import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Calendar, User, Building, Tag, DollarSign, FileText, Image as ImageIcon, AlertTriangle, AlertOctagon, ShieldAlert, Percent } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Expense, TransactionType, VatTreatment } from '../../types/pettyCashTypes';
import { VAT_RATE, calculateVat, formatLkr } from '../../utils/vatCalculations';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (expenseId: string) => void;
  expenseToEdit?: Expense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit
}) => {
  const {
    supervisors,
    projects,
    categories,
    currentSupervisorName,
    userRole,
    addExpense,
    updateExpense,
    checkBudgetImpact
  } = usePettyCash();

  // Form State
  const todayIso = new Date().toISOString().split('T')[0];
  const [dateRef, setDateRef] = useState<string>(todayIso);
  const [supervisor, setSupervisor] = useState<string>(
    userRole === 'SUPERVISOR' ? currentSupervisorName : supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA'
  );
  const [project, setProject] = useState<string>(projects[0]?.PROJECT_CODE || 'PIDM 26');
  const [category, setCategory] = useState<string>(categories[0]?.CATEGORY_NAME || '5000 Construction Materials');
  const [transactionType, setTransactionType] = useState<TransactionType>('PETTY_CASH_EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>('EXCLUDING_VAT');
  const [description, setDescription] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [proofDocument, setProofDocument] = useState<string>('');
  const [proofDocName, setProofDocName] = useState<string>('');
  const [supervisorConfirmedThreshold, setSupervisorConfirmedThreshold] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [submittedExpenseId, setSubmittedExpenseId] = useState<string | null>(null);

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;

  // Real-time VAT Breakdown calculation
  const vatBreakdown = useMemo(() => {
    return calculateVat(numericAmount, vatTreatment, VAT_RATE);
  }, [numericAmount, vatTreatment]);

  // Real-time project budget impact calculation
  const budgetImpact = useMemo(() => {
    return checkBudgetImpact(project, vatBreakdown.grossAmount);
  }, [project, vatBreakdown.grossAmount, checkBudgetImpact]);

  useEffect(() => {
    if (expenseToEdit) {
      setDateRef(expenseToEdit.DATE_REF || todayIso);
      setSupervisor(expenseToEdit.SUPERVISOR || (userRole === 'SUPERVISOR' ? currentSupervisorName : supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA'));
      setProject(expenseToEdit.PROJECT || projects[0]?.PROJECT_CODE || 'PIDM 26');
      setCategory(expenseToEdit.EXPENSES_CATEGORY || categories[0]?.CATEGORY_NAME || '5000 Construction Materials');
      setTransactionType(expenseToEdit.TRANSACTION_TYPE || 'PETTY_CASH_EXPENSE');
      setAmount(expenseToEdit.AMOUNT ? expenseToEdit.AMOUNT.toString() : '');
      setVatTreatment(expenseToEdit.vatTreatment || (expenseToEdit.vatApplicable ? 'EXCLUDING_VAT' : 'VAT_NOT_APPLICABLE'));
      setDescription(expenseToEdit.EXPENSES_DESCRIPTION || '');
      setRemarks(expenseToEdit.REMARKS || '');
      setProofDocument(expenseToEdit.PROOF_DOCUMENT || '');
      setProofDocName(expenseToEdit.PROOF_DOCUMENT_NAME || '');
      setSupervisorConfirmedThreshold(false);
      setError('');
    } else {
      setDateRef(todayIso);
      setSupervisor(userRole === 'SUPERVISOR' ? currentSupervisorName : supervisors[0]?.SUPERVISOR_NAME || 'BUDDIKA');
      setProject(projects[0]?.PROJECT_CODE || 'PIDM 26');
      setCategory(categories[0]?.CATEGORY_NAME || '5000 Construction Materials');
      setTransactionType('PETTY_CASH_EXPENSE');
      setAmount('');
      setVatTreatment('EXCLUDING_VAT');
      setDescription('');
      setRemarks('');
      setProofDocument('');
      setProofDocName('');
      setSupervisorConfirmedThreshold(false);
      setError('');
    }
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  // Format date to DD/MM/YYYY
  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
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

    if (!description.trim()) {
      setError('Please enter an expense description.');
      return;
    }

    if (!supervisor) {
      setError('Please select a supervisor.');
      return;
    }

    if (!project) {
      setError('Please select a project.');
      return;
    }

    if (!category) {
      setError('Please select an expense category.');
      return;
    }

    try {
      const displayDate = formatDateDisplay(dateRef);
      const selectedSupObj = supervisors.find(s =>
        s.SUPERVISOR_NAME.trim().toUpperCase() === supervisor.trim().toUpperCase() ||
        s.id === supervisor ||
        s.SUPERVISOR_ID === supervisor ||
        s.employeeCode === supervisor ||
        s.staffId === supervisor
      );
      const supId = selectedSupObj?.staffId || selectedSupObj?.id || selectedSupObj?.employeeCode || supervisor;
      const supName = selectedSupObj?.SUPERVISOR_NAME || supervisor;

      if (expenseToEdit) {
        updateExpense(expenseToEdit.id, {
          DATE_REF: dateRef,
          DATE: displayDate,
          SUPERVISOR: supName,
          SUPERVISOR_ID: supId,
          PROJECT: project,
          EXPENSES_CATEGORY: category,
          TRANSACTION_TYPE: transactionType,
          AMOUNT: numericAmount,
          vatTreatment,
          vatRate: vatTreatment === 'VAT_NOT_APPLICABLE' ? 0 : VAT_RATE,
          netAmount: vatBreakdown.netAmount,
          vatAmount: vatBreakdown.vatAmount,
          grossAmount: vatBreakdown.grossAmount,
          vatApplicable: vatBreakdown.vatApplicable,
          EXPENSES_DESCRIPTION: description.trim(),
          PROOF_DOCUMENT: proofDocument || undefined,
          PROOF_DOCUMENT_NAME: proofDocName || undefined,
          REMARKS: remarks.trim() || undefined
        });
        if (onSuccess) onSuccess(expenseToEdit.EXPENSES_ID);
        onClose();
      } else {
        const newExp = addExpense({
          DATE_REF: dateRef,
          DATE: displayDate,
          SUPERVISOR: supName,
          SUPERVISOR_ID: supId,
          PROJECT: project,
          EXPENSES_CATEGORY: category,
          TRANSACTION_TYPE: transactionType,
          AMOUNT: numericAmount,
          vatTreatment,
          vatRate: vatTreatment === 'VAT_NOT_APPLICABLE' ? 0 : VAT_RATE,
          netAmount: vatBreakdown.netAmount,
          vatAmount: vatBreakdown.vatAmount,
          grossAmount: vatBreakdown.grossAmount,
          vatApplicable: vatBreakdown.vatApplicable,
          EXPENSES_DESCRIPTION: description.trim(),
          PAYMENT_STATUS: userRole === 'ADMIN' || userRole === 'FINANCE' ? 'Approved' : 'Pending',
          PROOF_DOCUMENT: proofDocument || undefined,
          PROOF_DOCUMENT_NAME: proofDocName || undefined,
          CREATED_BY: `${supName.toLowerCase()}@company.com`,
          REMARKS: remarks.trim() || undefined
        });

        setSubmittedExpenseId(newExp.EXPENSES_ID);
        if (onSuccess) onSuccess(newExp.EXPENSES_ID);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit expense.');
    }
  };

  const handleResetAndClose = () => {
    setSubmittedExpenseId(null);
    setAmount('');
    setDescription('');
    setRemarks('');
    setProofDocument('');
    setProofDocName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{expenseToEdit ? 'Edit Site Expense' : 'Add Site Expense'}</h3>
              <p className="text-xs text-slate-400">{expenseToEdit ? `Updating voucher ${expenseToEdit.EXPENSES_ID}` : 'Direct entry to Google Sheets Petty Cash database'}</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {submittedExpenseId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-100">Expense Recorded Successfully!</h4>
              <p className="text-xs text-slate-400 mt-1">Transaction written to Google Sheets with tracking ID:</p>
              <div className="mt-2 font-mono text-sm font-bold bg-slate-950 border border-emerald-800 text-emerald-300 py-1.5 px-3 rounded-lg inline-block">
                {submittedExpenseId}
              </div>
            </div>
            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSubmittedExpenseId(null);
                  setAmount('');
                  setDescription('');
                  setRemarks('');
                  setProofDocument('');
                  setProofDocName('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Add Another Expense
              </button>
              <button
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Done & View List
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

            {/* Date and Supervisor Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Transaction Date *
                </label>
                <div className="relative">
                  <input
                    id="add-expense-date-input"
                    type="date"
                    required
                    value={dateRef}
                    onChange={(e) => setDateRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Supervisor *
                </label>
                <select
                  id="add-expense-supervisor-select"
                  disabled={userRole === 'SUPERVISOR'}
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 disabled:opacity-75"
                >
                  {supervisors.map(s => (
                    <option key={s.id} value={s.SUPERVISOR_NAME}>
                      {s.employeeCode || s.SUPERVISOR_ID} — {s.FULL_NAME || s.SUPERVISOR_NAME}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Project Code *
                </label>
                <select
                  id="add-expense-project-select"
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.PROJECT_CODE}>
                      {p.PROJECT_CODE} - {p.PROJECT_NAME.slice(0, 24)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Expense Category *
                </label>
                <select
                  id="add-expense-category-select"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.CATEGORY_NAME}>
                      {c.CATEGORY_NAME}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount in LKR */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Input Amount (LKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400 font-mono">
                  LKR
                </span>
                <input
                  id="add-expense-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 100000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-14 pr-3 py-2.5 text-sm font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* VAT Treatment Selection (Standard 18% VAT) */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VAT Treatment</span>
                </label>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  Standard Rate: {VAT_RATE}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  id="expense-vat-excluding"
                  onClick={() => setVatTreatment('EXCLUDING_VAT')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    vatTreatment === 'EXCLUDING_VAT'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">Excluding VAT</p>
                  <p className="text-[10px] opacity-75 mt-0.5">+18% VAT on top</p>
                </button>

                <button
                  type="button"
                  id="expense-vat-including"
                  onClick={() => setVatTreatment('INCLUDING_VAT')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    vatTreatment === 'INCLUDING_VAT'
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">Including VAT</p>
                  <p className="text-[10px] opacity-75 mt-0.5">18% extracted (18/118)</p>
                </button>

                <button
                  type="button"
                  id="expense-vat-none"
                  onClick={() => setVatTreatment('VAT_NOT_APPLICABLE')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    vatTreatment === 'VAT_NOT_APPLICABLE'
                      ? 'bg-slate-800 border-slate-500 text-slate-200 ring-1 ring-slate-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">Not Applicable</p>
                  <p className="text-[10px] opacity-75 mt-0.5">0% VAT (Exempt)</p>
                </button>
              </div>

              {/* Real-time Calculation Breakdown Box */}
              {numericAmount > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center bg-slate-900/60 p-2 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Net Amount</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {formatLkr(vatBreakdown.netAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-medium">
                      VAT ({vatTreatment === 'VAT_NOT_APPLICABLE' ? '0%' : '18%'})
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatLkr(vatBreakdown.vatAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-400 block font-medium">Gross Total</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {formatLkr(vatBreakdown.grossAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Expense Description / Purpose *
              </label>
              <textarea
                id="add-expense-description-input"
                required
                rows={2}
                placeholder="Details of materials, labour, fuel, or repairs purchased on site..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Internal Remarks / Reference
              </label>
              <input
                id="add-expense-remarks-input"
                type="text"
                placeholder="e.g. Bill #4912, checked with site engineer"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Proof Document / Receipt Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Proof Document / Receipt Photo
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 text-center bg-slate-950 transition-colors">
                {proofDocument ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs text-slate-200 truncate max-w-[200px]">
                        {proofDocName || 'Attached Receipt Image'}
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
                      htmlFor="expense-proof-file-input"
                      className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Upload receipt, invoice or voucher
                    </label>
                    <input
                      id="expense-proof-file-input"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, PDF receipts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Project Budget Threshold Alert Notification */}
            {budgetImpact.allocatedBudget > 0 && (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  budgetImpact.projectedThreshold === 'OVER_BUDGET'
                    ? 'bg-rose-950/40 border-rose-700/80 shadow-md shadow-rose-950/20'
                    : budgetImpact.projectedThreshold === 'CRITICAL_95'
                    ? 'bg-orange-950/40 border-orange-700/80 shadow-md shadow-orange-950/20'
                    : budgetImpact.projectedThreshold === 'WARNING_80'
                    ? 'bg-amber-950/40 border-amber-700/80 shadow-md shadow-amber-950/20'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {budgetImpact.projectedThreshold === 'OVER_BUDGET' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                    ) : budgetImpact.projectedThreshold === 'CRITICAL_95' ? (
                      <AlertOctagon className="w-4 h-4 text-orange-400 animate-pulse" />
                    ) : budgetImpact.projectedThreshold === 'WARNING_80' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {budgetImpact.projectedThreshold === 'OVER_BUDGET'
                          ? '🚨 Budget Exceeded Warning'
                          : budgetImpact.projectedThreshold === 'CRITICAL_95'
                          ? '⚠️ 95% Critical Budget Threshold'
                          : budgetImpact.projectedThreshold === 'WARNING_80'
                          ? '⚡ 80% Budget Threshold Warning'
                          : 'Petty Cash Budget Status'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {budgetImpact.projectedPercent.toFixed(1)}% Projected
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden my-1.5 border border-slate-800 relative">
                      <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-amber-400/60" />
                      <div className="absolute top-0 bottom-0 left-[95%] w-0.5 bg-orange-400/60" />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          budgetImpact.projectedThreshold === 'OVER_BUDGET'
                            ? 'bg-rose-500'
                            : budgetImpact.projectedThreshold === 'CRITICAL_95'
                            ? 'bg-orange-500'
                            : budgetImpact.projectedThreshold === 'WARNING_80'
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, budgetImpact.projectedPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Spent: LKR {budgetImpact.projectedSpent.toLocaleString()}</span>
                      <span>Budget: LKR {budgetImpact.allocatedBudget.toLocaleString()}</span>
                      <span className={budgetImpact.remainingBudget <= 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        Buffer: LKR {budgetImpact.remainingBudget.toLocaleString()}
                      </span>
                    </div>

                    {budgetImpact.message && (
                      <p className="text-[11px] mt-1 text-slate-300 font-medium leading-tight">
                        {budgetImpact.message}
                      </p>
                    )}

                    {(budgetImpact.projectedThreshold === 'CRITICAL_95' || budgetImpact.projectedThreshold === 'OVER_BUDGET') && (
                      <label className="mt-2 flex items-center gap-2 cursor-pointer pt-1.5 border-t border-slate-800">
                        <input
                          type="checkbox"
                          checked={supervisorConfirmedThreshold}
                          onChange={(e) => setSupervisorConfirmedThreshold(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-[11px] font-semibold text-amber-300">
                          Supervisor Acknowledgment: I confirm this project budget threshold impact.
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-submit-add-expense"
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {expenseToEdit ? 'Save Changes' : 'Submit Expense'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
