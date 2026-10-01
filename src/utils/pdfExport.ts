import jsPDF from 'jspdf';
import { Expense, MemberSummary, formatKD } from '../types';

interface PDFExportParams {
  monthName: string;
  roomSpending: number;
  members: MemberSummary[];
  expenses: Expense[];
  fixedBills: {
    rent: { paid: boolean; amount: number; paidBy: string | null };
    recharge: { paid: boolean; amount: number; paidBy: string | null };
    electricity: { paid: boolean; amount: number; paidBy: string | null };
  };
}

export function generateRoomPDF(params: PDFExportParams) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('KUWAIT ROOM MESS & BILL STATEMENT', 14, y);
  y += 7;

  // Subheader
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Billing Month: ${params.monthName}  |  Generated: ${generatedAt}  |  Currency: Kuwaiti Dinar (KD)`, 14, y);
  y += 10;

  // Thin separator rule
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // High Level Summary Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ROOM EXPENSES', 20, y + 8);
  doc.text('FLAT RENT (205 KD)', 75, y + 8);
  doc.text('INTERNET (5 KD)', 125, y + 8);
  doc.text('PER PERSON SHARE', 165, y + 8);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatKD(params.roomSpending), 20, y + 17);
  doc.text(params.fixedBills.rent.paid ? `${formatKD(params.fixedBills.rent.amount)} [Paid]` : '205.000 KD [Due]', 75, y + 17);
  doc.text(params.fixedBills.recharge.paid ? `${formatKD(params.fixedBills.recharge.amount)} [Paid]` : '5.000 KD [Due]', 125, y + 17);
  const avg = params.members.length > 0 ? params.roomSpending / params.members.length : 0;
  doc.text(formatKD(avg), 165, y + 17);

  y += 32;

  // Section 1: Member Payment Due Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Member Payment Status (How Much Each Person Pays This Month)', 14, y);
  y += 6;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('MEMBER', 18, y + 5);
  doc.text('ALREADY SPENT (KD)', 62, y + 5);
  doc.text('1/5 FAIR SHARE (KD)', 105, y + 5);
  doc.text('FINAL AMOUNT TO PAY (KD)', 145, y + 5);
  y += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  for (const m of params.members) {
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y, pageWidth - 14, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(m.name, 18, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(formatKD(m.totalPaid), 62, y + 5);
    doc.text(formatKD(m.totalShare), 105, y + 5);

    if (m.amountToPay > 0.001) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72); // Rose
      doc.text(`PAY:  ${formatKD(m.amountToPay)}`, 145, y + 5);
    } else if (m.excessPaid > 0.001) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 149, 106); // Emerald
      doc.text(`PAID FULL (+${formatKD(m.excessPaid)})`, 145, y + 5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('0.000 KD (BALANCED)', 145, y + 5);
    }

    y += 7.5;
  }
  y += 8;

  // Section 2: Detailed Expense Log
  if (y > 220) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Itemized Room Mess & Bills Log', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DATE', 18, y + 5);
  doc.text('DESCRIPTION', 42, y + 5);
  doc.text('CATEGORY', 105, y + 5);
  doc.text('PAID BY', 145, y + 5);
  doc.text('AMOUNT', 175, y + 5);
  y += 7;

  doc.setFont('helvetica', 'normal');
  const itemsToShow = params.expenses.slice(0, 30);
  for (const exp of itemsToShow) {
    if (y > 275) {
      doc.addPage();
      y = 16;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y, pageWidth - 14, y);

    doc.setTextColor(100, 116, 139);
    doc.text(exp.date, 18, y + 4.5);

    doc.setTextColor(15, 23, 42);
    const titleSnippet = exp.title.length > 32 ? exp.title.slice(0, 30) + '...' : exp.title;
    doc.text(titleSnippet, 42, y + 4.5);

    doc.setTextColor(71, 85, 105);
    const catSnippet = exp.category.length > 18 ? exp.category.slice(0, 16) + '..' : exp.category;
    doc.text(catSnippet, 105, y + 4.5);

    doc.text(exp.paidBy, 145, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(formatKD(exp.amount), 175, y + 4.5);
    doc.setFont('helvetica', 'normal');

    y += 6.5;
  }

  // Footer notes & signature space
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 10;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Verified for Room Members: Mujeeb, Rikash, Askar, Appunni, Kuttas', 14, y);
  doc.text('Kuwait Room Mess Bill Calculator', pageWidth - 60, y);

  // Save the PDF
  const filename = `Kuwait_Room_Mess_${params.monthName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
