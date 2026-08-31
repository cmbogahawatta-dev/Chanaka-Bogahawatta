import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  Check,
  Building2,
  UserCheck,
  DollarSign,
  Layers,
  Lock,
  KeyRound
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import {
  DataImportService,
  ParsedRawData,
  ValidationSummary,
  DuplicateAction
} from '../../services/dataImportService';
import { AdminSecurityService } from '../../services/adminSecurityService';
import { EXPENSE_FIELDS } from '../../services/dataImportService';

interface BulkImportExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (batchId: string) => void;
}

export const BulkImportExpensesModal: React.FC<BulkImportExpensesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    expenses,
    projects,
    supervisors,
    categories,
    userRole,
    bulkImportExpenses
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
  const [approvalMode, setApprovalMode] = useState<'APPROVED' | 'PENDING'>('APPROVED');
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [approverName, setApproverName] = useState<string>(
    userRole === 'ADMIN' ? 'Head Office Administrator' : 'Finance Officer'
  );
  const [approvalRemarks, setApprovalRemarks] = useState<string>('Authorized site petty cash expense bulk batch');
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('SKIP');
  const [autoRegisterSupervisors, setAutoRegisterSupervisors] = useState<boolean>(true);
  const [autoRegisterProjects, setAutoRegisterProjects] = useState<boolean>(true);
  const [skipInvalidRows, setSkipInvalidRows] = useState<boolean>(true);

  // Step 4: Final output
  const [createdBatchId, setCreatedBatchId] = useState<string>('');
  const [importedCount, setImportedCount] = useState<number>(0);
  const [importedTotalAmount, setImportedTotalAmount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAdminSession = userRole === 'ADMIN' || AdminSecurityService.isVerified();

  // Reset wizard
  const handleReset = () => {
    setCurrentStep(1);
    setParsedData(null);
    setParseError(null);
    setPastedText('');
    setColumnMapping({});
    setValidationSummary(null);
    setAdminPin('');
    setAdminPinError(null);
    setCreatedBatchId('');
    setImportedCount(0);
    setImportedTotalAmount(0);
  };

  // Format currency
  const formatLKR = (val: number) => {
    return `LKR ${val.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Process File Upload
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const parsed = await DataImportService.parseFile(file);
      processParsedData(parsed);
    } catch (err: any) {
      setParseError(err.message || 'Failed to read spreadsheet.');
    } finally {
      setIsParsing(false);
    }
  };

  // Process Paste Data
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setParseError('Please paste tab-delimited or comma-separated rows.');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    try {
      const parsed = DataImportService.parseRawText(pastedText);
      processParsedData(parsed);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse pasted text.');
    } finally {
      setIsParsing(false);
    }
  };

  // Load Built-in Realistic Construction Sample Batch
  const handleLoadSampleData = () => {
    const sampleRows = [
      {
        'Date': '15/08/2026',
        'Supervisor': 'BUDDIKA',
        'Project': 'PIDM 26',
        'Category': '5000 Construction Materials',
        'Amount': '18500',
        'Description': 'Purchased high-tensile binding wire & cutting discs for slab shuttering',
        'Voucher No': 'PRV-2026-0811',
        'Payment Source': 'Petty Cash',
        'Remarks': 'Site purchase receipt #4421 attached'
      },
      {
        'Date': '16/08/2026',
        'Supervisor': 'KASUN',
        'Project': 'HAVELOCK',
        'Category': '5003 Transport & Site Freight',
        'Amount': '32000',
        'Description': 'Boom truck crane rental for unloading steel rebar at Havelock site',
        'Voucher No': 'PRV-2026-0812',
        'Payment Source': 'Petty Cash',
        'Remarks': 'Transport invoice verified by PM'
      },
      {
        'Date': '17/08/2026',
        'Supervisor': 'PRADEEP',
        'Project': 'TRILLIUM',
        'Category': '5002 Site Safety & PPE',
        'Amount': '14500',
        'Description': 'Emergency supply of 10 safety helmets, leather gloves and dust masks',
        'Voucher No': 'PRV-2026-0813',
        'Payment Source': 'Petty Cash',
        'Remarks': 'Safety officer approved'
      },
      {
        'Date': '18/08/2026',
        'Supervisor': 'CHAMARA',
        'Project': 'MARINA',
        'Category': '5004 Equipment Fuel & Lubricants',
        'Amount': '28000',
        'Description': 'Diesel fuel purchase for site diesel generator (100L)',
        'Voucher No': 'PRV-2026-0814',
        'Payment Source': 'Petty Cash',
        'Remarks': 'Fuel pump receipt #9088'
      },
      {
        'Date': '19/08/2026',
        'Supervisor': 'NUWAN',
        'Project': 'CINNAMON',
        'Category': '5001 Site Consumables & Fasteners',
        'Amount': '12400',
        'Description': 'Masonry drill bits, expansion anchors and waterproof silicone tubes',
        'Voucher No': 'PRV-2026-0815',
        'Payment Source': 'Petty Cash',
        'Remarks': 'Cinnamon site MEP team request'
      },
      {
        'Date': '20/08/2026',
        'Supervisor': 'SANJEEWA',
        'Project': 'ALTAIR',
        'Category': '5006 Casual Labor & Site Porterage',
        'Amount': '22500',
        'Description': 'Emergency overtime site cleanup & debris loading team (3 workers)',
        'Voucher No': 'PRV-2026-0816',
        'Payment Source': 'Petty Cash',
        'Remarks': 'Daily casual labor voucher signed'
      }
    ];

    const sampleHeaders = Object.keys(sampleRows[0]);
    const parsed: ParsedRawData = {
      headers: sampleHeaders,
      rows: sampleRows,
      fileName: 'Sample_EMA_Petty_Cash_Batch.xlsx',
      fileSize: '14.2 KB',
      sheetNames: ['Sample Expenses']
    };

    processParsedData(parsed);
  };

  // Helper to map and validate
  const processParsedData = (parsed: ParsedRawData) => {
    setParsedData(parsed);
    const mapping = DataImportService.autoMapColumns('HISTORICAL_EXPENSES', parsed.headers);
    setColumnMapping(mapping);

    // Validate
    const summary = DataImportService.validateData(
      'HISTORICAL_EXPENSES',
      parsed.rows,
      mapping,
      {
        expenses,
        projects,
        supervisors
      }
    );

    setValidationSummary(summary);
    setCurrentStep(2);
  };

  // Recalculate validation when user changes column mapping
  const handleMappingChange = (fieldKey: string, sourceHeader: string) => {
    if (!parsedData) return;
    const newMapping = { ...columnMapping, [fieldKey]: sourceHeader };
    setColumnMapping(newMapping);

    const summary = DataImportService.validateData(
      'HISTORICAL_EXPENSES',
      parsedData.rows,
      newMapping,
      {
        expenses,
        projects,
        supervisors
      }
    );
    setValidationSummary(summary);
  };

  // Execute Import & Posting
  const handleCommitImport = () => {
    if (!validationSummary || !parsedData) return;

    // Check Admin PIN if direct approved mode is selected by non-admin
    if (approvalMode === 'APPROVED' && !isAdminSession) {
      if (!adminPin) {
        setAdminPinError('Please enter the Admin PIN to authorize immediate approval.');
        return;
      }
      const verified = AdminSecurityService.verifyCode(adminPin);
      if (!verified) {
        setAdminPinError('Invalid Admin PIN code. Direct approval requires valid authorization.');
        return;
      }
    }

    try {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const batchId = `IMP-EXP-${datePart}-${randomSeq}`;

      const res = bulkImportExpenses(
        batchId,
        validationSummary,
        {
          approvalStatus: approvalMode === 'APPROVED' ? 'Approved' : 'Pending',
          performedBy: approverName || 'Admin / Finance Officer',
          userRole: userRole,
          approvedBy: approvalMode === 'APPROVED' ? approverName : undefined,
          approvalRemarks: approvalRemarks,
          fileName: parsedData.fileName,
          fileSize: parsedData.fileSize,
          skipInvalid: skipInvalidRows,
          duplicateAction: duplicateAction,
          autoRegisterSupervisors,
          autoRegisterProjects
        }
      );

      setCreatedBatchId(batchId);
      setImportedCount(res.count);
      setImportedTotalAmount(res.totalAmount);
      setCurrentStep(4);

      if (onSuccess) {
        onSuccess(batchId);
      }
    } catch (err: any) {
      alert(`Import Failed: ${err.message}`);
    }
  };

  // Filter preview rows
  const getFilteredRows = () => {
    if (!validationSummary) return [];
    if (previewFilter === 'valid') {
      return validationSummary.validatedRows.filter(r => r.isValid && !r.isDuplicate);
    }
    if (previewFilter === 'errors') {
      return validationSummary.validatedRows.filter(r => !r.isValid);
    }
    if (previewFilter === 'duplicates') {
      return validationSummary.validatedRows.filter(r => r.isDuplicate);
    }
    return validationSummary.validatedRows;
  };

  const filteredPreviewRows = getFilteredRows();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-md">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Bulk Import Expenses with Admin Approval
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700">
                  Batch Processor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload spreadsheets or paste tabular expenses with structured admin approval workflows
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Bar */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto w-full">
            <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>1</span>
              <span>Select Source</span>
            </div>
            <div className="w-6 h-[1px] bg-slate-800 hidden sm:block" />

            <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>2</span>
              <span>Mapping & Validation</span>
            </div>
            <div className="w-6 h-[1px] bg-slate-800 hidden sm:block" />

            <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>3</span>
              <span>Admin Approval</span>
            </div>
            <div className="w-6 h-[1px] bg-slate-800 hidden sm:block" />

            <div className={`flex items-center gap-1.5 ${currentStep === 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>4</span>
              <span>Batch Receipt</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* STEP 1: Data Source Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setInputTab('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      inputTab === 'upload'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File (.xlsx / .csv)
                  </button>
                  <button
                    onClick={() => setInputTab('paste')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      inputTab === 'paste'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Paste Tabular Data
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => DataImportService.downloadTemplate('HISTORICAL_EXPENSES', 'xlsx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Download Excel Template
                  </button>
                  <button
                    onClick={handleLoadSampleData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 text-xs font-bold border border-emerald-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Load Sample Batch
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              {inputTab === 'upload' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-950/20 scale-[0.99]'
                      : 'border-slate-700 hover:border-emerald-600/60 bg-slate-950/50 hover:bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg">
                    {isParsing ? (
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                    ) : (
                      <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mb-1">
                    {isParsing ? 'Parsing Spreadsheet...' : 'Drop your expense sheet here or click to browse'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
                    Auto-detects column headers like Date, Supervisor, Project, Category, and Amount.
                  </p>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
                    <span>Expected Columns: Date | Supervisor | Project | Category | Amount | Description</span>
                  </div>
                </div>
              )}

              {/* Paste Tab */}
              {inputTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      Paste cells from Excel or Google Sheets (Tab or comma separated):
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Include the header row at the top
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Date&#9;Supervisor&#9;Project&#9;Category&#9;Amount&#9;Description&#10;15/08/2026&#9;BUDDIKA&#9;PIDM 26&#9;5000 Construction Materials&#9;18500&#9;Purchased high-tensile wire"
                    className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-200 font-mono text-xs leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleProcessPastedText}
                      disabled={isParsing || !pastedText.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                    >
                      {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Parse Pasted Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Mapping & Validation Preview */}
          {currentStep === 2 && validationSummary && parsedData && (
            <div className="space-y-5">
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Total Rows</div>
                  <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">
                    {validationSummary.totalRows}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                  <div className="text-[11px] text-emerald-400 font-medium">Valid Records</div>
                  <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">
                    {validationSummary.validRowsCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Total Batch Sum</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    {formatLKR(
                      validationSummary.validatedRows
                        .filter(r => r.isValid)
                        .reduce((sum, r) => sum + (Number(r.mapped.AMOUNT) || 0), 0)
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60">
                  <div className="text-[11px] text-amber-400 font-medium">Duplicates Found</div>
                  <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">
                    {validationSummary.duplicatesCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60">
                  <div className="text-[11px] text-rose-400 font-medium">Rows with Errors</div>
                  <div className="text-xl font-bold text-rose-300 font-mono mt-0.5">
                    {validationSummary.errorsCount}
                  </div>
                </div>
              </div>

              {/* Column Mapping Accordion */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">Field Mapping Matrix</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    File: <strong className="text-slate-200">{parsedData.fileName}</strong> ({parsedData.fileSize})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {EXPENSE_FIELDS.filter(f => ['DATE', 'SUPERVISOR', 'PROJECT', 'EXPENSES_CATEGORY', 'AMOUNT', 'EXPENSES_DESCRIPTION'].includes(f.key)).map(field => (
                    <div key={field.key} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-rose-400">*</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{field.key}</span>
                      </div>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Unmapped --</option>
                        {parsedData.headers.map(header => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Rows Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-200">Preview Parsed Records</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      onClick={() => setPreviewFilter('all')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                        previewFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({validationSummary.totalRows})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('valid')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                        previewFilter === 'valid' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Valid ({validationSummary.validRowsCount})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('errors')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                        previewFilter === 'errors' ? 'bg-rose-900/60 text-rose-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Errors ({validationSummary.errorsCount})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('duplicates')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                        previewFilter === 'duplicates' ? 'bg-amber-900/60 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Duplicates ({validationSummary.duplicatesCount})
                    </button>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Supervisor</th>
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                        <th className="py-2.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-400">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((row) => (
                          <tr key={row.rowIndex} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-mono text-slate-400">{row.rowIndex}</td>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800"
                                  title={row.errors.map(e => e.message).join('\n')}
                                >
                                  <AlertCircle className="w-3 h-3" /> Error
                                </span>
                              )}
                              {row.isDuplicate && (
                                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                                  Duplicate
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-300">{row.mapped.DATE || '-'}</td>
                            <td className="py-2 px-3 font-semibold text-slate-200">{row.mapped.SUPERVISOR || '-'}</td>
                            <td className="py-2 px-3 text-emerald-400 font-bold">{row.mapped.PROJECT || '-'}</td>
                            <td className="py-2 px-3 text-slate-300 truncate max-w-[150px]">{row.mapped.EXPENSES_CATEGORY || '-'}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                              {row.mapped.AMOUNT ? formatLKR(Number(row.mapped.AMOUNT)) : '-'}
                            </td>
                            <td className="py-2 px-3 text-slate-300 truncate max-w-[200px]" title={row.mapped.EXPENSES_DESCRIPTION}>
                              {row.mapped.EXPENSES_DESCRIPTION || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Admin Approval Strategy & Posting Controls */}
          {currentStep === 3 && validationSummary && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Select Approval & Posting Strategy
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose whether to submit these expenses into the admin review queue or post directly as pre-approved
                </p>
              </div>

              {/* Approval Mode Choice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode 1: Direct Admin Pre-Approval */}
                <div
                  onClick={() => setApprovalMode('APPROVED')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    approvalMode === 'APPROVED'
                      ? 'border-emerald-500 bg-emerald-950/30 shadow-lg'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-900/60 border border-emerald-700 flex items-center justify-center text-emerald-300">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Instant Posting
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 mb-1">
                      Direct Admin Approval & Immediate Posting
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      All valid records will be imported with status <strong className="text-emerald-400">"Approved"</strong>, stamped with official Admin authorization, and immediately deducted from supervisor running balances.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Selected for Direct Final Posting</span>
                  </div>
                </div>

                {/* Mode 2: Submit for Admin Review */}
                <div
                  onClick={() => setApprovalMode('PENDING')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    approvalMode === 'PENDING'
                      ? 'border-amber-500 bg-amber-950/30 shadow-lg'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-900/60 border border-amber-700 flex items-center justify-center text-amber-300">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                        Pending Queue
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 mb-1">
                      Submit for Administrative Review (Pending Status)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Expenses will be placed in the <strong className="text-amber-400">"Pending Approval"</strong> state under a batch tag. They will not affect running cash balances until an Administrator signs off.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <ClockIcon className="w-4 h-4" />
                    <span>Queued for Administrator Review</span>
                  </div>
                </div>
              </div>

              {/* Admin Authorization PIN requirement if non-admin selects direct approval */}
              {approvalMode === 'APPROVED' && !isAdminSession && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <KeyRound className="w-4 h-4" />
                    <span>Admin Security Authorization Required</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Direct approved bulk posting requires an active Administrator session or authorization passcode (e.g., <code className="text-emerald-300 font-bold">ADMIN2026</code> or <code className="text-emerald-300 font-bold">EMA2026</code>).
                  </p>
                  <div className="max-w-xs">
                    <input
                      type="password"
                      placeholder="Enter Admin PIN (e.g. ADMIN2026)"
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setAdminPinError(null);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                    {adminPinError && (
                      <p className="text-[11px] text-rose-400 mt-1 font-medium">{adminPinError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Approver Details & Narrative */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Approving Officer / Performed By:
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="e.g. Eng. K. Perera (Finance Controller)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Approval Remarks / Audit Notes:
                  </label>
                  <input
                    type="text"
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    placeholder="e.g. Colombo & Havelock Site Week 34 bulk voucher batch"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Advanced Controls & Auto-Registration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300">Master Registry Automation</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRegisterSupervisors}
                      onChange={(e) => setAutoRegisterSupervisors(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                    />
                    <span>Auto-register new Supervisors in directory if absent from master records</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRegisterProjects}
                      onChange={(e) => setAutoRegisterProjects(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                    />
                    <span>Auto-register new Projects in database if absent from active project list</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipInvalidRows}
                      onChange={(e) => setSkipInvalidRows(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                    />
                    <span>Skip rows with errors and proceed with valid rows ({validationSummary.validRowsCount} valid)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Batch Receipt */}
          {currentStep === 4 && (
            <div className="py-6 px-4 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl animate-bounce">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  Bulk Expense Import Completed Successfully
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  The expense records have been processed and integrated into the Petty Cash master ledger.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Batch Identifier</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{createdBatchId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Records Imported</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{importedCount} vouchers</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Batch Amount</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{formatLKR(importedTotalAmount)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Posting Status</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    approvalMode === 'APPROVED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {approvalMode === 'APPROVED' ? 'Approved & Posted' : 'Pending Admin Sign-off'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Authorized By</span>
                  <span className="text-xs text-slate-300 font-medium">{approverName}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  Done & View Expenses List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 4 && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!validationSummary || validationSummary.validRowsCount === 0}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all"
              >
                Configure Approval ({validationSummary?.validRowsCount || 0} valid rows)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleCommitImport}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                Execute Bulk Import & {approvalMode === 'APPROVED' ? 'Approve' : 'Submit'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Simple Clock Icon helper for queued badge
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
