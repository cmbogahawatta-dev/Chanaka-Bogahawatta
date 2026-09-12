import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  Eye,
  Check,
  XCircle,
  Clock,
  Printer,
  Paperclip,
  Download,
  ExternalLink,
  Layers,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { GoodsReceivedNote } from '../../types/supplierTypes';
import { GoodsReceivedModal } from './GoodsReceivedModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';

export const GoodsReceivedView: React.FC = () => {
  const { grns, suppliers, updateGRNStatus, deleteGRN, clearGRNHistory } = useSupplier();
  const { projects } = usePettyCash();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');

  const [isNewGRNModalOpen, setIsNewGRNModalOpen] = useState(false);
  const [editingGRN, setEditingGRN] = useState<GoodsReceivedNote | null>(null);
  const [deleteTargetGRN, setDeleteTargetGRN] = useState<GoodsReceivedNote | null>(null);
  const [viewingGRN, setViewingGRN] = useState<GoodsReceivedNote | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{ title: string; fileName: string; dataUrl: string } | null>(null);

  const filteredGRNs = useMemo(() => {
    return grns.filter(g => {
      const matchSearch =
        searchTerm === '' ||
        (g.grnNumber && g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.supplierName && g.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.deliveryNoteNumber && g.deliveryNoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.poNumber && g.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.vehicleNumber && g.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (g.items && g.items.some(it => it.description.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchStatus = selectedStatus === 'ALL' || g.status === selectedStatus;
      const matchProj = selectedProject === 'ALL' || g.projectCode === selectedProject;

      return matchSearch && matchStatus && matchProj;
    });
  }, [grns, searchTerm, selectedStatus, selectedProject]);

  const acceptedCount = grns.filter(g => g.status === 'Accepted').length;
  const partialCount = grns.filter(g => g.status === 'Partial').length;
  const rejectedCount = grns.filter(g => g.status === 'Rejected').length;

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
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Site Goods Received Notes (GRN) & Delivery Verification</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Site receipt tracking, multi-item materials list, QA inspection acceptance, and supplier delivery note document uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminClearHistoryButton
            id="btn-admin-clear-grns"
            moduleName="Goods Received Notes"
            itemCount={grns.length}
            itemDescription="goods received notes and site delivery logs"
            preservedItemsDescription="Purchase orders and supplier catalog records remain intact."
            onClear={() => clearGRNHistory()}
          />
          <button
            onClick={() => {
              setEditingGRN(null);
              setIsNewGRNModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Issue Site GRN</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total GRN Issued</span>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{grns.length} Deliveries</div>
          <span className="text-[10px] text-slate-400 font-medium">All verified site gate entries</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fully Accepted</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{acceptedCount} Dispatches</div>
          <span className="text-[10px] text-emerald-300 font-medium">Passed QA inspection</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Partial Acceptance</span>
          <div className="text-xl font-mono font-bold text-amber-400 mt-1">{partialCount} Dispatches</div>
          <span className="text-[10px] text-amber-300 font-medium">Partial deductions applied</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rejections / Non-Compliant</span>
          <div className="text-xl font-mono font-bold text-rose-400 mt-1">{rejectedCount} Gate Rejections</div>
          <span className="text-[10px] text-rose-300 font-medium">Returned to vendor</span>
        </div>
      </div>

      {/* 3. Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search GRN#, supplier, delivery note, material, truck#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p, idx) => (
              <option key={`${p.id || p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Accepted">Accepted</option>
            <option value="Partial">Partial</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* 4. GRN Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">GRN # & Date</th>
                <th className="p-3">Supplier & Delivery Note</th>
                <th className="p-3">Project / Site</th>
                <th className="p-3">Associated PO</th>
                <th className="p-3">Delivered Materials List</th>
                <th className="p-3">Delivery Note Copy</th>
                <th className="p-3">Vehicle & Officer</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No Goods Received Notes recorded.
                  </td>
                </tr>
              ) : (
                filteredGRNs.map(grn => {
                  const grnItems = grn.items && grn.items.length > 0
                    ? grn.items
                    : [
                        {
                          description: grn.itemDescription || 'Material Delivery',
                          orderedQuantity: grn.orderedQuantity ?? 0,
                          receivedQuantity: grn.receivedQuantity ?? 0,
                          acceptedQuantity: grn.acceptedQuantity ?? 0,
                          rejectedQuantity: grn.rejectedQuantity ?? 0,
                          unit: grn.unit || ''
                        }
                      ];

                  const hasAttachment = Boolean(grn.deliveryNoteAttachmentData || grn.deliveryNoteAttachmentName);

                  return (
                    <tr key={grn.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-slate-200 block">{grn.grnNumber}</span>
                        <span className="text-[10px] text-slate-400">{grn.deliveryDate}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-100 block">{grn.supplierName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Note: {grn.deliveryNoteNumber}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold font-mono">
                          {grn.projectCode}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {grn.poNumber ? (
                          <span className="font-bold text-orange-400">{grn.poNumber}</span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Ad-hoc Delivery</span>
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {grnItems.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                                {grnItems.length} items
                              </span>
                            )}
                            <span className="text-[11px] font-medium text-slate-200 truncate">
                              {grnItems[0].description}
                            </span>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400">
                            Delivered: <span className="text-emerald-400 font-bold">{grnItems[0].acceptedQuantity ?? grnItems[0].receivedQuantity ?? 0} {grnItems[0].unit}</span>
                            {(grnItems[0].rejectedQuantity || 0) > 0 && (
                              <span className="text-rose-400 ml-1">({grnItems[0].rejectedQuantity} rej)</span>
                            )}
                          </div>

                          {grnItems.length > 1 && (
                            <div className="text-[10px] text-slate-500 italic">
                              +{grnItems.length - 1} more items (view details)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {hasAttachment ? (
                          <button
                            onClick={() => {
                              if (grn.deliveryNoteAttachmentData) {
                                setPreviewAttachment({
                                  title: `Supplier Delivery Note - ${grn.deliveryNoteNumber}`,
                                  fileName: grn.deliveryNoteAttachmentName || 'Delivery_Note_Copy.pdf',
                                  dataUrl: grn.deliveryNoteAttachmentData
                                });
                              }
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-semibold transition-colors"
                            title="View / Download Supplier Delivery Note"
                          >
                            <Paperclip className="w-3 h-3 text-emerald-400" />
                            <span className="truncate max-w-[100px]">
                              {grn.deliveryNoteAttachmentName ? 'Copy Attached' : 'Attached'}
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">None attached</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-slate-300 block">{grn.vehicleNumber || 'Unspecified'}</span>
                        <span className="text-[10px] text-slate-400">By: {grn.receivedBy}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          grn.status === 'Accepted' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                          grn.status === 'Partial' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {grn.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingGRN(grn)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                            title="View GRN Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingGRN(grn);
                              setIsNewGRNModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                            title="Edit Goods Received Note"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetGRN(grn)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Delete Goods Received Note"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal: View Full GRN Details */}
      {viewingGRN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{viewingGRN.grnNumber}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      viewingGRN.status === 'Accepted' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                      viewingGRN.status === 'Partial' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {viewingGRN.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Supplier: <strong className="text-slate-200">{viewingGRN.supplierName}</strong> | Delivery Date: <strong className="text-slate-200">{viewingGRN.deliveryDate}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setViewingGRN(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Delivery Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Delivery Note Ref</span>
                  <span className="font-mono font-bold text-slate-200">{viewingGRN.deliveryNoteNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Project Code</span>
                  <span className="font-mono font-bold text-purple-400">{viewingGRN.projectCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Associated PO</span>
                  <span className="font-mono font-bold text-orange-400">{viewingGRN.poNumber || 'None (Direct)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Vehicle / Mixer No</span>
                  <span className="font-mono font-bold text-slate-200">{viewingGRN.vehicleNumber || 'Unspecified'}</span>
                </div>
              </div>

              {/* Multi-Item Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Delivered Line Items Schedule</span>
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Receiving Officer: <strong className="text-slate-200">{viewingGRN.receivedBy}</strong>
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Material Description</th>
                        <th className="p-2.5 text-right">PO Ordered</th>
                        <th className="p-2.5 text-right">Delivered</th>
                        <th className="p-2.5 text-right">Accepted</th>
                        <th className="p-2.5 text-right">Rejected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(viewingGRN.items && viewingGRN.items.length > 0
                        ? viewingGRN.items
                        : [
                            {
                              description: viewingGRN.itemDescription || 'Material Delivery',
                              orderedQuantity: viewingGRN.orderedQuantity ?? 0,
                              receivedQuantity: viewingGRN.receivedQuantity ?? 0,
                              acceptedQuantity: viewingGRN.acceptedQuantity ?? 0,
                              rejectedQuantity: viewingGRN.rejectedQuantity ?? 0,
                              unit: viewingGRN.unit || ''
                            }
                          ]
                      ).map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2.5">
                            <span className="font-medium text-slate-100 block">{it.description}</span>
                            {it.rejectionReason && (
                              <span className="text-[10px] text-rose-400 block mt-0.5 italic">
                                Rejection Note: {it.rejectionReason}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-right text-slate-400">
                            {it.orderedQuantity || '—'} {it.unit}
                          </td>
                          <td className="p-2.5 font-mono text-right font-bold text-slate-200">
                            {it.receivedQuantity ?? 0} {it.unit}
                          </td>
                          <td className="p-2.5 font-mono text-right font-bold text-emerald-400">
                            {it.acceptedQuantity ?? it.receivedQuantity ?? 0} {it.unit}
                          </td>
                          <td className="p-2.5 font-mono text-right font-bold text-rose-400">
                            {(it.rejectedQuantity || 0) > 0 ? `${it.rejectedQuantity} ${it.unit}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Uploaded Supplier Copy of Delivery Note */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Uploaded Supplier Copy of Delivery Note</span>
                  </span>
                  {viewingGRN.deliveryNoteAttachmentName && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {viewingGRN.deliveryNoteAttachmentName}
                    </span>
                  )}
                </div>

                {viewingGRN.deliveryNoteAttachmentData ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {viewingGRN.deliveryNoteAttachmentData.startsWith('data:image') ? (
                        <img
                          src={viewingGRN.deliveryNoteAttachmentData}
                          alt="Delivery Note Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setPreviewAttachment({
                              title: `Supplier Delivery Note - ${viewingGRN.deliveryNoteNumber}`,
                              fileName: viewingGRN.deliveryNoteAttachmentName || 'Delivery_Note.png',
                              dataUrl: viewingGRN.deliveryNoteAttachmentData!
                            });
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
                          <FileText className="w-7 h-7" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-200 block truncate text-xs">
                          {viewingGRN.deliveryNoteAttachmentName || 'Supplier_Delivery_Note_Scan.pdf'}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Official vendor signed delivery receipt / weighbridge ticket
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setPreviewAttachment({
                            title: `Supplier Delivery Note - ${viewingGRN.deliveryNoteNumber}`,
                            fileName: viewingGRN.deliveryNoteAttachmentName || 'Delivery_Note_Copy.pdf',
                            dataUrl: viewingGRN.deliveryNoteAttachmentData!
                          });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDownloadAttachment(viewingGRN.deliveryNoteAttachmentData!, viewingGRN.deliveryNoteAttachmentName || 'Delivery_Note.pdf')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700 font-bold text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-slate-500">
                    No scanned supplier delivery note attached to this record.
                  </div>
                )}
              </div>

              {/* Inspection QA Remarks */}
              {viewingGRN.qualityInspectionRemarks && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    QA / Slump Test Inspection Remarks
                  </span>
                  <p className="text-slate-300 italic">{viewingGRN.qualityInspectionRemarks}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = viewingGRN;
                    setViewingGRN(null);
                    setEditingGRN(toEdit);
                    setIsNewGRNModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit GRN</span>
                </button>
                <button
                  onClick={() => {
                    const toDel = viewingGRN;
                    setViewingGRN(null);
                    setDeleteTargetGRN(toDel);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-800 font-bold text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print GRN Docket</span>
                </button>
                <button
                  onClick={() => setViewingGRN(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Attachment Viewer Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200 text-sm">{previewAttachment.title}</span>
                <span className="text-xs text-slate-400 font-mono">({previewAttachment.fileName})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAttachment(previewAttachment.dataUrl, previewAttachment.fileName)}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
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

      {/* Modal: New / Edit GRN */}
      <GoodsReceivedModal
        isOpen={isNewGRNModalOpen}
        onClose={() => {
          setIsNewGRNModalOpen(false);
          setEditingGRN(null);
        }}
        editGRN={editingGRN}
      />

      {/* Universal Delete Modal */}
      {deleteTargetGRN && (
        <UniversalDeleteModal
          isOpen={true}
          onClose={() => setDeleteTargetGRN(null)}
          module="procurement"
          recordType="Goods Received Note"
          recordId={deleteTargetGRN.id}
          recordCode={deleteTargetGRN.grnNumber}
          recordTitle={deleteTargetGRN.itemDescription || 'Material Delivery'}
          additionalDetails={`GRN for ${deleteTargetGRN.supplierName} (Note: ${deleteTargetGRN.deliveryNoteNumber}, Delivered: ${deleteTargetGRN.receivedQuantity} ${deleteTargetGRN.unit})`}
          onDelete={() => {
            deleteGRN(deleteTargetGRN.id);
            setDeleteTargetGRN(null);
          }}
        />
      )}
    </div>
  );
};
