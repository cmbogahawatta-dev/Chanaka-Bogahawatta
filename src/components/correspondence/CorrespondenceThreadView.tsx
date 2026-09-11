import React, { useMemo } from 'react';
import {
  GitCommit,
  GitBranch,
  ArrowRight,
  Send,
  Inbox,
  Calendar,
  Building,
  FileText,
  Link,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Letter } from '../../types/correspondenceTypes';

interface CorrespondenceThreadViewProps {
  currentLetter: Letter;
  allLetters: Letter[];
  onSelectLetter: (letter: Letter) => void;
  onComposeReply: (letter: Letter) => void;
  onOpenLinkModal?: (letter: Letter) => void;
}

export const CorrespondenceThreadView: React.FC<CorrespondenceThreadViewProps> = ({
  currentLetter,
  allLetters,
  onSelectLetter,
  onComposeReply,
  onOpenLinkModal
}) => {
  // Discover all linked letters in this thread
  const threadLetters = useMemo(() => {
    const visitedIds = new Set<string>();
    const result: Letter[] = [];

    const queue: string[] = [currentLetter.id];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visitedIds.has(id)) continue;
      visitedIds.add(id);

      const target = allLetters.find(l => l.id === id);
      if (target) {
        result.push(target);

        // Check parents and replies
        if (target.replyToLetterId && !visitedIds.has(target.replyToLetterId)) {
          queue.push(target.replyToLetterId);
        }
        if (target.previousLetterId && !visitedIds.has(target.previousLetterId)) {
          queue.push(target.previousLetterId);
        }
        if (target.parentCorrespondenceId && !visitedIds.has(target.parentCorrespondenceId)) {
          queue.push(target.parentCorrespondenceId);
        }
        if (target.relatedCorrespondenceIds) {
          target.relatedCorrespondenceIds.forEach(relId => {
            if (!visitedIds.has(relId)) queue.push(relId);
          });
        }

        // Also find any letters that reference this target as their replyToLetterId or parent
        allLetters.forEach(l => {
          if (
            (l.replyToLetterId === target.id ||
              l.previousLetterId === target.id ||
              l.parentCorrespondenceId === target.id ||
              (l.relatedCorrespondenceIds && l.relatedCorrespondenceIds.includes(target.id))) &&
            !visitedIds.has(l.id)
          ) {
            queue.push(l.id);
          }
        });
      }
    }

    // Sort chronologically by date
    return result.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [currentLetter, allLetters]);

  return (
    <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Thread Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              Contractual Reference Chain & Chronology
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {threadLetters.length} {threadLetters.length === 1 ? 'Record' : 'Linked Records'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive audit trail of submissions, engineer directives, and contractor replies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLinkModal && (
            <button
              onClick={() => onOpenLinkModal(currentLetter)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Link className="w-3.5 h-3.5 text-indigo-400" />
              Link Another Letter
            </button>
          )}
          <button
            onClick={() => onComposeReply(currentLetter)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            Draft Official Reply
          </button>
        </div>
      </div>

      {/* Timeline Node Chain */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-emerald-500">
        {threadLetters.map((letter, idx) => {
          const isSelected = letter.id === currentLetter.id;
          const isIncoming = letter.direction === 'Incoming' || letter.direction === 'INCOMING';

          return (
            <div key={letter.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isSelected
                    ? 'bg-purple-600 border-white text-white shadow-lg shadow-purple-500/50 scale-110'
                    : isIncoming
                    ? 'bg-blue-950 border-blue-500 text-blue-400'
                    : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                }`}
              >
                {isIncoming ? <Inbox className="w-3 h-3 sm:w-4 sm:h-4" /> : <Send className="w-3 h-3 sm:w-4 sm:h-4" />}
              </div>

              {/* Node Card */}
              <div
                onClick={() => onSelectLetter(letter)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/20 border-purple-500 shadow-md ring-1 ring-purple-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isIncoming
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isIncoming ? 'INCOMING' : 'OUTGOING'}
                    </span>

                    {letter.documentType && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-purple-300 border border-purple-500/20">
                        {letter.documentType}
                      </span>
                    )}

                    {letter.contractualCategory && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300">
                        {letter.contractualCategory}
                      </span>
                    )}

                    <span className="font-mono text-xs font-bold text-slate-100">
                      {letter.letterNumber}
                    </span>

                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500 text-white uppercase tracking-wider">
                        Currently Viewing
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{letter.date}</span>
                    {letter.receivedDate && (
                      <span className="text-blue-300 text-[11px]">(Rec: {letter.receivedDate})</span>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 mb-1">{letter.subject}</h4>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {isIncoming ? (
                        <>
                          Sender: <strong className="text-slate-200">{letter.senderOrganization || 'External'}</strong>
                        </>
                      ) : (
                        <>
                          Recipient: <strong className="text-slate-200">{letter.recipientOrganization || 'Recipient'}</strong>
                        </>
                      )}
                    </span>
                  </div>

                  {letter.theirReference && (
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded">
                      <span>Their Ref:</span>
                      <strong className="text-amber-300">{letter.theirReference}</strong>
                    </div>
                  )}

                  {letter.replyDueDate && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400">
                      <Clock className="w-3 h-3" />
                      <span>Due: {letter.replyDueDate}</span>
                    </div>
                  )}

                  {letter.actionItems && letter.actionItems.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{letter.actionItems.length} Action Tasks</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
