import React, { useState } from 'react';
import {
  X,
  FileText,
  Building2,
  DollarSign,
  Paperclip,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  CreditCard
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import {
  PRVPriority,
  PayeeType,
  PRVPaymentMethod,
  CurrencyCode,
  PaymentRequestAttachment
} from '../../types/prvTypes';

interface CreatePRVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePRVModal: React.FC<CreatePRVModalProps> = ({ isOpen, onClose }) => {
  const { createPaymentRequest, paymentRequests } = usePRV();
  const { projects, categories } = usePettyCash();
  const { currentUser, currentRole } = useEnterprise();

  // Next PRV number preview
  const nextPrvNumber = `PRV-${new Date().getFullYear()}-${String(paymentRequests.length + 1).padStart(5, '0')}`;

  // Form State
  const [requestDate, setRequestDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState<string>('Site Operations & Earthwork');
  const [projectCode, setProjectCode] = useState<string>(projects[0]?.PROJECT_CODE || 'PIDM 26');
  const [costCentre, setCostCentre] = useState<string>('CC-PIDM26-OPERATIONS');
  const [expenseCategory, setExpenseCategory] = useState<string>(categories[0]?.CATEGORY_NAME || 'Plant & Equipment');
  const [purpose, setPurpose] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [requiredDate, setRequiredDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<PRVPriority>('Medium');

  // Payee & Bank Info
  const [payeeName, setPayeeName] = useState<string>('');
  const [payeeType, setPayeeType] = useState<PayeeType>('Supplier');
  const [bankName, setBankName] = useState<string>('First Abu Dhabi Bank (FAB)');
  const [accountName, setAccountName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [iban, setIban] = useState<string>('');
  const [swiftCode, setSwiftCode] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PRVPaymentMethod>('Bank Transfer');

  // Amount & Financials
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<CurrencyCode>('AED');
  const [vatRate, setVatRate] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Attachments
  const [attachments, setAttachments] = useState<PaymentRequestAttachment[]>([]);
  const [attDocType, setAttDocType] = useState<PaymentRequestAttachment['documentType']>('Invoice');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const vatAmount = (amount * vatRate) / 100;
  const totalAmount = amount + vatAmount;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAtt: PaymentRequestAttachment = {
          id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: file.name,
          documentType: attDocType,
          fileType: file.type || 'application/octet-stream',
          fileData: (reader.result as string) || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60',
          fileSizeKb: Math.round(file.size / 1024),
          uploadedBy: currentUser,
          uploadedAt: new Date().toLocaleString('en-GB')
        };
        setAttachments(prev => [...prev, newAtt]);
        setIsUploading(false);
      };
      reader.onerror = () => setIsUploading(false);
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleAddSampleAttachment = (type: PaymentRequestAttachment['documentType']) => {
    const sampleAtt: PaymentRequestAttachment = {
      id: `att-${Date.now()}`,
      name: `${type.replace(/\s+/g, '_')}_Document.pdf`,
      documentType: type,
      fileType: 'application/pdf',
      fileData: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60',
      fileSizeKb: 450,
      uploadedBy: currentUser,
      uploadedAt: new Date().toLocaleString('en-GB')
    };
    setAttachments(prev => [...prev, sampleAtt]);
  };

  const handleSubmit = (submitImmediately: boolean) => {
    if (!purpose.trim() || !payeeName.trim() || amount <= 0) {
      alert('Please fill all mandatory fields: Payment Purpose, Payee Name, and a valid Amount greater than 0.');
      return;
    }

    const selectedProj = projects.find(p => p.PROJECT_CODE === projectCode);
    const selectedCat = categories.find(c => c.CATEGORY_NAME === expenseCategory);

    createPaymentRequest(
      {
        requestDate,
        requestedBy: currentUser,
        requestedByEmail: `${currentUser.toLowerCase()}@emaenterprise.com`,
        department,
        projectId: selectedProj?.id || 'prj-1',
        projectCode,
        costCentre,
        expenseCategoryId: selectedCat?.id || 'cat-1',
        expenseCategory,
        purpose: purpose.trim(),
        description: description.trim() || purpose.trim(),
        requiredDate,
        priority,
        payeeName: payeeName.trim(),
        payeeType,
        bankName: bankName.trim(),
        accountName: accountName.trim() || payeeName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim() || undefined,
        swiftCode: swiftCode.trim() || undefined,
        paymentMethod,
        paymentSource: paymentMethod === 'Petty Cash' ? 'Petty Cash' : 'Bank Account',
        amount,
        currency,
        vatRate,
        vatAmount,
        totalAmount,
        paymentReference: paymentReference.trim() || undefined,
        attachments
      },
      submitImmediately
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-rose-600 flex items-center justify-center text-white font-bold shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">Create Payment Request Voucher</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-mono font-bold">
                  {nextPrvNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-tier Accounts Review (L1 & L2) → Owner Final Authorization & Proof Scan
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

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-300">
          {/* SECTION 1: REQUEST INFORMATION */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-purple-400 font-bold border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4" />
              <span className="uppercase tracking-wider text-[11px]">1. Request & Project Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Request Date *</label>
                <input
                  type="date"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Requested By</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser} (${currentRole})`}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Site Operations / Fleet / Earthwork"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Project Code *</label>
                <select
                  value={projectCode}
                  onChange={(e) => {
                    setProjectCode(e.target.value);
                    setCostCentre(`CC-${e.target.value.replace(/\s+/g, '')}-EXPENSE`);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.PROJECT_CODE}>
                      {p.PROJECT_CODE} - {p.PROJECT_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cost Centre</label>
                <input
                  type="text"
                  value={costCentre}
                  onChange={(e) => setCostCentre(e.target.value)}
                  placeholder="e.g. CC-PIDM26-FUEL"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Expense Category (GL) *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.CATEGORY_NAME}>
                      {c.CATEGORY_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Required Payment Date *</label>
                <input
                  type="date"
                  required
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PRVPriority)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none font-semibold"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent (Immediate Payment Required)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PRVPaymentMethod)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none font-semibold"
                >
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                  <option value="Cash">Cash Voucher</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Company Corporate Card</option>
                  <option value="Online Payment">Online Banking Portal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Payment Purpose (Subject) *</label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Diesel fuel bulk purchase / Road aggregate supply / Crane rental"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-bold focus:border-purple-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Detailed Description & Justification</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed project background, location chainage, plant machinery involved, and justification..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 2: PAYEE & BANK DETAILS */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <CreditCard className="w-4 h-4" />
              <span className="uppercase tracking-wider text-[11px]">2. Payee & Banking Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payee Name *</label>
                <input
                  type="text"
                  required
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="e.g. Emirates Petroleum / Tokyo Super Cement"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payee Type *</label>
                <select
                  value={payeeType}
                  onChange={(e) => setPayeeType(e.target.value as PayeeType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Supplier">Supplier</option>
                  <option value="Contractor">Contractor / Subcontractor</option>
                  <option value="Employee">Employee / Reimbursement</option>
                  <option value="Other">Other Entity</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. First Abu Dhabi Bank (FAB) / Commercial Bank"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Beneficiary Account Title"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1048293847"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">IBAN / Swift (Optional)</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="e.g. AE44033000104829374619"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: AMOUNT & FINANCIAL BREAKDOWN */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-800 pb-2">
              <DollarSign className="w-4 h-4" />
              <span className="uppercase tracking-wider text-[11px]">3. Financial Breakdown & Currency</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-end">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Currency *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none"
                >
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                  <option value="QAR">QAR - Qatari Riyal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Base Amount *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Payable</span>
                <div className="text-sm font-mono font-black text-emerald-400 mt-0.5">
                  {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Invoice / Reference No</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. INV-2026-8821 / PO-99120"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 4: SUPPORTING DOCUMENTS */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <Paperclip className="w-4 h-4" />
                <span className="uppercase tracking-wider text-[11px]">4. Supporting Documents ({attachments.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddSampleAttachment('Invoice')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                >
                  + Sample Invoice
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSampleAttachment('Quotation')}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                >
                  + Sample Quotation
                </button>
              </div>
            </div>

            {/* Document Type Selector & Upload Button */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Attachment Type</label>
                <select
                  value={attDocType}
                  onChange={(e) => setAttDocType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="Quotation">Quotation</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Supplier statement">Supplier statement</option>
                  <option value="Delivery note">Delivery note</option>
                  <option value="Contract">Contract</option>
                  <option value="Approval letter">Approval letter</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Upload File (PDF, JPG, PNG, Excel, Word)</label>
                <label className="flex items-center justify-center gap-2 p-2 rounded-lg bg-blue-950/60 border border-dashed border-blue-700 hover:bg-blue-900/60 cursor-pointer text-blue-300 font-bold transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Choose file or drag & drop</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-200 block truncate">{att.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-medium">
                            {att.documentType}
                          </span>
                          <span>{att.fileSizeKb} KB</span>
                          <span>• {att.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Auto-assigns unique <span className="font-mono font-bold text-purple-300">{nextPrvNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold shadow-lg transition-all active:scale-95"
            >
              Submit for Accounts Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
