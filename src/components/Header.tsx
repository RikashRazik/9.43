import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  Settings, 
  ChevronDown, 
  Lock, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';
import { MEMBER_CONFIG, formatKD, BillingCycle } from '../types';
import { Logo943 } from './Logo943';

interface HeaderProps {
  activeAccount: string;
  onSelectAccount: (account: string) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  onOpenAddExpense: () => void;
  onOpenReport: () => void;
  onOpenSettings: () => void;
  isOnline: boolean;
  fixedBillsStatus: {
    rent: { paid: boolean; amount: number; paidBy: string | null };
    recharge: { paid: boolean; amount: number; paidBy: string | null };
    electricity: { paid: boolean; amount: number; paidBy: string | null };
  };
  roomMembers: string[];
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  isAdminLoggedIn: boolean;
  currentCycle?: BillingCycle;
}

export const Header: React.FC<HeaderProps> = ({
  activeAccount,
  onSelectAccount,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  onOpenReport,
  onOpenSettings,
  isOnline,
  fixedBillsStatus,
  roomMembers,
  onOpenAdminLogin,
  onLogoutAdmin,
  isAdminLoggedIn,
  currentCycle,
}) => {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const activeConf = MEMBER_CONFIG[activeAccount] || MEMBER_CONFIG['Admin'];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <Logo943 size="md" />

          {/* Controls Right Side */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Month Selector Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer max-w-[95px] sm:max-w-none truncate"
            >
              {currentCycle && (
                <option value="CYCLE">
                  📅 {currentCycle.name} ({currentCycle.startDate.slice(5)} to {currentCycle.endDate.slice(5)})
                </option>
              )}
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => {
                const date = new Date(m + '-01');
                const label = isNaN(date.getTime()) 
                  ? m 
                  : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>

            {/* Desktop Report Icon */}
            <button
              type="button"
              onClick={onOpenReport}
              className="hidden sm:inline-flex p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Download Room PDF Report"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* ONLY ADMIN CAN ACCESS SETTINGS */}
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="hidden sm:inline-flex p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Admin Room Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Account Switcher Avatar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAccountDropdown(!showAccountDropdown);
                }}
                className="flex items-center gap-1.5 p-1 sm:pl-2 sm:pr-2.5 sm:py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer text-left"
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${activeConf.color} flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0`}>
                  {activeConf.initial}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-slate-900">
                  {activeAccount}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Profile Dropdown */}
              {showAccountDropdown && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                  
                  {/* If Admin is logged in */}
                  {isAdminLoggedIn && (
                    <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50 mb-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Admin Mode
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAccountDropdown(false);
                            onLogoutAdmin();
                          }}
                          className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer flex items-center gap-0.5"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Exit</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="px-3 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Room Flatmates ({roomMembers.length})
                  </div>

                  {/* ONLY THE 5 ROOM FLATMATES (ADMIN REMOVED FROM PUBLIC SWITCHER) */}
                  {roomMembers.map((m) => {
                    const conf = MEMBER_CONFIG[m] || {
                      color: 'bg-slate-800 text-white',
                      initial: m.slice(0, 2).toUpperCase(),
                    };
                    const isSelected = m === activeAccount;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          onSelectAccount(m);
                          setShowAccountDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                          isSelected ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md ${conf.color} flex items-center justify-center text-[10px] font-bold`}>
                          {conf.initial}
                        </div>
                        <span className="flex-1 truncate">{m}</span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                      </button>
                    );
                  })}

                  {/* Admin Entry Option at Bottom */}
                  <div className="border-t border-slate-100 mt-1.5 pt-1">
                    {isAdminLoggedIn ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountDropdown(false);
                          onOpenSettings();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-50 cursor-pointer font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Admin Settings & Bills</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountDropdown(false);
                          onOpenAdminLogin();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Admin Portal 🔒</span>
                      </button>
                    )}
                  </div>

                  {/* Mobile PDF Report Link */}
                  <div className="border-t border-slate-100 mt-1 pt-1 sm:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onOpenReport();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>PDF Report & Summary</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
