import React, { useState } from 'react';
import {
  X,
  FileText,
  Building2,
  Calendar,
  Save,
  DollarSign
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { Supplier, SupplierContract } from '../../types/supplierTypes';

interface SupplierContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  contractToEdit?: SupplierContract | null;
}

export const SupplierContractModal: React.FC<SupplierContractModalProps> = ({
  isOpen,
  onClose,
  supplier,
  contractToEdit
}) => {
  const { addContract } = useSupplier();
  const { projects } = usePettyCash();

  const [contractNumber, setContractNumber] = useState(
    contractToEdit?.contractNumber || `SC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [title, setTitle] = useState(contractToEdit?.contractTitle || contractToEdit?.title || '');
  const [projectCode, setProjectCode] = useState(contractToEdit?.projectCode || projects[0]?.PROJECT_CODE || 'PIDM 26');
  const [startDate, setStartDate] = useState(contractToEdit?.startDate || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    contractToEdit?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [contractValue, setContractValue] = useState<number>(contractToEdit?.contractValue || 10000000);
  const [retentionPercent, setRetentionPercent] = useState<number>(contractToEdit?.retentionPercent || 5);
  const [advancePercent, setAdvancePercent] = useState<number>(contractToEdit?.advancePercent || 0);
  const [scopeDescription, setScopeDescription] = useState(contractToEdit?.scope || contractToEdit?.scopeDescription || '');
  const [status, setStatus] = useState<SupplierContract['status']>(contractToEdit?.status || 'Active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNumber.trim() || !title.trim() || contractValue <= 0) {
      alert('Please fill contract number, title, and valid contract value.');
      return;
    }

    addContract(supplier.id, {
      contractNumber: contractNumber.trim(),
      contractTitle: title.trim(),
      projectCode,
      startDate,
      endDate,
      contractValue,
      currency: 'LKR',
      scope: scopeDescription.trim(),
      paymentTerms: 'Standard Retention & Progress Milestone',
      retentionPercent,
      advancePercent,
      status
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-800/80 flex items-center justify-center text-orange-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {contractToEdit ? 'Edit Contract' : 'Add Supplier Framework Contract'}
              </h3>
              <p className="text-xs text-slate-400">Supplier: {supplier.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contract Number <span className="text-rose-400">*</span></label>
              <input
                type="text"
                required
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contract Title / Agreement Scope <span className="text-rose-400">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Supply Agreement for Ready-Mix Concrete 2026-2027"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Allocated Project</label>
              <select
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Company-Wide / All Sites</option>
                {projects.map((p, idx) => (
                  <option key={`${p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>{p.PROJECT_CODE}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">End / Expiry Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Total Contract Value (LKR)</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={contractValue}
                onChange={(e) => setContractValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Advance %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Retention %</label>
              <input
                type="number"
                min="0"
                max="20"
                value={retentionPercent}
                onChange={(e) => setRetentionPercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Scope & Technical Specifications</label>
            <textarea
              rows={2}
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              placeholder="Supply of Grade 25, 30, and 35 concrete with batching reports, transit mixers and concrete pump..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Contract</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
