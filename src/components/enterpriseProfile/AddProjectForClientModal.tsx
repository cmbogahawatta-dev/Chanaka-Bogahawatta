import React, { useState } from 'react';
import { X, Briefcase, Plus, Link2, CheckCircle2, Building, DollarSign, MapPin, Calendar, FileText } from 'lucide-react';
import { Client, SupportingDocument } from '../../types/enterpriseProfileTypes';
import { Project } from '../../types/pettyCashTypes';
import { usePettyCash } from '../../context/PettyCashContext';
import { SupportingDocumentUploadInput } from './SupportingDocumentUploadInput';

interface AddProjectForClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  clientsList?: Client[];
  onProjectAdded?: (project: Project) => void;
}

export const AddProjectForClientModal: React.FC<AddProjectForClientModalProps> = ({
  isOpen,
  onClose,
  client,
  clientsList = [],
  onProjectAdded
}) => {
  const { projects, addProject, updateProject, supervisors } = usePettyCash();

  const [mode, setMode] = useState<'create' | 'link'>('create');
  const [selectedClientId, setSelectedClientId] = useState(client.id);

  // Form State for creating new project
  const [projectCode, setProjectCode] = useState(() => `PRJ-${String(projects.length + 1).padStart(3, '0')}`);
  const [projectName, setProjectName] = useState('');
  const [location, setLocation] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [pettyCashBudget, setPettyCashBudget] = useState('500000');
  const [status, setStatus] = useState<'Active' | 'On Hold' | 'Completed' | 'Closed'>('Active');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [remarks, setRemarks] = useState('');
  const [supportingDocs, setSupportingDocs] = useState<SupportingDocument[]>([]);

  // State for linking existing project
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [linkSearchTerm, setLinkSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentClient = clientsList.find(c => c.id === selectedClientId) || client;

  // Projects not yet assigned to this client
  const availableProjectsToLink = projects.filter(
    p =>
      p.CLIENT !== currentClient.name &&
      p.CLIENT_NAME !== currentClient.name &&
      (linkSearchTerm === '' ||
        p.PROJECT_CODE.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
        p.PROJECT_NAME.toLowerCase().includes(linkSearchTerm.toLowerCase()) ||
        (p.LOCATION && p.LOCATION.toLowerCase().includes(linkSearchTerm.toLowerCase())))
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const numContract = Math.round((parseFloat(contractValue.replace(/,/g, '')) || 0) * 100) / 100;
    const numBudget = Math.round((parseFloat(pettyCashBudget.replace(/,/g, '')) || 500000) * 100) / 100;

    const newProject = addProject({
      PROJECT_CODE: projectCode.trim() || `PRJ-${String(projects.length + 1).padStart(3, '0')}`,
      PROJECT_NAME: projectName.trim(),
      CLIENT: currentClient.name,
      CLIENT_NAME: currentClient.name,
      LOCATION: location.trim() || 'Site Location',
      CONTRACT_VALUE: numContract,
      BUDGET_PETTY_CASH: numBudget,
      BUDGET: numBudget,
      budget: numBudget,
      STATUS: status,
      START_DATE: startDate || undefined,
      END_DATE: endDate || undefined,
      PROJECT_MANAGER: projectManager.trim() || undefined,
      REMARKS: remarks.trim() || undefined
    });

    if (onProjectAdded) {
      onProjectAdded(newProject);
    }
    onClose();
  };

  const handleLinkProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    updateProject(selectedProjectId, {
      CLIENT: currentClient.name,
      CLIENT_NAME: currentClient.name
    });

    const linked = projects.find(p => p.id === selectedProjectId || p.PROJECT_CODE === selectedProjectId);
    if (linked && onProjectAdded) {
      onProjectAdded({
        ...linked,
        CLIENT: currentClient.name,
        CLIENT_NAME: currentClient.name
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Add Project for Client
              </h3>
              <p className="text-xs text-purple-400 font-medium mt-0.5">
                Client / Employer: <span className="text-slate-200 font-bold">{currentClient.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client selector (if multiple clients exist) */}
        {clientsList.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Client / Employer
            </label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            >
              {clientsList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.contactPerson ? `(${c.contactPerson})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mode Selector Tabs: Create New vs Link Existing */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'create'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Create New Project
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              mode === 'link'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Link Existing Project
          </button>
        </div>

        {/* MODE 1: CREATE NEW PROJECT */}
        {mode === 'create' && (
          <form onSubmit={handleCreateProject} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Project Code / Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RDA-04, PIDM 27"
                  value={projectCode}
                  onChange={e => setProjectCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Project Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expressway Overpass Drainage System"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Site / Project Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mirigama Interchange / Colombo 02"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Active">Active (Ongoing Works)</option>
                  <option value="On Hold">On Hold (Pending Clearance)</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400 font-medium">
                    Contract Value (LKR)
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">2 Decimals Allowed</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 45,000,000.00"
                  value={contractValue}
                  onChange={e => setContractValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Supports 2 decimal precision (e.g. 45,000,000.50)</span>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-slate-400 font-medium">
                    Petty Cash Initial Float / Allowance (LKR)
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">2 Decimals Allowed</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 500,000.00"
                  value={pettyCashBudget}
                  onChange={e => setPettyCashBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Supports 2 decimal precision (e.g. 500,000.00)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Commencement Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Project Manager / Supervisor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Samantha Perera / Eng. Bandara"
                  value={projectManager}
                  onChange={e => setProjectManager(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">
                Contractual Remarks / BoQ Reference
              </label>
              <textarea
                rows={2}
                placeholder="e.g. FIDIC Red Book conditions, 10% retention, direct client billing"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Supporting Document Input */}
            <div className="pt-2 border-t border-slate-800">
              <SupportingDocumentUploadInput
                documents={supportingDocs}
                onDocumentsChange={setSupportingDocs}
                label="Supporting Contract / Award Letter"
                helperText="Attach client purchase order, award notification, or agreement (PDF/image)"
                categoryDefault="Project Award / Contract"
                allowMultiple={true}
                compact={true}
                idPrefix="new-client-project"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Project to {currentClient.name}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: LINK EXISTING PROJECT */}
        {mode === 'link' && (
          <form onSubmit={handleLinkProject} className="space-y-4 text-xs sm:text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Select an existing project from the company project registry to re-assign or link to{' '}
                <strong className="text-slate-200">{currentClient.name}</strong>.
              </p>
              <input
                type="text"
                placeholder="Search existing projects by code, name, or location..."
                value={linkSearchTerm}
                onChange={e => setLinkSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-purple-500 mb-3"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-800 rounded-xl p-2 bg-slate-950/40">
              {availableProjectsToLink.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <p className="text-xs">No matching projects available to link.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    All current projects are either already linked or no projects match your filter.
                  </p>
                </div>
              ) : (
                availableProjectsToLink.map(p => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProjectId === p.id
                        ? 'bg-purple-600/15 border-purple-500/60 text-slate-100 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedProject"
                      value={p.id}
                      checked={selectedProjectId === p.id}
                      onChange={() => setSelectedProjectId(p.id)}
                      className="mt-1 text-purple-600 focus:ring-purple-500 focus:ring-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-purple-400 text-xs">
                          {p.PROJECT_CODE}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {p.STATUS}
                        </span>
                      </div>
                      <p className="font-medium text-slate-100 truncate text-xs sm:text-sm mt-0.5">
                        {p.PROJECT_NAME}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        {p.LOCATION && <span>Loc: {p.LOCATION}</span>}
                        {p.CLIENT && <span>Current Client: {p.CLIENT}</span>}
                        {p.CONTRACT_VALUE ? (
                          <span className="font-mono text-emerald-400">
                            LKR {Number(p.CONTRACT_VALUE).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedProjectId}
                className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold shadow-lg shadow-purple-600/20 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Assign Selected Project to {currentClient.name}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
