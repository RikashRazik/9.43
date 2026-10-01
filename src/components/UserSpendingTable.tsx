import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Plus, 
  Calendar, 
  Tag, 
  ShoppingBag,
  ExternalLink,
  X
} from 'lucide-react';
import { Expense, formatKD, EXPENSE_CATEGORIES } from '../types';

interface UserSpendingTableProps {
  activeAccount: string;
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onOpenAddExpense: () => void;
  selectedMonth: string;
}

export const UserSpendingTable: React.FC<UserSpendingTableProps> = ({
  activeAccount,
  expenses,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
  selectedMonth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const monthLabel =
    selectedMonth === 'ALL'
      ? 'All Months'
      : new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

  // Filter to ONLY expenses paid by the active user (or all if Admin)
  const myExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchUser = activeAccount === 'Admin' ? true : e.paidBy === activeAccount;
      const matchSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.vendor && e.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'ALL' || e.category === selectedCategory;
      return matchUser && matchSearch && matchCat;
    });
  }, [expenses, activeAccount, searchQuery, selectedCategory]);

  const totalSpentByMe = useMemo(() => {
    return myExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [myExpenses]);

  return (
    <div className="space-y-3.5">
      {/* Top Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {activeAccount === 'Admin' ? 'All Room Spendings' : `My Spendings · ${activeAccount}`}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {activeAccount === 'Admin'
                    ? `Admin audit table for all purchases in ${monthLabel}`
                    : `Purchases paid out of your pocket for ${monthLabel}. You can edit or delete your items anytime.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Total You Spent
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono-num text-emerald-600">
                {formatKD(totalSpentByMe)}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Purchase</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by item name or supermarket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spending Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Logged Items ({myExpenses.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Click edit pencil <Edit3 className="w-3 h-3 inline text-slate-400" /> to modify any expense
          </span>
        </div>

        {myExpenses.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              No purchases found for {activeAccount === 'Admin' ? 'this room' : activeAccount} in {monthLabel}.
            </p>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myExpenses.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
              >
                {/* Left side details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    <Tag className="w-4 h-4 text-slate-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.title}
                      </span>

                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {item.category}
                      </span>

                      {item.receiptImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(item.receiptImage || null)}
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                        >
                          <Receipt className="w-3 h-3 text-emerald-600" />
                          <span>View Receipt</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {item.date}
                      </span>
                      {item.vendor && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600">{item.vendor}</span>
                        </>
                      )}
                      {item.notes && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[200px] text-slate-500 italic">
                            "{item.notes}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side amount and EDIT/DELETE actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center pl-12 sm:pl-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-bold font-mono-num text-slate-900">
                      {formatKD(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Paid by {item.paidBy}
                    </div>
                  </div>

                  {/* Direct Edit & Delete Buttons for User */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditExpense(item)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
                      title="Edit this expense"
                      aria-label="Edit this expense"
                    >
                      <Edit3 className="w-4 h-4 text-indigo-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${item.title}" (${formatKD(item.amount)})?`)) {
                          onDeleteExpense(item.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete this expense"
                      aria-label="Delete this expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[85vh] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Receipt Verification
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={previewImage}
                alt="Receipt"
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
