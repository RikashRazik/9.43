import { Expense, MemberSummary } from '../types';

export function calculateFinancials(
  members: string[],
  expenses: Expense[],
  selectedMonth?: string, // YYYY-MM, 'ALL', 'CYCLE'
  vacationMembers: string[] = [],
  currentCycle?: { startDate: string; endDate: string }
) {
  // Filter by cycle or month if provided and not ALL
  let filteredExpenses = expenses;
  if (selectedMonth === 'CYCLE' && currentCycle) {
    filteredExpenses = expenses.filter(
      (e) => e.date >= currentCycle.startDate && e.date <= currentCycle.endDate
    );
  } else if (selectedMonth && selectedMonth !== 'ALL') {
    filteredExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  }

  // Initialize summary map
  const memberMap: Record<string, MemberSummary> = {};
  for (const m of members) {
    memberMap[m] = {
      name: m,
      totalPaid: 0,
      totalShare: 0,
      amountToPay: 0,
      excessPaid: 0,
      expenseCount: 0,
      onVacation: vacationMembers.includes(m),
    };
  }

  // 1. Calculate expense payments and fair shares
  let totalRoomSpending = 0;
  for (const exp of filteredExpenses) {
    totalRoomSpending += exp.amount;
    
    // Who paid
    if (memberMap[exp.paidBy]) {
      memberMap[exp.paidBy].totalPaid += exp.amount;
      memberMap[exp.paidBy].expenseCount += 1;
    }

    // Determine if this expense is a fixed room utility (Rent, Wifi, Electricity/Current)
    const catLower = (exp.category || '').toLowerCase();
    const titleLower = (exp.title || '').toLowerCase();
    const isUtilityOrRent = 
      catLower.includes('rent') ||
      catLower.includes('recharge') ||
      catLower.includes('internet') ||
      catLower.includes('wifi') ||
      catLower.includes('electricity') ||
      catLower.includes('current') ||
      titleLower.includes('rent') ||
      titleLower.includes('wifi') ||
      titleLower.includes('recharge') ||
      titleLower.includes('electricity') ||
      titleLower.includes('current charges');

    let participants: string[];

    if (isUtilityOrRent) {
      // Rent, Wifi, and Electricity must be paid by EVERYONE during vacation as well!
      participants = members;
    } else {
      // Mess / Food / Groceries: vacation members are EXEMPT!
      const activeMembers = members.filter(m => !vacationMembers.includes(m));
      participants = activeMembers.length > 0 ? activeMembers : members;
    }

    if (participants.length > 0) {
      const perPersonShare = exp.amount / participants.length;
      for (const p of participants) {
        if (memberMap[p]) {
          memberMap[p].totalShare += perPersonShare;
        }
      }
    }
  }

  // 2. Compute "Final Amount You Need To Pay This Month" for each member
  const memberSummaries: MemberSummary[] = [];
  for (const m of members) {
    const summary = memberMap[m];
    summary.totalPaid = Math.round(summary.totalPaid * 1000) / 1000;
    summary.totalShare = Math.round(summary.totalShare * 1000) / 1000;
    
    const diff = summary.totalShare - summary.totalPaid;
    if (diff > 0.001) {
      summary.amountToPay = Math.round(diff * 1000) / 1000;
      summary.excessPaid = 0;
    } else if (diff < -0.001) {
      summary.amountToPay = 0;
      summary.excessPaid = Math.round(Math.abs(diff) * 1000) / 1000;
    } else {
      summary.amountToPay = 0;
      summary.excessPaid = 0;
    }

    memberSummaries.push(summary);
  }

  // 3. Fixed Bills Tracking for this month
  const rentExpense = filteredExpenses.find(e => 
    e.category === 'Rent (205 KD)' || e.title.toLowerCase().includes('rent')
  );
  const rechargeExpense = filteredExpenses.find(e => 
    e.category === 'Internet Recharge (5 KD)' || e.title.toLowerCase().includes('wifi') || e.title.toLowerCase().includes('recharge')
  );
  const electricityExpenses = filteredExpenses.filter(e => 
    e.category === 'Electricity Bill' || e.title.toLowerCase().includes('electric') || e.title.toLowerCase().includes('current')
  );
  const electricityTotal = electricityExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const exp of filteredExpenses) {
    categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
  }

  return {
    totalRoomSpending: Math.round(totalRoomSpending * 1000) / 1000,
    memberSummaries,
    categoryBreakdown,
    filteredExpenses,
    fixedBillsStatus: {
      rent: {
        paid: !!rentExpense,
        amount: rentExpense ? rentExpense.amount : 205,
        paidBy: rentExpense ? rentExpense.paidBy : null,
      },
      recharge: {
        paid: !!rechargeExpense,
        amount: rechargeExpense ? rechargeExpense.amount : 5,
        paidBy: rechargeExpense ? rechargeExpense.paidBy : null,
      },
      electricity: {
        paid: electricityExpenses.length > 0,
        amount: electricityTotal,
        paidBy: electricityExpenses.length > 0 ? electricityExpenses[0].paidBy : null,
      }
    }
  };
}
