import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Edit3, Building2, MapPin, DollarSign, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { Project } from '../../types/pettyCashTypes';
import { usePettyCash } from '../../context/PettyCashContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit
}) => {
  const { addProject, updateProject } = usePettyCash();

  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [contractValue, setContractValue] = useState<number>(10000000);
  const [budgetPettyCash, setBudgetPettyCash] = useState<number>(2000000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<'Active' | 'On Hold' | 'Completed' | 'Closed'>('Active');
  const [projectManager, setProjectManager] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setProjectCode(projectToEdit.PROJECT_CODE || '');
      setProjectName(projectToEdit.PROJECT_NAME || '');
      setClient(projectToEdit.CLIENT || '');
      setLocation(projectToEdit.LOCATION || '');
      setContractValue(projectToEdit.CONTRACT_VALUE || 0);
      setBudgetPettyCash(projectToEdit.BUDGET_PETTY_CASH || 0);
      setStartDate(projectToEdit.START_DATE || new Date().toISOString().slice(0, 10));
      setEndDate(projectToEdit.END_DATE || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setStatus(projectToEdit.STATUS || 'Active');
      setProjectManager(projectToEdit.PROJECT_MANAGER || '');
      setRemarks(projectToEdit.REMARKS || '');
    } else {
      setProjectCode('');
      setProjectName('');
      setClient('Road Development Authority (RDA)');
      setLocation('');
      setContractValue(15000000);
      setBudgetPettyCash(2500000);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setStatus('Active');
      setProjectManager('');
      setRemarks('');
    }
    setError(null);
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectCode.trim()) {
      setError('Project Code is required (e.g. PIDM 30)');
      return;
    }
    if (!projectName.trim()) {
      setError('Project Name is required');
      return;
    }
    if (!client.trim()) {
      setError('Client Name is required');
      return;
    }

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        PROJECT_CODE: projectCode.trim().toUpperCase(),
        PROJECT_NAME: projectName.trim(),
        CLIENT: client.trim(),
        LOCATION: location.trim(),
        CONTRACT_VALUE: Number(contractValue) || 0,
        BUDGET_PETTY_CASH: Number(budgetPettyCash) || 0,
        START_DATE: startDate,
        END_DATE: endDate,
        STATUS: status,
        PROJECT_MANAGER: projectManager.trim() || 'Site Resident Engineer',
        REMARKS: remarks.trim()
      });
    } else {
      addProject({
        PROJECT_CODE: projectCode.trim().toUpperCase(),
        PROJECT_NAME: projectName.trim(),
        CLIENT: client.trim(),
        LOCATION: location.trim(),
        CONTRACT_VALUE: Number(contractValue) || 0,
        BUDGET_PETTY_CASH: Number(budgetPettyCash) || 0,
        START_DATE: startDate,
        END_DATE: endDate,
        STATUS: status,
        PROJECT_MANAGER: projectManager.trim() || 'Site Resident Engineer',
        REMARKS: remarks.trim()
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400">
              {projectToEdit ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {projectToEdit ? `Edit Project: ${projectToEdit.PROJECT_CODE}` : 'Create New Project Package'}
              </h2>
              <p className="text-xs text-slate-400">
                {projectToEdit ? 'Modify project contract details, budgets, and location' : 'Register a new construction package in the master directory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Code */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Project Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PIDM 30 or RDA-WP-04"
                value={projectCode}
                onChange={e => setProjectCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Project Status <span className="text-rose-400">*</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Active">Active (Under Construction)</option>
                <option value="On Hold">On Hold / Suspended</option>
                <option value="Completed">Completed (Handover in Progress)</option>
                <option value="Closed">Closed & Final Settled</option>
              </select>
            </div>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Project / Contract Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rehabilitation of Southern Expressway Bridge Structure Package 2"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Client / Authority <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Road Development Authority (RDA)"
                value={client}
                onChange={e => setClient(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Site Location</label>
              <input
                type="text"
                placeholder="e.g. Gampaha & Mirigama Section"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Contract Value */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Contract Total Value (LKR)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={contractValue}
                onChange={e => setContractValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Petty Cash Budget */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Petty Cash Allocation (LKR)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={budgetPettyCash}
                onChange={e => setBudgetPettyCash(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Project Manager / Engineer */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Resident Engineer / PM</label>
              <input
                type="text"
                placeholder="e.g. Eng. Bandara"
                value={projectManager}
                onChange={e => setProjectManager(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Completion</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="Add key milestones, site specifications, or funding donor details..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{projectToEdit ? 'Save Changes' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
