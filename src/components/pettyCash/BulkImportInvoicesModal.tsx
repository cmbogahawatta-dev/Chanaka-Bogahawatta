import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  FileText,
  DollarSign,
  Layers,
  Lock,
  KeyRound,
  Building2,
  Receipt,
  PieChart
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import {
  DataImportService,
  ParsedRawData,
  ValidationSummary,
  DuplicateAction,
  INVOICE_FIELDS
} from '../../services/dataImportService';
import { AdminSecurityService } from '../../services/adminSecurityService';
import { formatLKR } from '../../utils/helpers';

interface BulkImportInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (batchId: string) => void;
}

export const BulkImportInvoicesModal: React.FC<BulkImportInvoicesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    income,
    projects,
    userRole,
    bulkImportInvoices
  } = usePettyCash();

  // Wizard Steps: 1: Source, 2: Mapping & Preview, 3: Approval Settings, 4: Complete
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Input source state
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedRawData | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Step 2: Mapping & Validation
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors' | 'duplicates'>('all');

  // Step 3: Admin Approval & Options
  const [autoRegisterProjects, setAutoRegisterProjects] = useState<boolean>(true);
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [approverName, setApproverName] = useState<string>(
    userRole === 'ADMIN' ? 'Head Office Chief Accountant' : 'Commercial Billing Director'
  );
  const [approvalRemarks, setApprovalRemarks] = useState<string>(
    'Certified project billing invoices and interim payment certificates bulk migration'
  );
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('SKIP');

  // Step 4: Result state
  const [importResult, setImportResult] = useState<{
    batchId: string;
    totalGross: number;
    totalNet: number;
    totalVat: number;
    totalReceived: number;
    count: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- Step 1: Parsing Handler ---
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const data = await DataImportService.parseFile(file);
      processParsedData(data);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse selected project invoice file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteProcess = () => {
    if (!pastedText.trim()) {
      setParseError('Please paste tab or comma-separated tabular data from Excel or a CSV file.');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    try {
      const data = DataImportService.parseRawText(pastedText);
      processParsedData(data);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse pasted invoice data.');
    } finally {
      setIsParsing(false);
    }
  };

  const processParsedData = (data: ParsedRawData) => {
    setParsedData(data);
    const suggested = DataImportService.autoMapColumns('PROJECT_INVOICES', data.headers);
    setColumnMapping(suggested);

    // Initial validation
    const summary = DataImportService.validateDataset(
      'PROJECT_INVOICES',
      data.rows,
      suggested,
      {
        existingExpenses: [],
        existingProjects: projects,
        existingSupervisors: [],
        existingCategories: [],
        existingIncome: income
      }
    );
    setValidationSummary(summary);
    setCurrentStep(2);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // --- Step 2: Mapping Change & Re-Validation ---
  const handleMappingChange = (schemaField: string, fileColumn: string) => {
    const updated = { ...columnMapping, [schemaField]: fileColumn };
    setColumnMapping(updated);

    if (parsedData) {
      const summary = DataImportService.validateDataset(
        'PROJECT_INVOICES',
        parsedData.rows,
        updated,
        {
          existingExpenses: [],
          existingProjects: projects,
          existingSupervisors: [],
          existingCategories: [],
          existingIncome: income
        }
      );
      setValidationSummary(summary);
    }
  };

  // Calculate totals from valid rows
  const financialTotals = React.useMemo(() => {
    if (!validationSummary) {
      return { totalGross: 0, totalNet: 0, totalVat: 0, totalReceived: 0, totalDue: 0 };
    }
    let totalGross = 0;
    let totalNet = 0;
    let totalVat = 0;
    let totalReceived = 0;

    validationSummary.validatedRows.forEach((r) => {
      if (r.isValid) {
        const net = Number(r.mapped['NET_AMOUNT']) || 0;
        const vat = Number(r.mapped['CALCULATED_VAT']) || 0;
        const gross = Number(r.mapped['CALCULATED_GROSS']) || (net + vat);
        const received = Number(r.mapped['AMOUNT_RECEIVED']) || 0;

        totalGross += gross;
        totalNet += net;
        totalVat += vat;
        totalReceived += received;
      }
    });

    return {
      totalGross,
      totalNet,
      totalVat,
      totalReceived,
      totalDue: Math.max(0, totalGross - totalReceived)
    };
  }, [validationSummary]);

  // --- Step 3: Admin Approval Verification & Execution ---
  const handleExecuteImport = async () => {
    setAdminPinError(null);

    // If user entered PIN, verify with AdminSecurityService
    if (adminPin.trim()) {
      const pinCheck = await AdminSecurityService.verifyCode(adminPin);
      if (!pinCheck.success) {
        setAdminPinError(pinCheck.message || 'Invalid Master Admin PIN. Authorization required.');
        return;
      }
    } else {
      // If PIN is blank, check if security credential is required
      const cred = AdminSecurityService.getCredential();
      if (cred && cred.pinHash) {
        setAdminPinError('Please enter your 4-digit Master Admin PIN to authorize invoice bulk import.');
        return;
      }
    }

    if (!parsedData || !validationSummary) return;

    const batchId = `IMP-INV-${Date.now().toString().slice(-6)}`;

    try {
      const result = bulkImportInvoices(batchId, validationSummary, {
        performedBy: approverName || 'Administrator',
        userRole: userRole || 'ADMIN',
        approvalRemarks,
        fileName: parsedData.fileName,
        fileSize: parsedData.fileSize,
        skipInvalid: true,
        duplicateAction,
        autoRegisterProjects
      });

      setImportResult({
        batchId: result.batchRecord.id,
        totalGross: result.totalGross,
        totalNet: result.totalNet,
        totalVat: result.totalVat,
        totalReceived: result.totalReceived,
        count: result.count
      });

      setCurrentStep(4);
      if (onSuccess) onSuccess(result.batchRecord.id);
    } catch (err: any) {
      setAdminPinError(err.message || 'Invoice bulk import execution failed.');
    }
  };

  // Filtered rows for Preview Table
  const filteredRows = validationSummary?.validatedRows.filter(r => {
    if (previewFilter === 'valid') return r.isValid;
    if (previewFilter === 'errors') return !r.isValid;
    if (previewFilter === 'duplicates') return r.isDuplicate;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Bulk Import Project Invoices</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Certified Billing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bulk import client tax invoices & IPC certificates with Sri Lanka VAT (18%), receivable tracking, and automatic project allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-6 text-xs">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 1 ? 'bg-indigo-600 text-white' : currentStep === 1 ? 'border-2 border-indigo-500 text-indigo-400' : 'border border-slate-700'
              }`}>
                {currentStep > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <span>Upload Source</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 2 ? 'bg-indigo-600 text-white' : currentStep === 2 ? 'border-2 border-indigo-500 text-indigo-400' : 'border border-slate-700'
              }`}>
                {currentStep > 2 ? <Check className="w-3 h-3" /> : '2'}
              </div>
              <span>Map & Validate</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep > 3 ? 'bg-indigo-600 text-white' : currentStep === 3 ? 'border-2 border-indigo-500 text-indigo-400' : 'border border-slate-700'
              }`}>
                {currentStep > 3 ? <Check className="w-3 h-3" /> : '3'}
              </div>
              <span>Authorization</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-slate-800" />
            <div className={`flex items-center gap-2 ${currentStep === 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === 4 ? 'bg-emerald-600 text-white' : 'border border-slate-700'
              }`}>
                {currentStep === 4 ? <Check className="w-3 h-3" /> : '4'}
              </div>
              <span>Complete</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-invoices-template-xlsx"
              onClick={() => DataImportService.downloadTemplate('PROJECT_INVOICES', 'xlsx')}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-900/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel Template</span>
            </button>
            <button
              id="btn-download-invoices-template-csv"
              onClick={() => DataImportService.downloadTemplate('PROJECT_INVOICES', 'csv')}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Download CSV formatted template"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: DATA SOURCE SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Input Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setInputTab('upload')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    inputTab === 'upload'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Upload Spreadsheet (.xlsx, .csv)</span>
                </button>
                <button
                  onClick={() => setInputTab('paste')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    inputTab === 'paste'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Paste Tabular Data</span>
                </button>
              </div>

              {parseError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {inputTab === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    {isParsing ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-200">
                    {isParsing ? 'Parsing Invoice Spreadsheet...' : 'Choose or drop invoice spreadsheet here'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Accepts Excel workbooks (.xlsx, .xls) and CSV files. Automatic column detection maps invoice number, project, client, dates, and amounts.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono">
                      .XLSX
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono">
                      .CSV
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono">
                      .XLS
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Paste Tab-Delimited or CSV Data from Excel / Google Sheets:
                    </label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Invoice Number&#9;Project Code&#9;Client Name&#9;Invoice Date&#9;Billing Description&#9;Net Amount&#9;VAT Treatment&#9;Amount Received
INV-2024-001&#9;PIDM 26&#9;NWSDB&#9;15/01/2024&#9;Interim Payment Certificate No. 04&#9;2500000&#9;EXCLUDING_VAT&#9;1500000
INV-2024-002&#9;HAVELOCK&#9;UDA&#9;22/01/2024&#9;IPC No. 02 - Foundation Concrete&#9;4200000&#9;EXCLUDING_VAT&#9;4200000"
                      rows={10}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handlePasteProcess}
                      disabled={isParsing || !pastedText.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      <span>Parse Pasted Records</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Format Guide */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2 mb-2 text-slate-200 font-semibold text-xs">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Invoice Spreadsheet Standard Columns</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] text-slate-400">
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-200 block">Invoice Number (Required)</strong>
                    <span>Unique client bill or IPC reference e.g. <span className="text-indigo-400 font-mono">INV-2024-001</span></span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-200 block">Project Code (Required)</strong>
                    <span>Site allocation code e.g. <span className="text-indigo-400 font-mono">PIDM 26</span> or <span className="text-indigo-400 font-mono">HAVELOCK</span></span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-200 block">Net Amount (Required)</strong>
                    <span>Net certified value before Sri Lanka VAT (18%) e.g. <span className="text-indigo-400 font-mono">2500000</span></span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-200 block">VAT Treatment & Rate</strong>
                    <span>EXCLUDING_VAT, INCLUDING_VAT, or VAT_NOT_APPLICABLE. Defaults to 18%.</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-200 block">Amount Received (Optional)</strong>
                    <span>Receipts collected towards this invoice so far. Calculates balance due automatically.</span>
                  </div>
                  <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
                    <strong className="text-slate-200 block">Dates & Description</strong>
                    <span>Dates in <span className="text-indigo-400 font-mono">DD/MM/YYYY</span> format. Scope or milestone details.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & LIVE VALIDATION PREVIEW */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Financial Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Valid Rows</span>
                  <span className="text-lg font-black text-slate-100 font-mono">
                    {validationSummary?.validRowsCount || 0} / {validationSummary?.totalRows || 0}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Net</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {formatLKR(financialTotals.totalNet)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Output VAT (18%)</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">
                    {formatLKR(financialTotals.totalVat)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Gross Invoiced</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {formatLKR(financialTotals.totalGross)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Balance Due</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {formatLKR(financialTotals.totalDue)}
                  </span>
                </div>
              </div>

              {/* Column Mapping Grid */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Spreadsheet Column Mapping
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Verify that your file columns match the corresponding project invoice attributes:
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (parsedData) {
                        const auto = DataImportService.autoMapColumns('PROJECT_INVOICES', parsedData.headers);
                        setColumnMapping(auto);
                      }
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Auto-Match</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {INVOICE_FIELDS.map((f) => (
                    <div
                      key={f.key}
                      className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          {f.label} {f.required && <span className="text-rose-400">*</span>}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{f.type}</span>
                      </div>
                      <select
                        value={columnMapping[f.key] || ''}
                        onChange={(e) => handleMappingChange(f.key, e.target.value)}
                        className={`w-full text-xs bg-slate-950 border rounded-lg px-2 py-1.5 focus:outline-none ${
                          f.required && !columnMapping[f.key]
                            ? 'border-rose-500/80 text-rose-300'
                            : 'border-slate-800 text-slate-200 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">-- Ignore / Not in file --</option>
                        {parsedData?.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table with Filter Tabs */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">Validation Preview:</span>
                    <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
                      <button
                        onClick={() => setPreviewFilter('all')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                          previewFilter === 'all'
                            ? 'bg-slate-800 text-slate-100 shadow-sm'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        All ({validationSummary?.totalRows || 0})
                      </button>
                      <button
                        onClick={() => setPreviewFilter('valid')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                          previewFilter === 'valid'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Valid ({validationSummary?.validRowsCount || 0})
                      </button>
                      <button
                        onClick={() => setPreviewFilter('duplicates')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                          previewFilter === 'duplicates'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Duplicates ({validationSummary?.duplicatesCount || 0})
                      </button>
                      <button
                        onClick={() => setPreviewFilter('errors')}
                        className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                          previewFilter === 'errors'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            : 'text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Errors ({validationSummary?.errorsCount || 0})
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Showing {filteredRows.length} row(s)
                  </span>
                </div>

                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Scope / Milestone</th>
                        <th className="py-2.5 px-3 text-right">Net Amount</th>
                        <th className="py-2.5 px-3 text-right">VAT (18%)</th>
                        <th className="py-2.5 px-3 text-right">Gross Total</th>
                        <th className="py-2.5 px-3 text-right">Received</th>
                        <th className="py-2.5 px-3">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 font-mono">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r) => {
                          const net = Number(r.mapped['NET_AMOUNT']) || 0;
                          const vat = Number(r.mapped['CALCULATED_VAT']) || 0;
                          const gross = Number(r.mapped['CALCULATED_GROSS']) || (net + vat);
                          const received = Number(r.mapped['AMOUNT_RECEIVED']) || 0;

                          return (
                            <tr
                              key={r.rowIndex}
                              className={`hover:bg-slate-900/50 transition-colors ${
                                !r.isValid
                                  ? 'bg-rose-950/20 text-rose-200'
                                  : r.isDuplicate
                                  ? 'bg-amber-950/20 text-amber-200'
                                  : 'text-slate-300'
                              }`}
                            >
                              <td className="py-2 px-3 font-semibold text-slate-400">#{r.rowIndex}</td>
                              <td className="py-2 px-3">
                                {r.isValid ? (
                                  r.isDuplicate ? (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-sans">
                                      Duplicate
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-sans">
                                      Valid
                                    </span>
                                  )
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-sans">
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-200">
                                {r.mapped['INVOICE_NUMBER'] || '—'}
                              </td>
                              <td className="py-2 px-3 font-semibold text-indigo-300">
                                {r.mapped['PROJECT'] || '—'}
                              </td>
                              <td className="py-2 px-3 truncate max-w-[140px] font-sans">
                                {r.mapped['CLIENT_NAME'] || '—'}
                              </td>
                              <td className="py-2 px-3 truncate max-w-[180px] font-sans">
                                {r.mapped['BILLING_DESCRIPTION'] || '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {net.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right text-indigo-400">
                                {vat.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-400">
                                {gross.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right text-blue-300">
                                {received.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 font-sans text-[11px]">
                                {r.errors.length > 0 ? (
                                  <span className="text-rose-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    {r.errors[0].error}
                                  </span>
                                ) : r.warnings.length > 0 ? (
                                  <span className="text-amber-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    {r.warnings[0].error}
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADMIN AUTHORIZATION & IMPORT POLICIES */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Summary Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Execution Snapshot
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {validationSummary?.validRowsCount} Valid / {validationSummary?.totalRows} Rows
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Certified Gross:</span>
                    <strong className="text-base text-slate-100 font-mono font-bold">
                      {formatLKR(financialTotals.totalGross)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Output VAT (18%):</span>
                    <strong className="text-base text-indigo-400 font-mono font-bold">
                      {formatLKR(financialTotals.totalVat)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Initial Receipts:</span>
                    <strong className="text-base text-blue-400 font-mono font-bold">
                      {formatLKR(financialTotals.totalReceived)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Receivable Balance:</span>
                    <strong className="text-base text-amber-400 font-mono font-bold">
                      {formatLKR(financialTotals.totalDue)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Import Policies */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Import Policies & Handling
                </h4>

                {/* Duplicate Policy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Duplicate Invoice Number Handling:
                  </label>
                  <select
                    value={duplicateAction}
                    onChange={(e) => setDuplicateAction(e.target.value as DuplicateAction)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SKIP">Skip Duplicates (Keep existing invoice records unmodified)</option>
                    <option value="UPDATE">Update Existing (Overwrite fields with imported values)</option>
                    <option value="CANCEL">Cancel Execution if any duplicates are found</option>
                  </select>
                </div>

                {/* Auto Register Missing Projects */}
                <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoRegisterProjects}
                    onChange={(e) => setAutoRegisterProjects(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>
                    Auto-register newly referenced Project Site codes into project directory if missing
                  </span>
                </label>
              </div>

              {/* Approver Details */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Financial Certification & Audit Sign-Off
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Authorizing Officer / Commercial Manager:
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Head Office Commercial Director"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Batch Audit Remarks:
                  </label>
                  <input
                    type="text"
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Audit trail memo for this import batch"
                  />
                </div>

                {/* Security PIN Check */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Security PIN Verification:</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Master cryptographic PIN or leave blank if default
                    </span>
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setAdminPinError(null);
                    }}
                    placeholder="••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono tracking-widest focus:outline-none focus:border-indigo-500"
                  />
                  {adminPinError && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{adminPinError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECONCILIATION */}
          {currentStep === 4 && importResult && (
            <div className="space-y-6 max-w-xl mx-auto text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-in zoom-in-75 duration-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-100">Project Invoices Bulk Import Successful!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Batch <span className="text-indigo-400 font-mono font-semibold">{importResult.batchId}</span> has been committed to the ledger with full VAT calculation and accounts receivable tracking.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Invoices Imported</span>
                  <span className="text-xl font-black text-slate-100 font-mono">{importResult.count}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Gross Value</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{formatLKR(importResult.totalGross)}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Net Certified Sum</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">{formatLKR(importResult.totalNet)}</span>
                </div>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Output VAT (18%)</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">{formatLKR(importResult.totalVat)}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 text-left">
                <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Next Actions</span>
                </div>
                <p>
                  You can inspect the certified invoices on the Project Invoices ledger, print individual tax receipts, or record subsequent client settlements.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 4 && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep === 1 && (
              <button
                disabled={!parsedData}
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to Mapping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                disabled={!validationSummary || validationSummary.validRowsCount === 0}
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Proceed to Authorization ({validationSummary?.validRowsCount || 0} Ready)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Commit {validationSummary?.validRowsCount} Invoices</span>
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                View Invoices Ledger
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
