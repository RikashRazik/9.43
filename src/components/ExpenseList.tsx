import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Calendar, 
  Image as ImageIcon, 
  Users, 
  Tag, 
  Receipt,
  X
} from 'lucide-react';
import { Expense, EXPENSE_CATEGORIES, formatKD, MEMBER_CONFIG } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  roomMembers: string[];
  activeAccount: string;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEditExpense,
  onDeleteExpense,
  roomMembers,
  activeAccount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<string>('ALL');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter expenses
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.vendor && e.vendor.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q) ||
        e.paidBy.toLowerCase().includes(q);

      // Category
      const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;

      // Member
      const matchesMember = selectedMember === 'ALL' || e.paidBy === selectedMember;

      return matchesSearch && matchesCategory && matchesMember;
    });
  }, [expenses, searchQuery, selectedCategory, selectedMember]);

  return (
    <div className="space-y-3">
      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses, store (LuLu, Sultan), description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Member Filter Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Buyers</option>
              {roomMembers.map((m) => (
                <option key={m} value={m}>
                  Paid by {m}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none cursor-pointer"
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
      </div>

      {/* Expense Items List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Room Activity Feed ({filtered.length} {filtered.length === 1 ? 'item' : 'items'})
          </div>
          {filtered.length > 0 && (
            <span className="text-xs font-mono-num font-bold text-slate-700">
              Total: {formatKD(filtered.reduce((sum, e) => sum + e.amount, 0))}
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No expenses found matching the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const conf = MEMBER_CONFIG[item.paidBy] || MEMBER_CONFIG['Admin'];
              const splitCount = item.splitWith?.length || roomMembers.length;
              return (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 px-2 rounded-xl transition-colors group"
                >
                  {/* Left: Avatar & Item Details */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${conf.color} flex items-center justify-center font-bold text-xs shrink-0 mt-0.5`}
                      title={`Paid by ${item.paidBy}`}
                    >
                      {conf.initial}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.title}
                        </span>
                        {item.receiptImage && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(item.receiptImage || null)}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span>Paid by <strong className="text-slate-800">{item.paidBy}</strong></span>
                        <span>·</span>
                        <span>{item.date}</span>
                        <span>·</span>
                        <span className="text-slate-600 font-medium">{item.category}</span>
                        {item.vendor && (
                          <>
                            <span>·</span>
                            <span className="text-slate-500 italic">{item.vendor}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>Split by {splitCount} ({formatKD(item.amount / splitCount)} each)</span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center pl-12 sm:pl-0">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-bold font-mono-num text-slate-900">
                        {formatKD(item.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatKD(item.amount / splitCount)} / person
                      </div>
                    </div>

                    {/* Only the flatmate who paid or Admin can edit/delete this expense */}
                    {(activeAccount === 'Admin' || item.paidBy === activeAccount) ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic">
                        {item.paidBy}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            className="max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={previewImage} 
              alt="Receipt preview" 
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
