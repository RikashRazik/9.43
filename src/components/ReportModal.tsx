import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Printer 
} from 'lucide-react';
import { MemberSummary, Expense, formatKD } from '../types';
import { generateRoomPDF } from '../utils/pdfExport';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  totalRoomSpending: number;
  memberSummaries: MemberSummary[];
  expenses: Expense[];
  fixedBillsStatus: {
    rent: { paid: boolean; amount: number; paidBy: string | null };
    recharge: { paid: boolean; amount: number; paidBy: string | null };
    electricity: { paid: boolean; amount: number; paidBy: string | null };
  };
  rentAmount: number;
  rechargeAmount: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  totalRoomSpending,
  memberSummaries,
  expenses,
  fixedBillsStatus,
  rentAmount,
  rechargeAmount,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const monthLabel =
    selectedMonth === 'ALL'
      ? 'All Months Total'
      : new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });

  // Generate WhatsApp room group share text
  const generateWhatsAppText = () => {
    let text = `🇰🇼 *ROOM MESS & BILL SUMMARY - ${monthLabel}*\n`;
    text += `💰 *Total Room Spend:* ${formatKD(totalRoomSpending)}\n`;
    text += `🏠 *Flat Rent (205 KD):* ${fixedBillsStatus.rent.paid ? `Paid by ${fixedBillsStatus.rent.paidBy}` : 'Pending'}\n`;
    text += `📶 *Room Wifi (5 KD):* ${fixedBillsStatus.recharge.paid ? `Paid by ${fixedBillsStatus.recharge.paidBy}` : 'Pending'}\n\n`;

    text += `👥 *FINAL AMOUNT TO PAY PER PERSON (5 Members):*\n`;
    for (const m of memberSummaries) {
      const status =
        m.amountToPay > 0.001
          ? `🔴 *PAYS: ${formatKD(m.amountToPay)}* (Spent: ${formatKD(m.totalPaid)} | Share: ${formatKD(m.totalShare)})`
          : m.excessPaid > 0.001
          ? `🟢 *PAID FULL (+${formatKD(m.excessPaid)} excess)* (Spent: ${formatKD(m.totalPaid)})`
          : `⚪ *BALANCED (0.000 KD)*`;
      text += `• *${m.name}:* ${status}\n`;
    }

    text += `\n_Generated live by Kuwait Room Mess Calculator_`;
    return text;
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(generateWhatsAppText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPDF = () => {
    generateRoomPDF({
      monthName: monthLabel,
      roomSpending: totalRoomSpending,
      members: memberSummaries,
      expenses,
      fixedBills: fixedBillsStatus,
    });
  };

  // Download simple CSV
  const handleDownloadCSV = () => {
    let csv = 'Date,Title,Category,PaidBy,Amount_KD,Notes\n';
    expenses.forEach((e) => {
      const safeTitle = `"${e.title.replace(/"/g, '""')}"`;
      const safeNotes = `"${(e.notes || '').replace(/"/g, '""')}"`;
      csv += `${e.date},${safeTitle},${e.category},${e.paidBy},${e.amount.toFixed(3)},${safeNotes}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kuwait_Room_Mess_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-800" />
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Room Statement & Payment Summary
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {monthLabel} · Kuwait Dinar (KD)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy for WhatsApp'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Export CSV Spreadsheet</span>
            </button>
          </div>

          {/* Statement Preview Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-[11px]">
            <div className="text-center font-bold text-slate-900 border-b border-slate-200 pb-2">
              KUWAIT ROOM MESS AUDIT - {monthLabel.toUpperCase()}
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 py-1">
              <div>Total Room Spend: <strong>{formatKD(totalRoomSpending)}</strong></div>
              <div>Per Person Share: <strong>{formatKD(totalRoomSpending / 5)}</strong></div>
              <div>Flat Rent (205 KD): <strong>{fixedBillsStatus.rent.paid ? `Paid (${fixedBillsStatus.rent.paidBy})` : 'Pending'}</strong></div>
              <div>Wifi (5 KD): <strong>{fixedBillsStatus.recharge.paid ? `Paid (${fixedBillsStatus.recharge.paidBy})` : 'Pending'}</strong></div>
            </div>

            <div className="border-t border-slate-200 pt-2">
              <div className="font-bold text-slate-800 mb-1">MEMBER FINAL AMOUNTS TO PAY:</div>
              {memberSummaries.map((m) => (
                <div key={m.name} className="flex justify-between py-1 text-slate-700 border-b border-slate-100 last:border-0">
                  <span>{m.name}:</span>
                  <span>
                    Spent {formatKD(m.totalPaid)} | Share {formatKD(m.totalShare)} |{' '}
                    <strong className={m.amountToPay > 0.001 ? 'text-rose-600 font-bold' : m.excessPaid > 0.001 ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                      {m.amountToPay > 0.001 
                        ? `PAYS ${formatKD(m.amountToPay)}` 
                        : m.excessPaid > 0.001 
                        ? `PAID FULL (+${formatKD(m.excessPaid)})` 
                        : 'BALANCED'}
                    </strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
