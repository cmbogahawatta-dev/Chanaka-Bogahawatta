import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Building,
  CheckCircle2,
  ExternalLink,
  Layers,
  Landmark,
  FileCheck,
  Edit3,
  Trash2
} from 'lucide-react';
import { Quotation } from '../../types/quotationTypes';
import { generateQuotationPdf } from '../../utils/quotationPdf';
import { formatQuotationDate, resolveClientAddress } from '../../utils/quotationUtils';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { useQuotation } from '../../context/QuotationContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';

interface QuotationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
  onPrint?: (quotation: Quotation) => void;
  onDownload?: (quotation: Quotation) => void;
  onOpenDetails?: (quotation: Quotation) => void;
  onOpenEdit?: (quotation: Quotation) => void;
  onOpenDelete?: (quotation: Quotation) => void;
}

export const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
  isOpen,
  onClose,
  quotation,
  onPrint,
  onDownload,
  onOpenDetails,
  onOpenEdit,
  onOpenDelete
}) => {
  const { accounts } = useEnterpriseBanking();
  const { updateQuotation, downloadQuotationPdf, printQuotationPdf } = useQuotation();
  const { clients } = useEnterpriseCompany();

  const [activeQuotation, setActiveQuotation] = useState<Quotation | null>(quotation);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'sheet' | 'pdf'>('sheet');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setActiveQuotation(quotation);
  }, [quotation]);

  const resolvedClientAddress = useMemo(() => {
    if (!activeQuotation) return '';
    return resolveClientAddress(activeQuotation, clients);
  }, [activeQuotation, clients]);

  // Selected bank account ID
  const selectedBankAccountId = useMemo(() => {
    if (!activeQuotation) return accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
    if (activeQuotation.bankAccountId) return activeQuotation.bankAccountId;
    if (activeQuotation.settlementBankDetails?.bankAccountId) return activeQuotation.settlementBankDetails.bankAccountId;
    const matched = accounts.find(a => a.accountNumber === activeQuotation.settlementBankDetails?.accountNumber);
    if (matched) return matched.id;
    return accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
  }, [activeQuotation, accounts]);

  const handleBankChange = (accountId: string) => {
    if (!activeQuotation) return;
    const targetAccount = accounts.find(a => a.id === accountId);
    if (!targetAccount) return;

    const newBankDetails = {
      bankAccountId: targetAccount.id,
      accountName: targetAccount.accountName,
      bankName: targetAccount.bank,
      branchName: targetAccount.branch,
      accountNumber: targetAccount.accountNumber,
      swiftCode: targetAccount.swift,
      currency: targetAccount.currency,
      purpose: targetAccount.purpose,
      isPrimary: targetAccount.isPrimary
    };

    updateQuotation(activeQuotation.id, {
      bankAccountId: targetAccount.id,
      settlementBankDetails: newBankDetails
    });

    setActiveQuotation(prev => prev ? {
      ...prev,
      bankAccountId: targetAccount.id,
      settlementBankDetails: newBankDetails
    } : null);
  };

  // Generate live PDF Blob URL whenever active quotation changes
  useEffect(() => {
    if (isOpen && activeQuotation) {
      try {
        const doc = generateQuotationPdf(activeQuotation);
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Failed to generate PDF blob preview:', err);
      }
    }
  }, [isOpen, activeQuotation]);

  if (!isOpen || !activeQuotation) return null;

  const isQuotation = activeQuotation.documentType === 'QUOTATION';
  const isDraft = activeQuotation.status === 'DRAFT';
  const isAccepted = activeQuotation.status === 'ACCEPTED' || activeQuotation.status === 'CONVERTED';
  const isCancelled = activeQuotation.status === 'CANCELLED';
  const isExpired = activeQuotation.status === 'EXPIRED';

  const handleDownload = () => {
    if (onDownload) {
      onDownload(activeQuotation);
    } else {
      downloadQuotationPdf(activeQuotation);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint(activeQuotation);
    } else {
      printQuotationPdf(activeQuotation);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-6xl h-[94vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-slate-950/90 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${isQuotation ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  {isQuotation ? 'Commercial Quotation' : 'Engineering Cost Estimate'}
                </h3>
                <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {activeQuotation.quotationNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                  {activeQuotation.revision?.revisionLabel || 'Rev.00'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isAccepted ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
                  activeQuotation.status === 'SENT' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800' :
                  isExpired ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                  isCancelled ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {activeQuotation.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target Client: <span className="text-slate-200 font-medium">{activeQuotation.clientName}</span>
                {activeQuotation.projectCode && ` • Project: ${activeQuotation.projectCode}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('sheet')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${viewMode === 'sheet' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Document View
              </button>
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${viewMode === 'pdf' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Rendered PDF
              </button>
            </div>

            {/* Zoom Controls for Sheet Mode */}
            {viewMode === 'sheet' && (
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-400">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                  className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                  className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Print & Download Buttons */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {onOpenEdit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEdit(activeQuotation);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Edit Quotation details and line items"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit</span>
              </button>
            )}

            {onOpenDelete && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDelete(activeQuotation);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Delete this quotation"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            )}

            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(activeQuotation)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Workflow Details</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bank Details Selector Strip */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-400" />
            <span>Remittance Bank Account:</span>
            <select
              value={selectedBankAccountId}
              onChange={e => handleBankChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.bank} • A/C {acc.accountNumber} ({acc.accountName}) {acc.isPrimary ? '• [PRIMARY]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Commercial document strictly independent of expenses &amp; payment vouchers.</span>
          </div>
        </div>

        {/* Modal Main Content (Sheet Preview or PDF) */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
          {viewMode === 'pdf' && pdfBlobUrl ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-white">
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Quotation PDF"
              />
            </div>
          ) : (
            /* High-Fidelity A4 Sheet Preview */
            <div
              className="bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-10 w-full max-w-[850px] transition-transform origin-top select-text"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              {/* Top Accent Strip */}
              <div className="h-1.5 bg-slate-900 -mt-10 -mx-10 mb-6" />

              {/* Watermark for special statuses */}
              {isCancelled && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-8xl font-black text-rose-500/15 -rotate-45 tracking-widest uppercase">
                    CANCELLED
                  </span>
                </div>
              )}
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-8xl font-black text-amber-500/15 -rotate-45 tracking-widest uppercase">
                    EXPIRED
                  </span>
                </div>
              )}
              {isDraft && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-8xl font-black text-slate-400/10 -rotate-45 tracking-widest uppercase">
                    DRAFT
                  </span>
                </div>
              )}

              {/* Document Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 uppercase">
                    {isQuotation ? 'Commercial Quotation' : 'Cost Estimate'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600 font-medium">Ref Number:</span>
                    <span className="font-mono text-sm font-bold text-sky-700">
                      {activeQuotation.quotationNumber}
                    </span>
                    <span className="text-xs font-bold text-purple-700 px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200">
                      {activeQuotation.revision?.revisionLabel || 'Rev.00'}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-500">Date of Quotation</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatQuotationDate(activeQuotation.quotationDate)}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium mt-1">
                    Valid Until: {formatQuotationDate(activeQuotation.validUntilDate)} ({activeQuotation.validityDays} Days)
                  </div>
                </div>
              </div>

              {/* Two Column Address Cards */}
              <div className="grid grid-cols-2 gap-4 my-5 text-xs">
                {/* Service Provider */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                  <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200">
                    Issued By (Service Provider)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{activeQuotation.supplierName}</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">{activeQuotation.supplierAddress}</div>
                  <div className="mt-2 pt-1 border-t border-slate-200/80 flex gap-4 text-[11px]">
                    <div><span className="font-semibold text-slate-700">TIN:</span> <span className="font-mono text-sky-700 font-bold">{activeQuotation.supplierTin}</span></div>
                    <div><span className="font-semibold text-slate-700">VAT:</span> <span className="font-mono text-sky-700 font-bold">{activeQuotation.supplierVatNumber}</span></div>
                  </div>
                </div>

                {/* Client / Purchaser */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50">
                  <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200">
                    Prepared For (Client)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{activeQuotation.clientName}</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">{resolvedClientAddress}</div>
                  <div className="mt-2 pt-1 border-t border-slate-200/80 flex gap-4 text-[11px]">
                    <div><span className="font-semibold text-slate-700">TIN:</span> <span className="font-mono text-sky-700 font-bold">{activeQuotation.clientTin || 'N/A'}</span></div>
                    <div><span className="font-semibold text-slate-700">VAT:</span> <span className="font-mono text-sky-700 font-bold">{activeQuotation.clientVatNumber || 'N/A'}</span></div>
                  </div>
                  {activeQuotation.clientContactPerson && (
                    <div className="text-[11px] text-slate-600 mt-1">
                      <span className="font-medium text-slate-700">Attn:</span> {activeQuotation.clientContactPerson}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata strip: Project, Scope, Tender */}
              {(activeQuotation.projectCode || activeQuotation.scopeOfWork || activeQuotation.tenderRef) && (
                <div className="bg-slate-100 border border-slate-200 rounded p-3 text-xs mb-5 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Project Reference</span>
                    <span className="font-semibold text-slate-900">{activeQuotation.projectCode || 'General'} - {activeQuotation.projectName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tender / RFQ No.</span>
                    <span className="font-mono text-slate-900 font-semibold">{activeQuotation.tenderRef || activeQuotation.rfqNumber || 'Direct Solicitation'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Timeline</span>
                    <span className="font-semibold text-slate-900">{activeQuotation.estimatedDuration || 'As agreed'}</span>
                  </div>
                  {activeQuotation.scopeOfWork && (
                    <div className="col-span-3 pt-1 border-t border-slate-200 text-slate-700">
                      <span className="font-semibold text-slate-900">Scope:</span> {activeQuotation.scopeOfWork}
                    </div>
                  )}
                </div>
              )}

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded overflow-hidden mb-5">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px]">
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-3">Description of Proposed Works / Supply Items</th>
                      <th className="py-2 px-2 text-center w-14">Unit</th>
                      <th className="py-2 px-2 text-right w-16">Qty</th>
                      <th className="py-2 px-2 text-right w-24">Rate (LKR)</th>
                      <th className="py-2 px-2 text-center w-14">Disc</th>
                      <th className="py-2 px-3 text-right w-28">Taxable (LKR)</th>
                      <th className="py-2 px-2 text-center w-12">VAT</th>
                      <th className="py-2 px-3 text-right w-28">Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {activeQuotation.lineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{item.description}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{item.unitOfMeasure || 'Nos'}</td>
                        <td className="py-2 px-2 text-right font-mono">{item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-right font-mono">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">
                          {item.discountPercent ? `${item.discountPercent}%` : item.discountAmount ? `-${item.discountAmount}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">{item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{item.vatRate}%</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary & Words */}
              <div className="grid grid-cols-12 gap-4 mb-6">
                <div className="col-span-7 border border-slate-200 rounded p-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                      Total Amount in Words
                    </div>
                    <div className="font-serif italic text-slate-800 text-xs leading-relaxed">
                      "{activeQuotation.amountInWords}"
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div><span className="font-semibold text-slate-900">Payment Terms:</span> {activeQuotation.paymentTerms}</div>
                    {activeQuotation.warrantyPeriod && (
                      <div><span className="font-semibold text-slate-900">Warranty:</span> {activeQuotation.warrantyPeriod}</div>
                    )}
                  </div>
                </div>

                <div className="col-span-5 border border-slate-200 rounded p-3 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (Before Discount):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      LKR {activeQuotation.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {activeQuotation.totalDiscountAmount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Total Discount:</span>
                      <span className="font-mono font-semibold">
                        - LKR {activeQuotation.totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-700 border-t border-slate-200 pt-1">
                    <span>Net Taxable Base Value:</span>
                    <span className="font-mono font-bold text-slate-900">
                      LKR {activeQuotation.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>VAT (Output Tax @ {activeQuotation.vatRate}%):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      LKR {activeQuotation.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between text-sm font-bold text-slate-900">
                    <span>Total Quoted Amount:</span>
                    <span className="font-mono text-sky-800">
                      LKR {activeQuotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Bank Information */}
              {activeQuotation.settlementBankDetails && (
                <div className="border border-blue-100 bg-blue-50/50 rounded p-3 text-[11px] text-slate-700 mb-6">
                  <span className="font-bold text-slate-900 block mb-0.5">Direct Wire Remittance Instructions:</span>
                  <span>
                    Bank: <strong>{activeQuotation.settlementBankDetails.bankName}</strong> ({activeQuotation.settlementBankDetails.branchName}) •
                    A/C No: <strong className="font-mono text-sky-800">{activeQuotation.settlementBankDetails.accountNumber}</strong> •
                    Account: <strong>{activeQuotation.settlementBankDetails.accountName}</strong> •
                    SWIFT: <strong className="font-mono">{activeQuotation.settlementBankDetails.swiftCode || 'CCEYLKFX'}</strong>
                  </span>
                </div>
              )}

              {/* Signatures & Seal */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-300 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Prepared By (Estimating)</div>
                  <div className="font-bold text-slate-900 mt-1">{activeQuotation.preparedBy}</div>
                  <div className="h-10 border-b border-slate-300 border-dashed mb-1" />
                  <div className="text-[10px] text-slate-500">Signature &amp; Date</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Authorized Commercial Signatory</div>
                  <div className="font-bold text-slate-900 mt-1">
                    {activeQuotation.approvedBy || 'Director of Operations'}
                  </div>
                  <div className="h-10 border-b border-slate-300 border-dashed mb-1" />
                  <div className="text-[10px] text-slate-500">Signature &amp; Corporate Seal</div>
                </div>

                <div className="border border-slate-300 rounded p-2 text-center flex flex-col justify-between">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Client Confirmation &amp; Stamp</div>
                  <div className="font-mono text-[11px] font-bold text-slate-800 my-2">
                    {isAccepted ? 'CONFIRMED & ACCEPTED' : '[ CLIENT ACCEPTANCE SIGNATURE ]'}
                  </div>
                  <div className="text-[9px] text-slate-400">Formal acceptance required prior to mobilization</div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                <span>Official Commercial Document • Apex Global ERP / EMA Construction</span>
                <span>Page 1 of 1 • System Generated</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
