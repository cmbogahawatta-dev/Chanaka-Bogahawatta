import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  FileCheck2,
  Calendar,
  CreditCard,
  Eye,
  Check,
  Send,
  Printer,
  Paperclip,
  Download,
  ExternalLink,
  Layers,
  FileText,
  X
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { SupplierInvoice, SupplierInvoiceStatus } from '../../types/supplierTypes';
import { SupplierInvoiceModal } from './SupplierInvoiceModal';

export const SupplierInvoicesView: React.FC = () => {
  const { invoices, suppliers, recordInvoicePayment, updateInvoiceStatus } = useSupplier();
  const { projects } = usePettyCash();
  const { addPaymentVoucher, currentRole } = useEnterprise();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');

  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<SupplierInvoice | null>(null);
  const [settlementInvoice, setSettlementInvoice] = useState<SupplierInvoice | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ title: string; fileName: string; dataUrl: string } | null>(null);

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'Bank Transfer (CEFT/SLIPS)' | 'Cheque' | 'Petty Cash' | 'Direct Debit'>('Bank Transfer (CEFT/SLIPS)');
  const [settleRef, setSettleRef] = useState('');
  const [generateVoucher, setGenerateVoucher] = useState(true);

  const formatLKR = (amt: number) => {
    return `LKR ${Number(amt || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => {
      const matchSearch =
        searchTerm === '' ||
        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.supplierInvoiceRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.poNumber && i.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.items && i.items.some(it => it.description.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchStatus = selectedStatus === 'ALL' || i.status === selectedStatus;
      const matchProj = selectedProject === 'ALL' || i.projectCode === selectedProject;

      return matchSearch && matchStatus && matchProj;
    });
  }, [invoices, searchTerm, selectedStatus, selectedProject]);

  const totalInvoiced = useMemo(() => invoices.reduce((acc, curr) => acc + curr.netAmount, 0), [invoices]);
  const totalPaid = useMemo(() => invoices.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0), [invoices]);
  const totalOutstanding = totalInvoiced - totalPaid;

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueCount = useMemo(() => {
    return invoices.filter(i => i.status !== 'Paid' && i.status !== 'Cancelled' && i.dueDate < todayStr).length;
  }, [invoices, todayStr]);

  const handleOpenSettlement = (inv: SupplierInvoice) => {
    const remaining = inv.netAmount - (inv.paidAmount || 0);
    setSettlementInvoice(inv);
    setSettleAmount(remaining);
    setSettleRef(`CEFT-${Date.now().toString().slice(-6)}`);
    setGenerateVoucher(true);
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementInvoice || settleAmount <= 0) return;

    recordInvoicePayment(
      settlementInvoice.id,
      settleAmount,
      settleMethod,
      settleRef.trim() || undefined
    );

    // If generate voucher checked, link to Enterprise Payment Voucher
    if (generateVoucher) {
      addPaymentVoucher({
        DATE: new Date().toISOString().slice(0, 10),
        PROJECT_CODE: settlementInvoice.projectCode,
        BENEFICIARY: settlementInvoice.supplierName,
        SUPPLIER_ID: settlementInvoice.supplierId,
        SUPPLIER_NAME: settlementInvoice.supplierName,
        LINKED_INVOICE_ID: settlementInvoice.id,
        CATEGORY: 'Materials',
        AMOUNT: settleAmount,
        STATUS: 'Approved',
        PAYMENT_METHOD: settleMethod.includes('Cheque') ? 'Cheque' : 'Direct Bank Transfer',
        CHEQUE_OR_REF_NO: settleRef.trim() || undefined,
        REQUESTED_BY: 'Procurement Accounts',
        REMARKS: `Settlement for Supplier Invoice ${settlementInvoice.supplierInvoiceRef} (${settlementInvoice.invoiceNumber})`
      });
    }

    setSettlementInvoice(null);
  };

  const handleDownloadAttachment = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Supplier Invoices & Accounts Payable (AP)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vendor tax invoices, multi-item materials schedule, 3-way matching, credit aging & uploaded supplier copies.
          </p>
        </div>

        <button
          onClick={() => setIsNewInvoiceModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Supplier Invoice</span>
        </button>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{formatLKR(totalInvoiced)}</div>
          <span className="text-[10px] text-slate-400 font-medium">{invoices.length} Registered invoices</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Settled to Date</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{formatLKR(totalPaid)}</div>
          <span className="text-[10px] text-emerald-300 font-medium">Disbursed via vouchers</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Payables</span>
          <div className="text-xl font-mono font-bold text-rose-400 mt-1">{formatLKR(totalOutstanding)}</div>
          <span className="text-[10px] text-rose-300 font-medium">Current vendor liability</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Invoices</span>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{overdueCount} Invoices</div>
          <span className="text-[10px] text-amber-300 font-medium">Beyond agreed credit term</span>
        </div>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search invoice ref, internal#, supplier, item, PO#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p, idx) => (
              <option key={`${p.id || p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Vendor Invoice # & Ref</th>
                <th className="p-3">Supplier Master</th>
                <th className="p-3">Items / Materials</th>
                <th className="p-3">Invoice Copy</th>
                <th className="p-3">Dates (Inv / Due)</th>
                <th className="p-3">Project / PO</th>
                <th className="p-3">Net Amount</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No supplier invoices recorded matching the filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const balance = inv.netAmount - (inv.paidAmount || 0);
                  const isOverdue = inv.status !== 'Paid' && inv.status !== 'Cancelled' && inv.dueDate < todayStr;
                  const hasAttachment = Boolean(inv.invoiceAttachmentData || inv.invoiceAttachmentName);
                  const itemCount = inv.items?.length || 1;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-slate-200 block">{inv.supplierInvoiceRef}</span>
                        <span className="text-[10px] text-slate-500">{inv.invoiceNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-100 block">{inv.supplierName}</span>
                        {inv.vatAmount ? (
                          <span className="text-[10px] text-emerald-400 font-mono">VAT: {formatLKR(inv.vatAmount)}</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Non-VAT</span>
                        )}
                      </td>
                      <td className="p-3 max-w-[180px]">
                        {inv.items && inv.items.length > 0 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {inv.items.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold text-[10px] font-mono shrink-0">
                                  {inv.items.length} items
                                </span>
                              )}
                              <span className="font-medium text-slate-200 truncate block text-[11px]">
                                {inv.items[0].description}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {inv.items[0].quantity} {inv.items[0].unit} @ {formatLKR(inv.items[0].unitPrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">General Procurement</span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasAttachment ? (
                          <button
                            onClick={() => {
                              if (inv.invoiceAttachmentData) {
                                setPreviewAttachment({
                                  title: `Supplier Tax Invoice - ${inv.supplierInvoiceRef}`,
                                  fileName: inv.invoiceAttachmentName || 'Tax_Invoice_Copy.pdf',
                                  dataUrl: inv.invoiceAttachmentData
                                });
                              }
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800 text-[10px] font-semibold transition-colors"
                            title="View / Download Attached Supplier Invoice Copy"
                          >
                            <Paperclip className="w-3 h-3 text-blue-400" />
                            <span className="truncate max-w-[90px]">
                              {inv.invoiceAttachmentName ? 'Invoice Attached' : 'Attached'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">No copy</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300">{inv.invoiceDate}</div>
                        <div className={`text-[10px] font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          Due: {inv.dueDate} {isOverdue && '⚠️'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold font-mono">
                          {inv.projectCode}
                        </span>
                        {inv.poNumber && (
                          <span className="block font-mono text-[10px] text-orange-400 mt-0.5">
                            {inv.poNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        <div className="font-bold text-slate-200">{formatLKR(inv.netAmount)}</div>
                        <div className="text-[10px] text-emerald-400">Paid: {formatLKR(inv.paidAmount || 0)}</div>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={balance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {formatLKR(balance)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === 'Paid' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          inv.status === 'Partially Paid' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                          inv.status === 'Approved' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                          'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {balance > 0 && (
                            <button
                              onClick={() => handleOpenSettlement(inv)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow transition-all"
                              title="Pay Invoice via Voucher"
                            >
                              Pay Voucher
                            </button>
                          )}
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                            title="View Invoice Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Full Invoice Details */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{viewingInvoice.supplierInvoiceRef}</h3>
                    <span className="font-mono text-slate-500 text-xs">({viewingInvoice.invoiceNumber})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      viewingInvoice.status === 'Paid' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      viewingInvoice.status === 'Approved' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                      'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {viewingInvoice.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Vendor: <strong className="text-slate-200">{viewingInvoice.supplierName}</strong> | Project: <strong className="text-purple-300">{viewingInvoice.projectCode}</strong>
                  </span>
                </div>
              </div>

              <button onClick={() => setViewingInvoice(null)} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Invoice Date</span>
                  <span className="font-mono font-bold text-slate-200">{viewingInvoice.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Due Date</span>
                  <span className="font-mono font-bold text-blue-400">{viewingInvoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Purchase Order</span>
                  <span className="font-mono font-bold text-orange-400">{viewingInvoice.poNumber || 'Standalone'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Linked GRN</span>
                  <span className="font-mono font-bold text-emerald-400">{viewingInvoice.grnNumber || '—'}</span>
                </div>
              </div>

              {/* Multi-Item Line Items Table */}
              <div className="space-y-2">
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Itemized Materials & Services Schedule</span>
                </span>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Qty & Unit</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(viewingInvoice.items && viewingInvoice.items.length > 0
                        ? viewingInvoice.items
                        : [
                            {
                              id: 'single-1',
                              description: viewingInvoice.remarks || 'Standard Material Supply',
                              quantity: 1,
                              unit: 'Lot',
                              unitPrice: viewingInvoice.grossAmount || viewingInvoice.netAmount,
                              totalAmount: viewingInvoice.grossAmount || viewingInvoice.netAmount
                            }
                          ]
                      ).map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-slate-900/40">
                          <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-slate-100">{it.description}</td>
                          <td className="p-2.5 font-mono text-right text-slate-300">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="p-2.5 font-mono text-right text-slate-400">
                            {formatLKR(it.unitPrice)}
                          </td>
                          <td className="p-2.5 font-mono text-right font-bold text-slate-200">
                            {formatLKR(it.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uploaded Supplier Copy of Invoice */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                    <span>Uploaded Official Vendor Tax Invoice Copy</span>
                  </span>
                  {viewingInvoice.invoiceAttachmentName && (
                    <span className="text-[10px] text-blue-400 font-mono">
                      {viewingInvoice.invoiceAttachmentName}
                    </span>
                  )}
                </div>

                {viewingInvoice.invoiceAttachmentData ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {viewingInvoice.invoiceAttachmentData.startsWith('data:image') ? (
                        <img
                          src={viewingInvoice.invoiceAttachmentData}
                          alt="Invoice Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setPreviewAttachment({
                              title: `Supplier Tax Invoice - ${viewingInvoice.supplierInvoiceRef}`,
                              fileName: viewingInvoice.invoiceAttachmentName || 'Supplier_Invoice.png',
                              dataUrl: viewingInvoice.invoiceAttachmentData!
                            });
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center shrink-0">
                          <FileText className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-200 block truncate text-xs">
                          {viewingInvoice.invoiceAttachmentName || 'Supplier_Tax_Invoice.pdf'}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Verified vendor copy attached for Accounts Payable audit & 3-way match
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setPreviewAttachment({
                            title: `Supplier Tax Invoice - ${viewingInvoice.supplierInvoiceRef}`,
                            fileName: viewingInvoice.invoiceAttachmentName || 'Supplier_Invoice_Copy.pdf',
                            dataUrl: viewingInvoice.invoiceAttachmentData!
                          });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(viewingInvoice.invoiceAttachmentData!, viewingInvoice.invoiceAttachmentName || 'Supplier_Invoice.pdf')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700 font-bold text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-slate-500">
                    No scanned supplier invoice copy attached to this record.
                  </div>
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Materials Subtotal:</span>
                  <span className="font-mono text-slate-200">{formatLKR(viewingInvoice.grossAmount || viewingInvoice.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Inland Revenue VAT (+):</span>
                  <span className="font-mono text-emerald-400">{formatLKR(viewingInvoice.vatAmount || 0)}</span>
                </div>
                {(viewingInvoice.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount / Commercial Rebate (-):</span>
                    <span className="font-mono text-emerald-400">{formatLKR(viewingInvoice.discountAmount || 0)}</span>
                  </div>
                )}
                {(viewingInvoice.retentionDeducted || 0) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Contract Retention Deducted (-):</span>
                    <span className="font-mono text-amber-400">{formatLKR(viewingInvoice.retentionDeducted || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-800 text-slate-100">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono text-blue-400">{formatLKR(viewingInvoice.netAmount)}</span>
                </div>
                <div className="flex justify-between font-mono pt-1">
                  <span className="text-slate-400">Disbursed / Paid Amount:</span>
                  <span className="text-emerald-400 font-bold">{formatLKR(viewingInvoice.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-slate-300">Remaining Balance:</span>
                  <span className={viewingInvoice.netAmount - (viewingInvoice.paidAmount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {formatLKR(viewingInvoice.netAmount - (viewingInvoice.paidAmount || 0))}
                  </span>
                </div>
              </div>

              {viewingInvoice.remarks && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Remarks / Audit Note</span>
                  <p className="text-slate-300 italic">{viewingInvoice.remarks}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice Voucher</span>
              </button>
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full-Screen Attachment Viewer */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-slate-200 text-sm">{previewAttachment.title}</span>
                <span className="text-xs text-slate-400 font-mono">({previewAttachment.fileName})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAttachment(previewAttachment.dataUrl, previewAttachment.fileName)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              {previewAttachment.dataUrl.startsWith('data:image') ? (
                <img
                  src={previewAttachment.dataUrl}
                  alt={previewAttachment.fileName}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg border border-slate-800 shadow-xl"
                />
              ) : (
                <iframe
                  src={previewAttachment.dataUrl}
                  title={previewAttachment.fileName}
                  className="w-full h-[75vh] rounded-lg border border-slate-800 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Settle Invoice with Payment Voucher */}
      {settlementInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Disbursement Settlement</span>
                <h3 className="text-base font-bold text-slate-100">Pay Supplier Invoice</h3>
              </div>
              <button onClick={() => setSettlementInvoice(null)} className="p-1 text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <form onSubmit={handleConfirmSettlement} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                <div className="flex justify-between"><span>Vendor:</span><strong className="text-slate-100">{settlementInvoice.supplierName}</strong></div>
                <div className="flex justify-between"><span>Invoice Ref:</span><strong className="font-mono text-slate-100">{settlementInvoice.supplierInvoiceRef}</strong></div>
                <div className="flex justify-between"><span>Total Invoiced:</span><span className="font-mono text-slate-300">{formatLKR(settlementInvoice.netAmount)}</span></div>
                <div className="flex justify-between font-bold text-rose-400">
                  <span>Balance Outstanding:</span>
                  <span className="font-mono">{formatLKR(settlementInvoice.netAmount - (settlementInvoice.paidAmount || 0))}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Amount (LKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={settlementInvoice.netAmount - (settlementInvoice.paidAmount || 0)}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-mono font-bold focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Settlement Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:border-emerald-500"
                >
                  <option value="Bank Transfer (CEFT/SLIPS)">Direct Bank Transfer (CEFT / Real-time SLIPS)</option>
                  <option value="Cheque">Account Payee Cheque</option>
                  <option value="Petty Cash">Authorized Site Petty Cash</option>
                  <option value="Direct Debit">Direct Debit / Standing Order</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. CEFT-889124 / CHQ-00412"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="gen-voucher"
                  checked={generateVoucher}
                  onChange={(e) => setGenerateVoucher(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="gen-voucher" className="text-[11px] text-slate-300 cursor-pointer">
                  <strong>Create Linked Enterprise Payment Voucher</strong>
                  <span className="block text-slate-400">
                    Automatically log an approved Payment Voucher in the central cash register linked to this vendor invoice.
                  </span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Disburse Payment ({formatLKR(settleAmount)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Supplier Invoice */}
      <SupplierInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
      />
    </div>
  );
};
