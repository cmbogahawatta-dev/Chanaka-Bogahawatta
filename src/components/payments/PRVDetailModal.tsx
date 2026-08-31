import React, { useState } from 'react';
import {
  X,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  Paperclip,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ShieldCheck,
  Camera,
  ExternalLink,
  Download,
  Eye,
  CreditCard,
  Printer,
  ChevronRight,
  ArrowRight,
  User,
  History,
  AlertCircle
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { PaymentRequestVoucher, PRVStatus } from '../../types/prvTypes';

interface PRVDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PRVDetailModal: React.FC<PRVDetailModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedPRV,
    accountsL1Approve,
    accountsL1Reject,
    accountsL1Return,
    accountsL2Approve,
    accountsL2Reject,
    accountsL2Return,
    openOwnerApprovalForPRV,
    openProofScannerForPRV,
    submitDraftRequest
  } = usePRV();

  const { expenses } = usePettyCash();
  const { currentUser, currentRole, navigateToModule } = useEnterprise();

  // Active tab inside modal
  const [modalTab, setModalTab] = useState<'details' | 'attachments' | 'proof' | 'audit'>('details');
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  // Accounts Action Modals/Prompts
  const [actionComment, setActionComment] = useState('');
  const [activeActionPrompt, setActiveActionPrompt] = useState<'L1_APPROVE' | 'L1_RETURN' | 'L1_REJECT' | 'L2_APPROVE' | 'L2_RETURN' | 'L2_REJECT' | null>(null);

  if (!isOpen || !selectedPRV) return null;

  const prv = selectedPRV;

  // Find linked project expense if paid
  const linkedExpense = prv.linkedExpenseId
    ? expenses.find(e => e.id === prv.linkedExpenseId || e.PRV_NUMBER === prv.prvNumber)
    : undefined;

  // Determine stage progress step (1 to 5)
  const getStageStep = (status: PRVStatus): number => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'SUBMITTED': return 1;
      case 'ACCOUNTS_L1_APPROVED': return 2;
      case 'ACCOUNTS_L2_APPROVED': return 3;
      case 'OWNER_APPROVED':
      case 'PAYMENT_PROOF_PENDING': return 4;
      case 'PAID': return 5;
      default: return 1;
    }
  };
  const currentStep = getStageStep(prv.status);

  // Handle Print Voucher
  const handlePrint = () => {
    window.print();
  };

  const handleExecuteAccountsAction = () => {
    if (!activeActionPrompt) return;

    if (activeActionPrompt === 'L1_APPROVE') {
      accountsL1Approve(prv.id, actionComment.trim() || 'Verified by Accounts Level 1');
    } else if (activeActionPrompt === 'L1_RETURN') {
      if (!actionComment.trim()) {
        alert('Please provide a reason for returning to requester.');
        return;
      }
      accountsL1Return(prv.id, actionComment.trim());
    } else if (activeActionPrompt === 'L1_REJECT') {
      if (!actionComment.trim()) {
        alert('Please provide a reason for rejecting.');
        return;
      }
      accountsL1Reject(prv.id, actionComment.trim());
    } else if (activeActionPrompt === 'L2_APPROVE') {
      accountsL2Approve(prv.id, actionComment.trim() || 'Budget verified by Accounts Level 2');
    } else if (activeActionPrompt === 'L2_RETURN') {
      if (!actionComment.trim()) {
        alert('Please provide a reason for returning.');
        return;
      }
      accountsL2Return(prv.id, actionComment.trim());
    } else if (activeActionPrompt === 'L2_REJECT') {
      if (!actionComment.trim()) {
        alert('Please provide a reason for rejecting.');
        return;
      }
      accountsL2Reject(prv.id, actionComment.trim());
    }

    setActiveActionPrompt(null);
    setActionComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 print:border-0 print:bg-white print:text-black print:max-h-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">{prv.prvNumber}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    prv.status === 'PAID'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : prv.status === 'OWNER_APPROVED'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : prv.status.includes('REJECTED')
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}
                >
                  {prv.status.replace(/_/g, ' ')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prv.priority === 'Urgent'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : prv.priority === 'High'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {prv.priority} Priority
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Created on {prv.requestDate} by <strong className="text-slate-200">{prv.requestedBy}</strong> ({prv.department})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 text-xs font-bold transition-colors"
              title="Print Voucher"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKFLOW STEPPER BAR */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 shrink-0 print:hidden overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] text-xs font-bold">
            {/* Step 1 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-purple-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {currentStep > 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span>1. Request Submitted</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            {/* Step 2 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {currentStep > 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span>2. Accounts L1</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            {/* Step 3 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {currentStep > 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
              </div>
              <span>3. Accounts L2</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            {/* Step 4 */}
            <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-amber-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 4 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {currentStep > 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '4'}
              </div>
              <span>4. Owner Approved</span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            {/* Step 5 */}
            <div className={`flex items-center gap-1.5 ${currentStep === 5 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {currentStep === 5 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '5'}
              </div>
              <span>5. Proof & Paid</span>
            </div>
          </div>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modalTab === 'details'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Voucher Details
            </button>
            <button
              onClick={() => setModalTab('attachments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modalTab === 'attachments'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Supporting Docs ({prv.attachments.length})</span>
            </button>
            {prv.transaction && (
              <button
                onClick={() => setModalTab('proof')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'proof'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Proof & Transaction</span>
              </button>
            )}
            <button
              onClick={() => setModalTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                modalTab === 'audit'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail ({prv.auditTrail.length})</span>
            </button>
          </div>

          {linkedExpense && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Linked Project Expense: {linkedExpense.EXPENSES_ID}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {modalTab === 'details' && (
            <div className="space-y-4">
              {/* Financial Hero Header */}
              <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Payment Purpose / Subject
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">{prv.purpose}</h2>
                  <p className="text-xs text-slate-400 max-w-xl">{prv.description}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-right min-w-[200px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount Payable</span>
                  <div className="text-xl font-mono font-black text-emerald-400 mt-0.5">
                    {prv.currency} {prv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {prv.vatAmount ? (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (Base: {prv.currency} {prv.amount.toLocaleString()} + VAT {prv.vatRate}%: {prv.currency} {prv.vatAmount.toLocaleString()})
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 3-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Col 1: Request & Project Info */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold border-b border-slate-800 pb-2">
                    <Building2 className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-[11px]">Project & Cost Allocation</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Project Code</span>
                      <span className="font-bold text-slate-200 text-sm">{prv.projectCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Cost Centre</span>
                      <span className="font-mono text-slate-300">{prv.costCentre || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Expense Category (GL)</span>
                      <span className="font-semibold text-slate-200">{prv.expenseCategory}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Required Payment Date</span>
                      <span className="font-bold text-amber-300">{prv.requiredDate}</span>
                    </div>
                  </div>
                </div>

                {/* Col 2: Payee & Banking Details */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-[11px]">Payee & Bank Details</span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Beneficiary / Payee</span>
                      <span className="font-bold text-slate-200 text-sm">{prv.payeeName}</span>
                      <span className="text-[10px] text-slate-400 block">Type: {prv.payeeType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Bank Name</span>
                      <span className="text-slate-300">{prv.bankName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Account Number</span>
                      <span className="font-mono text-slate-200 font-bold">{prv.accountNumber || 'N/A'}</span>
                    </div>
                    {prv.iban && (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">IBAN / SWIFT</span>
                        <span className="font-mono text-slate-300">{prv.iban}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Payment Method</span>
                      <span className="font-bold text-purple-300">{prv.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Col 3: Multi-tier Verification Log */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-800 pb-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-[11px]">Approval Progression</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* L1 Accounts */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-300">Level 1: Accounts Review</span>
                        {prv.approvals.some(a => a.approvalLevel === 'ACCOUNTS_L1') ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <span className="text-amber-400">Pending</span>
                        )}
                      </div>
                      {prv.approvals.find(a => a.approvalLevel === 'ACCOUNTS_L1') && (
                        <p className="text-[10px] text-slate-400 italic mt-1">
                          "{prv.approvals.find(a => a.approvalLevel === 'ACCOUNTS_L1')?.comment}"
                        </p>
                      )}
                    </div>

                    {/* L2 Senior Accounts */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-300">Level 2: Financial Controller</span>
                        {prv.approvals.some(a => a.approvalLevel === 'ACCOUNTS_L2') ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </div>
                      {prv.approvals.find(a => a.approvalLevel === 'ACCOUNTS_L2') && (
                        <p className="text-[10px] text-slate-400 italic mt-1">
                          "{prv.approvals.find(a => a.approvalLevel === 'ACCOUNTS_L2')?.comment}"
                        </p>
                      )}
                    </div>

                    {/* Owner Approval */}
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-300">Final: Owner Authorization</span>
                        {prv.approvals.some(a => a.approvalLevel === 'OWNER') ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                          </span>
                        ) : (
                          <span className="text-slate-500">Pending</span>
                        )}
                      </div>
                      {prv.approvals.find(a => a.approvalLevel === 'OWNER') && (
                        <p className="text-[10px] text-slate-400 italic mt-1">
                          "{prv.approvals.find(a => a.approvalLevel === 'OWNER')?.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Expense Card if Completed */}
              {linkedExpense && (
                <div className="bg-emerald-950/30 p-4 rounded-xl border border-emerald-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Completed & Posted to Project Expense</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Expense ID: <strong className="font-mono text-emerald-300">{linkedExpense.EXPENSES_ID}</strong> • Project: <strong>{linkedExpense.PROJECT}</strong> • Category: <strong>{linkedExpense.EXPENSES_CATEGORY}</strong> • Source: <strong>{linkedExpense.PAYMENT_SOURCE}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalTab('proof')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Payment Proof Slip</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ATTACHMENTS TAB */}
          {modalTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200 text-sm">
                  Supporting Documentation ({prv.attachments.length})
                </h4>
              </div>

              {prv.attachments.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No supporting documents attached to this payment request voucher.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {prv.attachments.map(att => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-9 h-9 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h5 className="font-bold text-slate-100 truncate text-xs">{att.name}</h5>
                            <span className="text-[10px] text-purple-300 font-semibold">{att.documentType}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">{att.fileSizeKb} KB</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                        <span>Uploaded by {att.uploadedBy}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewAttachmentUrl(att.fileData)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAYMENT PROOF TAB */}
          {modalTab === 'proof' && prv.transaction && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="uppercase tracking-wider text-[11px]">Official Payment Transaction Confirmation</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    Completed on {prv.transaction.completedAt}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Payment Date</span>
                    <span className="font-bold text-slate-200">{prv.transaction.paymentDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Payment Reference</span>
                    <span className="font-mono font-bold text-emerald-400">{prv.transaction.paymentReference}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Payment Source</span>
                    <span className="font-bold text-purple-300">{prv.transaction.paymentSource}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Paid By</span>
                    <span className="font-bold text-slate-200">{prv.transaction.paidBy}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Bank Account Used</span>
                  <span className="font-mono text-slate-300">{prv.transaction.bankAccount}</span>
                </div>
              </div>

              {/* Scanned Proof Document Image */}
              {prv.transaction.proofs && prv.transaction.proofs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Scanned Payment Proof Documents ({prv.transaction.proofs.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prv.transaction.proofs.map(prf => (
                      <div key={prf.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden space-y-2 p-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{prf.documentType}</span>
                          <span className="font-mono text-slate-400 text-[10px]">{prf.capturedAt}</span>
                        </div>
                        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                          <img
                            src={prf.file}
                            alt="Payment Proof"
                            className="w-full h-full object-contain cursor-pointer"
                            onClick={() => setPreviewAttachmentUrl(prf.file)}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Method: {prf.capturedMethod} • Scanned by: {prf.capturedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AUDIT TRAIL TAB */}
          {modalTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-200 text-sm">Chronological Audit Log</h4>
              <div className="space-y-2">
                {prv.auditTrail.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{entry.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Executed by <strong className="text-slate-300">{entry.user}</strong> ({entry.role})
                        {entry.newStatus ? <span> • Status → <strong className="text-purple-300">{entry.newStatus}</strong></span> : null}
                      </p>
                      {entry.comment && (
                        <p className="text-[11px] text-slate-300 italic bg-slate-900/80 p-1.5 rounded mt-1 border border-slate-800">
                          "{entry.comment}"
                        </p>
                      )}
                      {entry.details && (
                        <p className="text-[10px] text-emerald-400 mt-0.5">{entry.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Prompt Drawer (Accounts L1/L2 Comment Modal) */}
        {activeActionPrompt && (
          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 shrink-0 animate-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-purple-300">
                {activeActionPrompt.includes('APPROVE')
                  ? 'Confirm Approval Comment'
                  : activeActionPrompt.includes('RETURN')
                  ? 'Reason for Return to Requester'
                  : 'Reason for Rejection'}
              </span>
              <button
                onClick={() => setActiveActionPrompt(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder="Enter verification notes / reasons..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleExecuteAccountsAction}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Confirm Action
              </button>
            </div>
          </div>
        )}

        {/* Footer Dynamic Action Bar based on Status */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-[11px] text-slate-400">
            Current Status: <strong className="text-slate-200">{prv.status.replace(/_/g, ' ')}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* If Draft: Requester submit */}
            {prv.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => {
                  submitDraftRequest(prv.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
              >
                Submit for Accounts Review
              </button>
            )}

            {/* If Submitted: Accounts L1 actions */}
            {prv.status === 'SUBMITTED' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveActionPrompt('L1_RETURN')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs"
                >
                  Return to Requester
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActionPrompt('L1_REJECT')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActionPrompt('L1_APPROVE')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accounts L1 Approve</span>
                </button>
              </>
            )}

            {/* If L1 Approved: Accounts L2 actions */}
            {prv.status === 'ACCOUNTS_L1_APPROVED' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveActionPrompt('L2_RETURN')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs"
                >
                  Return
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActionPrompt('L2_REJECT')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setActiveActionPrompt('L2_APPROVE')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accounts L2 Approve</span>
                </button>
              </>
            )}

            {/* If L2 Approved: Owner Final Approval */}
            {prv.status === 'ACCOUNTS_L2_APPROVED' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openOwnerApprovalForPRV(prv);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Owner Payment Authorization</span>
              </button>
            )}

            {/* If Owner Approved / Proof Pending: Scan / Upload Proof */}
            {(prv.status === 'OWNER_APPROVED' || prv.status === 'PAYMENT_PROOF_PENDING') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openProofScannerForPRV(prv);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Scan / Upload Payment Proof (Complete Payment)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Full Preview Modal */}
      {previewAttachmentUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs">Document Preview</span>
              <button
                onClick={() => setPreviewAttachmentUrl(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <img
                src={previewAttachmentUrl}
                alt="Document preview"
                className="max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
