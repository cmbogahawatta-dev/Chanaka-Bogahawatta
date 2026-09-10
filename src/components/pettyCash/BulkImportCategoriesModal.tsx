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
  Layers,
  Lock,
  KeyRound,
  Tag,
  FolderTree
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import {
  DataImportService,
  ParsedRawData,
  ValidationSummary,
  DuplicateAction,
  CATEGORY_FIELDS
} from '../../services/dataImportService';
import { AdminSecurityService } from '../../services/adminSecurityService';

interface BulkImportCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (batchId: string) => void;
}

export const BulkImportCategoriesModal: React.FC<BulkImportCategoriesModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const {
    categories,
    userRole,
    bulkImportCategoriesDirect
  } = usePettyCash();
  const { currentRole } = useEnterprise();
  const isAuthorizedFinancialRole =
    currentRole === 'ADMIN' ||
    currentRole === 'FINANCE' ||
    currentRole === 'OWNER' ||
    userRole === 'ADMIN' ||
    userRole === 'FINANCE';

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
  const [defaultCostGroup, setDefaultCostGroup] = useState<string>('Direct Project Cost');
  const [defaultActiveStatus, setDefaultActiveStatus] = useState<boolean>(true);
  const [adminPin, setAdminPin] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [approverName, setApproverName] = useState<string>(
    userRole === 'ADMIN' ? 'Head Office Chief Accountant' : 'Accounts & Cost Control Lead'
  );
  const [approvalRemarks, setApprovalRemarks] = useState<string>('Authorized GL chart of accounts & expense category bulk import');
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('UPDATE');

  // Step 4: Result state
  const [importResult, setImportResult] = useState<{
    batchId: string;
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
      setParseError(err.message || 'Failed to parse the selected file.');
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
      setParseError(err.message || 'Failed to parse pasted data.');
    } finally {
      setIsParsing(false);
    }
  };

  const processParsedData = (data: ParsedRawData) => {
    setParsedData(data);
    const suggested = DataImportService.autoMapColumns('CATEGORY_DIRECTORY', data.headers);
    setColumnMapping(suggested);

    // Initial validation
    const summary = DataImportService.validateDataset(
      'CATEGORY_DIRECTORY',
      data.rows,
      suggested,
      {
        existingExpenses: [],
        existingProjects: [],
        existingSupervisors: [],
        existingCategories: categories
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
        'CATEGORY_DIRECTORY',
        parsedData.rows,
        updated,
        {
          existingExpenses: [],
          existingProjects: [],
          existingSupervisors: [],
          existingCategories: categories
        }
      );
      setValidationSummary(summary);
    }
  };

  // --- Step 3: Admin Approval & Execute ---
  const handleExecuteImport = async () => {
    setAdminPinError(null);

    // Verify Admin PIN if required or role requires validation
    if (adminPin.trim()) {
      const pinCheck = await AdminSecurityService.verifyCode(adminPin.trim());
      if (!pinCheck.success && adminPin.trim() !== '1234') {
        setAdminPinError(pinCheck.message || 'Invalid Master Admin PIN. Authorization required.');
        return;
      }
    }

    if (!validationSummary || !parsedData) return;

    // Filter rows based on validity
    const rowsToImport = validationSummary.validatedRows
      .filter(r => r.isValid)
      .map(r => {
        const rawCode = String(r.mapped.CATEGORY_CODE || '').trim();
        const rawName = String(r.mapped.CATEGORY_NAME || '').trim();
        const code = rawCode;
        const name = rawName || `${code} Category`;
        const group = r.mapped.CATEGORY_GROUP || defaultCostGroup;
        const desc = r.mapped.DESCRIPTION || '';
        const active = r.mapped.ACTIVE !== undefined ? Boolean(r.mapped.ACTIVE) : defaultActiveStatus;

        return {
          CATEGORY_CODE: code,
          CATEGORY_NAME: name,
          CATEGORY_GROUP: group,
          DESCRIPTION: desc,
          REMARKS: desc,
          ACTIVE: active
        };
      });

    if (rowsToImport.length === 0) {
      setAdminPinError('No valid category records available to import. Please review mapping and source data.');
      return;
    }

    const actionMap: 'skip' | 'update' | 'append' =
      duplicateAction === 'SKIP' ? 'skip' : duplicateAction === 'UPDATE' ? 'update' : 'append';

    const result = bulkImportCategoriesDirect(rowsToImport, actionMap);

    setImportResult({
      batchId: result.batchId,
      count: result.count
    });

    if (onSuccess) {
      onSuccess(result.batchId);
    }

    setCurrentStep(4);
  };

  // Filtered rows for step 2 preview
  const getFilteredRows = () => {
    if (!validationSummary) return [];
    switch (previewFilter) {
      case 'valid':
        return validationSummary.validatedRows.filter(r => r.isValid && !r.isDuplicate);
      case 'duplicates':
        return validationSummary.validatedRows.filter(r => r.isDuplicate);
      case 'errors':
        return validationSummary.validatedRows.filter(r => !r.isValid);
      default:
        return validationSummary.validatedRows;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Bulk Import GL Expense Categories
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Master Accounting Directory
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Import general ledger cost classification, expense categories, and accounting codes from Excel or CSV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Stepper */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-8 w-full max-w-3xl mx-auto">
            {[
              { step: 1, label: 'Source File', icon: FileSpreadsheet },
              { step: 2, label: 'Mapping & Preview', icon: Eye },
              { step: 3, label: 'Approval & Settings', icon: ShieldCheck },
              { step: 4, label: 'Complete', icon: CheckCircle2 }
            ].map(({ step, label, icon: Icon }) => {
              const isActive = currentStep === step;
              const isPast = currentStep > step;
              return (
                <div key={step} className="flex-1 flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : isActive
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : step}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </span>
                  {step < 4 && (
                    <div
                      className={`flex-1 h-0.5 ml-2 ${
                        isPast ? 'bg-emerald-500/50' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: SOURCE SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Template Download Prompt */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Need the GL Category Import Template?</h4>
                    <p className="text-xs text-slate-400">
                      Download pre-structured templates with standard Sri Lankan construction GL cost codes & validation rules.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => DataImportService.downloadTemplate('CATEGORY_DIRECTORY', 'xlsx')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => DataImportService.downloadTemplate('CATEGORY_DIRECTORY', 'csv')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Template</span>
                  </button>
                </div>
              </div>

              {/* Source Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setInputTab('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    inputTab === 'upload'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Spreadsheet (.xlsx / .csv)</span>
                </button>
                <button
                  onClick={() => setInputTab('paste')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    inputTab === 'paste'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Paste Tabular Data</span>
                </button>
              </div>

              {parseError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{parseError}</span>
                </div>
              )}

              {inputTab === 'upload' ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {isParsing ? 'Analyzing and validating file...' : 'Choose or drag & drop spreadsheet'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 25MB.
                  </p>
                  <button
                    type="button"
                    disabled={isParsing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isParsing ? 'Reading Columns...' : 'Browse File'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Paste raw tabular cells copied from Excel or Google Sheets (Tab or Comma delimited):</span>
                    {pastedText && (
                      <span className="text-emerald-400 font-mono">
                        {pastedText.trim().split('\n').length} rows detected
                      </span>
                    )}
                  </div>
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder={`GL Code\tCategory Name\tCost Group\tDescription\n5000\tConstruction Materials\tDirect Project Cost\tAggregates, cement, sand, reinforcing steel\n5010\tMain Materials (VAT Purchase)\tDirect Project Cost\tDirect VAT registered commercial bulk materials\n6010\tSite Office Rent & Utilities\tSite Overheads\tElectricity, water, and temporary site rentals\n7020\tPrinting & Stationery\tAdmin & Head Office\tPaper, ink, blueprint printing`}
                    rows={10}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePasteProcess}
                      disabled={isParsing || !pastedText.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <span>{isParsing ? 'Processing Cells...' : 'Parse & Validate Data'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MAPPING & PREVIEW */}
          {currentStep === 2 && validationSummary && parsedData && (
            <div className="space-y-6">
              {/* Mapping Controls Box */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Column Field Mapping</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Source File: <strong className="text-slate-200 font-mono">{parsedData.fileName}</strong> ({parsedData.rows.length} rows)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORY_FIELDS.map(f => {
                    const currentMatch = columnMapping[f.key] || '';
                    const isMapped = Boolean(currentMatch);
                    return (
                      <div
                        key={f.key}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                          isMapped
                            ? 'bg-slate-900/80 border-slate-700'
                            : f.required
                            ? 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-1">
                            {f.label}
                            {f.required && <span className="text-rose-400 font-bold">*</span>}
                          </span>
                          {isMapped ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Mapped
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {f.required ? 'Required' : 'Optional'}
                            </span>
                          )}
                        </div>

                        <select
                          value={currentMatch}
                          onChange={e => handleMappingChange(f.key, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">-- Select File Column --</option>
                          {parsedData.headers.map(h => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-500 truncate">{f.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validation Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setPreviewFilter('all')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'all'
                      ? 'bg-slate-800 border-slate-500 shadow-md'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 block font-medium">Total Rows</span>
                  <span className="text-xl font-bold text-white font-mono mt-1 block">
                    {validationSummary.totalRows}
                  </span>
                </div>

                <div
                  onClick={() => setPreviewFilter('valid')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'valid'
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] text-emerald-400 block font-medium">Ready to Import</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
                    {validationSummary.validRowsCount}
                  </span>
                </div>

                <div
                  onClick={() => setPreviewFilter('duplicates')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'duplicates'
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-md'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] text-amber-400 block font-medium">Existing / Duplicates</span>
                  <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">
                    {validationSummary.duplicatesCount}
                  </span>
                </div>

                <div
                  onClick={() => setPreviewFilter('errors')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'errors'
                      ? 'bg-rose-950/40 border-rose-500/80 shadow-md'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-[11px] text-rose-400 block font-medium">Validation Errors</span>
                  <span className="text-xl font-bold text-rose-400 font-mono mt-1 block">
                    {validationSummary.errorsCount}
                  </span>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-700/80 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-800/70 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Preview Data ({getFilteredRows().length} rows showing)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Filter: <strong className="text-emerald-400 capitalize">{previewFilter}</strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Required fields: <span className="text-emerald-400 font-mono">GL Code, Category Name</span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-850 text-slate-300 font-semibold sticky top-0 z-10 border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">Row</th>
                        <th className="py-2.5 px-3 w-28">Status</th>
                        <th className="py-2.5 px-3">GL Code</th>
                        <th className="py-2.5 px-3">Category Name</th>
                        <th className="py-2.5 px-3">Cost Group</th>
                        <th className="py-2.5 px-3">Description / Remarks</th>
                        <th className="py-2.5 px-3">Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {getFilteredRows().length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        getFilteredRows().map((row, idx) => {
                          const hasError = !row.isValid;
                          const isDup = row.isDuplicate;

                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-800/50 transition-colors ${
                                hasError
                                  ? 'bg-rose-950/20'
                                  : isDup
                                  ? 'bg-amber-950/10'
                                  : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center text-slate-500 font-mono">
                                {row.rowIndex}
                              </td>
                              <td className="py-2 px-3">
                                {hasError ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    <AlertCircle className="w-3 h-3" /> Error
                                  </span>
                                ) : isDup ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <AlertTriangle className="w-3 h-3" /> Existing
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <Check className="w-3 h-3" /> Valid
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-400">
                                {row.mapped.CATEGORY_CODE || (
                                  <span className="text-rose-400 italic font-sans">Missing code</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-100">
                                {row.mapped.CATEGORY_NAME || (
                                  <span className="text-rose-400 italic">Missing name</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-300">
                                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 border border-slate-700">
                                  {row.mapped.CATEGORY_GROUP || defaultCostGroup}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                                {row.mapped.DESCRIPTION || '-'}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.mapped.ACTIVE !== false
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-700 text-slate-400'
                                }`}>
                                  {row.mapped.ACTIVE !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
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

          {/* STEP 3: APPROVAL & IMPORT SETTINGS */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Import Configuration & Authorization</h3>
                    <p className="text-xs text-slate-400">
                      Configure duplicate handling rules and authorize directory updates.
                    </p>
                  </div>
                </div>

                {/* Duplicate Handling */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Duplicate GL Code Handling Strategy:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        action: 'UPDATE',
                        title: 'Update Existing',
                        desc: 'Overwrite category title, group & description for matching GL codes.'
                      },
                      {
                        action: 'SKIP',
                        title: 'Skip Existing',
                        desc: 'Leave existing categories untouched and only import new GL codes.'
                      },
                      {
                        action: 'IMPORT_AS_NEW',
                        title: 'Append Always',
                        desc: 'Create new separate entries regardless of existing codes.'
                      }
                    ].map(opt => (
                      <div
                        key={opt.action}
                        onClick={() => setDuplicateAction(opt.action as DuplicateAction)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          duplicateAction === opt.action
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-slate-900/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{opt.title}</span>
                          <input
                            type="radio"
                            checked={duplicateAction === opt.action}
                            onChange={() => setDuplicateAction(opt.action as DuplicateAction)}
                            className="accent-emerald-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Default Fallback Cost Group */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Default Cost Classification (for rows without specified group):
                  </label>
                  <select
                    value={defaultCostGroup}
                    onChange={e => setDefaultCostGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Direct Project Cost">Direct Project Cost (Site materials, fuel, subcontracts, machinery)</option>
                    <option value="Site Overheads">Site Overheads (Lodging, site utilities, safety PPE, meals)</option>
                    <option value="Admin & Head Office">Admin & Head Office (Printing, stationery, communication)</option>
                    <option value="Special / Non-Project">Special / Non-Project (Emergency disbursements, special approvals)</option>
                  </select>
                </div>

                {/* Approver Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Authorized By:</label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={e => setApproverName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Audit Remarks:</label>
                    <input
                      type="text"
                      value={approvalRemarks}
                      onChange={e => setApprovalRemarks(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Admin Security PIN Authorization */}
                <div className="pt-3 border-t border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Admin Authorization PIN</span>
                    </label>
                    <span className="text-[11px] text-emerald-400/80 font-mono">
                      (Demo PIN: 1234)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={adminPin}
                      onChange={e => {
                        setAdminPin(e.target.value);
                        setAdminPinError(null);
                      }}
                      placeholder="Enter 4-digit PIN (e.g. 1234)"
                      className={`w-full bg-slate-950 border rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-200 font-mono tracking-widest focus:outline-none ${
                        adminPinError
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                  {adminPinError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{adminPinError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED SUMMARY */}
          {currentStep === 4 && importResult && (
            <div className="space-y-6 max-w-xl mx-auto py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Categories Bulk Import Completed</h3>
                <p className="text-xs text-slate-400 mt-1">
                  General Ledger expense categories have been successfully verified and committed to the system master database.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Migration Batch ID:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    {importResult.batchId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Committed Category Records:</span>
                  <span className="font-bold text-white font-mono">{importResult.count} categories</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Duplicate Handling Strategy:</span>
                  <span className="font-semibold text-slate-300">{duplicateAction}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Authorized Approver:</span>
                  <span className="font-semibold text-slate-300">{approverName}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setParsedData(null);
                    setPastedText('');
                    setValidationSummary(null);
                    setImportResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                >
                  Import Another Batch
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  Done / View Categories
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {currentStep < 4 && (
          <div className="px-6 py-3.5 bg-slate-850 border-t border-slate-700/80 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep((currentStep - 1) as any)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>

              {currentStep === 2 && (
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!validationSummary || validationSummary.validRowsCount === 0}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <span>Continue to Approval</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  onClick={handleExecuteImport}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Import Categories</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
