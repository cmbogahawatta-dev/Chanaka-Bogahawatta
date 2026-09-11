import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Eye,
  GitFork,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Building,
  DollarSign,
  Briefcase,
  Landmark,
  ShieldCheck,
  Edit3,
  Trash2,
  Copy,
  History,
  ArrowRight
} from 'lucide-react';
import { Quotation, QuotationStatus } from '../../types/quotationTypes';
import { useQuotation } from '../../context/QuotationContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { formatQuotationDate } from '../../utils/quotationUtils';

interface QuotationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onOpenPreview: (quotation: Quotation) => void;
  onOpenRevisionModal: (quotation: Quotation) => void;
  onOpenConvertModal: (quotation: Quotation) => void;
  onOpenEditModal: (quotation: Quotation) => void;
  onOpenDeleteModal?: (quotation: Quotation) => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onOpenPreview,
  onOpenRevisionModal,
  onOpenConvertModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onNavigateToInvoice
}) => {
  const { updateStatus, downloadQuotationPdf, printQuotationPdf } = useQuotation();
  const { currentUser } = useEnterprise();

  const [activeTab, setActiveTab] = useState<'overview' | 'terms' | 'audit'>('overview');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!isOpen || !quotation) return null;

  const isQuotation = quotation.documentType === 'QUOTATION';
  const isDraft = quotation.status === 'DRAFT';
  const isSent = quotation.status === 'SENT';
  const isAccepted = quotation.status === 'ACCEPTED';
  const isConverted = quotation.status === 'CONVERTED';
  const isExpired = quotation.status === 'EXPIRED';
  const isCancelled = quotation.status === 'CANCELLED';
  const isRejected = quotation.status === 'REJECTED';

  const handleStatusTransition = (newStatus: QuotationStatus, notes?: string) => {
    updateStatus(quotation.id, newStatus, currentUser || 'Commercial Lead', notes);
    setShowRejectInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isQuotation ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {quotation.quotationNumber}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  {quotation.revision?.revisionLabel || 'Rev.00'}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                  isAccepted || isConverted ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  isSent ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                  isExpired ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  isRejected || isCancelled ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {quotation.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {quotation.clientName} • Quoted: LKR {quotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPreview(quotation)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Preview</span>
            </button>

            <button
              onClick={() => downloadQuotationPdf(quotation)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => onOpenEditModal(quotation)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Edit Quotation details and line items"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit</span>
            </button>

            {onOpenDeleteModal && (
              <button
                onClick={() => onOpenDeleteModal(quotation)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Delete this quotation"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => printQuotationPdf(quotation)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow Action Command Strip */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Lifecycle Actions:</span>

            {isDraft && (
              <button
                onClick={() => handleStatusTransition('SENT')}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Sent</span>
              </button>
            )}

            {(isDraft || isSent) && (
              <button
                onClick={() => handleStatusTransition('ACCEPTED')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Accept Quotation</span>
              </button>
            )}

            {(isDraft || isSent) && (
              <button
                onClick={() => setShowRejectInput(prev => !prev)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Reject</span>
              </button>
            )}

            {/* Revision Action */}
            <button
              onClick={() => onOpenRevisionModal(quotation)}
              className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 flex items-center gap-1.5 transition-colors font-semibold"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Create Revision</span>
            </button>

            {/* Convert to Tax Invoice Action */}
            {!isConverted && (
              <button
                onClick={() => onOpenConvertModal(quotation)}
                className="px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 flex items-center gap-1.5 transition-colors font-bold shadow-sm"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Convert to Tax Invoice</span>
              </button>
            )}

            {/* Edit Quotation / Estimate */}
            <button
              onClick={() => onOpenEditModal(quotation)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
              title="Edit parameters, items, or commercial terms"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Document</span>
            </button>

            {/* Delete Quotation / Estimate */}
            {onOpenDeleteModal && (
              <button
                onClick={() => onOpenDeleteModal(quotation)}
                className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 flex items-center gap-1.5 transition-colors font-medium"
                title="Delete this quotation"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Independent Sales Document (Zero Expense Impact)</span>
          </div>
        </div>

        {/* Reject Reason Input Banner (when toggled) */}
        {showRejectInput && (
          <div className="px-6 py-3 bg-rose-950/30 border-b border-rose-900/50 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <input
              type="text"
              placeholder="State reason for rejection (e.g. price exceeded budget, awarded to competitor)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="flex-1 bg-slate-900 border border-rose-800/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
            <button
              onClick={() => handleStatusTransition('REJECTED', rejectReason)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => setShowRejectInput(false)}
              className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Converted to Invoice Banner (if applicable) */}
        {isConverted && quotation.convertedInvoiceNumber && (
          <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Converted to Tax Invoice:</span>
              <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700">
                {quotation.convertedInvoiceNumber}
              </span>
              {quotation.convertedAt && (
                <span className="text-slate-400 text-[11px]">
                  on {formatQuotationDate(quotation.convertedAt)}
                </span>
              )}
            </div>
            {quotation.convertedInvoiceId && onNavigateToInvoice && (
              <button
                onClick={() => onNavigateToInvoice(quotation.convertedInvoiceId!)}
                className="flex items-center gap-1 underline font-bold hover:text-white"
              >
                <span>View Tax Invoice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex gap-6 text-xs font-semibold bg-slate-950/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'overview' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Quotation Overview &amp; Items
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'terms' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Commercial Terms &amp; Conditions
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'audit' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            Revisions &amp; Audit Trail ({quotation.auditTrail?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
          {activeTab === 'overview' && (
            <>
              {/* Metadata Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Offer Date</span>
                  <div className="font-semibold text-slate-200">{formatQuotationDate(quotation.quotationDate)}</div>
                  <div className="text-[11px] text-slate-400">Valid: {quotation.validityDays} Days</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Valid Until</span>
                  <div className="font-semibold text-amber-300">{formatQuotationDate(quotation.validUntilDate)}</div>
                  <div className="text-[11px] text-slate-400">{isExpired ? 'Offer Expired' : 'Active Offer'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Project Reference</span>
                  <div className="font-semibold text-purple-300">{quotation.projectCode || 'General'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{quotation.projectName || 'Commercial works'}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Prepared By</span>
                  <div className="font-semibold text-slate-200">{quotation.preparedBy}</div>
                  <div className="text-[11px] text-slate-400">{quotation.revision?.revisionReason || 'Initial estimate'}</div>
                </div>
              </div>

              {/* Client Snapshot Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs font-bold text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span>Client Master Information (Snapshot at Offer Time)</span>
                  </div>
                  {quotation.clientSnapshot?.capturedAt && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Snapshot Taken: {quotation.clientSnapshot.capturedAt.split('T')[0]}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Legal Name:</span>
                    <span className="text-slate-100 font-bold">{quotation.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">TIN / VAT:</span>
                    <span className="font-mono text-slate-200">
                      TIN: {quotation.clientTin || 'N/A'} {quotation.clientVatNumber ? `• VAT: ${quotation.clientVatNumber}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact Attention:</span>
                    <span className="text-slate-200">{quotation.clientContactPerson || 'Direct'} ({quotation.clientPhone || 'No phone'})</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-slate-500 block">Registered Address:</span>
                    <span className="text-slate-300">{quotation.clientAddress}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
                <div className="p-3 bg-slate-950/80 border-b border-slate-800 font-bold text-xs text-slate-300 flex justify-between">
                  <span>Line Items &amp; Commercial Quantities</span>
                  <span className="text-slate-400 font-normal">{quotation.lineItems.length} items listed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/80">
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-2 text-center w-16">Unit</th>
                        <th className="py-2.5 px-2 text-right w-20">Qty</th>
                        <th className="py-2.5 px-3 text-right w-28">Rate (LKR)</th>
                        <th className="py-2.5 px-2 text-center w-16">Disc</th>
                        <th className="py-2.5 px-3 text-right w-32">Taxable (LKR)</th>
                        <th className="py-2.5 px-2 text-center w-14">VAT</th>
                        <th className="py-2.5 px-3 text-right w-32">Total (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {quotation.lineItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-200">{item.description}</td>
                          <td className="py-2.5 px-2 text-center text-slate-400">{item.unitOfMeasure || 'Nos'}</td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-300">{item.quantity.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-amber-400">
                            {item.discountPercent ? `${item.discountPercent}%` : item.discountAmount ? `-${item.discountAmount}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-200 font-semibold">{item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-2 text-center text-slate-400">{item.vatRate}%</td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-400 font-bold">{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total in Words</span>
                    <p className="font-serif italic text-amber-200/90 text-xs bg-slate-900 p-2.5 rounded border border-slate-800">
                      "{quotation.amountInWords}"
                    </p>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal (Before Discount):</span>
                      <span className="font-mono text-slate-200">LKR {quotation.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {quotation.totalDiscountAmount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Commercial Discount:</span>
                        <span className="font-mono">- LKR {quotation.totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                      <span>Taxable Value:</span>
                      <span className="font-mono font-bold text-slate-100">LKR {quotation.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>VAT Output Tax ({quotation.vatRate}%):</span>
                      <span className="font-mono text-rose-400">LKR {quotation.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-100 pt-1 border-t-2 border-slate-700">
                      <span>Total Quoted Amount:</span>
                      <span className="font-mono text-cyan-400 text-base">LKR {quotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Payment Terms</span>
                <p className="text-slate-300 leading-relaxed">{quotation.paymentTerms}</p>
              </div>

              {quotation.deliveryTerms && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Delivery &amp; Mobilization Terms</span>
                  <p className="text-slate-300 leading-relaxed">{quotation.deliveryTerms}</p>
                </div>
              )}

              {quotation.warrantyPeriod && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Warranty &amp; Defects Liability Period</span>
                  <p className="text-slate-300 leading-relaxed">{quotation.warrantyPeriod}</p>
                </div>
              )}

              {quotation.exclusions && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Contractual Exclusions</span>
                  <p className="text-slate-300 leading-relaxed">{quotation.exclusions}</p>
                </div>
              )}

              {quotation.termsAndConditions && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">General Terms &amp; Conditions</span>
                  <pre className="text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                    {quotation.termsAndConditions}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-300">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Document Lifecycle History &amp; Revision Log</span>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {quotation.auditTrail?.map((entry, idx) => (
                    <div key={entry.id || idx} className="py-3 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{entry.action}</span>
                          {entry.newStatus && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                              {entry.newStatus}
                            </span>
                          )}
                        </div>
                        {entry.notes && <p className="text-slate-400 text-xs">{entry.notes}</p>}
                      </div>
                      <div className="text-right text-[11px] text-slate-500 shrink-0">
                        <div>{entry.performedBy}</div>
                        <div className="font-mono">{entry.timestamp.replace('T', ' ').slice(0, 16)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
