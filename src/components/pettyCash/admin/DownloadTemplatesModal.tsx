import React from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Receipt,
  Building2,
  Users,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  Layers
} from 'lucide-react';
import { dataImportService } from '../../../services/dataImportService';
import { ImportType } from '../../../types/pettyCashTypes';

interface DownloadTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ImportType;
}

export const DownloadTemplatesModal: React.FC<DownloadTemplatesModalProps> = ({
  isOpen,
  onClose,
  defaultType
}) => {
  if (!isOpen) return null;

  const handleDownload = (type: ImportType, format: 'xlsx' | 'csv' = 'xlsx') => {
    dataImportService.downloadTemplate(type, format);
  };

  const handleDownloadAll = () => {
    dataImportService.downloadAllTemplates('xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Download Pre-Formatted Migration Templates
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Excel (.xlsx) & CSV
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download standardized spreadsheets pre-configured with correct column headers, sample data, and schema validation rules.
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Bulk Download Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Full Migration Starter Pack
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Download all 3 official Excel templates (Expenses, Projects, Supervisors) in 1-click.
                </p>
              </div>
            </div>

            <button
              id="btn-download-all-templates-modal"
              onClick={handleDownloadAll}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download All 3 (.xlsx)</span>
            </button>
          </div>

          {/* 3 Entity Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Historical Expenses Template */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                defaultType === 'HISTORICAL_EXPENSES'
                  ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Expenses
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">
                  Historical Expenses Template
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  For importing past vouchers, disbursements, fuel, transport, materials, and daily site expenses.
                </p>

                {/* Validation Requirements */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Validation Requirements:
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-emerald-300">Required:</strong> Date (DD/MM/YYYY), Supervisor, Project, Category, Description, Amount (numeric &gt; 0)</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300">Optional:</strong> Expense ID, Payment Source, Voucher No, Payment Status, Remarks</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Includes embedded validation rules sheet</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  id="btn-download-expenses-xlsx"
                  onClick={() => handleDownload('HISTORICAL_EXPENSES', 'xlsx')}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleDownload('HISTORICAL_EXPENSES', 'csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Download CSV version"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* 2. Project Directory Template */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                defaultType === 'PROJECT_DIRECTORY'
                  ? 'bg-slate-900/90 border-blue-500 shadow-lg shadow-blue-950/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    Projects
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">
                  Project Directory Template
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  For bulk registering project codes, client accounts, contract sums, locations, and float limits.
                </p>

                {/* Validation Requirements */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Validation Requirements:
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong className="text-blue-300">Required:</strong> Project Code (unique key), Project Name</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300">Optional:</strong> Client, Location, Contract Value, Start/End Dates, Status, Budget</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Includes embedded validation rules sheet</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  id="btn-download-projects-xlsx"
                  onClick={() => handleDownload('PROJECT_DIRECTORY', 'xlsx')}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleDownload('PROJECT_DIRECTORY', 'csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Download CSV version"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* 3. Supervisor Directory Template */}
            <div
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                defaultType === 'SUPERVISOR_DIRECTORY'
                  ? 'bg-slate-900/90 border-purple-500 shadow-lg shadow-purple-950/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                    Supervisors
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">
                  Supervisor Directory Template
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  For bulk registering custodians, contact info, initial petty cash float balances, and assigned sites.
                </p>

                {/* Validation Requirements */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Validation Requirements:
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong className="text-purple-300">Required:</strong> Supervisor Full Name</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300">Optional:</strong> Supervisor ID, Mobile, Email, Opening Float, Assigned Project, Active</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <FileCheck2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Includes embedded validation rules sheet</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  id="btn-download-supervisors-xlsx"
                  onClick={() => handleDownload('SUPERVISOR_DIRECTORY', 'xlsx')}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleDownload('SUPERVISOR_DIRECTORY', 'csv')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Download CSV version"
                >
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Assurance & Format Tips */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">
                Template Formatting & Auto-Detection Guidelines:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
                <li>Keep the top row headers intact for 100% automated column mapping.</li>
                <li>Enter dates formatted as <span className="text-emerald-400 font-mono">DD/MM/YYYY</span> (e.g. 15/04/2024) or <span className="text-emerald-400 font-mono">YYYY-MM-DD</span>.</li>
                <li>Amounts must be positive numeric figures without currency symbols (e.g. <span className="text-emerald-400 font-mono">45000</span>).</li>
                <li>Each downloaded Excel workbook contains an embedded second worksheet titled <span className="text-slate-200 font-mono font-semibold">Validation_Rules</span> with full field specifications.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            EMA Enterprise Migration Standard v2.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
