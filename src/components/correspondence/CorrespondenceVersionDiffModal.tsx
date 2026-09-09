import React, { useState, useMemo } from 'react';
import {
  X,
  GitCompare,
  Columns,
  AlignLeft,
  ArrowRight,
  Clock,
  User,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Letter, LetterVersion } from '../../types/correspondenceTypes';
import { computeWordDiff, stripHtml, DiffSegment } from '../../utils/textDiffUtils';

interface CorrespondenceVersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: Letter;
  versions: LetterVersion[];
}

export const CorrespondenceVersionDiffModal: React.FC<CorrespondenceVersionDiffModalProps> = ({
  isOpen,
  onClose,
  letter,
  versions
}) => {
  if (!isOpen) return null;

  // Sorted versions ascending
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => a.version - b.version);
  }, [versions]);

  // Default to comparing previous version with current version
  const [selectedOldVerNumber, setSelectedOldVerNumber] = useState<number>(() => {
    if (sortedVersions.length >= 2) {
      return sortedVersions[sortedVersions.length - 2].version;
    }
    return sortedVersions[0]?.version || 1;
  });

  const [selectedNewVerNumber, setSelectedNewVerNumber] = useState<number>(() => {
    if (sortedVersions.length > 0) {
      return sortedVersions[sortedVersions.length - 1].version;
    }
    return 1;
  });

  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const oldVer = useMemo(() => {
    return sortedVersions.find(v => v.version === selectedOldVerNumber) || sortedVersions[0];
  }, [sortedVersions, selectedOldVerNumber]);

  const newVer = useMemo(() => {
    return sortedVersions.find(v => v.version === selectedNewVerNumber) || sortedVersions[sortedVersions.length - 1];
  }, [sortedVersions, selectedNewVerNumber]);

  const oldText = useMemo(() => stripHtml(oldVer?.bodyHtml || ''), [oldVer]);
  const newText = useMemo(() => stripHtml(newVer?.bodyHtml || letter.bodyHtml || ''), [newVer, letter]);

  const diffSegments = useMemo<DiffSegment[]>(() => {
    return computeWordDiff(oldText, newText);
  }, [oldText, newText]);

  const stats = useMemo(() => {
    let addedWords = 0;
    let removedWords = 0;
    for (const seg of diffSegments) {
      const words = seg.value.trim().split(/\s+/).filter(Boolean).length;
      if (seg.type === 'added') addedWords += words;
      if (seg.type === 'removed') removedWords += words;
    }
    return { addedWords, removedWords };
  }, [diffSegments]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Document Version Comparison
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-purple-300 border border-slate-700">
                  {letter.letterNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track modifications, deletions, and external additions before official finalization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === 'split' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Side by Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                  viewMode === 'unified' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                Unified Diff
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Version Pickers & Difference Statistics Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Baseline (Previous):
              </span>
              <select
                value={selectedOldVerNumber}
                onChange={e => setSelectedOldVerNumber(Number(e.target.value))}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 font-semibold focus:outline-none"
              >
                {sortedVersions.map(v => (
                  <option key={v.id} value={v.version}>
                    V{v.version} — {v.source || 'Draft'} ({v.changedBy || 'Author'})
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 mt-4" />

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Compared (Current / Revised):
              </span>
              <select
                value={selectedNewVerNumber}
                onChange={e => setSelectedNewVerNumber(Number(e.target.value))}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 font-semibold focus:outline-none"
              >
                {sortedVersions.map(v => (
                  <option key={v.id} value={v.version}>
                    V{v.version} — {v.source || 'Revision'} ({v.changedBy || 'Author'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Change Stats */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded text-xs font-semibold">
              +{stats.addedWords} words added
            </span>
            <span className="px-2.5 py-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded text-xs font-semibold">
              -{stats.removedWords} words removed
            </span>
          </div>
        </div>

        {/* Diff Content View */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/90 font-mono text-xs leading-relaxed">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Previous Version Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <strong className="text-slate-200 font-semibold">
                      Version {oldVer?.version} (Baseline)
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {oldVer?.changedAt ? new Date(oldVer.changedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-slate-300 flex-1 overflow-y-auto pr-2">
                  {oldText || <span className="text-slate-600 italic">No content in this baseline version.</span>}
                </div>
              </div>

              {/* Current Version Box */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <strong className="text-slate-200 font-semibold">
                      Version {newVer?.version} (Current / Imported)
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {newVer?.changedAt ? new Date(newVer.changedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-slate-300 flex-1 overflow-y-auto pr-2">
                  {newText || <span className="text-slate-600 italic">No content in this compared version.</span>}
                </div>
              </div>
            </div>
          ) : (
            /* Unified Diff Box */
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 whitespace-pre-wrap">
              <div className="pb-3 mb-3 border-b border-slate-800 flex items-center justify-between text-slate-400">
                <span>
                  Comparing V{oldVer?.version} against V{newVer?.version}
                </span>
                <span className="text-[11px] text-slate-500">
                  Green = Added • Red Strikethrough = Deleted
                </span>
              </div>
              <div>
                {diffSegments.map((seg, idx) => {
                  if (seg.type === 'added') {
                    return (
                      <span
                        key={idx}
                        className="bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400 px-0.5 rounded font-bold"
                      >
                        {seg.value}
                      </span>
                    );
                  }
                  if (seg.type === 'removed') {
                    return (
                      <span
                        key={idx}
                        className="bg-rose-500/20 text-rose-300 line-through border-b-2 border-rose-400 px-0.5 rounded opacity-75"
                      >
                        {seg.value}
                      </span>
                    );
                  }
                  return <span key={idx} className="text-slate-300">{seg.value}</span>;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Source: <span className="text-purple-300 font-medium">{newVer?.source || 'Application Draft'}</span> • Total Saved Versions: {sortedVersions.length}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
