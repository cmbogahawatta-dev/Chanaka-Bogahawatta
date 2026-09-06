import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  Building,
  CreditCard,
  Ban,
  FileSpreadsheet,
  Share2,
  ExternalLink,
  History,
  Check,
  RefreshCw,
  Copy,
  Trash2
} from 'lucide-react';
import { TaxInvoice } from '../../types/taxInvoiceTypes';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { formatDateToGazette, validateTaxInvoiceForIssuance } from '../../utils/taxInvoiceUtils';

interface TaxInvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice | null;
  onOpenRecordPayment: (invoice: TaxInvoice) => void;
  onOpenCancelInvoice: (invoice: TaxInvoice) => void;
  onOpenCreditNote: (invoice: TaxInvoice) => void;
  onOpenDeleteInvoice?: (invoice: TaxInvoice) => void;
}

export const TaxInvoiceDetailModal: React.FC<TaxInvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
  onOpenCancelInvoice,
  onOpenCreditNote,
  onOpenDeleteInvoice
}) => {
  const {
    submitInvoice,
    approveInvoice,
    issueInvoice,
    syncToQuickBooks,
    downloadInvoicePdf,
    printInvoicePdf
  } = useTaxInvoice();

  const { currentUser, currentRole } = useEnterprise();

  const [activeTab, setActiveTab] = useState<'preview' | 'compliance' | 'audit' | 'qbo'>('preview');
  const [issueError, setIssueError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState(false);

  if (!isOpen || !invoice) return null;

  const isDraft = invoice.isDraft || invoice.status === 'DRAFT' || invoice.status === 'SUBMITTED' || invoice.status === 'APPROVED';
  const isSubmitted = invoice.status === 'SUBMITTED';
  const isApproved = invoice.status === 'APPROVED';
  const isIssued = invoice.status === 'ISSUED' || invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID';
  const isCancelled = invoice.status === 'CANCELLED';

  const canApprove = currentRole === 'ADMIN' || currentRole === 'FINANCE' || currentRole === 'OWNER';

  const compliance = validateTaxInvoiceForIssuance(invoice);

  const handleIssue = () => {
    setIssueError(null);
    const res = issueInvoice(invoice.id, currentUser || 'Finance Director');
    if (!res.success && res.errors) {
      setIssueError(res.errors.join(' '));
    }
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText(invoice.serialNumber);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
              isCancelled ? 'bg-rose-950/80 border-rose-800 text-rose-300' :
              isDraft ? 'bg-amber-950/80 border-amber-800 text-amber-300' :
              'bg-emerald-950/80 border-emerald-800 text-emerald-300'
            }`}>
              {isCancelled ? <Ban className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {invoice.isCreditNote ? 'TAX CREDIT NOTE' : 'OFFICIAL TAX INVOICE'}
                </h2>
                <button
                  onClick={handleCopySerial}
                  className="flex items-center gap-1 font-mono font-bold text-xs text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 hover:bg-cyan-900/60 transition-colors"
                  title="Click to copy serial"
                >
                  <span>{invoice.serialNumber}</span>
                  {copyNotice ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isIssued ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                  isCancelled ? 'bg-rose-950 text-rose-300 border-rose-700' :
                  isApproved ? 'bg-indigo-950 text-indigo-300 border-indigo-700' :
                  isSubmitted ? 'bg-amber-950 text-amber-300 border-amber-700' :
                  'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inland Revenue Gazette No. 2481/22 Compliant • Date: {formatDateToGazette(invoice.invoiceDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => printInvoicePdf(invoice)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Print official invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => downloadInvoicePdf(invoice)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
              title="Download official A4 PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Workflow Sub-bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'preview' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Invoice Form & PDF
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'compliance' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Gazette Checklist (18)</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
            <button
              onClick={() => setActiveTab('qbo')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                activeTab === 'qbo' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              QuickBooks Sync
            </button>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2">
            {invoice.status === 'DRAFT' && (
              <button
                onClick={() => submitInvoice(invoice.id, currentUser || 'Finance Officer')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Approval</span>
              </button>
            )}

            {isSubmitted && canApprove && (
              <button
                onClick={() => approveInvoice(invoice.id, currentUser || 'Finance Director')}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Invoice</span>
              </button>
            )}

            {isApproved && (
              <button
                onClick={handleIssue}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Issue Official Tax Invoice</span>
              </button>
            )}

            {isIssued && (
              <>
                <button
                  onClick={() => onOpenRecordPayment(invoice)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Client Payment</span>
                </button>

                <button
                  onClick={() => onOpenCreditNote(invoice)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold flex items-center gap-1.5 border border-indigo-900/60"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Issue Credit Note</span>
                </button>

                <button
                  onClick={() => onOpenCancelInvoice(invoice)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold flex items-center gap-1.5 border border-rose-800"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Invoice</span>
                </button>
              </>
            )}

            {onOpenDeleteInvoice && (
              <button
                onClick={() => onOpenDeleteInvoice(invoice)}
                className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold flex items-center gap-1.5 border border-rose-800/80 transition-colors ml-auto sm:ml-0"
                title="Permanently delete invoice with Admin Security Key"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {issueError && (
          <div className="px-6 py-2.5 bg-rose-950/80 border-b border-rose-900 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Cannot issue invoice: {issueError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* TAB 1: FORM & PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Prominent Statutory Banner */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 font-black text-[11px] border border-red-800 tracking-wider">
                      TAX INVOICE
                    </span>
                    <span className="text-slate-400 font-medium">
                      Inland Revenue Department • Gazette Extraordinary No. 2481/22
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Serial: <strong className="font-mono text-cyan-300 text-sm">{invoice.serialNumber}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Invoice Consideration (Gross)</span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    LKR {invoice.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Balance Due: LKR {invoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Supplier & Purchaser Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                    Supplier (Issuing Entity)
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-sm">{invoice.supplierName}</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">{invoice.supplierAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">TIN:</span>
                      <strong className="text-cyan-300">{invoice.supplierTin}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">VAT No:</span>
                      <strong className="text-cyan-300">{invoice.supplierVatNumber}</strong>
                    </div>
                  </div>
                </div>

                {/* Purchaser */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                    Purchaser (Client / Recipient)
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-sm">{invoice.purchaserName}</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">{invoice.purchaserAddress || 'Not specified'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">TIN:</span>
                      <strong className="text-cyan-300">{invoice.purchaserTin || 'Required under Gazette'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">VAT No:</span>
                      <strong className="text-cyan-300">{invoice.purchaserVatNumber || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates & Project Reference */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Invoice Date:</span>
                  <span className="font-mono font-bold text-white">{formatDateToGazette(invoice.invoiceDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Supply Date / Period:</span>
                  <span className="font-mono text-slate-300">{formatDateToGazette(invoice.supplyDate || invoice.invoiceDate)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Project & IPC:</span>
                  <span className="font-bold text-slate-200">{invoice.projectCode} {invoice.ipcNumber && `• ${invoice.ipcNumber}`}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Due Date:</span>
                  <span className="font-mono text-amber-400">{formatDateToGazette(invoice.dueDate)}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="py-2.5 px-3 font-semibold w-10">#</th>
                      <th className="py-2.5 px-3 font-semibold">Description of Taxable Supply</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-16">Unit</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-20">Qty</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Rate (LKR)</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-32">Taxable (LKR)</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-16">VAT %</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">VAT (LKR)</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-32">Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoice.lineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-center">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{item.description}</td>
                        <td className="py-2.5 px-3 text-center text-slate-400">{item.unitOfMeasure || 'Nos'}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-white font-medium">{item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{item.vatRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-400 font-medium">{item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Financial Breakdown */}
              <div className="flex flex-col md:flex-row justify-between gap-4 pt-2">
                <div className="flex-1 p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Amount in Words:</span>
                    <p className="font-semibold text-white italic">{invoice.amountInWords}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">Bank Details:</span> Commercial Bank PLC • Echelon Square Corporate • A/C 1000-8491-0028
                  </div>
                </div>

                <div className="w-full md:w-80 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Value (Excl. VAT):</span>
                    <span className="font-mono text-white">LKR {invoice.totalTaxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-red-400 font-semibold">
                    <span>VAT @ {invoice.vatRate}%:</span>
                    <span className="font-mono">LKR {invoice.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-2 text-sm">
                    <span>Total Consideration:</span>
                    <span className="font-mono text-emerald-400">LKR {invoice.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GAZETTE COMPLIANCE CHECKLIST */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">18-Point Statutory Gazette Verification</h3>
                  <p className="text-slate-400 text-xs">
                    Statutory adherence checklist according to Inland Revenue Gazette Extraordinary No. 2481/22 and No. 2500/106.
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold text-xs border ${
                  compliance.isValid ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}>
                  {compliance.isValid ? '100% COMPLIANT ✓' : `${compliance.errors.length} VIOLATION(S) ✗`}
                </span>
              </div>

              <div className="space-y-2">
                {compliance.checklist.map(item => (
                  <div
                    key={item.point}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                      item.passed ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-950/40 border-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {item.point}
                      </span>
                      <div>
                        <h4 className={`font-bold ${item.passed ? 'text-white' : 'text-rose-300'}`}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.detail}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      item.passed ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                    }`}>
                      {item.passed ? 'PASSED' : 'REQUIRED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-xs">Immutable Sequential Audit Log</h4>
                <p className="text-slate-400 text-[11px]">
                  All issuance, modification, authorization, and payment events are permanently timestamped.
                </p>
              </div>

              <div className="space-y-2">
                {invoice.auditTrail?.map((log, idx) => (
                  <div key={log.id || idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Performed by: <strong className="text-white">{log.performedBy}</strong>
                      </p>
                      {log.notes && (
                        <p className="text-slate-400 text-[11px] mt-1 bg-slate-900/80 p-2 rounded border border-slate-800">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: QUICKBOOKS INTEGRATION */}
          {activeTab === 'qbo' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">QuickBooks Online (QBO) Ledger Synchronization</h4>
                  <p className="text-slate-400 text-xs">
                    Synchronizes certified taxable supplies and output VAT into QBO General Ledger.
                  </p>
                </div>
                <button
                  onClick={() => syncToQuickBooks(invoice.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync to QuickBooks</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sync Status:</span>
                  <span className={`font-bold ${invoice.qbo?.status === 'Synced' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {invoice.qbo?.status || 'Not Synced'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">QBO Reference ID:</span>
                  <span className="font-mono text-cyan-300">{invoice.qbo?.qboInvoiceId || 'Pending Sync'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Synced:</span>
                  <span className="font-mono text-slate-300">{invoice.qbo?.lastSyncedAt ? new Date(invoice.qbo.lastSyncedAt).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
