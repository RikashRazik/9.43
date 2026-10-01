import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsers with larger limit for receipt image uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Data storage directory
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'room_data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  paidBy: string;
  splitWith: string[];
  receiptImage?: string;
  vendor?: string;
  notes?: string;
  month: string;
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

export interface BillingCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface RoomData {
  members: string[];
  vacationMembers?: string[];
  fixedBills: {
    rentAmount: number;
    rechargeAmount: number;
    budgetThresholdKD: number;
    rentDueDateDay: number;
    rechargeDueDateDay: number;
  };
  currentCycle?: BillingCycle;
  billingCycles?: BillingCycle[];
  expenses: Expense[];
  settlements: Settlement[];
  lastUpdated: string;
}

// Initial mock data customized for Kuwait Room of 5 members
function getInitialData(): RoomData {
  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. 2026-10
  const today = new Date().toISOString().slice(0, 10);
  
  const initialCycle: BillingCycle = {
    id: `cycle-${currentMonth}`,
    name: 'Current Running Cycle',
    startDate: `${currentMonth}-01`,
    endDate: `${currentMonth}-31`,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  return {
    members: ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'],
    vacationMembers: [],
    fixedBills: {
      rentAmount: 205, // 205 KD per month
      rechargeAmount: 5, // 5 KD per month
      budgetThresholdKD: 350,
      rentDueDateDay: 30,
      rechargeDueDateDay: 15
    },
    currentCycle: initialCycle,
    billingCycles: [initialCycle],
    expenses: [
      {
        id: 'exp-rent-1',
        title: 'Flat Monthly Rent (205 KD)',
        amount: 205.000,
        date: today,
        category: 'Rent (205 KD)',
        paidBy: 'Askar',
        splitWith: ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'],
        vendor: 'Building Haris / Landlord',
        notes: 'Monthly flat rent shared equally (41 KD each)',
        month: currentMonth,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'exp-wifi-1',
        title: 'Ooredoo 5G Room Wifi Recharge (5 KD)',
        amount: 5.000,
        date: today,
        category: 'Internet Recharge (5 KD)',
        paidBy: 'Rikash',
        splitWith: ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'],
        vendor: 'Ooredoo Kuwait',
        notes: 'Fixed monthly internet bill (1 KD each)',
        month: currentMonth,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'exp-groc-1',
        title: 'LuLu Hypermarket Groceries (Basmati rice, chicken, oil & spices)',
        amount: 14.750,
        date: today,
        category: 'Groceries',
        paidBy: 'Mujeeb',
        splitWith: ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'],
        vendor: 'LuLu Hypermarket Dajeej',
        notes: 'Monthly mess supplies',
        month: currentMonth,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      },
      {
        id: 'exp-veg-1',
        title: 'Fresh Vegetables & Onion Box from Souq',
        amount: 4.500,
        date: today,
        category: 'Vegetables & Fruits',
        paidBy: 'Appunni',
        splitWith: ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'],
        vendor: 'Vegetable Market',
        notes: 'Tomatoes, onions, green chillies, ginger',
        month: currentMonth,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      },
      {
        id: 'exp-water-1',
        title: 'Drinking Water Can 5-Gallon Bottles x 5',
        amount: 1.250,
        date: today,
        category: 'Water & Drinks',
        paidBy: 'Kuttas',
        splitWith: ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'],
        vendor: 'Rawdatain Water',
        notes: 'Room drinking water delivery',
        month: currentMonth,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ],
    settlements: [],
    lastUpdated: new Date().toISOString()
  };
}

function readData(): RoomData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Ensure defaults if missing
      if (!parsed.members || parsed.members.length === 0) {
        parsed.members = ['Mujeeb', 'Rikash', 'Askar', 'Appunni', 'Kuttas'];
      }
      if (!parsed.fixedBills) {
        parsed.fixedBills = {
          rentAmount: 205,
          rechargeAmount: 5,
          budgetThresholdKD: 350,
          rentDueDateDay: 30,
          rechargeDueDateDay: 15
        };
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading data file, reinitializing:', err);
  }
  const initial = getInitialData();
  writeData(initial);
  return initial;
}

function writeData(data: RoomData) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  broadcastUpdate(data);
}

// Server-Sent Events (SSE) subscribers for real-time live sync across devices
const sseClients: Response[] = [];

function broadcastUpdate(data: RoomData) {
  const payload = `data: ${JSON.stringify({ type: 'SYNC_UPDATE', data })}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// API Routes
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);

  // Send initial data immediately
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: readData() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

app.get('/api/data', (_req: Request, res: Response) => {
  const data = readData();
  res.json({ success: true, data });
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const { title, amount, date, category, paidBy, splitWith, receiptImage, vendor, notes } = req.body;
  
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'Amount is mandatory and must be greater than 0' });
  }

  const parsedAmount = Math.round(Number(amount) * 1000) / 1000;
  const data = readData();
  const expDate = date || new Date().toISOString().slice(0, 10);
  const month = expDate.slice(0, 7);

  const newExpense: Expense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: (title || 'Room Mess Expense').trim(),
    amount: parsedAmount,
    date: expDate,
    category: category || 'Groceries',
    paidBy: paidBy || 'Rikash',
    splitWith: Array.isArray(splitWith) && splitWith.length > 0 ? splitWith : data.members,
    receiptImage: receiptImage || undefined,
    vendor: vendor ? vendor.trim() : undefined,
    notes: notes ? notes.trim() : undefined,
    month,
    createdAt: new Date().toISOString()
  };

  data.expenses.unshift(newExpense);
  writeData(data);

  res.json({ success: true, expense: newExpense, data });
});

app.put('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, amount, date, category, paidBy, splitWith, vendor, notes, receiptImage } = req.body;

  const data = readData();
  const idx = data.expenses.findIndex(e => e.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  const parsedAmount = amount ? Math.round(Number(amount) * 1000) / 1000 : data.expenses[idx].amount;
  const expDate = date || data.expenses[idx].date;

  data.expenses[idx] = {
    ...data.expenses[idx],
    title: title ? title.trim() : data.expenses[idx].title,
    amount: parsedAmount,
    date: expDate,
    category: category || data.expenses[idx].category,
    paidBy: paidBy || data.expenses[idx].paidBy,
    splitWith: Array.isArray(splitWith) && splitWith.length > 0 ? splitWith : data.expenses[idx].splitWith,
    vendor: vendor !== undefined ? vendor : data.expenses[idx].vendor,
    notes: notes !== undefined ? notes : data.expenses[idx].notes,
    receiptImage: receiptImage !== undefined ? receiptImage : data.expenses[idx].receiptImage,
    month: expDate.slice(0, 7)
  };

  writeData(data);
  res.json({ success: true, expense: data.expenses[idx], data });
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readData();
  const prevLen = data.expenses.length;
  data.expenses = data.expenses.filter(e => e.id !== id);

  if (data.expenses.length === prevLen) {
    return res.status(404).json({ success: false, error: 'Expense not found' });
  }

  writeData(data);
  res.json({ success: true, data });
});

// Peer-to-peer settlements
app.post('/api/settlements', (req: Request, res: Response) => {
  const { fromMember, toMember, amount, date, note } = req.body;

  if (!fromMember || !toMember || fromMember === toMember) {
    return res.status(400).json({ success: false, error: 'Valid payer and receiver required' });
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
  }

  const data = readData();
  const setDate = date || new Date().toISOString().slice(0, 10);
  const newSettlement: Settlement = {
    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fromMember,
    toMember,
    amount: Math.round(Number(amount) * 1000) / 1000,
    date: setDate,
    note: note ? note.trim() : undefined,
    month: setDate.slice(0, 7),
    createdAt: new Date().toISOString()
  };

  data.settlements.unshift(newSettlement);
  writeData(data);

  res.json({ success: true, settlement: newSettlement, data });
});

app.delete('/api/settlements/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readData();
  data.settlements = data.settlements.filter(s => s.id !== id);
  writeData(data);
  res.json({ success: true, data });
});

// Update Room Configuration, Fixed Bills, Members & Vacation Status
app.post('/api/config', (req: Request, res: Response) => {
  const { fixedBills, members, vacationMembers } = req.body;
  const data = readData();

  if (fixedBills) {
    data.fixedBills = {
      ...data.fixedBills,
      ...fixedBills
    };
  }

  if (Array.isArray(members) && members.length >= 2) {
    data.members = members;
  }

  if (Array.isArray(vacationMembers)) {
    data.vacationMembers = vacationMembers;
  }

  data.lastUpdated = new Date().toISOString();
  writeData(data);
  res.json({ success: true, data });
});

// Admin Start New Billing Cycle With Custom Start Date
app.post('/api/billing-cycle/start', (req: Request, res: Response) => {
  const { startDate, endDate, name } = req.body;
  if (!startDate) {
    return res.status(400).json({ success: false, error: 'Start date is required' });
  }

  const data = readData();
  const startDt = new Date(startDate);
  // Default end date is 1 month ahead
  const defaultEnd = new Date(startDt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const cycleEnd = endDate || defaultEnd;
  const cycleName = name?.trim() || `Cycle (${startDate} to ${cycleEnd})`;

  const newCycle: BillingCycle = {
    id: `cycle-${Date.now()}`,
    name: cycleName,
    startDate,
    endDate: cycleEnd,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  if (!Array.isArray(data.billingCycles)) {
    data.billingCycles = [];
  }
  // Archive previous cycles
  data.billingCycles = data.billingCycles.map(c => ({ ...c, isActive: false }));
  data.billingCycles.unshift(newCycle);
  data.currentCycle = newCycle;
  data.lastUpdated = new Date().toISOString();

  writeData(data);
  res.json({ success: true, cycle: newCycle, data, message: `New billing cycle started from ${startDate}` });
});

// Admin Edit Current Running Billing Cycle Dates
app.post('/api/billing-cycle/edit', (req: Request, res: Response) => {
  const { startDate, endDate, name } = req.body;
  const data = readData();

  if (!data.currentCycle) {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    data.currentCycle = {
      id: `cycle-${month}`,
      name: name || 'Current Running Cycle',
      startDate: startDate || `${month}-01`,
      endDate: endDate || `${month}-31`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
  } else {
    if (startDate) data.currentCycle.startDate = startDate;
    if (endDate) data.currentCycle.endDate = endDate;
    if (name) data.currentCycle.name = name.trim();
  }

  if (Array.isArray(data.billingCycles)) {
    const idx = data.billingCycles.findIndex(c => c.id === data.currentCycle?.id);
    if (idx !== -1) {
      data.billingCycles[idx] = { ...data.currentCycle };
    } else {
      data.billingCycles.unshift(data.currentCycle);
    }
  }

  data.lastUpdated = new Date().toISOString();
  writeData(data);
  res.json({ success: true, cycle: data.currentCycle, data, message: 'Billing cycle dates updated successfully' });
});

// Admin Reset Monthly Bill at Month End
app.post('/api/reset-month', (req: Request, res: Response) => {
  const { month } = req.body;
  const data = readData();
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  // Filter out expenses for targetMonth
  data.expenses = data.expenses.filter(e => e.month !== targetMonth);
  data.lastUpdated = new Date().toISOString();
  writeData(data);

  res.json({ success: true, data, message: `Successfully cleared expenses for ${targetMonth}` });
});

// Reset or archive
app.post('/api/reset-data', (req: Request, res: Response) => {
  const initial = getInitialData();
  writeData(initial);
  res.json({ success: true, data: initial });
});

// Smart Receipt OCR using Gemini 3.8 Flash
app.post('/api/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Receipt image data is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured' });
    }

    const ai = new GoogleGenAI();
    
    // Clean base64 header if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const cleanMimeType = mimeType || 'image/jpeg';

    const prompt = `Analyze this purchase receipt or bill. The currency is Kuwaiti Dinar (KD or KWD, 1 KD = 1000 fils).
Extract:
1. "amount": The grand total amount as a number in Kuwaiti Dinar (e.g., if receipt shows 4.750 KD or 4 KD 750 fils, return 4.75).
2. "vendor": Store/Supermarket/Supplier name (e.g. LuLu Hypermarket, Sultan Center, Grand Hyper, City Centre, Carrefour, Saveco, Baqala, Ooredoo, Zain, STC, MEW Kuwait Electricity, etc.)
3. "date": Date in YYYY-MM-DD format (if not legible, return "${new Date().toISOString().slice(0, 10)}")
4. "category": Choose the single best match from: ["Groceries", "Vegetables & Fruits", "Meat & Fish", "Water & Drinks", "Room Supplies", "Rent (205 KD)", "Internet Recharge (5 KD)", "Electricity Bill", "Gas / Cooking", "Dining / Treats", "Other"]
5. "title": A concise 3-8 word summary of the main items or purchase (e.g. "LuLu groceries rice & cooking oil", "Drinking water bottles", "Meat & vegetables")
6. "notes": Brief itemized highlights if visible.

Respond ONLY with valid raw JSON in this exact structure:
{
  "amount": number,
  "vendor": string,
  "date": string,
  "category": string,
  "title": string,
  "notes": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: cleanMimeType
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      // Clean potential markdown blocks
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    res.json({ success: true, result: parsedResult });
  } catch (error: any) {
    console.error('Receipt scan error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to scan receipt image' 
    });
  }
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kuwait Room Mess Calculator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
