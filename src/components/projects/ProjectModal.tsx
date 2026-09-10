import React, { useState, useEffect, useMemo } from 'react';
import { X, FolderPlus, Edit3, Building2, MapPin, DollarSign, Calendar, User, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { Project } from '../../types/pettyCashTypes';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';

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
  const { addProject, updateProject, projects } = usePettyCash();
  const { clients, updateClient } = useEnterpriseCompany();

  const [projectCode, setProjectCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [client, setClient] = useState('');
  const [isCustomClient, setIsCustomClient] = useState(false);
  const [location, setLocation] = useState('');
  const [contractValue, setContractValue] = useState<string | number>('15000000.00');
  const [budgetPettyCash, setBudgetPettyCash] = useState<string | number>('2500000.00');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<'Active' | 'On Hold' | 'Completed' | 'Closed'>('Active');
  const [projectManager, setProjectManager] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Distinct Client List Options from EnterpriseCompanyContext & PettyCash Projects
  const clientOptions = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    // 1. From Registered Clients in EnterpriseCompanyContext
    clients.forEach(c => {
      const name = c.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    });

    // 2. From Existing Projects in PettyCash
    projects.forEach(p => {
      const cName = (p.CLIENT || p.CLIENT_NAME)?.trim();
      if (cName && !seen.has(cName.toLowerCase())) {
        seen.add(cName.toLowerCase());
        list.push(cName);
      }
    });

    // 3. Common Default Infrastructure Clients in Sri Lanka
    const defaults = [
      'Road Development Authority (RDA)',
      'Central Engineering Consultancy Bureau (CECB)',
      'Sri Lanka Ports Authority (SLPA)',
      'National Water Supply and Drainage Board (NWSDB)',
      'Urban Development Authority (UDA)',
      'Ceylon Electricity Board (CEB)',
      'Airport and Aviation Services (Sri Lanka) Ltd',
      'Ministry of Transport and Highways'
    ];

    defaults.forEach(d => {
      if (!seen.has(d.toLowerCase())) {
        seen.add(d.toLowerCase());
        list.push(d);
      }
    });

    return list;
  }, [clients, projects]);

  const matchedRegisteredClient = useMemo(() => {
    if (!client) return null;
    return clients.find(c => c.name?.trim().toLowerCase() === client.trim().toLowerCase()) || null;
  }, [client, clients]);

  const parseDecimalValue = (val: string | number): number => {
    if (typeof val === 'number') {
      return isNaN(val) ? 0 : Math.round(val * 100) / 100;
    }
    const clean = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  };

  const handleBlurContract = () => {
    if (contractValue !== '' && !isNaN(Number(contractValue))) {
      const parsed = parseFloat(String(contractValue));
      if (!isNaN(parsed)) {
        setContractValue(parsed.toFixed(2));
      }
    }
  };

  const handleBlurBudget = () => {
    if (budgetPettyCash !== '' && !isNaN(Number(budgetPettyCash))) {
      const parsed = parseFloat(String(budgetPettyCash));
      if (!isNaN(parsed)) {
        setBudgetPettyCash(parsed.toFixed(2));
      }
    }
  };

  useEffect(() => {
    if (projectToEdit) {
      const existingClient = projectToEdit.CLIENT || '';
      setProjectCode(projectToEdit.PROJECT_CODE || '');
      setProjectName(projectToEdit.PROJECT_NAME || '');
      setClient(existingClient);
      setLocation(projectToEdit.LOCATION || '');
      const rawContract = projectToEdit.CONTRACT_VALUE ?? 0;
      setContractValue(rawContract !== undefined && rawContract !== null ? String(rawContract) : '0');
      const rawBudget = projectToEdit.BUDGET_PETTY_CASH ?? projectToEdit.BUDGET ?? 0;
      setBudgetPettyCash(rawBudget !== undefined && rawBudget !== null ? String(rawBudget) : '0');
      setStartDate(projectToEdit.START_DATE || new Date().toISOString().slice(0, 10));
      setEndDate(projectToEdit.END_DATE || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setStatus(projectToEdit.STATUS || 'Active');
      setProjectManager(projectToEdit.PROJECT_MANAGER || '');
      setRemarks(projectToEdit.REMARKS || '');

      if (existingClient && !clientOptions.some(opt => opt.toLowerCase() === existingClient.toLowerCase())) {
        setIsCustomClient(true);
      } else {
        setIsCustomClient(false);
      }
    } else {
      setProjectCode('');
      setProjectName('');
      const defaultClient = clientOptions[0] || 'Road Development Authority (RDA)';
      setClient(defaultClient);
      setIsCustomClient(false);
      setLocation('');
      setContractValue('15000000.00');
      setBudgetPettyCash('2500000.00');
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setStatus('Active');
      setProjectManager('');
      setRemarks('');
    }
    setError(null);
  }, [projectToEdit, isOpen, clientOptions]);

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

    const parsedContract = parseDecimalValue(contractValue);
    const parsedBudget = parseDecimalValue(budgetPettyCash);

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        PROJECT_CODE: projectCode.trim().toUpperCase(),
        PROJECT_NAME: projectName.trim(),
        CLIENT: client.trim(),
        LOCATION: location.trim(),
        CONTRACT_VALUE: parsedContract,
        BUDGET_PETTY_CASH: parsedBudget,
        BUDGET: parsedBudget,
        budget: parsedBudget,
        START_DATE: startDate,
        END_DATE: endDate,
        STATUS: status,
        PROJECT_MANAGER: projectManager.trim() || 'Site Resident Engineer',
        REMARKS: remarks.trim()
      });

      if (matchedRegisteredClient) {
        const currentIds = matchedRegisteredClient.assignedProjectIds || [];
        if (!currentIds.includes(projectToEdit.id)) {
          updateClient(matchedRegisteredClient.id, {
            assignedProjectIds: [...currentIds, projectToEdit.id]
          });
        }
      }
    } else {
      const created = addProject({
        PROJECT_CODE: projectCode.trim().toUpperCase(),
        PROJECT_NAME: projectName.trim(),
        CLIENT: client.trim(),
        LOCATION: location.trim(),
        CONTRACT_VALUE: parsedContract,
        BUDGET_PETTY_CASH: parsedBudget,
        BUDGET: parsedBudget,
        budget: parsedBudget,
        START_DATE: startDate,
        END_DATE: endDate,
        STATUS: status,
        PROJECT_MANAGER: projectManager.trim() || 'Site Resident Engineer',
        REMARKS: remarks.trim()
      });

      if (matchedRegisteredClient && created) {
        const currentIds = matchedRegisteredClient.assignedProjectIds || [];
        if (!currentIds.includes(created.id)) {
          updateClient(matchedRegisteredClient.id, {
            assignedProjectIds: [...currentIds, created.id]
          });
        }
      }
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
            {/* Client / Authority */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Client / Authority <span className="text-rose-400">*</span>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomClient(!isCustomClient);
                    if (isCustomClient && !client && clientOptions.length > 0) {
                      setClient(clientOptions[0]);
                    }
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline underline-offset-2 flex items-center gap-1 transition-colors"
                  tabIndex={-1}
                >
                  {isCustomClient ? 'Select from Client List' : '+ Type Custom Client'}
                </button>
              </div>

              {!isCustomClient ? (
                <div className="relative">
                  <select
                    id="project-client-dropdown"
                    required
                    value={client}
                    onChange={e => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomClient(true);
                        setClient('');
                      } else {
                        setClient(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 appearance-none pr-9 cursor-pointer text-xs"
                  >
                    <option value="" disabled>
                      -- Select Client from Client List ({clientOptions.length} available) --
                    </option>
                    {clientOptions.map(cliName => (
                      <option key={cliName} value={cliName}>
                        {cliName}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Type Custom / Unlisted Client...</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Road Development Authority (RDA)"
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomClient(false);
                      if (!client && clientOptions.length > 0) {
                        setClient(clientOptions[0]);
                      }
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium whitespace-nowrap transition-colors border border-slate-700"
                    title="Switch to Client List dropdown"
                  >
                    Client List
                  </button>
                </div>
              )}

              {/* Registered Client link indicator */}
              {matchedRegisteredClient && (
                <p className="mt-1 text-[10px] text-purple-400/90 truncate flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>
                    Linked to Client Directory: {matchedRegisteredClient.contactPerson || matchedRegisteredClient.industry || 'Registered Client'}
                  </span>
                </p>
              )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold text-xs sm:text-sm">Contract Total Value (LKR)</label>
                <span className="text-[10px] text-purple-400 font-medium">2 Decimals Allowed</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={contractValue}
                onChange={e => setContractValue(e.target.value)}
                onBlur={handleBlurContract}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Supports decimal values (e.g. 15000000.50)</span>
            </div>

            {/* Petty Cash Budget */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300 font-semibold text-xs sm:text-sm">Petty Cash Allocation (LKR)</label>
                <span className="text-[10px] text-emerald-400 font-medium">2 Decimals Allowed</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={budgetPettyCash}
                onChange={e => setBudgetPettyCash(e.target.value)}
                onBlur={handleBlurBudget}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Site petty cash allowance limit (e.g. 500000.00)</span>
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
