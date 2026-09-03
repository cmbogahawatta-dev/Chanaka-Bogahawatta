import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Image as ImageIcon,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { Income, IncomeSource } from '../../types/pettyCashTypes';

export type IncomeModalType =
  | 'PETTY_CASH_TOPUP'
  | 'OTHER_INCOME';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (incomeId: string) => void;
  incomeToEdit?: Income | null;
  initialType?: IncomeModalType;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  incomeToEdit
}) => {
  const {
    supervisors,
    projects,
    addIncome,
    updateIncome,
    userRole,
    currentSupervisorName
  } = usePettyCash();

  const { navigateToModule } = useEnterprise();

  // Common dates
  const todayIso = new Date().toISOString().split('T')[0];

  // Petty Cash Top-up form states
  const [dateRef, setDateRef] = useState<string>(todayIso);
  const [supervisor, setSupervisor] = useState<string>(supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA');
  const [project, setProject] = useState<string>(projects[0]?.PROJECT_CODE || 'HEAD_OFFICE');
  const [incomeSource, setIncomeSource] = useState<IncomeSource>('Head Office Petty Cash Top-up');
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [proofDocument, setProofDocument] = useState<string>('');
  const [proofDocName, setProofDocName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submittedIncomeId, setSubmittedIncomeId] = useState<string | null>(null);

  // Initialize form when opening or editing
  useEffect(() => {
    if (!isOpen) return;

    if (incomeToEdit) {
      setDateRef(incomeToEdit.DATE || todayIso);
      setSupervisor(incomeToEdit.SUPERVISOR || supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA');
      setProject(incomeToEdit.PROJECT || projects[0]?.PROJECT_CODE || 'HEAD_OFFICE');
      setIncomeSource(incomeToEdit.INCOME_SOURCE || 'Head Office Petty Cash Top-up');
      setAmount(incomeToEdit.AMOUNT ? incomeToEdit.AMOUNT.toString() : '');
      setRemarks(incomeToEdit.REMARKS || '');
      setProofDocument(incomeToEdit.PROOF_DOCUMENT || '');
      setProofDocName(incomeToEdit.PROOF_DOCUMENT_NAME || '');
    } else {
      setDateRef(todayIso);
      const initialSup = currentSupervisorName || supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA';
      setSupervisor(initialSup);
      setProject(projects[0]?.PROJECT_CODE || 'HEAD_OFFICE');
      setIncomeSource('Head Office Petty Cash Top-up');
      setAmount('');
      setRemarks('');
      setProofDocument('');
      setProofDocName('');
      setError('');
      setSubmittedIncomeId(null);
    }
  }, [isOpen, incomeToEdit, supervisors, projects, todayIso, currentSupervisorName]);

  if (!isOpen) return null;

  // File Upload Handler (Bank slip / Deposit receipt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Proof image exceeds 5MB size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProofDocument(reader.result as string);
      setProofDocName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Submit Petty Cash Top-up
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive top-up amount.');
      return;
    }

    if (!supervisor) {
      setError('Please select a recipient supervisor for this float top-up.');
      return;
    }

    try {
      if (incomeToEdit) {
        // Edit existing record
        updateIncome(incomeToEdit.id, {
          DATE: dateRef,
          SUPERVISOR: supervisor,
          PROJECT: project,
          INCOME_SOURCE: incomeSource,
          AMOUNT: numericAmount,
          REMARKS: remarks.trim() || undefined,
          PROOF_DOCUMENT: proofDocument || undefined,
          PROOF_DOCUMENT_NAME: proofDocName || undefined
        });
        setSubmittedIncomeId(incomeToEdit.INCOME_ID || incomeToEdit.id);
      } else {
        // Create new Petty Cash Top-up
        const newRecord = addIncome({
          DATE: dateRef,
          SUPERVISOR: supervisor,
          PROJECT: project,
          INCOME_SOURCE: incomeSource,
          AMOUNT: numericAmount,
          REMARKS: remarks.trim() || 'Site petty cash float replenishment',
          PROOF_DOCUMENT: proofDocument || undefined,
          PROOF_DOCUMENT_NAME: proofDocName || undefined,
          TRANSACTION_TYPE: 'PETTY_CASH_TOPUP'
        });
        setSubmittedIncomeId(newRecord.INCOME_ID);
      }

      if (onSuccess && submittedIncomeId) {
        onSuccess(submittedIncomeId);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to save petty cash top-up.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                {incomeToEdit ? 'Edit Petty Cash Top-up' : 'Record Petty Cash Top-up'}
              </h2>
              <p className="text-xs text-slate-400">
                Disburse float replenishments and cash advances to site supervisors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice for Project Invoices & Client Payments */}
        <div className="bg-indigo-950/40 border-b border-indigo-900/40 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-300">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Looking for Project Invoices (Inc) & Client Payments?</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigateToModule('payments');
            }}
            className="text-indigo-300 hover:text-white font-bold underline ml-2 shrink-0"
          >
            Go to Finance & PRV
          </button>
        </div>

        {/* Success confirmation */}
        {submittedIncomeId ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Petty Cash Float Top-up Recorded!</h3>
            <p className="text-xs text-slate-400">
              Voucher <span className="font-mono font-bold text-emerald-400">{submittedIncomeId}</span> has been logged and credited to {supervisor}&apos;s cash balance.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Date & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Top-up Date *
                </label>
                <input
                  type="date"
                  value={dateRef}
                  onChange={(e) => setDateRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount (LKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                    LKR
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-3.5 py-2.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Supervisor & Project Allocation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Recipient Supervisor *
                </label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  required
                >
                  {supervisors.map((s) => (
                    <option key={s.SUPERVISOR_NAME} value={s.SUPERVISOR_NAME}>
                      {s.SUPERVISOR_NAME} {s.TELEPHONE ? `(${s.TELEPHONE})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Project Allocation *
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
                  required
                >
                  <option value="HEAD_OFFICE">HEAD_OFFICE - General Cash Float</option>
                  {projects.map((p) => (
                    <option key={p.PROJECT_CODE} value={p.PROJECT_CODE}>
                      {p.PROJECT_CODE} - {p.PROJECT_NAME}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Top-up Channel / Source */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Top-up Channel / Method *
              </label>
              <select
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value as IncomeSource)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="Head Office Petty Cash Top-up">Head Office Petty Cash Top-up</option>
                <option value="Direct Bank Transfer to Supervisor">Direct Bank Transfer to Supervisor Float</option>
                <option value="Cash Advance / Float Replenishment">Cash Advance / Float Replenishment</option>
                <option value="Bank Deposit Slip">Bank Deposit Slip (BOC / Commercial Bank)</option>
                <option value="Owner Advance">Owner Float Advance</option>
                <option value="Other Income / Float Adjustment">Other Float Adjustment</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Remarks / Float Purpose
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Float replenishment for week 36 site civil works"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Slip Proof Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Bank Deposit / Transfer Proof Slip (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Choose Image</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {proofDocName ? (
                  <span className="text-xs text-emerald-400 font-mono truncate max-w-[200px]">
                    {proofDocName}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">No slip chosen (max 5MB)</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{incomeToEdit ? 'Save Top-up Changes' : 'Record Petty Cash Top-up'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
