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
  Building2,
  Layers,
  Lock,
  KeyRound,
  DollarSign
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import {
  DataImportService,
  ParsedRawData,
  ValidationSummary,
  DuplicateAction,
  PROJECT_FIELDS
} from '../../services/dataImportService';
import { AdminSecurityService } from '../../services/adminSecurityService';

interface BulkImportProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (batchId: string) => void;
}

export const BulkImportProjectsModal: React.FC<BulkImportProjectsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    projects,
    supervisors,
    userRole,
    bulkImportProjects
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
  const [defaultStatus, setDefaultStatus] = useState<'Active' | 'On Hold' | 'Completed'>('Active');
  const [defaultPettyCashBudget, setDefaultPettyCashBudget] = useState<string>('500000');
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [approverName, setApproverName] = useState<string>(
    userRole === 'ADMIN' ? 'Head Office Project Director' : 'Senior Contracts Manager'
  );
  const [approvalRemarks, setApprovalRemarks] = useState<string>('Authorized project master directory bulk migration');
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('UPDATE');

  // Step 4: Result state
  const [importResult, setImportResult] = useState<{
    batchId: string;
    totalContractValue: number;
    count: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Format currency in LKR
  const formatLKR = (val: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // --- Step 1: Parsing Handler ---
  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const data = await DataImportService.parseFile(file);
      processParsedData(data);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse the selected project spreadsheet.');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteProcess = () => {
    if (!pastedText.trim()) {
      setParseError('Please paste tab or comma-separated tabular data from Excel or CSV.');
      return;
    }
    setIsParsing(true);
    setParseError(null);
    try {
      const data = DataImportService.parseRawText(pastedText);
      processParsedData(data);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse pasted data.');
    } finally {
      setIsParsing(false);
    }
  };

  const processParsedData = (data: ParsedRawData) => {
    setParsedData(data);
    const suggested = DataImportService.autoMapColumns('PROJECT_DIRECTORY', data.headers);
    setColumnMapping(suggested);

    // Initial validation
    const summary = DataImportService.validateDataset(
      'PROJECT_DIRECTORY',
      data.rows,
      suggested,
      {
        existingExpenses: [],
        existingProjects: projects,
        existingSupervisors: supervisors,
        existingCategories: []
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
        'PROJECT_DIRECTORY',
        parsedData.rows,
        updated,
        {
          existingExpenses: [],
          existingProjects: projects,
          existingSupervisors: supervisors,
          existingCategories: []
        }
      );
      setValidationSummary(summary);
    }
  };

  // --- Step 3: Admin Approval Verification & Execution ---
  const handleExecuteImport = async () => {
    setAdminPinError(null);

    // Admin PIN verification
    const pinCheck = await AdminSecurityService.verifyCode(adminPin);
    if (!pinCheck.success) {
      setAdminPinError(pinCheck.message || 'Invalid Master Admin PIN. Authorization required.');
      return;
    }

    if (!parsedData || !validationSummary) return;

    const batchId = `IMP-PRJ-${Date.now().toString().slice(-6)}`;

    try {
      const result = bulkImportProjects(batchId, validationSummary, {
        performedBy: approverName || 'Administrator',
        userRole: userRole || 'ADMIN',
        defaultStatus,
        defaultPettyCashBudget: Number(defaultPettyCashBudget) || 500000,
        approvalRemarks,
        fileName: parsedData.fileName,
        fileSize: parsedData.fileSize,
        skipInvalid: true,
        duplicateAction
      });

      setImportResult({
        batchId: result.batchRecord.id,
        totalContractValue: result.totalContractValue,
        count: result.count
      });

      setCurrentStep(4);
      if (onSuccess) onSuccess(result.batchRecord.id);
    } catch (err: any) {
      setAdminPinError(err.message || 'Project bulk import execution failed.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Bulk Import Project Master Directory</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Protected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Import site construction projects, client codes, contract values, and petty cash budget caps from Excel/CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className={`flex items-center gap-2 text-xs font-semibold ${currentStep >= 1 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                currentStep > 1 ? 'bg-blue-500 text-white border-blue-400' : currentStep === 1 ? 'bg-blue-500/20 text-blue-300 border-blue-500' : 'border-slate-700 bg-slate-800'
              }`}>
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span>1. File / Data Source</span>
            </div>

            <div className={`h-0.5 w-12 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`} />

            <div className={`flex items-center gap-2 text-xs font-semibold ${currentStep >= 2 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                currentStep > 2 ? 'bg-blue-500 text-white border-blue-400' : currentStep === 2 ? 'bg-blue-500/20 text-blue-300 border-blue-500' : 'border-slate-700 bg-slate-800'
              }`}>
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span>2. Map & Validate</span>
            </div>

            <div className={`h-0.5 w-12 ${currentStep >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`} />

            <div className={`flex items-center gap-2 text-xs font-semibold ${currentStep >= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                currentStep > 3 ? 'bg-blue-500 text-white border-blue-400' : currentStep === 3 ? 'bg-blue-500/20 text-blue-300 border-blue-500' : 'border-slate-700 bg-slate-800'
              }`}>
                {currentStep > 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
              </div>
              <span>3. Admin Authorization</span>
            </div>

            <div className={`h-0.5 w-12 ${currentStep >= 4 ? 'bg-emerald-400' : 'bg-slate-800'}`} />

            <div className={`flex items-center gap-2 text-xs font-semibold ${currentStep === 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                currentStep === 4 ? 'bg-emerald-500 text-white border-emerald-400' : 'border-slate-700 bg-slate-800'
              }`}>
                4
              </div>
              <span>4. Execution Summary</span>
            </div>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* ================= STEP 1: INGESTION ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Upload Project Master Spreadsheet</h3>
                  <p className="text-xs text-slate-400">Select an Excel (.xlsx / .xls) or CSV sheet, or paste tabular project records.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => DataImportService.downloadTemplate('PROJECT_DIRECTORY', 'xlsx')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    Template (.xlsx)
                  </button>
                  <button
                    onClick={() => DataImportService.downloadTemplate('PROJECT_DIRECTORY', 'csv')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Template (.csv)
                  </button>
                </div>
              </div>

              {/* Ingestion Tabs */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setInputTab('upload')}
                  className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    inputTab === 'upload'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Upload Document
                </button>
                <button
                  onClick={() => setInputTab('paste')}
                  className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                    inputTab === 'paste'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" /> Paste Excel / TSV Data
                </button>
              </div>

              {inputTab === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
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
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Click to choose or drag & drop Project Master spreadsheet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span>Fields: Project Code, Name, Client, Location, Contract Value, Budget</span>
                    <span>•</span>
                    <span>Max Size: 15MB</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste tabular project rows copied directly from Excel, Google Sheets, or CSV file here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePasteProcess}
                      disabled={isParsing || !pastedText.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                    >
                      {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      Parse Pasted Projects
                    </button>
                  </div>
                </div>
              )}

              {parseError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Import Error</p>
                    <p className="mt-0.5 text-rose-400">{parseError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: MAPPING & VALIDATION ================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* File details & Validation Metric Badges */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{parsedData?.fileName}</p>
                    <p className="text-xs text-slate-400">
                      {validationSummary?.totalRows} Total Projects • {parsedData?.headers.length} Source Columns
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validationSummary?.validRowsCount} Valid
                  </span>
                  {validationSummary && validationSummary.warningsCount > 0 && (
                    <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {validationSummary.warningsCount} Warnings
                    </span>
                  )}
                  {validationSummary && validationSummary.duplicatesCount > 0 && (
                    <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {validationSummary.duplicatesCount} Existing Projects
                    </span>
                  )}
                  {validationSummary && validationSummary.errorsCount > 0 && (
                    <span className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {validationSummary.errorsCount} Errors
                    </span>
                  )}
                </div>
              </div>

              {/* Column Mapping Section */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Header Column Mapping
                  </h4>
                  <span className="text-xs text-slate-400">Match file columns to Project schema</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROJECT_FIELDS.map((field) => {
                    const mappedCol = columnMapping[field.key] || '';
                    const isMatched = Boolean(mappedCol);

                    return (
                      <div
                        key={field.key}
                        className={`p-3 rounded-lg border transition ${
                          isMatched
                            ? 'bg-slate-900/60 border-slate-700/80'
                            : field.required
                            ? 'bg-rose-950/20 border-rose-800/40'
                            : 'bg-slate-900/30 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            {field.label}
                            {field.required && <span className="text-rose-400 font-bold">*</span>}
                          </label>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{field.type}</span>
                        </div>

                        <select
                          value={mappedCol}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Do Not Import / Skip --</option>
                          {parsedData?.headers.map((h) => (
                            <option key={h} value={h}>
                              Column: {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Rows Preview Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Project Validation Grid Preview
                    </span>
                    <span className="text-xs text-slate-500">({filteredRows.length} showing)</span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setPreviewFilter('all')}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        previewFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      All ({validationSummary?.totalRows})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('valid')}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        previewFilter === 'valid' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Valid ({validationSummary?.validRowsCount})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('duplicates')}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        previewFilter === 'duplicates' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Duplicates ({validationSummary?.duplicatesCount})
                    </button>
                    <button
                      onClick={() => setPreviewFilter('errors')}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        previewFilter === 'errors' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Errors ({validationSummary?.errorsCount})
                    </button>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3 font-semibold w-12 text-center">Row</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold">Project Code</th>
                        <th className="py-2 px-3 font-semibold">Project Name</th>
                        <th className="py-2 px-3 font-semibold">Client</th>
                        <th className="py-2 px-3 font-semibold">Contract Value (LKR)</th>
                        <th className="py-2 px-3 font-semibold">Petty Cash Budget</th>
                        <th className="py-2 px-3 font-semibold">Issues / Warnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
                      {filteredRows.map((row) => (
                        <tr key={row.rowIndex} className="hover:bg-slate-800/30 transition">
                          <td className="py-2 px-3 text-center text-slate-500">{row.rowIndex}</td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-sans text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-sans text-xs">
                                <AlertCircle className="w-3.5 h-3.5" /> Invalid
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-400">
                            {row.mapped['PROJECT_CODE'] || '<Missing>'}
                          </td>
                          <td className="py-2 px-3 text-slate-200">
                            {row.mapped['PROJECT_NAME'] || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {row.mapped['CLIENT'] || '—'}
                          </td>
                          <td className="py-2 px-3 text-emerald-400">
                            {formatLKR(Number(row.mapped['CONTRACT_VALUE']) || 0)}
                          </td>
                          <td className="py-2 px-3 text-amber-300">
                            {formatLKR(Number(row.mapped['PETTY_CASH_BUDGET']) || 500000)}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {row.errors.length > 0 && (
                              <span className="text-rose-400 block">{row.errors.map(e => e.error).join(', ')}</span>
                            )}
                            {row.warnings.length > 0 && (
                              <span className="text-amber-400 block">{row.warnings.map(w => w.error).join(', ')}</span>
                            )}
                            {row.errors.length === 0 && row.warnings.length === 0 && (
                              <span className="text-slate-500">Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ADMIN AUTHORIZATION ================= */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-300 text-xs">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-slate-100">Master Admin Authorization Required</h4>
                  <p className="mt-1 text-slate-300">
                    Bulk registering or altering project master codes affects site allocations, expense tagging across reports, and enterprise accounting balance limits.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-semibold text-slate-200">Import Policies & Settings</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Duplicate Project Code Policy
                    </label>
                    <select
                      value={duplicateAction}
                      onChange={(e) => setDuplicateAction(e.target.value as DuplicateAction)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="UPDATE">Update Existing Project Details & Budgets</option>
                      <option value="SKIP">Skip Existing Projects</option>
                      <option value="IMPORT_AS_NEW">Import with Generated Suffix</option>
                      <option value="CANCEL">Abort Import on Duplicate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Default Project Status
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => setDefaultStatus(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Active">Active (Ongoing Construction)</option>
                      <option value="On Hold">On Hold (Pending Commencement)</option>
                      <option value="Completed">Completed (Handed Over)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Fallback Petty Cash Budget (LKR)
                    </label>
                    <input
                      type="number"
                      value={defaultPettyCashBudget}
                      onChange={(e) => setDefaultPettyCashBudget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="500000"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Authorizing Officer / Manager
                    </label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="Enter authorizing manager's name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Batch Remarks / Project Audit Note
                  </label>
                  <textarea
                    rows={2}
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Optional administrative notes for this project bulk batch"
                  />
                </div>

                {/* Admin Master PIN Entry */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Enter Master Administrator PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPin}
                      onChange={(e) => {
                        setAdminPin(e.target.value);
                        setAdminPinError(null);
                      }}
                      placeholder="Enter 4-digit Master Security PIN"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                  {adminPinError && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {adminPinError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: SUMMARY & SUCCESS ================= */}
          {currentStep === 4 && importResult && (
            <div className="space-y-6 max-w-md mx-auto text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-100">Projects Imported Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Batch Reference: <span className="font-mono text-blue-400 font-semibold">{importResult.batchId}</span>
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-left space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Processed Projects:</span>
                  <span className="text-slate-200 font-bold">{importResult.count} Sites</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Combined Contract Value:</span>
                  <span className="text-emerald-400 font-bold font-mono">{formatLKR(importResult.totalContractValue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Import Policy:</span>
                  <span className="text-emerald-400 font-semibold">{duplicateAction}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Authorized By:</span>
                  <span className="text-slate-200">{approverName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200">{new Date().toLocaleString('en-GB')}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Close & View Project Directory
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
            >
              {currentStep === 4 ? 'Close' : 'Cancel'}
            </button>

            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!validationSummary || validationSummary.validRowsCount === 0}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                Proceed to Admin Authorization <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleExecuteImport}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950"
              >
                <ShieldCheck className="w-4 h-4" /> Authorize & Import Projects
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
