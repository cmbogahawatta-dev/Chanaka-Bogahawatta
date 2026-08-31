import React, { useState, useRef } from 'react';
import {
  Database,
  ShieldCheck,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  FileText,
  Building2,
  Users,
  Receipt,
  Layers,
  History,
  Lock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Check,
  Trash2,
  BookmarkPlus,
  HelpCircle,
  FileCheck2
} from 'lucide-react';
import { usePettyCash } from '../../../context/PettyCashContext';
import {
  ImportType,
  DuplicateAction,
  ImportBatchRecord,
  ImportErrorDetail,
  MappingTemplate,
  PettyCashNavTab
} from '../../../types/pettyCashTypes';
import {
  dataImportService,
  ParsedRawData,
  ValidationSummary,
  FieldDefinition
} from '../../../services/dataImportService';
import { adminSecurityService } from '../../../services/adminSecurityService';
import { AdminSecurityModal } from './AdminSecurityModal';
import { DownloadTemplatesModal } from './DownloadTemplatesModal';

interface AdminDataImportViewProps {
  onNavigateTab: (tab: PettyCashNavTab) => void;
  onLockSecuritySession: () => void;
}

export const AdminDataImportView: React.FC<AdminDataImportViewProps> = ({
  onNavigateTab,
  onLockSecuritySession
}) => {
  const {
    expenses,
    projects,
    supervisors,
    categories,
    importBatches,
    mappingTemplates,
    importBatchData,
    rollbackImportBatch,
    saveMappingTemplate,
    deleteMappingTemplate,
    userRole,
    setFilters
  } = usePettyCash();

  // Top sub-view tabs
  const [activeSubTab, setActiveSubTab] = useState<'wizard' | 'history' | 'templates' | 'downloads'>('wizard');

  // Wizard state (Steps 1 to 8)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedImportType, setSelectedImportType] = useState<ImportType>('HISTORICAL_EXPENSES');

  // Upload file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRawData | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column Mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);

  // Validation state
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('SKIP');
  const [skipInvalidRows, setSkipInvalidRows] = useState<boolean>(true);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'ERRORS' | 'DUPLICATES'>('ALL');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [latestBatchRecord, setLatestBatchRecord] = useState<ImportBatchRecord | null>(null);

  // Rollback Modal state
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState<boolean>(false);
  const [batchToRollback, setBatchToRollback] = useState<ImportBatchRecord | null>(null);
  const [rollbackStatusMsg, setRollbackStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Download Templates Modal state
  const [isDownloadTemplatesModalOpen, setIsDownloadTemplatesModalOpen] = useState<boolean>(false);
  const [downloadModalDefaultType, setDownloadModalDefaultType] = useState<ImportType>('HISTORICAL_EXPENSES');

  // Overall statistics
  const totalImportedRecords = importBatches.reduce((acc, b) => acc + (b.status !== 'ROLLED_BACK' ? b.importedRows : 0), 0);
  const totalActiveBatches = importBatches.filter(b => b.status !== 'ROLLED_BACK').length;

  // ----------------------------------------------------
  // Handlers
  // ----------------------------------------------------

  const handleSelectImportType = (type: ImportType) => {
    setSelectedImportType(type);
    setCurrentStep(2);
  };

  const handleFileUpload = async (file: File) => {
    setIsParsing(true);
    setParseError('');
    setUploadedFile(file);

    try {
      const parsed = await dataImportService.parseFile(file);
      setParsedData(parsed);

      // Auto-suggest column mapping
      const autoMapping = dataImportService.autoMapColumns(selectedImportType, parsed.headers);
      setColumnMapping(autoMapping);

      setCurrentStep(3);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file. Please upload a valid .xlsx or .csv spreadsheet.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplyMapping = () => {
    if (!parsedData) return;

    const summary = dataImportService.validateDataset(
      selectedImportType,
      parsedData.rows,
      columnMapping,
      {
        existingExpenses: expenses,
        existingProjects: projects,
        existingSupervisors: supervisors,
        existingCategories: categories
      }
    );

    setValidationSummary(summary);
    setCurrentStep(4);
  };

  const handleSaveCurrentTemplate = () => {
    if (!templateNameInput.trim()) return;
    saveMappingTemplate({
      name: templateNameInput.trim(),
      importType: selectedImportType,
      mappings: columnMapping
    });
    setTemplateNameInput('');
    setIsSavingTemplate(false);
  };

  const handleLoadTemplate = (tmpl: MappingTemplate) => {
    setColumnMapping(tmpl.mappings);
  };

  const handleExecuteImport = async () => {
    if (!validationSummary || !parsedData) return;

    setIsProcessing(true);
    setCurrentStep(6);
    setProcessProgress(20);

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const batchId = `IMP-${todayStr}-${randomSuffix}`;

    setTimeout(() => {
      setProcessProgress(60);
    }, 400);

    setTimeout(() => {
      setProcessProgress(90);

      try {
        const batch = importBatchData(
          batchId,
          selectedImportType,
          validationSummary,
          duplicateAction,
          {
            performedBy: `Administrator (${userRole})`,
            userRole,
            fileName: parsedData.fileName,
            fileSize: parsedData.fileSize,
            skipInvalid: skipInvalidRows
          }
        );

        setLatestBatchRecord(batch);
        setProcessProgress(100);
        setIsProcessing(false);
        setCurrentStep(8);
      } catch (err: any) {
        alert(`Import processing error: ${err.message}`);
        setIsProcessing(false);
        setCurrentStep(4);
      }
    }, 900);
  };

  const handleTriggerRollback = (batch: ImportBatchRecord) => {
    setBatchToRollback(batch);
    setIsRollbackModalOpen(true);
  };

  const handleConfirmRollback = () => {
    if (!batchToRollback) return;
    const res = rollbackImportBatch(batchToRollback.id, `Administrator (${userRole})`);
    setIsRollbackModalOpen(false);
    if (res.success) {
      setRollbackStatusMsg({ type: 'success', text: res.message });
    } else {
      setRollbackStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleResetWizard = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setParsedData(null);
    setValidationSummary(null);
    setLatestBatchRecord(null);
    setParseError('');
    setColumnMapping({});
  };

  const handleNavigateToImportedExpenses = () => {
    setFilters(prev => ({
      ...prev,
      dataSource: 'HISTORICAL'
    }));
    onNavigateTab('expenses');
  };

  const fieldsForCurrentType = dataImportService.getFieldsForType(selectedImportType);

  return (
    <div className="space-y-5">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-400">
                  Admin Migration Console
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Security Verified
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                DATA IMPORT & MIGRATION
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Unified Historical Petty Cash Data Migration, Project Matrix & Supervisor Directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="admin-download-templates-btn"
              onClick={() => {
                setDownloadModalDefaultType(selectedImportType);
                setIsDownloadTemplatesModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Templates</span>
            </button>

            <button
              id="admin-lock-session-btn"
              onClick={onLockSecuritySession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock Admin Session</span>
            </button>
          </div>
        </div>

        {/* Global Migration Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Imported</span>
            <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
              {totalImportedRecords.toLocaleString()} <span className="text-xs font-normal text-slate-400">records</span>
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Batches</span>
            <p className="text-base sm:text-lg font-black text-slate-100 mt-0.5">
              {totalActiveBatches} <span className="text-xs font-normal text-slate-400">batches</span>
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saved Templates</span>
            <p className="text-base sm:text-lg font-black text-blue-400 mt-0.5">
              {mappingTemplates.length} <span className="text-xs font-normal text-slate-400">formats</span>
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Last Migration</span>
            <p className="text-xs font-bold text-slate-200 mt-1 truncate">
              {importBatches[0] ? importBatches[0].id : 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('wizard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'wizard'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Import Wizard</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'history'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Import History & Rollback</span>
          {importBatches.length > 0 && (
            <span className="text-[10px] bg-slate-950/80 px-1.5 py-0.2 rounded-full font-bold">
              {importBatches.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'templates'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Saved Mapping Templates</span>
        </button>

        <button
          onClick={() => setActiveSubTab('downloads')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'downloads'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sample Templates</span>
        </button>
      </div>

      {rollbackStatusMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            rollbackStatusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700/80 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {rollbackStatusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{rollbackStatusMsg.text}</span>
          </div>
          <button
            onClick={() => setRollbackStatusMsg(null)}
            className="text-xs hover:underline text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. IMPORT WIZARD SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'wizard' && (
        <div className="space-y-6">
          {/* Wizard Step Progress Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs font-semibold">
              {[
                { step: 1, label: '1. Select Type' },
                { step: 2, label: '2. Upload File' },
                { step: 3, label: '3. Map Columns' },
                { step: 4, label: '4. Validate & Preview' },
                { step: 6, label: '5. Confirm & Import' },
                { step: 8, label: '6. Completed' }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <div
                    key={s.step}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold'
                        : isPassed
                        ? 'text-emerald-400 bg-emerald-950/50'
                        : 'text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------- STEP 1: Select Type ---------------- */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <p className="font-bold text-slate-100 text-sm mb-0.5">Select Migration Module or Download Templates</p>
                  <p className="text-xs text-slate-400">
                    Need standard spreadsheets with validation requirements? Download pre-formatted .xlsx templates with sample records.
                  </p>
                </div>
                <button
                  id="step1-download-templates-btn"
                  onClick={() => {
                    setDownloadModalDefaultType(selectedImportType);
                    setIsDownloadTemplatesModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Templates (.xlsx)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 01 Historical Expenses */}
                <div
                  id="import-opt-expenses"
                  onClick={() => handleSelectImportType('HISTORICAL_EXPENSES')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/30 group flex flex-col justify-between ${
                    selectedImportType === 'HISTORICAL_EXPENSES'
                      ? 'bg-gradient-to-b from-slate-900 to-emerald-950/40 border-emerald-500'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                        Option 01
                      </span>
                      <Receipt className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      Historical Expense Import
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Import historical petty cash expense logs, physical vouchers, and project expenses. Automatically marked with <span className="text-emerald-400 font-mono">HISTORICAL_IMPORT</span> and preserves original transaction dates.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      id="btn-download-exp-template-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        dataImportService.downloadTemplate('HISTORICAL_EXPENSES', 'xlsx');
                      }}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Download Historical Expenses Excel Template"
                    >
                      <Download className="w-3 h-3" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <span>Configure</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* 02 Project Directory */}
                <div
                  id="import-opt-projects"
                  onClick={() => handleSelectImportType('PROJECT_DIRECTORY')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:border-blue-500 hover:shadow-xl hover:shadow-blue-950/30 group flex flex-col justify-between ${
                    selectedImportType === 'PROJECT_DIRECTORY'
                      ? 'bg-gradient-to-b from-slate-900 to-blue-950/40 border-blue-500'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                        Option 02
                      </span>
                      <Building2 className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                      Project Directory Import
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Import or bulk-synchronize Master Project Codes, client names, sites, contract values, and allocated petty cash limits into the Project Matrix.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      id="btn-download-proj-template-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        dataImportService.downloadTemplate('PROJECT_DIRECTORY', 'xlsx');
                      }}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Download Project Directory Excel Template"
                    >
                      <Download className="w-3 h-3" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs text-blue-400 font-bold">
                      <span>Configure</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* 03 Supervisor Directory */}
                <div
                  id="import-opt-supervisors"
                  onClick={() => handleSelectImportType('SUPERVISOR_DIRECTORY')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer hover:border-purple-500 hover:shadow-xl hover:shadow-purple-950/30 group flex flex-col justify-between ${
                    selectedImportType === 'SUPERVISOR_DIRECTORY'
                      ? 'bg-gradient-to-b from-slate-900 to-purple-950/40 border-purple-500'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                        Option 03
                      </span>
                      <Users className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                      Supervisor Directory Import
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Import site supervisors, employee contact numbers, initial cash float opening balances, and default site/project assignments.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      id="btn-download-sup-template-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        dataImportService.downloadTemplate('SUPERVISOR_DIRECTORY', 'xlsx');
                      }}
                      className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Download Supervisor Directory Excel Template"
                    >
                      <Download className="w-3 h-3" />
                      <span>Excel (.xlsx)</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs text-purple-400 font-bold">
                      <span>Configure</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- STEP 2: Upload File ---------------- */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Type Selection</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-step2-download-template-xlsx"
                    onClick={() => dataImportService.downloadTemplate(selectedImportType, 'xlsx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel Template (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => {
                      setDownloadModalDefaultType(selectedImportType);
                      setIsDownloadTemplatesModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All Templates</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 sm:p-12 text-center bg-slate-900/60 hover:bg-slate-900/90 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  Drag and drop your Excel or CSV file here
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto">
                  Supports <span className="text-slate-200 font-mono">.xlsx</span>,{' '}
                  <span className="text-slate-200 font-mono">.xls</span>, and{' '}
                  <span className="text-slate-200 font-mono">.csv</span> with automatic header detection.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Browse Spreadsheet File</span>
                </div>
              </div>

              {isParsing && (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3 text-xs text-emerald-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing spreadsheet and extracting column structure...</span>
                </div>
              )}

              {parseError && (
                <div className="p-4 bg-rose-950/80 rounded-xl border border-rose-800 flex items-center gap-3 text-xs text-rose-300">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* ---------------- STEP 3: Column Mapping ---------------- */}
          {currentStep === 3 && parsedData && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Change File</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Saved Templates Loader */}
                  {mappingTemplates.filter(t => t.importType === selectedImportType).length > 0 && (
                    <select
                      onChange={(e) => {
                        const found = mappingTemplates.find(t => t.id === e.target.value);
                        if (found) handleLoadTemplate(found);
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Load Saved Mapping Template...</option>
                      {mappingTemplates
                        .filter(t => t.importType === selectedImportType)
                        .map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                  )}

                  <button
                    onClick={() => setIsSavingTemplate(!isSavingTemplate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save This Mapping</span>
                  </button>
                </div>
              </div>

              {isSavingTemplate && (
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="Enter template name (e.g. Previous 2024 Accounting Excel)..."
                    value={templateNameInput}
                    onChange={(e) => setTemplateNameInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleSaveCurrentTemplate}
                    disabled={!templateNameInput.trim()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                  >
                    Save Template
                  </button>
                </div>
              )}

              {/* Uploaded File Info Card */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">{parsedData.fileName}</span>
                  <span className="text-slate-500 font-mono">({parsedData.fileSize}, {parsedData.rows.length} rows)</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  {parsedData.headers.length} Columns Detected
                </span>
              </div>

              {/* Mapping Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/60">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Match Spreadsheet Columns to EMA Target Fields
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Our smart mapper automatically matches common column aliases. Adjust any dropdown if necessary.
                  </p>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {fieldsForCurrentType.map((field) => {
                    const mappedCol = columnMapping[field.key] || '';
                    return (
                      <div key={field.key} className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                        {/* Target Field Info */}
                        <div className="sm:col-span-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-100">{field.label}</span>
                            {field.required ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Optional</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{field.description}</p>
                        </div>

                        {/* Arrow */}
                        <div className="hidden sm:flex sm:col-span-1 justify-center text-slate-500">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Source Column Selector */}
                        <div className="sm:col-span-6">
                          <select
                            value={mappedCol}
                            onChange={(e) => {
                              setColumnMapping(prev => ({
                                ...prev,
                                [field.key]: e.target.value
                              }));
                            }}
                            className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors ${
                              mappedCol
                                ? 'bg-slate-950 border-emerald-700/80 text-emerald-300 font-semibold'
                                : field.required
                                ? 'bg-slate-950 border-rose-800/80 text-rose-300'
                                : 'bg-slate-950 border-slate-700 text-slate-400'
                            }`}
                          >
                            <option value="">-- Do Not Import / Not in File --</option>
                            {parsedData.headers.map(h => (
                              <option key={h} value={h}>
                                Column: {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Back
                </button>
                <button
                  id="btn-validate-mapped-data"
                  onClick={handleApplyMapping}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all active:scale-95"
                >
                  <span>Validate & Preview Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 4 & 5: Validate & Preview ---------------- */}
          {currentStep === 4 && validationSummary && parsedData && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Column Mapping</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dataImportService.exportErrorReport('VAL-PREVIEW', selectedImportType, validationSummary, 'xlsx')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Error Report (Excel)</span>
                  </button>
                </div>
              </div>

              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div
                  onClick={() => setPreviewFilter('ALL')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'ALL'
                      ? 'bg-slate-900 border-emerald-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows</span>
                  <p className="text-lg font-black text-slate-100 mt-0.5">{validationSummary.totalRows}</p>
                </div>

                <div
                  onClick={() => setPreviewFilter('VALID')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'VALID'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Valid Rows</span>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{validationSummary.validRowsCount}</p>
                </div>

                <div
                  onClick={() => setPreviewFilter('ERRORS')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'ERRORS'
                      ? 'bg-rose-950/40 border-rose-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-rose-400">Invalid Rows</span>
                  <p className="text-lg font-black text-rose-400 mt-0.5">{validationSummary.errorsCount}</p>
                </div>

                <div className="p-3.5 rounded-xl border bg-slate-900/60 border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Warnings</span>
                  <p className="text-lg font-black text-amber-400 mt-0.5">{validationSummary.warningsCount}</p>
                </div>

                <div
                  onClick={() => setPreviewFilter('DUPLICATES')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    previewFilter === 'DUPLICATES'
                      ? 'bg-blue-950/40 border-blue-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-blue-400">Duplicates</span>
                  <p className="text-lg font-black text-blue-400 mt-0.5">{validationSummary.duplicatesCount}</p>
                </div>
              </div>

              {/* Duplicate Handling Control */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Duplicate Conflict Resolution Strategy
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      When a record matches an existing ID or Voucher Number in the EMA database:
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setDuplicateAction('SKIP')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        duplicateAction === 'SKIP'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Skip Duplicate (Default)
                    </button>
                    <button
                      onClick={() => setDuplicateAction('UPDATE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        duplicateAction === 'UPDATE'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Update Existing
                    </button>
                    <button
                      onClick={() => setDuplicateAction('IMPORT_AS_NEW')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        duplicateAction === 'IMPORT_AS_NEW'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Import as New
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <input
                    type="checkbox"
                    id="chk-skip-invalid-rows"
                    checked={skipInvalidRows}
                    onChange={(e) => setSkipInvalidRows(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 focus:outline-none bg-slate-950 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="chk-skip-invalid-rows" className="text-xs text-slate-300 cursor-pointer">
                    Skip uncorrected invalid rows and import all valid records into the database
                  </label>
                </div>
              </div>

              {/* Data Table Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Row Preview ({validationSummary.validatedRows.length} rows)
                    </span>
                    <span className="text-[10px] text-slate-500">Filter: {previewFilter}</span>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Row #</th>
                        <th className="py-2.5 px-3">Status</th>
                        {selectedImportType === 'HISTORICAL_EXPENSES' && (
                          <>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Supervisor</th>
                            <th className="py-2.5 px-3">Project</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-right">Amount (LKR)</th>
                            <th className="py-2.5 px-3">Payment Source</th>
                          </>
                        )}
                        {selectedImportType === 'PROJECT_DIRECTORY' && (
                          <>
                            <th className="py-2.5 px-3">Project Code</th>
                            <th className="py-2.5 px-3">Project Name</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Location</th>
                            <th className="py-2.5 px-3 text-right">Contract Value</th>
                          </>
                        )}
                        {selectedImportType === 'SUPERVISOR_DIRECTORY' && (
                          <>
                            <th className="py-2.5 px-3">Supervisor ID</th>
                            <th className="py-2.5 px-3">Full Name</th>
                            <th className="py-2.5 px-3">Phone</th>
                            <th className="py-2.5 px-3">Assigned Site</th>
                            <th className="py-2.5 px-3 text-right">Opening Cash Float</th>
                          </>
                        )}
                        <th className="py-2.5 px-3">Issues / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {validationSummary.validatedRows
                        .filter((r) => {
                          if (previewFilter === 'VALID') return r.isValid;
                          if (previewFilter === 'ERRORS') return !r.isValid;
                          if (previewFilter === 'DUPLICATES') return r.isDuplicate;
                          return true;
                        })
                        .map((row) => {
                          const m = row.mapped;
                          return (
                            <tr
                              key={row.rowIndex}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                !row.isValid
                                  ? 'bg-rose-950/20'
                                  : row.isDuplicate
                                  ? 'bg-amber-950/20'
                                  : ''
                              }`}
                            >
                              <td className="py-2 px-3 font-mono text-slate-400">{row.rowIndex}</td>
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  row.isDuplicate ? (
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                                      Duplicate
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                                      Valid
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                                    Error
                                  </span>
                                )}
                              </td>

                              {selectedImportType === 'HISTORICAL_EXPENSES' && (
                                <>
                                  <td className="py-2 px-3 font-mono text-slate-200">{m.DATE || '-'}</td>
                                  <td className="py-2 px-3 font-semibold text-emerald-400">{m.SUPERVISOR || '-'}</td>
                                  <td className="py-2 px-3 font-semibold text-blue-400">{m.PROJECT || '-'}</td>
                                  <td className="py-2 px-3 text-slate-300 truncate max-w-[150px]">{m.EXPENSES_CATEGORY || '-'}</td>
                                  <td className="py-2 px-3 text-slate-200 truncate max-w-[200px]">{m.EXPENSES_DESCRIPTION || '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                                    {Number(m.AMOUNT || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 text-slate-300">{m.PAYMENT_SOURCE || 'Historical'}</td>
                                </>
                              )}

                              {selectedImportType === 'PROJECT_DIRECTORY' && (
                                <>
                                  <td className="py-2 px-3 font-bold text-blue-400">{m.PROJECT_CODE || '-'}</td>
                                  <td className="py-2 px-3 text-slate-200 truncate max-w-[220px]">{m.PROJECT_NAME || '-'}</td>
                                  <td className="py-2 px-3 text-slate-300">{m.CLIENT || '-'}</td>
                                  <td className="py-2 px-3 text-slate-300">{m.LOCATION || '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                                    {Number(m.CONTRACT_VALUE || 0).toLocaleString()}
                                  </td>
                                </>
                              )}

                              {selectedImportType === 'SUPERVISOR_DIRECTORY' && (
                                <>
                                  <td className="py-2 px-3 font-mono text-slate-400">{m.SUPERVISOR_ID || '-'}</td>
                                  <td className="py-2 px-3 font-bold text-emerald-400">{m.SUPERVISOR_NAME || '-'}</td>
                                  <td className="py-2 px-3 text-slate-300">{m.PHONE || '-'}</td>
                                  <td className="py-2 px-3 text-blue-400">{m.DEFAULT_PROJECT || '-'}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                                    {Number(m.OPENING_PETTY_CASH || 0).toLocaleString()}
                                  </td>
                                </>
                              )}

                              <td className="py-2 px-3">
                                {row.errors.length > 0 && (
                                  <span className="text-[11px] text-rose-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{row.errors[0].error}</span>
                                  </span>
                                )}
                                {row.errors.length === 0 && row.warnings.length > 0 && (
                                  <span className="text-[11px] text-amber-400 flex items-center gap-1">
                                    <Info className="w-3 h-3 shrink-0" />
                                    <span>{row.warnings[0].error}</span>
                                  </span>
                                )}
                                {row.errors.length === 0 && row.warnings.length === 0 && (
                                  <span className="text-[11px] text-slate-500">Ready</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commit Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Back
                </button>
                <button
                  id="btn-confirm-execute-import"
                  onClick={handleExecuteImport}
                  disabled={validationSummary.validRowsCount === 0 && !skipInvalidRows}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Database className="w-4 h-4" />
                  <span>
                    Commit & Import {validationSummary.validRowsCount} Records
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ---------------- STEP 6 & 7: Processing Progress ---------------- */}
          {currentStep === 6 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Executing Atomic Import Transaction...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Validating duplicate constraints, assigning unique transaction identifiers, and writing historical entries into the operational database.
              </p>

              <div className="w-full max-w-md mx-auto bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${processProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ---------------- STEP 8: Success Result ---------------- */}
          {currentStep === 8 && latestBatchRecord && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      Import Completed Successfully
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1">
                      Batch {latestBatchRecord.id}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Processed at {new Date(latestBatchRecord.timestamp).toLocaleString()} by {latestBatchRecord.performedBy}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleTriggerRollback(latestBatchRecord)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rollback This Batch</span>
                </button>
              </div>

              {/* Batch Statistics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Rows Processed</span>
                  <p className="text-lg font-black text-slate-100 mt-0.5">{latestBatchRecord.totalRows}</p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Successfully Imported</span>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{latestBatchRecord.importedRows}</p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Updated Records</span>
                  <p className="text-lg font-black text-amber-400 mt-0.5">{latestBatchRecord.updatedRows}</p>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Skipped / Failed</span>
                  <p className="text-lg font-black text-slate-400 mt-0.5">
                    {latestBatchRecord.skippedRows + latestBatchRecord.failedRows}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                {latestBatchRecord.importType === 'HISTORICAL_EXPENSES' && (
                  <button
                    id="btn-view-imported-expenses"
                    onClick={handleNavigateToImportedExpenses}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Imported Expenses in Ledger</span>
                  </button>
                )}

                {latestBatchRecord.importType === 'PROJECT_DIRECTORY' && (
                  <button
                    onClick={() => onNavigateTab('projects')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/50 transition-all active:scale-95"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>View Projects Matrix</span>
                  </button>
                )}

                {latestBatchRecord.importType === 'SUPERVISOR_DIRECTORY' && (
                  <button
                    onClick={() => onNavigateTab('supervisors')}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>View Supervisors Directory</span>
                  </button>
                )}

                <button
                  onClick={handleResetWizard}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                >
                  Import Another Spreadsheet
                </button>

                <button
                  onClick={() => setActiveSubTab('history')}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  View Import Batch History
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. IMPORT HISTORY & ROLLBACK SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Migration Batch Audit Log</h3>
              <p className="text-xs text-slate-400">
                Immutable record of all historical spreadsheet data migrations and rollback transactions.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveSubTab('wizard');
                handleResetWizard();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>New Data Import</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Import Type</th>
                  <th className="py-3 px-4">Source File</th>
                  <th className="py-3 px-4 text-center">Imported</th>
                  <th className="py-3 px-4 text-center">Updated</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {importBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                      No import migration batches on record.
                    </td>
                  </tr>
                ) : (
                  importBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{batch.id}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-200">
                          {batch.importType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{batch.fileName}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{batch.importedRows}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">{batch.updatedRows}</td>
                      <td className="py-3 px-4 text-center">
                        {batch.status === 'COMPLETED' && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                            Completed
                          </span>
                        )}
                        {batch.status === 'COMPLETED_WITH_WARNINGS' && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                            With Warnings
                          </span>
                        )}
                        {batch.status === 'ROLLED_BACK' && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                            Rolled Back
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{batch.performedBy}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(batch.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {batch.status !== 'ROLLED_BACK' ? (
                          <button
                            onClick={() => handleTriggerRollback(batch)}
                            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-[11px] font-semibold transition-colors"
                          >
                            Rollback
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Reversed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SAVED MAPPING TEMPLATES SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
            <h3 className="text-sm font-bold text-slate-100 mb-1">Reusable Column Mapping Templates</h3>
            <p className="text-slate-400">
              Templates save previous column configurations so future spreadsheet imports with the same columns are mapped instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mappingTemplates.map((tmpl) => (
              <div key={tmpl.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {tmpl.importType.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => deleteMappingTemplate(tmpl.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-2">{tmpl.name}</h4>
                  <div className="mt-3 space-y-1">
                    {Object.entries(tmpl.mappings).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{k}</span>
                        <span className="text-slate-200">→ {v || '(Unmapped)'}</span>
                      </div>
                    ))}
                    {Object.keys(tmpl.mappings).length > 4 && (
                      <p className="text-[10px] text-slate-500 italic mt-1">
                        + {Object.keys(tmpl.mappings).length - 4} more mappings
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Saved on {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setSelectedImportType(tmpl.importType);
                      setColumnMapping(tmpl.mappings);
                      setActiveSubTab('wizard');
                      setCurrentStep(2);
                    }}
                    className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DOWNLOAD TEMPLATES SUB-TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-0.5">Official EMA Data Migration Templates</h3>
              <p className="text-xs text-slate-400">
                Download pre-formatted Excel (.xlsx) or CSV spreadsheets preloaded with correct column headers, sample rows, and embedded validation rules.
              </p>
            </div>
            <button
              id="downloads-tab-bulk-download-btn"
              onClick={() => dataImportService.downloadAllTemplates('xlsx')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All 3 Templates (.xlsx)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Template 1 */}
            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Expenses (.xlsx)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">Historical Expenses Template</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Columns: Expense ID, Date, Supervisor, Project, Category, Description, Amount, Payment Source, Voucher No, Remarks.
                </p>
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-300">Validation Format:</div>
                  <div>• Date: <span className="text-emerald-400 font-mono">DD/MM/YYYY</span> or <span className="text-emerald-400 font-mono">YYYY-MM-DD</span></div>
                  <div>• Amount: Positive numeric (e.g. <span className="text-emerald-400 font-mono">18500</span>)</div>
                  <div>• Project & Supervisor: Matched with master matrix</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
                <button
                  id="btn-download-exp-xlsx-tab"
                  onClick={() => dataImportService.downloadTemplate('HISTORICAL_EXPENSES', 'xlsx')}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => dataImportService.downloadTemplate('HISTORICAL_EXPENSES', 'csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Template 2 */}
            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    Projects (.xlsx)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">Project Directory Template</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Columns: Project Code, Project Name, Client, Location, Contract Value, Start Date, Completion Date, Status, Petty Cash Budget.
                </p>
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-300">Validation Format:</div>
                  <div>• Project Code: Unique alphanumeric key</div>
                  <div>• Project Name: Full descriptive name</div>
                  <div>• Budget: Numeric positive ceiling limit</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
                <button
                  id="btn-download-proj-xlsx-tab"
                  onClick={() => dataImportService.downloadTemplate('PROJECT_DIRECTORY', 'xlsx')}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => dataImportService.downloadTemplate('PROJECT_DIRECTORY', 'csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Template 3 */}
            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    Supervisors (.xlsx)
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">Supervisor Directory Template</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Columns: Supervisor ID, Full Name, Mobile Phone, Email Address, Opening Cash Float, Assigned Project Code, Active Status.
                </p>
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-300">Validation Format:</div>
                  <div>• Full Name: Primary required identifier</div>
                  <div>• Opening Float: Initial cash balance</div>
                  <div>• Assigned Project: Valid project code</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-800">
                <button
                  id="btn-download-sup-xlsx-tab"
                  onClick={() => dataImportService.downloadTemplate('SUPERVISOR_DIRECTORY', 'xlsx')}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => dataImportService.downloadTemplate('SUPERVISOR_DIRECTORY', 'csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation & Format Info Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">
                Validation Requirements & Auto-Mapping Guarantee:
              </p>
              <p className="text-slate-400 text-[11px]">
                Each downloaded Excel (.xlsx) file comes with pre-populated, validated sample data rows and an embedded secondary sheet titled <span className="text-emerald-400 font-mono">Validation_Rules</span> explaining all mandatory fields, accepted date formats, GL codes, and duplicate policies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation & Security Verification Modal */}
      {isRollbackModalOpen && batchToRollback && (
        <AdminSecurityModal
          isOpen={isRollbackModalOpen}
          onClose={() => {
            setIsRollbackModalOpen(false);
            setBatchToRollback(null);
          }}
          actionTitle={`ROLLBACK BATCH ${batchToRollback.id}`}
          actionDescription={`You are about to roll back Batch ${batchToRollback.id}. This will safely remove ${batchToRollback.importedRows} imported records and revert any updated fields without affecting existing operations. Please re-enter your Admin Security Code to confirm.`}
          onVerified={handleConfirmRollback}
        />
      )}

      {/* Download Templates Modal */}
      {isDownloadTemplatesModalOpen && (
        <DownloadTemplatesModal
          isOpen={isDownloadTemplatesModalOpen}
          onClose={() => setIsDownloadTemplatesModalOpen(false)}
          defaultType={downloadModalDefaultType}
        />
      )}
    </div>
  );
};
