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
  CreditCard
} from 'lucide-react';
import { TaxInvoice, InvoiceBankDetails } from '../../types/taxInvoiceTypes';
import { generateTaxInvoicePdf } from '../../utils/taxInvoicePdf';
import { formatDateToGazette, cleanTaxInvoiceSerialNumber, resolvePurchaserFullAddress } from '../../utils/taxInvoiceUtils';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { useTaxInvoice } from '../../context/TaxInvoiceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';

interface TaxInvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice | null;
  onPrint?: (invoice: TaxInvoice) => void;
  onDownload?: (invoice: TaxInvoice) => void;
  onOpenDetails?: (invoice: TaxInvoice) => void;
}

export const TaxInvoicePreviewModal: React.FC<TaxInvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPrint,
  onDownload,
  onOpenDetails
}) => {
  const { accounts } = useEnterpriseBanking();
  const { updateInvoice } = useTaxInvoice();
  const { clients } = useEnterpriseCompany();

  const [activeInvoice, setActiveInvoice] = useState<TaxInvoice | null>(invoice);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'sheet' | 'pdf'>('sheet');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Sync active invoice with incoming invoice prop
  useEffect(() => {
    setActiveInvoice(invoice);
  }, [invoice]);

  // Resolve full purchaser address from client registry
  const resolvedPurchaserAddress = useMemo(() => {
    if (!activeInvoice) return '';
    return resolvePurchaserFullAddress(activeInvoice, clients);
  }, [activeInvoice, clients]);

  // Clean serial number without PREVIEW_
  const cleanSerial = useMemo(() => {
    return cleanTaxInvoiceSerialNumber(activeInvoice?.serialNumber);
  }, [activeInvoice?.serialNumber]);

  // Invoice object normalized for PDF rendering
  const invoiceForPdf = useMemo(() => {
    if (!activeInvoice) return null;
    return {
      ...activeInvoice,
      serialNumber: cleanSerial,
      purchaserAddress: resolvedPurchaserAddress
    };
  }, [activeInvoice, cleanSerial, resolvedPurchaserAddress]);

  // Selected bank account ID
  const selectedBankAccountId = useMemo(() => {
    if (!activeInvoice) return accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
    if (activeInvoice.bankAccountId) return activeInvoice.bankAccountId;
    if (activeInvoice.settlementBankDetails?.bankAccountId) return activeInvoice.settlementBankDetails.bankAccountId;
    // Match by account number or fallback to primary
    const matched = accounts.find(a => a.accountNumber === activeInvoice.settlementBankDetails?.accountNumber);
    if (matched) return matched.id;
    return accounts.find(a => a.isPrimary)?.id || accounts[0]?.id || '';
  }, [activeInvoice, accounts]);

  // Handle switching bank accounts
  const handleBankChange = (accountId: string) => {
    if (!activeInvoice) return;
    const targetAccount = accounts.find(a => a.id === accountId);
    if (!targetAccount) return;

    const newBankDetails: InvoiceBankDetails = {
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

    const updatedInvoice: TaxInvoice = {
      ...activeInvoice,
      bankAccountId: targetAccount.id,
      settlementBankDetails: newBankDetails
    };

    setActiveInvoice(updatedInvoice);

    // Save to persistent invoice record
    try {
      updateInvoice(activeInvoice.id, {
        bankAccountId: targetAccount.id,
        settlementBankDetails: newBankDetails
      });
    } catch (e) {
      console.warn('Could not auto-save bank details update:', e);
    }
  };

  // Resolved current bank details to display
  const currentBankDetails: InvoiceBankDetails = useMemo(() => {
    if (activeInvoice?.settlementBankDetails) {
      return activeInvoice.settlementBankDetails;
    }
    const currentAcc = accounts.find(a => a.id === selectedBankAccountId) || accounts.find(a => a.isPrimary) || accounts[0];
    if (currentAcc) {
      return {
        bankAccountId: currentAcc.id,
        accountName: currentAcc.accountName,
        bankName: currentAcc.bank,
        branchName: currentAcc.branch,
        accountNumber: currentAcc.accountNumber,
        swiftCode: currentAcc.swift,
        currency: currentAcc.currency,
        purpose: currentAcc.purpose,
        isPrimary: currentAcc.isPrimary
      };
    }
    return {
      accountName: activeInvoice?.supplierName || 'Apex Global Technologies (Pvt) Ltd',
      bankName: 'Commercial Bank of Ceylon PLC',
      branchName: 'Echelon Square Corporate Branch',
      accountNumber: '1000-8491-0028',
      swiftCode: 'CCEYLKX',
      currency: 'LKR'
    };
  }, [activeInvoice, accounts, selectedBankAccountId]);

  // Generate PDF blob URL whenever activeInvoice changes or view mode is set to 'pdf'
  useEffect(() => {
    if (!invoiceForPdf || !isOpen) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      return;
    }

    try {
      const doc = generateTaxInvoicePdf(invoiceForPdf);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Failed to generate PDF blob preview:', err);
    }
  }, [invoiceForPdf, isOpen]);

  if (!isOpen || !activeInvoice) return null;

  const currentInvoice = invoiceForPdf || activeInvoice;
  const isDraft = currentInvoice.isDraft || currentInvoice.status === 'DRAFT' || currentInvoice.status === 'SUBMITTED';
  const isCancelled = currentInvoice.status === 'CANCELLED' || currentInvoice.isCancelled;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(currentInvoice);
    } else {
      const doc = generateTaxInvoicePdf(currentInvoice);
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl.toString();
      document.body.appendChild(iframe);
      iframe.contentWindow?.print();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentInvoice);
    } else {
      const doc = generateTaxInvoicePdf(currentInvoice);
      const filename = `TaxInvoice_${cleanSerial}_${currentInvoice.invoiceDate}.pdf`;
      doc.save(filename);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div
      id="tax-invoice-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Action Header Bar */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  Tax Invoice Document Preview
                </span>
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800/60">
                  {cleanSerial}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  invoice.status === 'ISSUED' || invoice.status === 'PAID'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : isCancelled
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Review document layout & statutory details prior to downloading or printing
              </p>
            </div>
          </div>

          {/* Controls: Mode Switch, Zoom, Print, Download, Close */}
          <div className="flex items-center gap-2">
            {/* Settlement Bank Quick Selector */}
            <div className="flex items-center bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <label htmlFor="top-bank-selector" className="text-slate-400 font-medium hidden md:inline whitespace-nowrap">
                Remittance Bank:
              </label>
              <select
                id="top-bank-selector"
                value={selectedBankAccountId}
                onChange={e => handleBankChange(e.target.value)}
                className="bg-slate-950 text-cyan-200 border border-slate-700 hover:border-cyan-500 rounded px-2 py-0.5 text-xs font-semibold outline-none cursor-pointer max-w-[220px] truncate"
                title="Select from registered company bank accounts"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank} • {acc.branch} ({acc.accountNumber}) {acc.isPrimary ? '★ Primary' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('sheet')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'sheet'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Interactive A4 Document Sheet"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>A4 Sheet</span>
              </button>
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'pdf'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Generated PDF Engine View"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Engine</span>
              </button>
            </div>

            {/* Zoom Controls (only for sheet view) */}
            {viewMode === 'sheet' && (
              <div className="hidden sm:flex items-center bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-300 gap-1">
                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-1.5 font-mono text-[11px] hover:text-cyan-300"
                  title="Reset Zoom to 100%"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              id="preview-modal-print-btn"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 shadow-sm active:scale-95"
              title="Print official invoice"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print</span>
            </button>

            {/* Download PDF Button */}
            <button
              id="preview-modal-download-btn"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow active:scale-95"
              title="Download official A4 PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {onOpenDetails && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDetails(invoice);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 hidden md:flex items-center gap-1"
                title="Open full workspace with audit trail & settings"
              >
                <span>Full Workspace</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start">
          {viewMode === 'pdf' && pdfBlobUrl ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              <iframe
                src={pdfBlobUrl}
                title={`PDF Preview ${cleanSerial}`}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className="w-full max-w-[820px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-10 font-sans relative select-text my-2"
            >
              {/* Top Statutory Dark Bar */}
              <div className="h-1.5 bg-slate-900 -mx-8 -mt-8 sm:-mx-10 sm:-mt-10 mb-6" />

              {/* Watermarks */}
              {isCancelled && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                  <span className="text-7xl font-black text-rose-500/20 transform -rotate-45 select-none tracking-widest border-8 border-rose-500/20 p-6 rounded-2xl">
                    CANCELLED - VOID
                  </span>
                </div>
              )}
              {isDraft && !isCancelled && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
                  <span className="text-7xl font-black text-slate-400/20 transform -rotate-45 select-none tracking-widest border-8 border-slate-400/20 p-6 rounded-2xl">
                    PROVISIONAL - DRAFT
                  </span>
                </div>
              )}

              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-300 pb-5 gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {invoice.isCreditNote ? 'TAX CREDIT NOTE' : 'TAX INVOICE'}
                  </h1>
                  <div className="mt-1 text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="font-medium text-slate-500">Tax Invoice Number :-</span>
                    <span className="font-mono font-bold text-slate-900 text-base">{cleanSerial}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Value Added Tax Act No. 14 of 2002 • Gazette Extraordinary No. 2481/22 &amp; No. 2500/106
                  </p>
                </div>

                <div className="text-right sm:text-right w-full sm:w-auto bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-left font-mono">
                    <span className="text-slate-500 text-[11px]">Invoice Date:</span>
                    <strong className="text-slate-900 text-right">{formatDateToGazette(invoice.invoiceDate)}</strong>

                    <span className="text-slate-500 text-[11px]">Supply Date:</span>
                    <strong className="text-slate-900 text-right">{formatDateToGazette(invoice.supplyDate || invoice.invoiceDate)}</strong>

                    <span className="text-slate-500 text-[11px]">Payment Due:</span>
                    <strong className="text-slate-900 text-right">{formatDateToGazette(invoice.dueDate)}</strong>

                    <span className="text-slate-500 text-[11px]">Currency:</span>
                    <strong className="text-slate-900 text-right">LKR</strong>
                  </div>
                </div>
              </div>

              {/* Service Provider and Purchaser Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
                {/* Supplier */}
                <div className="border border-slate-300 rounded p-3.5 bg-slate-50/50 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                    SERVICE PROVIDER (SUPPLIER)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{invoice.supplierName}</div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">{invoice.supplierAddress}</div>
                  <div className="pt-1 text-[11px] font-mono grid grid-cols-2 gap-1 border-t border-slate-200/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">TIN:</span>
                      <strong className="text-slate-900">{invoice.supplierTin}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">VAT No:</span>
                      <strong className="text-slate-900">{invoice.supplierVatNumber}</strong>
                    </div>
                  </div>
                  {invoice.supplierContact && (
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      Contact: {invoice.supplierContact}
                    </div>
                  )}
                </div>

                {/* Purchaser */}
                <div className="border border-slate-300 rounded p-3.5 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      PURCHASER (CLIENT / RECIPIENT)
                    </span>
                    {invoice.purchaserSnapshot && (
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-semibold">
                        Master Sealed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{invoice.purchaserName}</span>
                    {invoice.purchaserSnapshot?.clientCode && (
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
                        {invoice.purchaserSnapshot.clientCode}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    {resolvedPurchaserAddress || invoice.purchaserAddress || 'Registered Address on file'}
                  </div>
                  <div className="pt-1 text-[11px] font-mono grid grid-cols-2 gap-1 border-t border-slate-200/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">TIN:</span>
                      <strong className="text-slate-900">{invoice.purchaserTin || 'Unverified'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">VAT No:</span>
                      <strong className="text-slate-900">{invoice.purchaserVatNumber || 'Non-VAT Registrant'}</strong>
                    </div>
                  </div>
                  {(invoice.purchaserContactPerson || invoice.purchaserPhone) && (
                    <div className="text-[10px] text-slate-500 pt-0.5">
                      Attn: {invoice.purchaserContactPerson} {invoice.purchaserPhone && `(${invoice.purchaserPhone})`}
                    </div>
                  )}
                </div>
              </div>

              {/* Project & Milestone Header */}
              <div className="bg-slate-100 border border-slate-300 rounded px-3.5 py-2 mb-4 flex flex-wrap items-center justify-between text-xs text-slate-700">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Project Reference</span>
                  <span className="font-bold text-slate-900">{invoice.projectCode} • {invoice.projectName}</span>
                </div>
                {invoice.ipcNumber && (
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Interim Payment Certificate</span>
                    <span className="font-mono font-bold text-indigo-700">{invoice.ipcNumber}</span>
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-300 rounded overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Description of Taxable Supply</th>
                      <th className="py-2.5 px-2 text-center w-14">Unit</th>
                      <th className="py-2.5 px-2 text-right w-16">Qty</th>
                      <th className="py-2.5 px-3 text-right w-24">Rate (LKR)</th>
                      <th className="py-2.5 px-3 text-right w-28">Taxable Value</th>
                      <th className="py-2.5 px-2 text-center w-12">VAT %</th>
                      <th className="py-2.5 px-3 text-right w-24">VAT (LKR)</th>
                      <th className="py-2.5 px-3 text-right w-28">Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.lineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{item.description}</td>
                        <td className="py-2 px-2 text-center text-slate-600">{item.unitOfMeasure || 'Nos'}</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-800">{item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-800">{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">{item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">{item.vatRate}%</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-800">{item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Amount in Words & Totals Box */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-8 text-xs">
                <div className="sm:col-span-7 space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Consideration in Words:</span>
                    <p className="font-semibold text-slate-900 italic mt-0.5">{invoice.amountInWords}</p>
                  </div>
                  <div className="p-3.5 border border-slate-300 rounded bg-slate-50 text-[11px] text-slate-700 space-y-1.5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Landmark className="w-3.5 h-3.5 text-cyan-700" />
                        <span>Settlement Bank Details:</span>
                        {currentBankDetails.isPrimary && (
                          <span className="text-[9.5px] bg-cyan-100 text-cyan-800 font-semibold px-1.5 py-0.2 rounded border border-cyan-300">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <label htmlFor="sheet-bank-picker" className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Select Registered Bank:
                        </label>
                        <select
                          id="sheet-bank-picker"
                          value={selectedBankAccountId}
                          onChange={e => handleBankChange(e.target.value)}
                          className="bg-white border border-slate-300 hover:border-cyan-600 focus:border-cyan-600 text-slate-800 text-[11px] rounded px-2 py-0.5 outline-none font-medium cursor-pointer shadow-xs max-w-[240px] truncate"
                          title="Select from registered company bank accounts"
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.bank} • {acc.branch} ({acc.accountNumber}) {acc.isPrimary ? '★ Primary' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-slate-700 pt-0.5">
                      <div>Account Name: <strong className="text-slate-900">{currentBankDetails.accountName}</strong></div>
                      <div>Bank &amp; Branch: <strong className="text-slate-800">{currentBankDetails.bankName}</strong> • {currentBankDetails.branchName}</div>
                      <div>
                        Account Number: <strong className="font-mono text-slate-900 font-bold">{currentBankDetails.accountNumber}</strong>
                        {currentBankDetails.swiftCode && (
                          <> • Swift: <strong className="font-mono text-slate-900">{currentBankDetails.swiftCode}</strong></>
                        )}
                        {currentBankDetails.currency && (
                          <> • Currency: <strong className="font-mono text-slate-800">{currentBankDetails.currency}</strong></>
                        )}
                      </div>
                      {currentBankDetails.purpose && (
                        <div className="text-[10px] text-slate-500 italic pt-0.5">
                          Remittance Purpose: {currentBankDetails.purpose}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-5">
                  <div className="border border-slate-300 rounded bg-slate-50 p-3 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Taxable Value:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {invoice.totalTaxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>VAT Output Tax ({invoice.vatRate}%):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {invoice.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="border-t-2 border-slate-400 pt-2 flex justify-between text-slate-900 font-bold text-sm">
                      <span>Total Consideration:</span>
                      <span className="font-mono text-slate-900">
                        LKR {invoice.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {invoice.amountReceived > 0 && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                        <div className="flex justify-between text-emerald-700">
                          <span>Amount Received:</span>
                          <span className="font-mono">LKR {invoice.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-800 font-bold">
                          <span>Balance Due:</span>
                          <span className="font-mono">LKR {invoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Signatures & Seal Section */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-300 pt-6 text-[11px] text-slate-600">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Prepared By</span>
                  <p className="font-bold text-slate-900">{invoice.preparedBy || 'Finance Officer'}</p>
                  <div className="w-3/4 border-b border-slate-300 h-8" />
                  <span className="text-[9px] text-slate-400">Signature &amp; Date</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Verified &amp; Approved</span>
                  <p className="font-bold text-slate-900">{invoice.approvedBy || (invoice.status === 'ISSUED' ? 'Director of Finance' : 'Pending Authorization')}</p>
                  <div className="w-3/4 border-b border-slate-300 h-8" />
                  <span className="text-[9px] text-slate-400">Signature &amp; Date</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Official Company Seal</span>
                  <div className="border border-dashed border-slate-400 rounded h-12 flex items-center justify-center text-slate-400 font-mono text-[9px] uppercase">
                    {invoice.status === 'ISSUED' || invoice.status === 'PAID' ? 'APEX CORP / OFFICIAL SEAL' : 'PROVISIONAL DRAFT'}
                  </div>
                </div>
              </div>

              {/* Bottom Gazette Footer */}
              <div className="mt-8 pt-3 border-t border-slate-200 text-[9.5px] text-slate-400 flex justify-between items-center">
                <span>Inland Revenue Department (Sri Lanka) Gazette Extraordinary No. 2481/22 &amp; No. 2500/106 Compliant</span>
                <span>Page 1 of 1 • Official Electronic Record</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Gazette No. 2481/22 Certified Format</span>
            <span className="text-slate-600">•</span>
            <span>Total Consideration: <strong className="text-white font-mono">LKR {invoice.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print from Preview</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={handleDownload}
              className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
