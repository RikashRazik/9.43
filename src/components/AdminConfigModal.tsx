import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Users, 
  Calendar,
  Share2,
  FileText,
  Trash2,
  Edit2,
  Plus,
  Plane,
  Home,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Clock,
  PlayCircle
} from 'lucide-react';
import { FixedBillsConfig, MemberSummary, Expense, BillingCycle, formatKD } from '../types';
import { generateRoomPDF } from '../utils/pdfExport';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FixedBillsConfig;
  onSaveConfig: (updatedConfig: Partial<FixedBillsConfig>) => Promise<void>;
  onResetData: () => Promise<void>;
  onResetMonth: (month: string) => Promise<void>;
  roomMembers: string[];
  vacationMembers: string[];
  onUpdateMembers: (members: string[], vacationMembers: string[]) => Promise<void>;
  selectedMonth: string;
  totalRoomSpending: number;
  memberSummaries: MemberSummary[];
  expenses: Expense[];
  onDeleteExpense: (id: string) => Promise<void>;
  onEditExpense: (expense: Expense) => void;
  fixedBillsStatus: {
    rent: { paid: boolean; amount: number; paidBy: string | null };
    recharge: { paid: boolean; amount: number; paidBy: string | null };
    electricity: { paid: boolean; amount: number; paidBy: string | null };
  };
  currentCycle?: BillingCycle;
  billingCycles?: BillingCycle[];
  onStartNewCycle: (cycleData: { startDate: string; endDate?: string; name?: string }) => Promise<void>;
  onEditCurrentCycle: (cycleData: { startDate?: string; endDate?: string; name?: string }) => Promise<void>;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetData,
  onResetMonth,
  roomMembers,
  vacationMembers,
  onUpdateMembers,
  selectedMonth,
  totalRoomSpending,
  memberSummaries,
  expenses,
  onDeleteExpense,
  onEditExpense,
  fixedBillsStatus,
  currentCycle,
  billingCycles = [],
  onStartNewCycle,
  onEditCurrentCycle,
}) => {
  const [activeTab, setActiveTab] = useState<'cycle' | 'monthEnd' | 'members' | 'expenses' | 'bills'>('cycle');
  
  // Billing cycle state
  const [cycleStartDate, setCycleStartDate] = useState(
    currentCycle?.startDate || new Date().toISOString().slice(0, 10)
  );
  const [cycleEndDate, setCycleEndDate] = useState(
    currentCycle?.endDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [cycleName, setCycleName] = useState(
    currentCycle?.name || 'Current Running Cycle'
  );

  const [newCycleStartDate, setNewCycleStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newCycleEndDate, setNewCycleEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [newCycleName, setNewCycleName] = useState('');
  const [isEditingCurrentCycle, setIsEditingCurrentCycle] = useState(false);
  const [cycleSuccessMessage, setCycleSuccessMessage] = useState<string | null>(null);

  // Sync cycle state when currentCycle prop changes
  useEffect(() => {
    if (currentCycle) {
      setCycleStartDate(currentCycle.startDate);
      setCycleEndDate(currentCycle.endDate);
      setCycleName(currentCycle.name);
    }
  }, [currentCycle]);

  // Bills form
  const [rentAmount, setRentAmount] = useState(config.rentAmount.toString());
  const [rechargeAmount, setRechargeAmount] = useState(config.rechargeAmount.toString());
  const [budgetThresholdKD, setBudgetThresholdKD] = useState(config.budgetThresholdKD.toString());

  // Members state
  const [membersList, setMembersList] = useState<string[]>([...roomMembers]);
  const [vacations, setVacations] = useState<string[]>([...vacationMembers]);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<{ index: number; name: string } | null>(null);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [confirmMonthReset, setConfirmMonthReset] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const monthLabel =
    selectedMonth === 'ALL'
      ? 'All Months'
      : selectedMonth === 'CYCLE' && currentCycle
      ? currentCycle.name
      : new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

  // Handle Edit Current Cycle
  const handleSaveCurrentCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onEditCurrentCycle({
        startDate: cycleStartDate,
        endDate: cycleEndDate,
        name: cycleName.trim(),
      });
      setIsEditingCurrentCycle(false);
      setCycleSuccessMessage('Billing cycle dates updated successfully!');
      setTimeout(() => setCycleSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update billing cycle');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Start New Cycle
  const handleStartNewCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleStartDate) {
      alert('Please select a start date for the new cycle');
      return;
    }

    if (
      !confirm(
        `Start new billing cycle starting from ${newCycleStartDate}? Current expenses will be archived to cycle history.`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      await onStartNewCycle({
        startDate: newCycleStartDate,
        endDate: newCycleEndDate || undefined,
        name: newCycleName.trim() || undefined,
      });
      setNewCycleName('');
      setCycleSuccessMessage(`New billing cycle started from ${newCycleStartDate}!`);
      setTimeout(() => setCycleSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to start new billing cycle');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Bills
  const handleSaveBills = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig({
        rentAmount: parseFloat(rentAmount) || 205,
        rechargeAmount: parseFloat(rechargeAmount) || 5,
        budgetThresholdKD: parseFloat(budgetThresholdKD) || 350,
      });
      alert('Room bill rates updated successfully!');
    } catch (err) {
      alert('Failed to save config.');
    } finally {
      setIsSaving(false);
    }
  };

  // Member management handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (membersList.includes(trimmed)) {
      alert('Member name already exists in room!');
      return;
    }
    const updated = [...membersList, trimmed];
    setMembersList(updated);
    setNewMemberName('');
    await onUpdateMembers(updated, vacations);
  };

  const handleSaveEditMember = async () => {
    if (!editingMember) return;
    const trimmed = editingMember.name.trim();
    if (!trimmed) return;
    const oldName = membersList[editingMember.index];
    const updated = [...membersList];
    updated[editingMember.index] = trimmed;
    
    // Update vacation list if renamed
    const updatedVacations = vacations.map(v => v === oldName ? trimmed : v);
    setMembersList(updated);
    setVacations(updatedVacations);
    setEditingMember(null);
    await onUpdateMembers(updated, updatedVacations);
  };

  const handleDeleteMember = async (name: string) => {
    if (membersList.length <= 2) {
      alert('A minimum of 2 room flatmates is required.');
      return;
    }
    if (confirm(`Remove flatmate "${name}" from this room?`)) {
      const updatedMembers = membersList.filter((m) => m !== name);
      const updatedVacations = vacations.filter((m) => m !== name);
      setMembersList(updatedMembers);
      setVacations(updatedVacations);
      await onUpdateMembers(updatedMembers, updatedVacations);
    }
  };

  const handleToggleVacation = async (name: string) => {
    const isCurrentlyOnVacation = vacations.includes(name);
    let updated: string[];
    if (isCurrentlyOnVacation) {
      updated = vacations.filter((m) => m !== name);
    } else {
      updated = [...vacations, name];
    }
    setVacations(updated);
    await onUpdateMembers(membersList, updated);
  };

  // Format WhatsApp Message
  const generateWhatsAppText = () => {
    const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    let text = `🇰🇼 *ROOM MESS & RENT STATEMENT*\n`;
    text += `📅 *Period:* ${monthLabel} (As of ${dateStr})\n`;
    text += `💰 *Total Room Spend:* ${formatKD(totalRoomSpending)}\n`;
    text += `🏠 *Rent (205 KD):* ${fixedBillsStatus.rent.paid ? `✅ Paid by ${fixedBillsStatus.rent.paidBy}` : '❌ Pending'}\n`;
    text += `📶 *Wifi (5 KD):* ${fixedBillsStatus.recharge.paid ? `✅ Paid by ${fixedBillsStatus.recharge.paidBy}` : '❌ Pending'}\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*MEMBERS PAYMENT BREAKDOWN:*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;

    memberSummaries.forEach((m) => {
      const statusIcon = m.amountToPay > 0.001 ? '🔴 Must Pay' : m.excessPaid > 0.001 ? '🟢 Receives' : '⚪ Settled';
      const vacationNote = m.onVacation ? ' _(🏖️ On Vacation - Rent/Wifi only)_' : '';
      text += `\n*${m.name}*${vacationNote}\n`;
      text += `• Fair Share: ${formatKD(m.totalShare)}\n`;
      text += `• Spent: ${formatKD(m.totalPaid)}\n`;
      if (m.amountToPay > 0.001) {
        text += `• 👉 *Cash to Pay: ${formatKD(m.amountToPay)}* (${statusIcon})\n`;
      } else if (m.excessPaid > 0.001) {
        text += `• 👉 *Room Owes Him: +${formatKD(m.excessPaid)}* (${statusIcon})\n`;
      } else {
        text += `• 👉 *All Clear (0.000 KD)*\n`;
      }
    });

    if (vacations.length > 0) {
      text += `\n🏖️ *Vacation Note:* ${vacations.join(', ')} on vacation. Exempt from food/groceries, pays equal share of Rent & Wifi.`;
    }

    text += `\n_Generated live by Kuwait Room Mess Manager_`;
    return text;
  };

  // Direct Send to WhatsApp Group
  const handleSendWhatsAppGroup = () => {
    const text = generateWhatsAppText();
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPDF = () => {
    generateRoomPDF({
      monthName: monthLabel,
      roomSpending: totalRoomSpending,
      members: memberSummaries,
      expenses,
      fixedBills: fixedBillsStatus,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Admin Mess Controls
              </h3>
              <p className="text-[11px] text-slate-500">
                Billing cycles, Month-end reset, WhatsApp dispatch & Flatmates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Admin Tabs */}
        <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('cycle')}
            className={`py-2.5 text-center transition-colors cursor-pointer truncate px-1 ${
              activeTab === 'cycle'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Billing Cycle
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthEnd')}
            className={`py-2.5 text-center transition-colors cursor-pointer truncate px-1 ${
              activeTab === 'monthEnd'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Month End
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-2.5 text-center transition-colors cursor-pointer truncate px-1 ${
              activeTab === 'members'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Members
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`py-2.5 text-center transition-colors cursor-pointer truncate px-1 ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Expenses ({expenses.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            className={`py-2.5 text-center transition-colors cursor-pointer truncate px-1 ${
              activeTab === 'bills'
                ? 'bg-white text-slate-900 border-b-2 border-slate-900 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            Fixed Bills
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: BILLING CYCLE MANAGER (START NEW CYCLE WITH DATE & EDIT CURRENT CYCLE) */}
          {activeTab === 'cycle' && (
            <div className="space-y-4">
              
              {cycleSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{cycleSuccessMessage}</span>
                </div>
              )}

              {/* CARD 1: Currently Running Billing Cycle */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-900 text-sm">
                      Currently Running Billing Cycle
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>

                {!isEditingCurrentCycle ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {currentCycle?.name || 'Current Running Cycle'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            From <strong>{currentCycle?.startDate || 'Month Start'}</strong> to{' '}
                            <strong>{currentCycle?.endDate || 'Month End'}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditingCurrentCycle(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-center"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit Cycle Dates</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-4">
                      <span>Expenses in cycle: <strong>{expenses.length}</strong></span>
                      <span>Total room spending: <strong>{formatKD(totalRoomSpending)}</strong></span>
                    </div>
                  </div>
                ) : (
                  /* Form to Edit Current Running Cycle */
                  <form onSubmit={handleSaveCurrentCycle} className="bg-white border border-indigo-200 rounded-xl p-3.5 space-y-3">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit Current Cycle Dates</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Cycle Start Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={cycleStartDate}
                          onChange={(e) => setCycleStartDate(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Cycle End Date
                        </label>
                        <input
                          type="date"
                          value={cycleEndDate}
                          onChange={(e) => setCycleEndDate(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">
                        Cycle Label / Name
                      </label>
                      <input
                        type="text"
                        value={cycleName}
                        onChange={(e) => setCycleName(e.target.value)}
                        placeholder="e.g. October 2026 Cycle or 25 Sep - 24 Oct"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingCurrentCycle(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Updated Dates'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* CARD 2: Start New Billing Cycle With Date */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-slate-800" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Start New Billing Cycle With Date
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Open a fresh billing cycle starting on a custom date (e.g. rent due date or salary date).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleStartNewCycle} className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        New Cycle Start Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={newCycleStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCycleStartDate(val);
                          if (val) {
                            const dt = new Date(val);
                            const next = new Date(dt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                            setNewCycleEndDate(next);
                          }
                        }}
                        required
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        New Cycle End Date (Target)
                      </label>
                      <input
                        type="date"
                        value={newCycleEndDate}
                        onChange={(e) => setNewCycleEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Cycle Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCycleName}
                      onChange={(e) => setNewCycleName(e.target.value)}
                      placeholder="e.g. November 2026 Cycle or Flat Rent Cycle"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      The new cycle will become the active tracking period.
                    </span>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Start New Cycle</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 3: Billing Cycle History */}
              {billingCycles.length > 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Previous Billing Cycles ({billingCycles.length})
                  </div>
                  <div className="divide-y divide-slate-200 text-xs">
                    {billingCycles.map((c) => (
                      <div key={c.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{c.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {c.startDate} to {c.endDate}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MONTH END RESET & WHATSAPP DISPATCH */}
          {activeTab === 'monthEnd' && (
            <div className="space-y-4">
              
              {/* WhatsApp & PDF Dispatch Card */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      Send Room Statement to WhatsApp Group
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Share complete room calculation, individual balances, rent & wifi status directly to flatmates.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSendWhatsAppGroup}
                    className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Send to WhatsApp Group</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official PDF</span>
                  </button>
                </div>
              </div>

              {/* Month-End Reset Card */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-950 text-sm">
                      Reset Monthly Bill at Month End
                    </h4>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Once all flatmates have paid their balances for <strong>{monthLabel}</strong>, click below to clear the current month's expenses. Next month starts fresh at 0.000 KD. Flatmates and bill settings will not be deleted.
                    </p>
                  </div>
                </div>

                {!confirmMonthReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmMonthReset(true)}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Bills for {monthLabel}</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2">
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Are you sure? This will clear all recorded expenses for {monthLabel}.</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSaving(true);
                          try {
                            await onResetMonth(selectedMonth);
                            setConfirmMonthReset(false);
                            alert(`Month-end reset complete! ${monthLabel} cleared.`);
                          } catch (e: any) {
                            alert(e.message || 'Failed to reset month');
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isSaving ? 'Resetting...' : 'Yes, Confirm Month-End Reset'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmMonthReset(false)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: MEMBERS & VACATION MANAGEMENT */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              
              {/* Vacation Rules Notice */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Plane className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Vacation Rule:</strong> Flatmates set on vacation are <strong>exempt from daily mess food & groceries</strong>, but <strong>continue paying their equal share of Rent (205 KD) and Wifi (5 KD)</strong>.
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Room Flatmates ({membersList.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Min 2 flatmates</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {membersList.map((m, idx) => {
                    const isOnVacation = vacations.includes(m);
                    const isEditing = editingMember?.index === idx;

                    return (
                      <div key={m} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/60">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingMember.name}
                              onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-semibold flex-1"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditMember}
                              className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMember(null)}
                              className="px-2 py-1 text-slate-500 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{m}</span>
                              {isOnVacation && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>🏖️ Vacation</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Toggle Vacation */}
                              <button
                                type="button"
                                onClick={() => handleToggleVacation(m)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                                  isOnVacation
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Toggle vacation mode"
                              >
                                <Plane className="w-3 h-3" />
                                <span>{isOnVacation ? 'On Vacation' : 'Set Vacation'}</span>
                              </button>

                              {/* Edit Name */}
                              <button
                                type="button"
                                onClick={() => setEditingMember({ index: idx, name: m })}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                title="Rename flatmate"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Delete flatmate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Flatmate Form */}
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New flatmate name (e.g. Shafeeq)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Flatmate</span>
                </button>
              </form>

            </div>
          )}

          {/* TAB 4: AUDIT & MANAGE EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  All Logged Expenses ({expenses.length})
                </span>
                <span className="font-mono-num font-bold text-slate-900">
                  Total: {formatKD(totalRoomSpending)}
                </span>
              </div>

              {expenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No expenses logged for this month.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-[350px] overflow-y-auto">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/70">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{exp.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {exp.date} · Paid by <strong className="text-slate-800">{exp.paidBy}</strong> · {exp.category}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold font-mono-num text-xs sm:text-sm text-slate-900">
                          {formatKD(exp.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditExpense(exp);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit expense"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete "${exp.title}" (${formatKD(exp.amount)})?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FIXED BILLS CONFIG */}
          {activeTab === 'bills' && (
            <form onSubmit={handleSaveBills} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Monthly Flat Rent (KD)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono-num font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Shared equally by {roomMembers.length} = {formatKD((parseFloat(rentAmount) || 205) / roomMembers.length)} / person
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Monthly Wifi Recharge (KD)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono-num font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Shared equally by {roomMembers.length} = {formatKD((parseFloat(rechargeAmount) || 5) / roomMembers.length)} / person
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Monthly Room Budget Threshold (KD)
                </label>
                <input
                  type="number"
                  step="1"
                  min="50"
                  value={budgetThresholdKD}
                  onChange={(e) => setBudgetThresholdKD(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono-num font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Bill Rates'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
