import React, { useState } from 'react';
import {
  X,
  Link,
  Search,
  Check,
  Building,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Letter } from '../../types/correspondenceTypes';

interface CorrespondenceLinkModalProps {
  currentLetter: Letter;
  allLetters: Letter[];
  onClose: () => void;
  onLinkLetter: (letterId: string, targetId: string) => void;
  onUnlinkLetter: (letterId: string, targetId: string) => void;
}

export const CorrespondenceLinkModal: React.FC<CorrespondenceLinkModalProps> = ({
  currentLetter,
  allLetters,
  onClose,
  onLinkLetter,
  onUnlinkLetter
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const linkedIds = new Set([
    ...(currentLetter.relatedCorrespondenceIds || []),
    ...(currentLetter.replyToLetterId ? [currentLetter.replyToLetterId] : []),
    ...(currentLetter.parentCorrespondenceId ? [currentLetter.parentCorrespondenceId] : [])
  ]);

  const candidates = allLetters.filter(l => {
    if (l.id === currentLetter.id) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.letterNumber.toLowerCase().includes(term) ||
      l.subject.toLowerCase().includes(term) ||
      (l.theirReference && l.theirReference.toLowerCase().includes(term)) ||
      (l.recipientOrganization && l.recipientOrganization.toLowerCase().includes(term)) ||
      (l.senderOrganization && l.senderOrganization.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Link Related Letters & Notices
              </h3>
              <p className="text-xs text-slate-400">
                Create two-way reference links for <span className="font-mono text-indigo-300">{currentLetter.letterNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by letter number, subject, employer, or reference..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Candidates List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No matching correspondence found.
            </div>
          ) : (
            candidates.map(candidate => {
              const isLinked = linkedIds.has(candidate.id);

              return (
                <div
                  key={candidate.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isLinked
                      ? 'bg-indigo-950/20 border-indigo-500/50'
                      : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          candidate.direction === 'Incoming'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {candidate.direction}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-200">
                        {candidate.letterNumber}
                      </span>
                      {candidate.documentType && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 font-mono">
                          {candidate.documentType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {candidate.subject}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{candidate.date}</span>
                      <span>•</span>
                      <span>{candidate.senderOrganization || candidate.recipientOrganization}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (isLinked) {
                        onUnlinkLetter(currentLetter.id, candidate.id);
                      } else {
                        onLinkLetter(currentLetter.id, candidate.id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                      isLinked
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isLinked ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        Unlink
                      </>
                    ) : (
                      <>
                        <Link className="w-3.5 h-3.5" />
                        Link Letter
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
