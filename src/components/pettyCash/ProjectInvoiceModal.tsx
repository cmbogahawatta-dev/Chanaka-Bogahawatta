import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Percent,
  CreditCard,
  Hash,
  Clock
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { Income, InvoicePaymentStatus, VatTreatment } from '../../types/pettyCashTypes';
import { VAT_RATE, calculateVat, formatLkr, round2 } from '../../utils/vatCalculations';

export interface ProjectInvoiceFormProps {
  onClose: () => void;
  onSuccess?: (invoiceId: string) => void;
  invoiceToEdit?: Income | null;
  mode?: 'standalone' | 'income';
}

export const ProjectInvoiceForm: React.FC<ProjectInvoiceFormProps> = ({
  onClose,
  onSuccess,
  invoiceToEdit,
  mode = 'standalone'
}) => {
  const {
    projects,
    supervisors,
    addIncome,
    updateIncome,
    generateNextInvoiceNumber,
    isInvoiceNumberTaken,
    currentSupervisorName
  } = usePettyCash();

  const todayIso = new Date().toISOString().split('T')[0];
  const in30DaysIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Form Fields
  const [projectCode, setProjectCode] = useState<string>(projects[0]?.PROJECT_CODE || 'PIDM 26');
  const [clientName, setClientName] = useState<string>('National Water Supply & Drainage Board');
  const [clientCode, setClientCode] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(todayIso);
  const [dueDate, setDueDate] = useState<string>(in30DaysIso);
  const [billingDescription, setBillingDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>('EXCLUDING_VAT');
  const [vatRate] = useState<number>(VAT_RATE);

  // Payment Tracking
  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>('Approved');
  const [amountReceivedInput, setAmountReceivedInput] = useState<string>('0');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [proofDocument, setProofDocument] = useState<string>('');
  const [proofDocName, setProofDocName] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [submittedInvoiceId, setSubmittedInvoiceId] = useState<string | null>(null);

  // Auto-fill client name and code when project selection changes
  const selectedProjectObj = useMemo(() => {
    return projects.find(p => p.PROJECT_CODE.toUpperCase() === projectCode.toUpperCase());
  }, [projects, projectCode]);

  useEffect(() => {
    if (selectedProjectObj) {
      const detectedClient = (selectedProjectObj as any).CLIENT_NAME ||
        (selectedProjectObj as any).CLIENT ||
        (selectedProjectObj as any).client ||
        (selectedProjectObj.PROJECT_CODE.includes('PIDM') ? 'National Water Supply & Drainage Board' :
         selectedProjectObj.PROJECT_CODE.includes('CBO') ? 'Colombo Municipal Council' :
         selectedProjectObj.PROJECT_CODE.includes('KDR') ? 'Road Development Authority' : 'Enterprise Client');
      setClientName(detectedClient);

      const detectedCode = (selectedProjectObj as any).CLIENT_CODE || (selectedProjectObj as any).clientCode || '';
      if (detectedCode) {
        setClientCode(detectedCode);
      }
    }
  }, [selectedProjectObj]);

  // Numeric Calculations
  const numericInputAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const vatBreakdown = useMemo(() => {
    return calculateVat(numericInputAmount, vatTreatment, vatRate);
  }, [numericInputAmount, vatTreatment, vatRate]);

  const grossTotal = vatBreakdown.grossAmount;
  const numericReceived = parseFloat(amountReceivedInput.replace(/,/g, '')) || 0;
  const balanceDue = round2(Math.max(0, grossTotal - numericReceived));

  // Initialize or Reset
  useEffect(() => {
    if (invoiceToEdit) {
      setProjectCode(invoiceToEdit.PROJECT || projects[0]?.PROJECT_CODE || 'PIDM 26');
      setClientName(invoiceToEdit.clientName || 'National Water Supply & Drainage Board');
      setClientCode(invoiceToEdit.clientCode || '');
      setInvoiceNumber(invoiceToEdit.invoiceNumber || invoiceToEdit.INCOME_ID || '');
      setInvoiceDate(invoiceToEdit.invoiceDate || invoiceToEdit.DATE_REF || todayIso);
      setDueDate(invoiceToEdit.dueDate || in30DaysIso);
      setBillingDescription(invoiceToEdit.billingDescription || invoiceToEdit.invoiceDescription || invoiceToEdit.REMARKS || '');
      setAmount(invoiceToEdit.netAmount ? invoiceToEdit.netAmount.toString() : (invoiceToEdit.AMOUNT ? invoiceToEdit.AMOUNT.toString() : ''));
      setVatTreatment(invoiceToEdit.vatTreatment || 'EXCLUDING_VAT');
      setPaymentStatus(invoiceToEdit.paymentStatus || 'Approved');
      setAmountReceivedInput(invoiceToEdit.amountReceived !== undefined ? invoiceToEdit.amountReceived.toString() : '0');
      setPaymentDate(invoiceToEdit.paymentDate || '');
      setPaymentReference(invoiceToEdit.paymentReference || '');
      setRemarks(invoiceToEdit.REMARKS || '');
      setProofDocument(invoiceToEdit.PROOF_DOCUMENT || '');
      setProofDocName(invoiceToEdit.PROOF_DOCUMENT_NAME || '');
      setError('');
      setSubmittedInvoiceId(null);
    } else {
      const defaultProj = projects[0]?.PROJECT_CODE || 'PIDM 26';
      setProjectCode(defaultProj);
      setInvoiceNumber(generateNextInvoiceNumber());
      setInvoiceDate(todayIso);
      setDueDate(in30DaysIso);
      setBillingDescription('');
      setAmount('');
      setVatTreatment('EXCLUDING_VAT');
      setPaymentStatus('Approved');
      setAmountReceivedInput('0');
      setPaymentDate('');
      setPaymentReference('');
      setRemarks('');
      setProofDocument('');
      setProofDocName('');
      setError('');
      setSubmittedInvoiceId(null);
    }
  }, [invoiceToEdit, projects, generateNextInvoiceNumber]);

  // Quick Auto Generate Invoice Number
  const handleAutoGenerateInvoiceNumber = () => {
    const nextNum = generateNextInvoiceNumber();
    setInvoiceNumber(nextNum);
  };

  // Synchronize Payment Status and Received Amount
  const handleReceivedChange = (val: string) => {
    setAmountReceivedInput(val);
    const num = parseFloat(val.replace(/,/g, '')) || 0;
    if (num >= grossTotal && grossTotal > 0) {
      setPaymentStatus('Paid');
      if (!paymentDate) setPaymentDate(todayIso);
    } else if (num > 0) {
      setPaymentStatus('Partially Paid');
      if (!paymentDate) setPaymentDate(todayIso);
    } else {
      if (paymentStatus === 'Paid' || paymentStatus === 'Partially Paid') {
        setPaymentStatus('Approved');
      }
    }
  };

  const handleStatusChange = (status: InvoicePaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'Paid') {
      setAmountReceivedInput(grossTotal.toString());
      if (!paymentDate) setPaymentDate(todayIso);
    } else if (status === 'Draft' || status === 'Submitted' || status === 'Approved') {
      if (parseFloat(amountReceivedInput) >= grossTotal && grossTotal > 0) {
        setAmountReceivedInput('0');
      }
    }
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

    const trimmedInvoiceNum = invoiceNumber.trim().toUpperCase();
    if (!trimmedInvoiceNum) {
      setError('Invoice number is mandatory.');
      return;
    }

    // Unique check
    const currentEditId = invoiceToEdit?.id;
    if (isInvoiceNumberTaken(trimmedInvoiceNum, currentEditId)) {
      setError(`Invoice number "${trimmedInvoiceNum}" is already registered in the system. Please use a unique invoice number.`);
      return;
    }

    if (numericInputAmount <= 0) {
      setError('Please enter a valid positive billing amount.');
      return;
    }

    if (!billingDescription.trim()) {
      setError('Please specify billing description, milestone or certified work scope (e.g. IPC No. 05 - Progress Payment Certificate).');
      return;
    }

    if (numericReceived > grossTotal) {
      setError(`Amount received (LKR ${formatLkr(numericReceived)}) cannot exceed Gross Invoice Total (LKR ${formatLkr(grossTotal)}).`);
      return;
    }

    try {
      const displayDate = invoiceDate.split('-').reverse().join('/');
      const selectedSupObj = supervisors.find(s =>
        s.SUPERVISOR_NAME.toUpperCase() === currentSupervisorName.toUpperCase()
      ) || supervisors[0];
      const supName = selectedSupObj?.SUPERVISOR_NAME || 'HEAD OFFICE';
      const supId = selectedSupObj?.staffId || selectedSupObj?.id || selectedSupObj?.employeeCode || 'HO-001';

      // Automated status determination if user hasn't chosen a terminal state
      let computedStatus = paymentStatus;
      if (paymentStatus !== 'Cancelled' && paymentStatus !== 'Draft') {
        if (numericReceived >= grossTotal && grossTotal > 0) {
          computedStatus = 'Paid';
        } else if (numericReceived > 0 && numericReceived < grossTotal) {
          computedStatus = 'Partially Paid';
        } else if (dueDate < todayIso && balanceDue > 0) {
          computedStatus = 'Overdue';
        } else if (paymentStatus !== 'Submitted') {
          computedStatus = 'Approved';
        }
      }

      const payload: Partial<Income> = {
        DATE: displayDate,
        DATE_REF: invoiceDate,
        SUPERVISOR: supName,
        SUPERVISOR_ID: supId,
        PROJECT: projectCode,
        INCOME_SOURCE: 'Project Income / Invoice',
        TRANSACTION_TYPE: 'PROJECT_INVOICE_INCOME',
        // Invoices store gross amount as primary transaction AMOUNT
        AMOUNT: vatBreakdown.grossAmount,
        clientName: clientName.trim(),
        clientCode: clientCode.trim() || undefined,
        invoiceNumber: trimmedInvoiceNum,
        invoiceDate,
        dueDate,
        invoiceDueDate: dueDate,
        billingDescription: billingDescription.trim(),
        invoiceDescription: billingDescription.trim(),
        vatTreatment,
        vatRate: vatTreatment === 'VAT_NOT_APPLICABLE' ? 0 : vatRate,
        netAmount: vatBreakdown.netAmount,
        vatAmount: vatBreakdown.vatAmount,
        grossAmount: vatBreakdown.grossAmount,
        vatApplicable: vatBreakdown.vatApplicable,
        paymentStatus: computedStatus,
        amountReceived: numericReceived,
        balanceDue,
        paymentDate: numericReceived > 0 ? (paymentDate || invoiceDate) : undefined,
        paymentReference: paymentReference.trim() || undefined,
        PROOF_DOCUMENT: proofDocument || undefined,
        PROOF_DOCUMENT_NAME: proofDocName || undefined,
        REMARKS: remarks.trim() || undefined
      };

      if (invoiceToEdit) {
        updateIncome(invoiceToEdit.id, payload);
        if (onSuccess) onSuccess(invoiceToEdit.id);
        onClose();
      } else {
        const newRecord = addIncome({
          ...payload,
          CREATED_BY: 'finance@emaconstruction.lk'
        } as any);

        setSubmittedInvoiceId(newRecord.INCOME_ID || trimmedInvoiceNum);
        if (onSuccess) onSuccess(newRecord.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save project invoice.');
    }
  };

  const invoiceStatuses: InvoicePaymentStatus[] = [
    'Draft',
    'Submitted',
    'Approved',
    'Partially Paid',
    'Paid',
    'Overdue',
    'Cancelled'
  ];

  return (
    <div className="w-full">
      {/* Success Confirmation View */}
      {submittedInvoiceId ? (
        <div className="p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Project Invoice Recorded Successfully</h3>
            <p className="text-xs text-slate-400 mt-1">
              Invoice <span className="font-mono text-emerald-400 font-bold">{invoiceNumber}</span> has been saved with 18% VAT calculations.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[10px] text-slate-400">Net Billing</p>
              <p className="font-mono font-bold text-slate-200">{formatLkr(vatBreakdown.netAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-400">Output VAT (18%)</p>
              <p className="font-mono font-bold text-emerald-400">{formatLkr(vatBreakdown.vatAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-indigo-400">Gross Total</p>
              <p className="font-mono font-bold text-white">{formatLkr(vatBreakdown.grossAmount)}</p>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedInvoiceId(null);
                handleAutoGenerateInvoiceNumber();
                setAmount('');
                setBillingDescription('');
                setRemarks('');
                setAmountReceivedInput('0');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
            >
              Create Another Invoice
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-colors"
            >
              Done & View Invoices
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Project & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Project Code *
              </label>
              <select
                id="invoice-project-select"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.PROJECT_CODE}>
                    {p.PROJECT_CODE} — {p.PROJECT_NAME}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Client / Employer Name *
                </label>
                {clientCode && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Code: {clientCode}
                  </span>
                )}
              </div>
              <input
                id="invoice-client-name"
                type="text"
                required
                placeholder="Client Organization Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Invoice Number & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Invoice Number *
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateInvoiceNumber}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  title="Generate next sequential number"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Suggest</span>
                </button>
              </div>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="invoice-number-input"
                  type="text"
                  required
                  placeholder="INV-2026-00001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Invoice Date *
              </label>
              <input
                id="invoice-date-input"
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                id="invoice-due-date-input"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: Billing Description / Milestone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Billing Description / Milestone / Work Scope *
            </label>
            <textarea
              id="invoice-description-input"
              required
              rows={2}
              placeholder="e.g. IPC No. 05 - Progress Payment Certificate — Substructure & foundation works certified by Resident Engineer..."
              value={billingDescription}
              onChange={(e) => setBillingDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Row 4: Amount & VAT Treatment (Compact Card immediately after Amount) */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Invoice Base Amount (LKR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400 font-mono">
                  LKR
                </span>
                <input
                  id="invoice-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 1000000.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-14 pr-3 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* VAT Treatment Options */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-400" />
                  <span>VAT Treatment</span>
                </label>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                  Standard Rate: {vatTreatment === 'VAT_NOT_APPLICABLE' ? '0%' : `${vatRate}%`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVatTreatment('EXCLUDING_VAT')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    vatTreatment === 'EXCLUDING_VAT'
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">Excluding VAT</p>
                  <p className="text-[10px] opacity-75 mt-0.5">Amount + 18% VAT on top</p>
                </button>

                <button
                  type="button"
                  onClick={() => setVatTreatment('INCLUDING_VAT')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
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
                  onClick={() => setVatTreatment('VAT_NOT_APPLICABLE')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    vatTreatment === 'VAT_NOT_APPLICABLE'
                      ? 'bg-slate-800 border-slate-500 text-slate-200 ring-1 ring-slate-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold">VAT Not Applicable</p>
                  <p className="text-[10px] opacity-75 mt-0.5">0% VAT (Exempt billing)</p>
                </button>
              </div>
            </div>

            {/* Real-time Calculation Breakdown Box */}
            <div className="p-3 bg-slate-900 rounded-xl border border-indigo-900/40 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Net Billing</span>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  {formatLkr(vatBreakdown.netAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                  Output VAT ({vatTreatment === 'VAT_NOT_APPLICABLE' ? '0%' : `${vatRate}%`})
                </span>
                <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                  {formatLkr(vatBreakdown.vatAmount)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-indigo-300 uppercase font-semibold">Invoice Total (Gross)</span>
                <p className="text-xs font-mono font-extrabold text-white mt-0.5">
                  {formatLkr(vatBreakdown.grossAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Payment & Collection Tracking */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Payment & Collection Tracking</span>
              </label>
              <div className="flex flex-wrap items-center gap-1">
                {invoiceStatuses.map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-colors ${
                      paymentStatus === st
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Amount Received to Date (LKR)
                </label>
                <input
                  id="invoice-received-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max={grossTotal > 0 ? grossTotal : undefined}
                  placeholder="0.00"
                  value={amountReceivedInput}
                  onChange={(e) => handleReceivedChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Balance Due (Receivable)
                </label>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400">
                  {formatLkr(balanceDue)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Payment Date (if received)
                </label>
                <input
                  id="invoice-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {numericReceived > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Bank Reference / Cheque No / Slip Ref
                </label>
                <input
                  id="invoice-payment-ref"
                  type="text"
                  placeholder="e.g. Bank of Ceylon Transfer Ref #BOC-99214 or Cheque #088122"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Row 6: Attachment & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Invoice PDF / Certificate Scan
              </label>
              <div className="border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-center bg-slate-950 transition-colors">
                {proofDocument ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 truncate max-w-[180px]">{proofDocName || 'Attached Document'}</span>
                    <button
                      type="button"
                      onClick={() => { setProofDocument(''); setProofDocName(''); }}
                      className="text-rose-400 hover:underline text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="invoice-file-upload"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="invoice-file-upload" className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Invoice PDF / Scan</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Internal Remarks / Notes
              </label>
              <input
                id="invoice-remarks-input"
                type="text"
                placeholder="e.g. Approved by Project Director, billed to Client Head Office"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-project-invoice"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{invoiceToEdit ? 'Update Invoice' : 'Create Project Invoice'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

interface ProjectInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (invoiceId: string) => void;
  invoiceToEdit?: Income | null;
  mode?: 'standalone' | 'income';
}

export const ProjectInvoiceModal: React.FC<ProjectInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceToEdit,
  mode = 'standalone'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Standalone Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{invoiceToEdit ? 'Edit Project Invoice' : 'Create Project Invoice'}</span>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                  VAT Standard (18%)
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official company project billing, client invoice ledger & VAT tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto max-h-[82vh]">
          <ProjectInvoiceForm
            onClose={onClose}
            onSuccess={onSuccess}
            invoiceToEdit={invoiceToEdit}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};
