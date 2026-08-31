import React, { useState, useEffect } from 'react';
import { X, DollarSign, Upload, CheckCircle2, AlertCircle, Building, User, FileText, Image as ImageIcon } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Income, IncomeSource } from '../../types/pettyCashTypes';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (incomeId: string) => void;
  incomeToEdit?: Income | null;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  incomeToEdit
}) => {
  const { supervisors, projects, addIncome, updateIncome } = usePettyCash();

  const todayIso = new Date().toISOString().split('T')[0];
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

  useEffect(() => {
    if (incomeToEdit) {
      setDateRef(incomeToEdit.DATE_REF || todayIso);
      setSupervisor(incomeToEdit.SUPERVISOR || supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA');
      setProject(incomeToEdit.PROJECT || projects[0]?.PROJECT_CODE || 'HEAD_OFFICE');
      setIncomeSource(incomeToEdit.INCOME_SOURCE || 'Head Office Petty Cash Top-up');
      setAmount(incomeToEdit.AMOUNT ? incomeToEdit.AMOUNT.toString() : '');
      setRemarks(incomeToEdit.REMARKS || '');
      setProofDocument(incomeToEdit.PROOF_DOCUMENT || '');
      setProofDocName(incomeToEdit.PROOF_DOCUMENT_NAME || '');
      setError('');
    } else {
      setDateRef(todayIso);
      setSupervisor(supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA');
      setProject(projects[0]?.PROJECT_CODE || 'HEAD_OFFICE');
      setIncomeSource('Head Office Petty Cash Top-up');
      setAmount('');
      setRemarks('');
      setProofDocument('');
      setProofDocName('');
      setError('');
    }
  }, [incomeToEdit, isOpen]);

  if (!isOpen) return null;

  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofDocName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setProofDocument(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive LKR amount.');
      return;
    }

    try {
      const displayDate = formatDateDisplay(dateRef);
      if (incomeToEdit) {
        updateIncome(incomeToEdit.id, {
          DATE_REF: dateRef,
          DATE: displayDate,
          SUPERVISOR: supervisor,
          PROJECT: project,
          INCOME_SOURCE: incomeSource,
          AMOUNT: numericAmount,
          PROOF_DOCUMENT: proofDocument || undefined,
          PROOF_DOCUMENT_NAME: proofDocName || undefined,
          REMARKS: remarks.trim() || undefined
        });
        if (onSuccess) onSuccess(incomeToEdit.INCOME_ID);
        onClose();
      } else {
        const newInc = addIncome({
          DATE_REF: dateRef,
          DATE: displayDate,
          SUPERVISOR: supervisor,
          PROJECT: project,
          INCOME_SOURCE: incomeSource,
          AMOUNT: numericAmount,
          PROOF_DOCUMENT: proofDocument || undefined,
          PROOF_DOCUMENT_NAME: proofDocName || undefined,
          CREATED_BY: 'finance@company.com',
          REMARKS: remarks.trim() || undefined
        });

        setSubmittedIncomeId(newInc.INCOME_ID);
        if (onSuccess) onSuccess(newInc.INCOME_ID);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit income.');
    }
  };

  const handleResetAndClose = () => {
    setSubmittedIncomeId(null);
    setAmount('');
    setRemarks('');
    setProofDocument('');
    setProofDocName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{incomeToEdit ? 'Edit Income / Cash Top-up' : 'Add Income / Cash Top-up'}</h3>
              <p className="text-xs text-slate-400">{incomeToEdit ? `Updating income voucher ${incomeToEdit.INCOME_ID}` : 'Record cash float top-up to supervisor or project'}</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedIncomeId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-100">Income / Top-up Recorded!</h4>
              <p className="text-xs text-slate-400 mt-1">Supervisor petty cash balance has been credited with ID:</p>
              <div className="mt-2 font-mono text-sm font-bold bg-slate-950 border border-emerald-800 text-emerald-300 py-1.5 px-3 rounded-lg inline-block">
                {submittedIncomeId}
              </div>
            </div>
            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSubmittedIncomeId(null);
                  setAmount('');
                  setRemarks('');
                  setProofDocument('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Add Another
              </button>
              <button
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  required
                  value={dateRef}
                  onChange={(e) => setDateRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Receiving Supervisor *
                </label>
                <select
                  required
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.SUPERVISOR_NAME}>
                      {s.SUPERVISOR_NAME}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Income Source *
                </label>
                <select
                  required
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value as IncomeSource)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Head Office Petty Cash Top-up">Head Office Petty Cash Top-up</option>
                  <option value="Commercial Bank Transfer">Commercial Bank Transfer</option>
                  <option value="Sampath Bank Cheque">Sampath Bank Cheque</option>
                  <option value="BOC Cash Advance">BOC Cash Advance</option>
                  <option value="Client Direct Advance">Client Direct Advance</option>
                  <option value="Scrap & Salvage Sale">Scrap & Salvage Sale</option>
                  <option value="Other Reimbursement">Other Reimbursement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Project Code *
                </label>
                <select
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="HEAD_OFFICE">HEAD_OFFICE - Central Treasury</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.PROJECT_CODE}>
                      {p.PROJECT_CODE} - {p.PROJECT_NAME.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Amount in Sri Lankan Rupees (LKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                  LKR
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 50000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-14 pr-3 py-2.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Remarks / Bank Reference / Voucher Details
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cheque #89124 issued for site emergency float..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Bank Slip / Deposit Slip Image
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center bg-slate-950 transition-colors">
                {proofDocument ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs text-slate-200 truncate max-w-[200px]">
                        {proofDocName || 'Bank Slip Attached'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProofDocument('');
                        setProofDocName('');
                      }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <label
                      htmlFor="income-proof-file-input"
                      className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Upload bank deposit slip / voucher
                    </label>
                    <input
                      id="income-proof-file-input"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {incomeToEdit ? 'Save Changes' : 'Record Income / Top-up'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
