import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Home, 
  ListFilter, 
  Plus, 
  Receipt, 
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  RoomData, 
  Expense, 
  FixedBillsConfig, 
  ROOM_MEMBERS, 
  formatKD 
} from './types';
import { calculateFinancials } from './utils/calculations';
import { 
  fetchServerData, 
  getLocalStoredData, 
  saveLocalStoredData, 
  getSavedActiveAccount, 
  saveActiveAccount,
  createExpenseApi,
  updateExpenseApi,
  deleteExpenseApi,
  updateConfigApi,
  startBillingCycleApi,
  editBillingCycleApi,
  resetMonthApi,
  resetRoomDataApi
} from './utils/syncService';

import { Header } from './components/Header';
import { PersonalDashboard } from './components/PersonalDashboard';
import { UserSpendingTable } from './components/UserSpendingTable';
import { RoomOverview } from './components/RoomOverview';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { ReportModal } from './components/ReportModal';
import { AdminConfigModal } from './components/AdminConfigModal';
import { AdminLoginModal } from './components/AdminLoginModal';

type TabType = 'personal' | 'my_spendings' | 'overview' | 'activity';

export default function App() {
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('room_mess_admin_session') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const [activeAccount, setActiveAccount] = useState<string>(() => {
    const saved = getSavedActiveAccount();
    if (saved === 'Admin' && sessionStorage.getItem('room_mess_admin_session') !== 'true') {
      return 'Rikash';
    }
    return saved || 'Rikash';
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Check URL query parameters for direct admin portal link: ?admin=login or ?admin=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'login' || params.get('admin') === 'true') {
      setIsAdminLoginModalOpen(true);
    }
  }, []);

  // Room data state
  const [roomData, setRoomData] = useState<RoomData>(() => {
    return (
      getLocalStoredData() || {
        members: [...ROOM_MEMBERS],
        vacationMembers: [],
        fixedBills: {
          rentAmount: 205,
          rechargeAmount: 5,
          budgetThresholdKD: 350,
          rentDueDateDay: 30,
          rechargeDueDateDay: 15,
        },
        expenses: [],
        settlements: [],
        lastUpdated: new Date().toISOString(),
      }
    );
  });

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expensePreset, setExpensePreset] = useState<{
    title: string;
    amount: number;
    category: string;
  } | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Sync active account
  const handleSelectAccount = (account: string) => {
    setActiveAccount(account);
    saveActiveAccount(account);
  };

  // Admin login success
  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('room_mess_admin_session', 'true');
    setActiveAccount('Admin');
    saveActiveAccount('Admin');
  };

  // Admin logout
  const handleLogoutAdmin = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('room_mess_admin_session');
    const fallback = roomData.members[0] || 'Rikash';
    setActiveAccount(fallback);
    saveActiveAccount(fallback);
  };

  // Fetch initial data & setup Server-Sent Events (SSE) for real-time live sync
  useEffect(() => {
    let sse: EventSource | null = null;

    const loadInitial = async () => {
      try {
        const serverData = await fetchServerData();
        setRoomData(serverData);
        saveLocalStoredData(serverData);
        setIsOnline(true);
      } catch (err) {
        console.warn('Backend fetch failed, using local storage cache:', err);
        setIsOnline(false);
      }
    };

    loadInitial();

    // Setup live SSE stream
    try {
      sse = new EventSource('/api/events');
      sse.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.data) {
            setRoomData(parsed.data);
            saveLocalStoredData(parsed.data);
            setIsOnline(true);
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      sse.onerror = () => {
        setIsOnline(false);
      };
    } catch {
      setIsOnline(false);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (sse) sse.close();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthKey);
    roomData.expenses.forEach((e) => {
      if (e.date) set.add(e.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [roomData.expenses, currentMonthKey]);

  // Compute live financials with vacation member exemptions & billing cycle range
  const financials = useMemo(() => {
    return calculateFinancials(
      roomData.members,
      roomData.expenses,
      selectedMonth,
      roomData.vacationMembers || [],
      roomData.currentCycle
    );
  }, [roomData.members, roomData.expenses, selectedMonth, roomData.vacationMembers, roomData.currentCycle]);

  // Action Handlers
  const handleStartNewCycle = async (cycleData: { startDate: string; endDate?: string; name?: string }) => {
    const res = await startBillingCycleApi(cycleData);
    setRoomData(res.data);
    saveLocalStoredData(res.data);
  };

  const handleEditCurrentCycle = async (cycleData: { startDate?: string; endDate?: string; name?: string }) => {
    const res = await editBillingCycleApi(cycleData);
    setRoomData(res.data);
    saveLocalStoredData(res.data);
  };

  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    if (editingExpense) {
      const res = await updateExpenseApi(editingExpense.id, expenseData);
      setRoomData(res.data);
      saveLocalStoredData(res.data);
    } else {
      const res = await createExpenseApi(expenseData);
      setRoomData(res.data);
      saveLocalStoredData(res.data);
    }
    setEditingExpense(null);
    setExpensePreset(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const res = await deleteExpenseApi(id);
      setRoomData(res.data);
      saveLocalStoredData(res.data);
    }
  };

  const handleSaveConfig = async (configUpdate: Partial<FixedBillsConfig>) => {
    const res = await updateConfigApi({ fixedBills: configUpdate });
    setRoomData(res.data);
    saveLocalStoredData(res.data);
  };

  const handleUpdateMembers = async (members: string[], vacationMembers: string[]) => {
    const res = await updateConfigApi({ members, vacationMembers });
    setRoomData(res.data);
    saveLocalStoredData(res.data);
  };

  const handleResetMonth = async (month: string) => {
    const res = await resetMonthApi(month);
    setRoomData(res.data);
    saveLocalStoredData(res.data);
  };

  const handleResetData = async () => {
    const res = await resetRoomDataApi();
    setRoomData(res.data);
    saveLocalStoredData(res.data);
  };

  const handleLogFixedBill = (category: string, amount: number, title: string) => {
    setExpensePreset({
      title,
      amount,
      category,
    });
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenAddExpenseWithPreset = (preset?: {
    title: string;
    amount: number;
    category: string;
  }) => {
    setEditingExpense(null);
    setExpensePreset(preset || null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpensePreset(null);
    setIsExpenseModalOpen(true);
  };

  // Safe handler to ensure only logged in Admin can open admin settings
  const handleOpenAdminSettings = () => {
    if (isAdminLoggedIn) {
      setIsAdminSettingsOpen(true);
    } else {
      setIsAdminLoginModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 sm:pb-20">
      {/* Top Navigation Bar */}
      <Header
        activeAccount={activeAccount}
        onSelectAccount={handleSelectAccount}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        availableMonths={availableMonths}
        onOpenAddExpense={() => handleOpenAddExpenseWithPreset()}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenSettings={handleOpenAdminSettings}
        isOnline={isOnline}
        fixedBillsStatus={financials.fixedBillsStatus}
        roomMembers={roomData.members}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        isAdminLoggedIn={isAdminLoggedIn}
        currentCycle={roomData.currentCycle}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-2.5 sm:px-6 pt-3 space-y-3.5">
        
        {/* Top Tabs - Shown ONLY on Desktop/Tablet, Centered & Refined */}
        <div className="hidden sm:grid max-w-xl mx-auto w-full bg-slate-200/80 p-1 rounded-xl grid-cols-4 gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === 'personal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">My Tracker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_spendings')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === 'my_spendings'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{activeAccount === 'Admin' ? 'All Spendings' : 'My Spendings'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Room Bills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate ${
              activeTab === 'activity'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Activity ({financials.filteredExpenses.length})</span>
          </button>
        </div>

        {/* Tab 1: Personal Live Payment Tracker */}
        {activeTab === 'personal' && (
          <PersonalDashboard
            activeAccount={activeAccount}
            memberSummaries={financials.memberSummaries}
            totalRoomSpending={financials.totalRoomSpending}
            onOpenAddExpense={handleOpenAddExpenseWithPreset}
            onOpenReceiptScan={() => handleOpenAddExpenseWithPreset()}
            rentAmount={roomData.fixedBills.rentAmount}
            rechargeAmount={roomData.fixedBills.rechargeAmount}
            categoryBreakdown={financials.categoryBreakdown}
          />
        )}

        {/* Tab 2: User Spending Table with Direct Edit & Delete */}
        {activeTab === 'my_spendings' && (
          <UserSpendingTable
            activeAccount={activeAccount}
            expenses={financials.filteredExpenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            onOpenAddExpense={() => handleOpenAddExpenseWithPreset()}
            selectedMonth={selectedMonth}
          />
        )}

        {/* Tab 3: Room Overview & Shared Bills (Rent 205 KD, Wifi 5 KD, Electricity, Member List) */}
        {activeTab === 'overview' && (
          <RoomOverview
            totalRoomSpending={financials.totalRoomSpending}
            memberSummaries={financials.memberSummaries}
            categoryBreakdown={financials.categoryBreakdown}
            fixedBillsStatus={financials.fixedBillsStatus}
            rentAmount={roomData.fixedBills.rentAmount}
            rechargeAmount={roomData.fixedBills.rechargeAmount}
            budgetThresholdKD={roomData.fixedBills.budgetThresholdKD}
            onLogFixedBill={handleLogFixedBill}
            onViewMemberDetails={(m) => {
              setActiveAccount(m);
              setActiveTab('personal');
            }}
          />
        )}

        {/* Tab 4: Activity Feed & Audit Log */}
        {activeTab === 'activity' && (
          <ExpenseList
            expenses={financials.filteredExpenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            roomMembers={roomData.members}
            activeAccount={activeAccount}
          />
        )}

      </main>

      {/* Floating Fast Add Button (Mobile, Tablet & Desktop) */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30">
        <button
          type="button"
          onClick={() => handleOpenAddExpenseWithPreset()}
          className="flex items-center gap-2 p-3 sm:px-4 sm:py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer border-2 border-white ring-2 ring-slate-900/10 group"
          title="Add Expense"
          aria-label="Add Expense"
        >
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-200" />
          <span className="hidden sm:inline text-xs font-bold tracking-wide pr-1">Add Expense</span>
        </button>
      </div>

      {/* Mobile Sticky Bottom Nav Bar (4 Clean Tabs) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 sm:hidden">
        <div className="grid grid-cols-4 py-2 text-[10px] text-center font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'personal' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span className="truncate">Tracker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_spendings')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'my_spendings' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="truncate">My Spendings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'overview' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="truncate">Bills</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'activity' ? 'text-slate-900 font-bold' : 'text-slate-400'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span className="truncate">Activity</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
          setExpensePreset(null);
        }}
        onSave={handleSaveExpense}
        editingExpense={editingExpense}
        activeAccount={activeAccount}
        roomMembers={roomData.members}
        vacationMembers={roomData.vacationMembers || []}
        initialPreset={expensePreset}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedMonth={selectedMonth}
        totalRoomSpending={financials.totalRoomSpending}
        memberSummaries={financials.memberSummaries}
        expenses={financials.filteredExpenses}
        fixedBillsStatus={financials.fixedBillsStatus}
        rentAmount={roomData.fixedBills.rentAmount}
        rechargeAmount={roomData.fixedBills.rechargeAmount}
      />

      {/* Admin Settings Modal - Only rendered and accessible when Admin */}
      {isAdminLoggedIn && (
        <AdminConfigModal
          isOpen={isAdminSettingsOpen}
          onClose={() => setIsAdminSettingsOpen(false)}
          config={roomData.fixedBills}
          onSaveConfig={handleSaveConfig}
          onResetData={handleResetData}
          onResetMonth={handleResetMonth}
          roomMembers={roomData.members}
          vacationMembers={roomData.vacationMembers || []}
          onUpdateMembers={handleUpdateMembers}
          selectedMonth={selectedMonth}
          totalRoomSpending={financials.totalRoomSpending}
          memberSummaries={financials.memberSummaries}
          expenses={financials.filteredExpenses}
          onDeleteExpense={handleDeleteExpense}
          onEditExpense={handleEditExpense}
          fixedBillsStatus={financials.fixedBillsStatus}
          currentCycle={roomData.currentCycle}
          billingCycles={roomData.billingCycles || []}
          onStartNewCycle={handleStartNewCycle}
          onEditCurrentCycle={handleEditCurrentCycle}
        />
      )}

      {/* Admin Login Modal (Direct URL or dropdown click) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
