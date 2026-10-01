import React from 'react';
import { 
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MemberSummary, formatKD, MEMBER_CONFIG } from '../types';

interface PersonalDashboardProps {
  activeAccount: string;
  memberSummaries: MemberSummary[];
  totalRoomSpending: number;
  onOpenAddExpense: (preset?: { title: string; amount: number; category: string }) => void;
  onOpenReceiptScan: () => void;
  rentAmount: number;
  rechargeAmount: number;
  categoryBreakdown?: Record<string, number>;
}

const MEMBER_ACCENT_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  Mujeeb: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-700' },
  Rikash: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', bar: 'bg-indigo-500', text: 'text-indigo-700' },
  Askar: { bg: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-500', text: 'text-amber-700' },
  Appunni: { bg: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'bg-rose-500', text: 'text-rose-700' },
  Kuttas: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', bar: 'bg-cyan-500', text: 'text-cyan-700' },
};

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  activeAccount,
  memberSummaries,
  totalRoomSpending,
  onOpenReceiptScan,
  rentAmount,
  rechargeAmount,
  categoryBreakdown = {},
}) => {
  const isAdmin = activeAccount === 'Admin';
  const mySummary = memberSummaries.find((m) => m.name === activeAccount) || {
    name: activeAccount,
    totalPaid: 0,
    totalShare: 0,
    amountToPay: 0,
    excessPaid: 0,
    expenseCount: 0,
  };

  const conf = MEMBER_CONFIG[activeAccount] || MEMBER_CONFIG['Admin'];

  // Filter out 'Admin' from member spending ranking
  const flatmatesList = memberSummaries.filter((m) => m.name !== 'Admin');

  // Sort flatmates by totalPaid descending (who spent the most)
  const sortedMembers = [...flatmatesList].sort((a, b) => b.totalPaid - a.totalPaid);
  const highestSpender = sortedMembers[0];
  const maxSpent = highestSpender && highestSpender.totalPaid > 0 ? highestSpender.totalPaid : 1;

  // Categories sorted by highest spend
  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-3.5">
      {/* 1. Minimal User Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          
          {/* Left: Avatar + Clean Single-Line Name & Role */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${conf.color} flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}>
              {conf.initial}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5 leading-tight">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight whitespace-nowrap">
                  Hi, {activeAccount} 👋
                </span>
                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                  · {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap truncate">
                Floor 9, Room 43 · Kuwait Mess
              </p>
            </div>
          </div>

          {/* Right: Camera / Scan Action Button */}
          <button
            type="button"
            onClick={onOpenReceiptScan}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Scan Receipt with AI OCR"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium">Scan</span>
          </button>

        </div>
      </div>

      {/* 2. MINIMAL LIVE PAYMENT TRACKER (Single Clean Card) */}
      {!isAdmin ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Payment Tracker
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              This Month
            </span>
          </div>

          {/* Vacation Notice Banner */}
          {mySummary.onVacation && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <span className="text-base">🏖️</span>
              <div>
                <strong>Vacation Mode Active:</strong> You are exempt from mess grocery & food bills. You only pay for your share of Rent, Wifi, and Electricity.
              </div>
            </div>
          )}

          {/* Main Payment Display */}
          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">
              {mySummary.amountToPay > 0.001
                ? 'Final Cash You Need to Pay This Month:'
                : mySummary.excessPaid > 0.001
                ? 'You Already Paid Full! Room Owes You:'
                : 'All Balanced (0.000 KD):'}
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono-num text-slate-900 tracking-tight">
                {mySummary.amountToPay > 0.001
                  ? formatKD(mySummary.amountToPay)
                  : mySummary.excessPaid > 0.001
                  ? `+${formatKD(mySummary.excessPaid)}`
                  : '0.000 KD'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {mySummary.amountToPay > 0.001
                ? `You pay this amount to clear your room rent, wifi, and grocery share.`
                : mySummary.excessPaid > 0.001
                ? `You spent more than your share. You do not need to pay anything!`
                : 'Your purchases match your share. You do not owe anything!'}
            </p>
          </div>

          {/* SINGLE ROW OF STAT CHIPS (NO DUPLICATES) */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Your Share
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(mySummary.totalShare)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                You Spent
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-emerald-700 mt-0.5 truncate">
                {formatKD(mySummary.totalPaid)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Rent Share
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(rentAmount / 5)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Wifi Share
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(rechargeAmount / 5)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Admin Mode Single Stat Chips */
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 mb-3">
            Room Mess Manager Summary
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Total Room Spend
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(totalRoomSpending)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Per Person Share
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(totalRoomSpending / 5)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Flat Rent
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(rentAmount)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Room Wifi
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono-num text-slate-900 mt-0.5 truncate">
                {formatKD(rechargeAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Flatmates Contribution Ranking List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Member Spendings
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Room Total: <strong className="font-mono-num text-slate-900">{formatKD(totalRoomSpending)}</strong>
          </span>
        </div>

        {/* Flatmates Contribution Ranking List */}
        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
          {sortedMembers.map((m, idx) => {
            const isHighest = idx === 0 && m.totalPaid > 0;
            const isMe = m.name === activeAccount;
            const percentOfMax = maxSpent > 0 ? Math.min(100, Math.round((m.totalPaid / maxSpent) * 100)) : 0;
            const percentOfTotal = totalRoomSpending > 0 ? Math.round((m.totalPaid / totalRoomSpending) * 100) : 0;
            const accent = MEMBER_ACCENT_COLORS[m.name] || { bar: 'bg-slate-700', text: 'text-slate-700' };
            const mConf = MEMBER_CONFIG[m.name] || { color: 'bg-slate-700 text-white', initial: m.name.slice(0, 2) };

            return (
              <div 
                key={m.name} 
                className={`p-3 transition-colors ${isMe ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Rank Badge */}
                    <span className={`text-[10px] font-bold w-4 text-center shrink-0 ${isHighest ? 'text-amber-600' : 'text-slate-400'}`}>
                      {isHighest ? '👑' : `#${idx + 1}`}
                    </span>

                    {/* Member Avatar */}
                    <div className={`w-6 h-6 rounded-md ${mConf.color} flex items-center justify-center font-bold text-[10px] shrink-0`}>
                      {mConf.initial}
                    </div>

                    {/* Member Name */}
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {m.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded-full">
                          You
                        </span>
                      )}
                      {m.onVacation && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded-full">
                          🏖️ Vacation
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Spending & Settlement Status Tag */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-bold font-mono-num text-xs sm:text-sm text-slate-900">
                        {formatKD(m.totalPaid)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {percentOfTotal}% of room
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="min-w-[70px] text-right">
                      {isHighest ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-block">
                          Top Spender
                        </span>
                      ) : m.excessPaid > 0.001 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block">
                          +{formatKD(m.excessPaid)} Credit
                        </span>
                      ) : m.amountToPay > 0.001 ? (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full inline-block">
                          {formatKD(m.amountToPay)} Due
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                          Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Comparison Bar */}
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${percentOfMax}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Helpful Fair Share Insight */}
        {highestSpender && highestSpender.totalPaid > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between gap-2">
            <span>
              💡 <strong>{highestSpender.name}</strong> has paid the most ({formatKD(highestSpender.totalPaid)}) this month.
            </span>
            <span className="text-slate-400 shrink-0">
              Avg/Person: <strong>{formatKD(totalRoomSpending / 5)}</strong>
            </span>
          </div>
        )}

      </div>

      {/* 4. Top Expense Categories Preview (Compact & Clean) */}
      {sortedCategories.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-bold text-slate-800 text-xs">
              Where the Money Went
            </h4>
            <span className="text-[10px] text-slate-400">
              Top room spending categories
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sortedCategories.map(([category, amt]) => {
              const pct = totalRoomSpending > 0 ? Math.round((amt / totalRoomSpending) * 100) : 0;
              return (
                <div key={category} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-semibold truncate mb-1">
                    {category}
                  </div>
                  <div className="font-bold font-mono-num text-xs text-slate-900">
                    {formatKD(amt)}
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="bg-slate-700 h-full rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
