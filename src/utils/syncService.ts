import { RoomData, Expense, Settlement, FixedBillsConfig } from '../types';

const STORAGE_KEY = 'kuwait_room_mess_data_v1';
const ACTIVE_ACCOUNT_KEY = 'kuwait_room_mess_active_account';

export function getLocalStoredData(): RoomData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse local storage data:', e);
  }
  return null;
}

export function saveLocalStoredData(data: RoomData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to local storage:', e);
  }
}

export function getSavedActiveAccount(): string {
  try {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || 'Rikash';
  } catch {
    return 'Rikash';
  }
}

export function saveActiveAccount(name: string) {
  try {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, name);
  } catch {
    // ignore
  }
}

export async function fetchServerData(): Promise<RoomData> {
  const res = await fetch('/api/data');
  if (!res.ok) {
    throw new Error('Failed to fetch room data');
  }
  const json = await res.json();
  return json.data;
}

export async function createExpenseApi(expense: Partial<Expense>): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create expense' }));
    throw new Error(err.error || 'Failed to create expense');
  }
  return res.json();
}

export async function updateExpenseApi(id: string, expense: Partial<Expense>): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  if (!res.ok) {
    throw new Error('Failed to update expense');
  }
  return res.json();
}

export async function deleteExpenseApi(id: string): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete expense');
  }
  return res.json();
}

export async function createSettlementApi(settlement: {
  fromMember: string;
  toMember: string;
  amount: number;
  date?: string;
  note?: string;
}): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch('/api/settlements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settlement),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to record settlement' }));
    throw new Error(err.error || 'Failed to record settlement');
  }
  return res.json();
}

export async function deleteSettlementApi(id: string): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch(`/api/settlements/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete settlement');
  }
  return res.json();
}

export async function updateConfigApi(payload: {
  fixedBills?: Partial<FixedBillsConfig>;
  members?: string[];
  vacationMembers?: string[];
}): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to update config');
  }
  return res.json();
}

export async function startBillingCycleApi(payload: {
  startDate: string;
  endDate?: string;
  name?: string;
}): Promise<{ success: boolean; data: RoomData; message?: string }> {
  const res = await fetch('/api/billing-cycle/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to start billing cycle' }));
    throw new Error(err.error || 'Failed to start billing cycle');
  }
  return res.json();
}

export async function editBillingCycleApi(payload: {
  startDate?: string;
  endDate?: string;
  name?: string;
}): Promise<{ success: boolean; data: RoomData; message?: string }> {
  const res = await fetch('/api/billing-cycle/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to edit billing cycle' }));
    throw new Error(err.error || 'Failed to edit billing cycle');
  }
  return res.json();
}

export async function resetMonthApi(month: string): Promise<{ success: boolean; data: RoomData; message?: string }> {
  const res = await fetch('/api/reset-month', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month }),
  });
  if (!res.ok) {
    throw new Error('Failed to reset monthly bills');
  }
  return res.json();
}

export async function resetRoomDataApi(): Promise<{ success: boolean; data: RoomData }> {
  const res = await fetch('/api/reset-data', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to reset data');
  }
  return res.json();
}

export async function scanReceiptWithAI(imageBase64: string, mimeType: string) {
  const res = await fetch('/api/scan-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to scan receipt' }));
    throw new Error(err.error || 'Failed to scan receipt');
  }
  return res.json();
}
