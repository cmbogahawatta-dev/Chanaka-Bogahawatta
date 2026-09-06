import React from 'react';
import { X, Download, FileText, Calendar, HardDrive, ExternalLink } from 'lucide-react';
import { SupportingDocument } from '../../types/enterpriseProfileTypes';

interface DocumentPreviewModalProps {
  document: SupportingDocument | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose
}) => {
  if (!document) return null;

  const isImage =
    document.fileType?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(document.name) ||
    document.dataUrl?.startsWith('data:image/');

  const isPdf =
    document.fileType?.includes('pdf') ||
    /\.pdf$/i.test(document.name) ||
    document.dataUrl?.startsWith('data:application/pdf');

  const handleDownload = () => {
    if (!document.dataUrl) return;
    const a = window.document.createElement('a');
    a.href = document.dataUrl;
    a.download = document.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
                {document.name}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                {document.fileSize && (
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    {document.fileSize}
                  </span>
                )}
                {document.uploadedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {document.uploadedAt}
                  </span>
                )}
                {document.category && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-medium text-[10px]">
                    {document.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {document.dataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
                title="Download supporting document"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/50 flex items-center justify-center">
          {isImage && document.dataUrl ? (
            <div className="max-h-[65vh] overflow-auto flex items-center justify-center">
              <img
                src={document.dataUrl}
                alt={document.name}
                className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg border border-slate-800"
              />
            </div>
          ) : isPdf && document.dataUrl ? (
            <div className="w-full h-[65vh] flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800 rounded-xl p-6 text-center">
              <iframe
                src={document.dataUrl}
                title={document.name}
                className="w-full h-full rounded-lg border border-slate-700/50"
              />
            </div>
          ) : (
            <div className="py-12 px-6 text-center max-w-md bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-100">{document.name}</h4>
              <p className="text-xs text-slate-400 mt-1">
                {document.description || 'Verified enterprise corporate supporting document.'}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                {document.dataUrl ? (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 italic">No direct file payload stored</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
          <span>Enterprise Supporting Document Vault</span>
          <span className="text-slate-500">Secure Client & Statutory Attachment</span>
        </div>
      </div>
    </div>
  );
};
