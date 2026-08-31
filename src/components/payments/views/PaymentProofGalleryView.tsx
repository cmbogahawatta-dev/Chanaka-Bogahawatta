import React, { useState } from 'react';
import {
  Camera,
  FileText,
  Search,
  Eye,
  Download,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { usePRV } from '../../../context/PRVContext';
import { PaymentProofDocument } from '../../../types/prvTypes';

export const PaymentProofGalleryView: React.FC = () => {
  const { paymentProofs, openPRVByNumber } = usePRV();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofForPreview, setSelectedProofForPreview] = useState<PaymentProofDocument | null>(null);

  const filteredProofs = paymentProofs.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.proofNumber.toLowerCase().includes(q) ||
      p.prvNumber.toLowerCase().includes(q) ||
      p.paymentReference.toLowerCase().includes(q) ||
      p.documentType.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 text-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Payment Proof Documents Vault</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
              {paymentProofs.length} Scanned Proof Documents
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable document archive of bank wire receipts, signed cash vouchers, and cheque confirmations captured via optical mobile scanner and web upload.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proof #, PRV #, wire reference..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 text-xs focus:border-emerald-500 focus:outline-none w-64"
          />
        </div>
      </div>

      {/* Proof Documents Grid */}
      {filteredProofs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <Camera className="w-10 h-10 mx-auto text-emerald-400 opacity-50" />
          <h3 className="font-bold text-slate-200 text-sm">No Payment Proof Documents Available</h3>
          <p className="text-xs text-slate-500">
            When an authorized voucher is paid and scanned via the mobile camera scanner or file uploader, the proof slip will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProofs.map(prf => (
            <div
              key={prf.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col justify-between group"
            >
              {/* Document Image Thumbnail Preview */}
              <div
                onClick={() => setSelectedProofForPreview(prf)}
                className="relative w-full aspect-[16/10] bg-black overflow-hidden cursor-pointer border-b border-slate-800 flex items-center justify-center"
              >
                <img
                  src={prf.file}
                  alt={prf.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 text-slate-100 font-bold text-xs flex items-center gap-1.5 backdrop-blur-sm">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zoom Proof Slip</span>
                  </div>
                </div>

                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
                  {prf.documentType}
                </div>

                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 font-mono text-[10px]">
                  {prf.capturedMethod === 'CAMERA_SCAN' ? 'Camera Scan' : 'Uploaded File'}
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      onClick={() => openPRVByNumber(prf.prvNumber)}
                      className="font-mono font-bold text-purple-300 text-xs hover:underline cursor-pointer block"
                    >
                      {prf.prvNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Ref: <strong className="text-slate-200">{prf.paymentReference}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-xs block">
                      {prf.currency} {prf.paymentAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{prf.paymentDate}</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Source: <strong className="text-purple-300">{prf.paymentSource}</strong></span>
                    <span>By: {prf.capturedBy}</span>
                  </div>
                  {prf.notes && (
                    <p className="text-[10px] text-slate-400 italic truncate">"{prf.notes}"</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => openPRVByNumber(prf.prvNumber)}
                    className="text-purple-400 hover:text-purple-300 font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>View Voucher</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setSelectedProofForPreview(prf)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Full Slip</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Zoom Modal */}
      {selectedProofForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {selectedProofForPreview.proofNumber}
                </span>
                <span className="text-xs text-slate-400">
                  Linked to <strong className="text-purple-300">{selectedProofForPreview.prvNumber}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedProofForPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <img
                src={selectedProofForPreview.file}
                alt={selectedProofForPreview.fileName}
                className="max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div>
                Amount: <strong className="text-emerald-400 font-mono">{selectedProofForPreview.currency} {selectedProofForPreview.paymentAmount.toLocaleString()}</strong> • Reference: <strong className="text-slate-200 font-mono">{selectedProofForPreview.paymentReference}</strong>
              </div>
              <button
                onClick={() => setSelectedProofForPreview(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
