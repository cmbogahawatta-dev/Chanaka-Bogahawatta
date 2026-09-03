import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  DollarSign,
  Calendar,
  Building,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Percent,
  Hash,
  User,
  ArrowRight
} from 'lucide-react';
import { Income } from '../../types/pettyCashTypes';
import { formatLkr, VAT_RATE, round2 } from '../../utils/vatCalculations';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Income | null;
  onOpenRecordPayment?: (invoice: Income) => void;
  onOpenEdit?: (invoice: Income) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
  onOpenEdit
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const invoiceNumber = invoice.invoiceNumber || invoice.INCOME_ID;
  const invoiceDate = invoice.invoiceDate || invoice.DATE_REF || invoice.DATE;
  const dueDate = invoice.dueDate || invoice.invoiceDueDate || 'Upon Certification';
  const clientName = invoice.clientName || 'National Water Supply & Drainage Board';
  const projectCode = invoice.PROJECT || 'PIDM 26';
  const description = invoice.billingDescription || invoice.invoiceDescription || invoice.REMARKS || 'Certified Project Billing / Work Milestone';
  const vatRate = invoice.vatRate !== undefined ? invoice.vatRate : (invoice.vatTreatment === 'VAT_NOT_APPLICABLE' ? 0 : VAT_RATE);
  const netAmount = invoice.netAmount ?? invoice.AMOUNT;
  const vatAmount = invoice.vatAmount ?? 0;
  const grossAmount = invoice.grossAmount ?? invoice.AMOUNT;
  const amountReceived = invoice.amountReceived ?? 0;
  const balanceDue = invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, grossAmount - amountReceived);
  const status = invoice.paymentStatus || (balanceDue <= 0 ? 'Paid' : amountReceived > 0 ? 'Partially Paid' : 'Pending');

  // Check if overdue
  const isOverdue = status !== 'Paid' && invoice.dueDate && new Date(invoice.dueDate) < new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[92vh]">
        {/* Top Actions Bar (Screen only, hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tax Invoice Preview</span>
                <span className="font-mono text-indigo-400 font-bold">#{invoiceNumber}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official IRD Compliant VAT Tax Invoice • Project {projectCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenRecordPayment && balanceDue > 0 && (
              <button
                onClick={() => onOpenRecordPayment(invoice)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            {onOpenEdit && (
              <button
                onClick={() => onOpenEdit(invoice)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Document Canvas */}
        <div className="p-5 sm:p-8 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:bg-white print:text-black">
          <div ref={printRef} className="space-y-6 max-w-2xl mx-auto">
            {/* Document Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm tracking-wider">
                    EMA
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                      EMA Construction (Pvt) Ltd
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600 tracking-wide">
                      Civil & Structural Engineering Contractors
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-600 space-y-0.5">
                  <p>No. 45/2, Nawala Road, Narahenpita, Colombo 05, Sri Lanka</p>
                  <p>Tel: +94 11 289 4410 • Email: finance@emaconstruction.lk</p>
                  <div className="pt-1 flex flex-wrap gap-x-4 font-mono text-[11px] text-slate-800">
                    <span><strong>VAT Reg No:</strong> 114-892-441-7000</span>
                    <span><strong>TIN:</strong> 114892441-0000</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-950 text-white text-xs font-black px-3.5 py-1 uppercase tracking-widest rounded">
                  VAT TAX INVOICE
                </div>
                <div className="mt-2 text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice No</p>
                  <p className="text-base font-mono font-black text-slate-950">{invoiceNumber}</p>
                </div>
                <div className="mt-1 text-[11px] text-slate-600 space-y-0.5 font-mono">
                  <p><strong>Date:</strong> {invoiceDate}</p>
                  <p><strong>Due Date:</strong> {dueDate}</p>
                  {isOverdue && (
                    <span className="inline-block bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                      OVERDUE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To & Project Info */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Billed To / Client
                </p>
                <p className="font-bold text-slate-900 text-sm">{clientName}</p>
                <p className="text-slate-600 mt-0.5">Head Office / Authorized Procurement Branch</p>
                <p className="text-slate-500 mt-1 font-mono text-[11px]">Sri Lanka</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Project Details
                </p>
                <p className="font-mono font-bold text-slate-900 text-sm">{projectCode}</p>
                <p className="text-slate-700 font-medium mt-0.5">Contract Scope / Project Site Execution</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">VAT Status:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                    {invoice.vatTreatment === 'VAT_NOT_APPLICABLE' ? 'Exempt (0%)' : `Standard (${vatRate}%)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-hidden border border-slate-300 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Item #</th>
                    <th className="py-2.5 px-3">Scope / Milestone Description</th>
                    <th className="py-2.5 px-3 text-right">Net Amount (LKR)</th>
                    <th className="py-2.5 px-3 text-right">VAT ({vatRate}%)</th>
                    <th className="py-2.5 px-3 text-right">Total (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="py-3 px-3 text-slate-500 font-bold">01</td>
                    <td className="py-3 px-3 font-sans">
                      <p className="font-bold text-slate-900">{description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Civil engineering contract works certified according to project milestones.
                      </p>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatLkr(netAmount)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">{formatLkr(vatAmount)}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-950">{formatLkr(grossAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Breakdown */}
            <div className="flex flex-wrap items-start justify-between gap-6 pt-2">
              <div className="max-w-xs space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                  <p className="font-bold text-slate-800 uppercase tracking-wide mb-1">
                    Bank Remittance Details
                  </p>
                  <p><strong>Bank:</strong> Commercial Bank of Ceylon PLC</p>
                  <p><strong>Account Name:</strong> EMA Construction (Pvt) Ltd</p>
                  <p><strong>Account No:</strong> 1000 4829 4820</p>
                  <p><strong>Branch:</strong> Nawala Corporate Branch (Code 019)</p>
                </div>

                {invoice.paymentReference && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900">
                    <span className="font-bold">Payment Ref: </span>
                    <span>{invoice.paymentReference}</span>
                    {invoice.paymentDate && <span> ({invoice.paymentDate})</span>}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-72 space-y-1.5 font-mono text-xs border border-slate-300 p-3.5 rounded-xl bg-slate-50">
                <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-200">
                  <span>Net Amount (Excl. VAT):</span>
                  <span className="font-bold text-slate-900">{formatLkr(netAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 pb-1 border-b border-slate-200">
                  <span>Output VAT ({vatRate}%):</span>
                  <span className="font-bold">{formatLkr(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-950 font-black text-sm pt-1 pb-1 border-b-2 border-slate-900">
                  <span>Gross Invoice Total:</span>
                  <span>{formatLkr(grossAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Amount Received:</span>
                  <span className="font-bold">({formatLkr(amountReceived)})</span>
                </div>
                <div className="flex justify-between text-slate-950 font-extrabold text-sm pt-1.5 border-t border-slate-300">
                  <span className={balanceDue > 0 ? 'text-amber-800' : 'text-emerald-800'}>
                    Balance Due:
                  </span>
                  <span className={balanceDue > 0 ? 'text-amber-800' : 'text-emerald-800'}>
                    {formatLkr(balanceDue)}
                  </span>
                </div>

                <div className="pt-2 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : status === 'Partially Paid'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  }`}>
                    Status: {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Authorizations Signatures */}
            <div className="pt-10 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600 font-semibold border-t border-slate-200">
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p>Prepared By (Accounts Officer)</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p>Checked By (Chief Accountant)</p>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-400 mb-1" />
                <p>Approved By (Managing Director)</p>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-400 pt-3">
              This is a computer-generated tax invoice generated by EMA Construction ERP & Fleet Management System.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
