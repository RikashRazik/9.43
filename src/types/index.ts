export const ROOM_MEMBERS = ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'] as const;
export type MemberName = typeof ROOM_MEMBERS[number];

export const ACCOUNTS = ['Admin', ...ROOM_MEMBERS] as const;
export type AccountName = typeof ACCOUNTS[number];

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Vegetables & Fruits',
  'Meat & Fish',
  'Water & Drinks',
  'Room Supplies',
  'Rent (205 KD)',
  'Internet Recharge (5 KD)',
  'Electricity Bill',
  'Gas / Cooking',
  'Dining / Treats',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface Expense {
  id: string;
  title: string;
  amount: number; // in KD
  date: string; // YYYY-MM-DD
  category: ExpenseCategory | string;
  paidBy: string;
  splitWith: string[];
  receiptImage?: string;
  vendor?: string;
  notes?: string;
  month: string; // YYYY-MM
  createdAt: string;
}

export interface Settlement {
  id: string;
  fromMember: string;
  toMember: string;
  amount: number;
  date: string;
  note?: string;
  month: string;
  createdAt: string;
}

export interface FixedBillsConfig {
  rentAmount: number; // default 205 KD
  rechargeAmount: number; // default 5 KD
  budgetThresholdKD: number; // default 350 KD
  rentDueDateDay: number; // default 30
  rechargeDueDateDay: number; // default 15
}

export interface BillingCycle {
  id: string;
  name: string; // e.g. "October 2026 Cycle" or "25 Sep - 24 Oct"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
}

export interface RoomData {
  members: string[];
  vacationMembers?: string[]; // Members currently on vacation/leave
  fixedBills: FixedBillsConfig;
  currentCycle?: BillingCycle;
  billingCycles?: BillingCycle[];
  expenses: Expense[];
  settlements: Settlement[];
  lastUpdated: string;
}

export interface MemberSummary {
  name: string;
  totalPaid: number; // what member spent out of pocket
  totalShare: number; // member's share of room costs
  amountToPay: number; // how much this member still needs to pay (totalShare - totalPaid)
  excessPaid: number; // if member paid more than their share (totalPaid - totalShare)
  expenseCount: number;
  onVacation?: boolean; // whether on vacation
}

export interface DebtTransaction {
  from: string; // debtor
  to: string; // creditor
  amount: number; // KD
}

// Kuwaiti Dinar helper functions
export const formatKD = (amount: number): string => {
  const rounded = Math.round(amount * 1000) / 1000;
  return rounded.toFixed(3) + ' KD';
};

export const formatKDRaw = (amount: number): string => {
  const rounded = Math.round(amount * 1000) / 1000;
  return rounded.toFixed(3);
};

// Initial preset member colors & avatars
export const MEMBER_CONFIG: Record<string, { color: string; badge: string; initial: string; role: string }> = {
  Mujeeb: { color: 'bg-emerald-600 text-white', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', initial: 'MJ', role: 'Room Member' },
  Rikash: { color: 'bg-indigo-600 text-white', badge: 'text-indigo-700 bg-indigo-50 border-indigo-200', initial: 'RK', role: 'Room Member' },
  Askar: { color: 'bg-amber-600 text-white', badge: 'text-amber-700 bg-amber-50 border-amber-200', initial: 'AK', role: 'Room Member' },
  Appunni: { color: 'bg-rose-600 text-white', badge: 'text-rose-700 bg-rose-50 border-rose-200', initial: 'AP', role: 'Room Member' },
  Kuttas: { color: 'bg-cyan-600 text-white', badge: 'text-cyan-700 bg-cyan-50 border-cyan-200', initial: 'KT', role: 'Room Member' },
  Admin: { color: 'bg-slate-900 text-white', badge: 'text-slate-800 bg-slate-100 border-slate-300', initial: 'AD', role: 'Mess Manager' },
};
