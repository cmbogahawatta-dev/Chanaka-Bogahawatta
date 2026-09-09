import React, { useRef } from 'react';
import {
  FileText,
  Globe,
  Download,
  Upload,
  Lock,
  Eye,
  GitCompare,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import { Letter, LetterVersion, LetterheadTemplate } from '../../types/correspondenceTypes';

interface CorrespondenceFinalDocumentPanelProps {
  letter: Letter;
  versions: LetterVersion[];
  letterhead?: LetterheadTemplate | null;
  onEditGoogleDocs: () => void;
  onDownloadWord: () => void;
  onImportWord: (file: File) => void;
  onPreviewPdf: () => void;
  onCompareVersions: () => void;
  onFinalizeLetter: () => void;
  isImportingWord?: boolean;
}

export const CorrespondenceFinalDocumentPanel: React.FC<CorrespondenceFinalDocumentPanelProps> = ({
  letter,
  versions,
  letterhead,
  onEditGoogleDocs,
  onDownloadWord,
  onImportWord,
  onPreviewPdf,
  onCompareVersions,
  onFinalizeLetter,
  isImportingWord
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportWord(file);
      e.target.value = '';
    }
  };

  const isFinalized = letter.status === 'Finalized' || letter.isLocked;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3.5">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              FINAL DOCUMENT CONTROL PANEL
            </h3>
            <span className="text-[10px] text-slate-400">
              Controlled master state & external editing bridges
            </span>
          </div>
        </div>

        {isFinalized ? (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <Lock className="w-3 h-3" />
            FINALIZED & LOCKED
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60">
            STATUS: {letter.status.toUpperCase()}
          </span>
        )}
      </div>

      {/* Status Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
            Status
          </span>
          <span className="font-bold text-slate-200">{letter.status}</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
            Current Version
          </span>
          <span className="font-mono font-bold text-purple-300">
            V{letter.version} ({versions.length} recorded)
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
            Editor
          </span>
          <span className="text-slate-200 truncate block font-medium">
            {letter.externalLastEditedBy || letter.preparedBy || 'Current User'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
            Last Updated
          </span>
          <span className="text-slate-300 font-mono text-[11px] block">
            {letter.externalDocumentUpdatedAt
              ? new Date(letter.externalDocumentUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : letter.createdAt
              ? new Date(letter.createdAt).toLocaleDateString()
              : 'Today'}
          </span>
        </div>
      </div>

      {/* External Document Bridges */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Document Actions & Bridges
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Google Docs Button */}
          <button
            type="button"
            onClick={onEditGoogleDocs}
            className="flex items-center justify-between px-3 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Google Docs</span>
            </span>
            <span className="text-[10px] text-blue-300 font-mono bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/40">
              {letter.googleDocumentUrl ? 'Linked' : 'Connect'}
            </span>
          </button>

          {/* Microsoft Word Button */}
          <button
            type="button"
            onClick={onDownloadWord}
            className="flex items-center justify-between px-3 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Microsoft Word</span>
            </span>
            <span className="text-[10px] text-blue-300 font-mono bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/40">
              .docx
            </span>
          </button>

          {/* PDF Preview Button */}
          <button
            type="button"
            onClick={onPreviewPdf}
            className="flex items-center justify-between px-3 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>PDF Inspection</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
              Preview
            </span>
          </button>
        </div>
      </div>

      {/* Control Actions: Compare, Import Revised, and Finalize */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Compare with Previous Version */}
          <button
            type="button"
            onClick={onCompareVersions}
            disabled={versions.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
            title={versions.length < 2 ? 'At least 2 versions required to compare' : 'Compare changes between versions'}
          >
            <GitCompare className="w-3.5 h-3.5 text-purple-400" />
            Compare Versions
          </button>

          {/* Import Revised Word Document */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isFinalized || isImportingWord}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            {isImportingWord ? 'Importing...' : 'Import Revised Document'}
          </button>
        </div>

        {/* Finalize Letter Action */}
        {!isFinalized ? (
          <button
            type="button"
            onClick={onFinalizeLetter}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-amber-600/20"
          >
            <Lock className="w-3.5 h-3.5" />
            Finalize Letter
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Finalized by {letter.finalizedBy || 'Authorized Officer'} on {letter.finalizedAt ? new Date(letter.finalizedAt).toLocaleDateString() : 'Date Recorded'}
          </div>
        )}
      </div>
    </div>
  );
};
