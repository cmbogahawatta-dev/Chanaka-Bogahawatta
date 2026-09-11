import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  Check,
  Building,
  FileText
} from 'lucide-react';
import { Letter, CorrespondenceActionItem } from '../../types/correspondenceTypes';

interface CorrespondenceActionTrackerModalProps {
  letter: Letter;
  onClose: () => void;
  onAddActionItem: (
    letterId: string,
    item: Omit<CorrespondenceActionItem, 'id' | 'createdAt'>
  ) => void;
  onUpdateActionItem: (
    letterId: string,
    actionItemId: string,
    updates: Partial<CorrespondenceActionItem>
  ) => void;
  onDeleteActionItem: (letterId: string, actionItemId: string) => void;
}

export const CorrespondenceActionTrackerModal: React.FC<CorrespondenceActionTrackerModalProps> = ({
  letter,
  onClose,
  onAddActionItem,
  onUpdateActionItem,
  onDeleteActionItem
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [remarks, setRemarks] = useState('');

  const handleSaveNewAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle.trim() || !responsiblePerson.trim()) return;

    onAddActionItem(letter.id, {
      correspondenceId: letter.id,
      action: actionTitle.trim(),
      responsiblePerson: responsiblePerson.trim(),
      dueDate,
      priority,
      status: 'OPEN',
      remarks: remarks.trim() || undefined
    });

    // Reset
    setActionTitle('');
    setResponsiblePerson('');
    setRemarks('');
    setIsAddingNew(false);
  };

  const actionList = letter.actionItems || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Action Items & Directive Tracker
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                  {letter.letterNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Subject: {letter.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Action Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Assigned Action Items ({actionList.length})
              </h4>
              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Action Item
                </button>
              )}
            </div>

            {actionList.length === 0 && !isAddingNew ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                No action items created yet for this correspondence record.
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-3 block mx-auto text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + Add First Action Item
                </button>
              </div>
            ) : (
              actionList.map(item => {
                const isCompleted = item.status === 'COMPLETED';
                const isOverdue =
                  !isCompleted &&
                  item.dueDate < new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-950/10 border-emerald-900/30 text-slate-400'
                        : isOverdue
                        ? 'bg-rose-950/15 border-rose-800/40'
                        : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() =>
                            onUpdateActionItem(letter.id, item.id, {
                              status: isCompleted ? 'OPEN' : 'COMPLETED',
                              completionDate: isCompleted
                                ? undefined
                                : new Date().toISOString().split('T')[0]
                            })
                          }
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-slate-600 hover:border-indigo-400 bg-slate-900'
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                            }`}
                          >
                            {item.action}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              Assignee: <strong className="text-slate-200">{item.responsiblePerson}</strong>
                            </span>
                            <span
                              className={`flex items-center gap-1 font-mono ${
                                isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              Target: {item.dueDate}
                              {isOverdue && ' (OVERDUE)'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                item.priority === 'URGENT' || item.priority === 'Urgent'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : item.priority === 'HIGH' || item.priority === 'High'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          {item.remarks && (
                            <p className="text-xs text-slate-400 mt-1 italic">
                              Note: {item.remarks}
                            </p>
                          )}
                          {item.completionDate && (
                            <p className="text-[11px] text-emerald-400 mt-1">
                              ✓ Completed on {item.completionDate}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteActionItem(letter.id, item.id)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Action Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Form to Add New Action Item */}
          {isAddingNew && (
            <form
              onSubmit={handleSaveNewAction}
              className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3 mt-4"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  New Action Directive
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Required Action / Directive *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carry out Joint Inspection at CH 14+300 with Consultant"
                  value={actionTitle}
                  onChange={e => setActionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Responsible Person / Role *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Site Engineer (K. Samarasinghe)"
                    value={responsiblePerson}
                    onChange={e => setResponsiblePerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes / Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Must prepare photo log and signature sign-off sheet"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
                >
                  Save Action Item
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
