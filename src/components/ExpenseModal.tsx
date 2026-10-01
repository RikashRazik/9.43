import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Sparkles, 
  Loader2, 
  Check, 
  Calendar, 
  Tag, 
  User, 
  Users, 
  AlertCircle
} from 'lucide-react';
import { 
  Expense, 
  EXPENSE_CATEGORIES, 
  formatKD, 
  formatKDRaw 
} from '../types';
import { scanReceiptWithAI } from '../utils/syncService';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Partial<Expense>) => Promise<void>;
  editingExpense?: Expense | null;
  activeAccount: string;
  roomMembers: string[];
  vacationMembers?: string[];
  initialPreset?: { title: string; amount: number; category: string } | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingExpense,
  activeAccount,
  roomMembers,
  vacationMembers = [],
  initialPreset,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<string>('Groceries');
  const [paidBy, setPaidBy] = useState<string>(
    activeAccount === 'Admin' ? (roomMembers[0] || 'Rikash') : activeAccount
  );
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active members who participate in daily mess
  const activeMessMembers = roomMembers.filter((m) => !vacationMembers.includes(m));

  // Reset or fill form when opening or editing
  useEffect(() => {
    if (editingExpense) {
      setTitle(editingExpense.title);
      setAmount(formatKDRaw(editingExpense.amount));
      setDate(editingExpense.date);
      setCategory(editingExpense.category);
      setPaidBy(editingExpense.paidBy);
      setVendor(editingExpense.vendor || '');
      setNotes(editingExpense.notes || '');
      setReceiptImage(editingExpense.receiptImage);
    } else if (initialPreset) {
      setTitle(initialPreset.title);
      setAmount(formatKDRaw(initialPreset.amount));
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(initialPreset.category);
      setPaidBy(activeAccount === 'Admin' ? (roomMembers[0] || 'Rikash') : activeAccount);
      setVendor('');
      setNotes('');
      setReceiptImage(undefined);
    } else {
      setTitle('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('Groceries');
      setPaidBy(activeAccount === 'Admin' ? (roomMembers[0] || 'Rikash') : activeAccount);
      setVendor('');
      setNotes('');
      setReceiptImage(undefined);
    }
    setScanMessage(null);
    setErrorMessage(null);
  }, [isOpen, editingExpense, initialPreset, activeAccount, roomMembers]);

  if (!isOpen) return null;

  // Handle OCR receipt photo upload / capture
  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid receipt image.');
      return;
    }

    setIsScanning(true);
    setScanMessage('Scanning receipt with AI OCR...');
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        setReceiptImage(base64Data);

        const result = await scanReceiptWithAI(base64Data, file.type);
        if (result.success && result.data) {
          if (result.data.amount) {
            setAmount(Number(result.data.amount).toFixed(3));
          }
          if (result.data.title) {
            setTitle(result.data.title);
          }
          if (result.data.vendor) {
            setVendor(result.data.vendor);
          }
          if (result.data.category && EXPENSE_CATEGORIES.includes(result.data.category as any)) {
            setCategory(result.data.category);
          }
          if (result.data.date) {
            setDate(result.data.date);
          }
          setScanMessage(`Receipt scanned: ${result.data.vendor || 'Purchase'} · ${result.data.amount} KD`);
        }
      } catch (err: any) {
        setErrorMessage('Could not scan receipt. Please enter amount manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file');
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  // Submit Expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0 KD.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please provide an item description.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-determine split participants based on category & vacation status:
      // Fixed utilities (Rent, Wifi, Electricity) split across all room members.
      // Mess food/groceries split automatically across active members only.
      const catLower = category.toLowerCase();
      const titleLower = title.toLowerCase();
      const isUtility =
        catLower.includes('rent') ||
        catLower.includes('recharge') ||
        catLower.includes('internet') ||
        catLower.includes('wifi') ||
        catLower.includes('electricity') ||
        catLower.includes('current') ||
        titleLower.includes('rent') ||
        titleLower.includes('wifi') ||
        titleLower.includes('electricity');

      const autoSplitWith = isUtility 
        ? roomMembers 
        : (activeMessMembers.length > 0 ? activeMessMembers : roomMembers);

      await onSave({
        title: title.trim(),
        amount: Math.round(parsedAmount * 1000) / 1000,
        date,
        category,
        paidBy,
        splitWith: autoSplitWith,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptImage,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              {editingExpense ? 'Edit Expense' : 'Log New Expense'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Kuwait Mess Expense Entry
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* AI Scan Feedback */}
          {scanMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scanMessage}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setScanMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-[10px] font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* SIMPLE & MINIMAL AMOUNT FIELD */}
          <div>
            <label htmlFor="expense-amount" className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (KD) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="expense-amount"
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full pl-3.5 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold font-mono-num text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                KD
              </span>
            </div>
          </div>

          {/* AI Receipt Camera Attachment (Quick OCR) */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleReceiptFile}
              className="hidden"
            />
            <button
              type="button"
              disabled={isScanning}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Scanning receipt...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>📸 Snap Receipt to Auto-Fill Amount</span>
                </>
              )}
            </button>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. LuLu Supermarket rice, oil & chicken"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Grid: Paid By & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Who Paid?
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                {roomMembers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              />
            </div>
          </div>

          {/* AUTOMATIC SPLIT INFORMATION (NO MANUAL COMPLEX SELECTION NEEDED) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
            {vacationMembers.length > 0 ? (
              <div className="flex items-start gap-2 text-amber-900">
                <span className="text-sm">🏖️</span>
                <div>
                  <strong>Automatic Vacation Split:</strong> Split across{' '}
                  <strong>{activeMessMembers.length} active flatmates</strong> ({activeMessMembers.join(', ')}).{' '}
                  <span className="text-amber-800">
                    ({vacationMembers.join(', ')} on vacation - exempt from food bills, but pays rent/wifi).
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <strong>Automatic Equal Split:</strong> Split equally across all{' '}
                  <strong>{roomMembers.length} room flatmates</strong>.
                </div>
              </div>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Souq vegetable market"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Log Expense'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
