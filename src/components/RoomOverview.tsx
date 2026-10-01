import React from 'react';
import { 
  Home, 
  Wifi, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  PieChart, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { MemberSummary, formatKD, MEMBER_CONFIG } from '../types';

interface RoomOverviewProps {
  totalRoomSpending: number;
  memberSummaries: MemberSummary[];
  categoryBreakdown: Record<string, number>;
  fixedBillsStatus: {
    rent: { paid: boolean; amount: number; paidBy: string | null; expenseId?: string };
    recharge: { paid: boolean; amount: number; paidBy: string | null; expenseId?: string };
    electricity: { paid: boolean; amount: number; paidBy: string | null };
  };
  rentAmount: number;
  rechargeAmount: number;
  budgetThresholdKD: number;
  onLogFixedBill: (category: string, amount: number, title: string) => void;
  onViewMemberDetails: (memberName: string) => void;
}

export const RoomOverview: React.FC<RoomOverviewProps> = ({
  totalRoomSpending,
  memberSummaries,
  categoryBreakdown,
  fixedBillsStatus,
  rentAmount,
  rechargeAmount,
  budgetThresholdKD,
  onLogFixedBill,
  onViewMemberDetails,
}) => {
  const perPersonAvg = totalRoomSpending / (memberSummaries.length || 5);
  const budgetPercent = Math.min(Math.round((totalRoomSpending / budgetThresholdKD) * 100), 100);
  const isBudgetWarning = budgetPercent >= 80;

  // Categories sorted by amount descending
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* 3 Core Shared Bills Spotlight (Rent 205 KD, Recharge 5 KD, Electricity) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Flat Rent 205 KD */}
        <div className={`p-4 rounded-2xl border transition-all ${
          fixedBillsStatus.rent.paid 
            ? 'bg-white border-emerald-200 shadow-xs' 
            : 'bg-white border-amber-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Home className="w-5 h-5" />
            </div>
            {fixedBillsStatus.rent.paid ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="w-3 h-3" /> Pending
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Flat Monthly Rent</div>
            <div className="text-xl font-bold font-mono-num text-slate-900 mt-0.5">
              {formatKD(rentAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {fixedBillsStatus.rent.paid ? (
                <span>Paid by <strong className="text-slate-800">{fixedBillsStatus.rent.paidBy}</strong> (41.000 KD each)</span>
              ) : (
                <span>41.000 KD per person (5 members)</span>
              )}
            </div>
          </div>

          {!fixedBillsStatus.rent.paid && (
            <button
              type="button"
              onClick={() => onLogFixedBill('Rent (205 KD)', rentAmount, `Flat Monthly Rent (${rentAmount} KD)`)}
              className="mt-3 w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Rent Payment
            </button>
          )}
        </div>

        {/* Wifi Recharge 5 KD */}
        <div className={`p-4 rounded-2xl border transition-all ${
          fixedBillsStatus.recharge.paid 
            ? 'bg-white border-emerald-200 shadow-xs' 
            : 'bg-white border-amber-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Wifi className="w-5 h-5" />
            </div>
            {fixedBillsStatus.recharge.paid ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Paid
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="w-3 h-3" /> Pending
              </span>
            )}
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Internet / Wifi Recharge</div>
            <div className="text-xl font-bold font-mono-num text-slate-900 mt-0.5">
              {formatKD(rechargeAmount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {fixedBillsStatus.recharge.paid ? (
                <span>Paid by <strong className="text-slate-800">{fixedBillsStatus.recharge.paidBy}</strong> (1.000 KD each)</span>
              ) : (
                <span>1.000 KD per person (5 members)</span>
              )}
            </div>
          </div>

          {!fixedBillsStatus.recharge.paid && (
            <button
              type="button"
              onClick={() => onLogFixedBill('Internet Recharge (5 KD)', rechargeAmount, `Ooredoo/Zain Room Wifi (${rechargeAmount} KD)`)}
              className="mt-3 w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Wifi Payment
            </button>
          )}
        </div>

        {/* Electricity Bill (Varying) */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Variable
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-500 font-medium">Electricity Bill (MEW)</div>
            <div className="text-xl font-bold font-mono-num text-slate-900 mt-0.5">
              {formatKD(fixedBillsStatus.electricity.amount)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {fixedBillsStatus.electricity.paid ? (
                <span>Logged by {fixedBillsStatus.electricity.paidBy} ({formatKD(fixedBillsStatus.electricity.amount / 5)} each)</span>
              ) : (
                <span>Shared equally when bill arrives</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onLogFixedBill('Electricity Bill', 0, 'MEW Electricity Bill')}
            className="mt-3 w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Electricity Bill
          </button>
        </div>
      </div>

      {/* Monthly Budget Tracker Alert */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Monthly Room Budget Tracker
              </span>
              {isBudgetWarning && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  ⚠️ 80%+ Alert
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Target monthly threshold: <strong className="text-slate-800">{formatKD(budgetThresholdKD)}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold font-mono-num text-slate-900">
              {formatKD(totalRoomSpending)}
            </span>
            <span className="text-xs text-slate-500 ml-1">
              ({budgetPercent}% used)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercent >= 100 
                ? 'bg-rose-500' 
                : budgetPercent >= 80 
                ? 'bg-amber-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      {/* Member Contributions Leaderboard & Balances */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Member Contributions & Balances
            </h3>
            <p className="text-xs text-slate-500">
              All 5 room members · Each responsible for 1/5 of room mess & shared bills.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {memberSummaries.map((m) => {
            const conf = MEMBER_CONFIG[m.name] || MEMBER_CONFIG['Admin'];
            const percentOfTotal = totalRoomSpending > 0 ? (m.totalPaid / totalRoomSpending) * 100 : 0;
            return (
              <div 
                key={m.name} 
                onClick={() => onViewMemberDetails(m.name)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${conf.color} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {conf.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      {m.name}
                      {m.onVacation && (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          🏖️ On Vacation
                        </span>
                      )}
                      <span className="text-[11px] font-normal text-slate-400">
                        ({m.expenseCount} items logged)
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Paid: <strong className="text-slate-800 font-mono-num">{formatKD(m.totalPaid)}</strong></span>
                      <span>·</span>
                      <span>Fair Share: <strong className="text-slate-800 font-mono-num">{formatKD(m.totalShare)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Amount to pay badge */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">
                      {m.amountToPay > 0.001 ? 'Need to Pay' : m.excessPaid > 0.001 ? 'Excess Paid' : 'Balance'}
                    </div>
                    <div className={`text-sm font-bold font-mono-num ${
                      m.amountToPay > 0.001 
                        ? 'text-rose-600' 
                        : m.excessPaid > 0.001 
                        ? 'text-emerald-600' 
                        : 'text-slate-600'
                    }`}>
                      {m.amountToPay > 0.001 
                        ? formatKD(m.amountToPay) 
                        : m.excessPaid > 0.001 
                        ? `+${formatKD(m.excessPaid)}` 
                        : '0.000 KD'}
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    m.amountToPay > 0.001 
                      ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                      : m.excessPaid > 0.001 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {m.amountToPay > 0.001 ? 'Pay Due' : m.excessPaid > 0.001 ? 'Paid Full' : 'Balanced'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-500">
              Where the room money went this month.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {sortedCategories.map(([cat, amount]) => {
              const catPercent = totalRoomSpending > 0 ? Math.round((amount / totalRoomSpending) * 100) : 0;
              return (
                <div key={cat} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-bold font-mono-num text-slate-900">
                      {formatKD(amount)} <span className="text-[10px] text-slate-400 font-normal">({catPercent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-800 rounded-full" 
                      style={{ width: `${catPercent}%` }} 
                    />
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
