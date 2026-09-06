import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Database,
  Building2,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { RegisteredBank } from '../../types/bankingTypes';
import {
  parseBankCsvData,
  SAMPLE_BANK_CSV_CONTENT,
  DEFAULT_REGISTERED_BANKS
} from '../../data/registeredBanksData';

interface ImportBankListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    banks: Array<Omit<RegisteredBank, 'id'>>,
    mode: 'append' | 'replace'
  ) => { added: number; updated: number; total: number };
  existingBankCount: number;
}

export const ImportBankListModal: React.FC<ImportBankListModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingBankCount
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'cbsl'>('upload');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedBanks, setParsedBanks] = useState<Array<Omit<RegisteredBank, 'id'>>>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_BANK_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cbsl_registered_banks_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseBankCsvData(text);
      setParsedBanks(result.banks);
      setParseErrors(result.errors);
      setIsParsed(true);
      setImportSuccessMessage(null);
    };
    reader.readAsText(file);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleParsePaste = () => {
    if (!pasteContent.trim()) {
      setParseErrors(['Please paste CSV, TSV or JSON data.']);
      return;
    }
    const result = parseBankCsvData(pasteContent);
    setParsedBanks(result.banks);
    setParseErrors(result.errors);
    setIsParsed(true);
    setImportSuccessMessage(null);
  };

  const handleLoadCbslDefaults = () => {
    const rawDefaults: Array<Omit<RegisteredBank, 'id'>> = DEFAULT_REGISTERED_BANKS.map(
      ({ id, ...rest }) => rest
    );
    setParsedBanks(rawDefaults);
    setParseErrors([]);
    setIsParsed(true);
    setFileName('CBSL_Master_Bank_Directory_2026.csv');
    setImportSuccessMessage(null);
  };

  const handleConfirmImport = () => {
    if (parsedBanks.length === 0) return;
    const result = onImport(parsedBanks, importMode);
    setImportSuccessMessage(
      `Successfully processed ${result.total} banks (${result.added} newly registered, ${result.updated} updated).`
    );
    setTimeout(() => {
      onClose();
      // Reset state for next time
      setIsParsed(false);
      setParsedBanks([]);
      setFileName(null);
      setPasteContent('');
      setImportSuccessMessage(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Import Bank Directory & Master List
              </h3>
              <p className="text-xs text-slate-400">
                Bulk register official banks with bank codes, SWIFT IDs, branches, and categories
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs & Actions */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Success Notification */}
          {importSuccessMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setIsParsed(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File (CSV / JSON)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('paste');
                  setIsParsed(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Text / Spreadsheet
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('cbsl');
                  handleLoadCbslDefaults();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'cbsl'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Load CBSL Master Preset (25 Banks)
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template CSV
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && !isParsed && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.json,.tsv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  Drag & Drop bank list CSV or JSON here
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  Supports standard Central Bank format: Bank Name, Bank Code (e.g. 7010), SWIFT/BIC Code, Branches, and Category
                </p>
                <span className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-600 shadow-sm transition-colors">
                  Browse File from Computer
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-300">Expected Columns:</span>{' '}
                  <code className="text-emerald-300">bank_name</code>,{' '}
                  <code className="text-emerald-300">bank_code</code>,{' '}
                  <code className="text-emerald-300">swift_code</code>,{' '}
                  <code className="text-emerald-300">short_name</code>,{' '}
                  <code className="text-emerald-300">branches</code> (semicolon-separated),{' '}
                  <code className="text-emerald-300">category</code>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === 'paste' && !isParsed && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Paste CSV / TSV / JSON Text:
                </label>
                <button
                  type="button"
                  onClick={() => setPasteContent(SAMPLE_BANK_CSV_CONTENT)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Insert Sample Data
                </button>
              </div>
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="Commercial Bank of Ceylon PLC,7010,CCEYLKFX,COMBANK,World Trade Centre;Kollupitiya,Licensed Commercial Bank&#10;Bank of Ceylon,7047,BCEYLKLX,BOC,Corporate Branch;BOC Tower,Licensed Commercial Bank"
                rows={8}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Parse & Review Bank Data
                </button>
              </div>
            </div>
          )}

          {/* PARSED REVIEW & VALIDATION VIEW */}
          {isParsed && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      File / Source:
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {fileName || 'Pasted Content'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Detected <strong className="text-slate-100 font-semibold">{parsedBanks.length}</strong> valid bank records to import
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsParsed(false);
                      setParsedBanks([]);
                      setParseErrors([]);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                  >
                    Change Source
                  </button>
                </div>
              </div>

              {/* Parsing Warnings / Errors */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Notice / Non-Fatal Parsing Warnings ({parseErrors.length}):
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-300/80 pl-1">
                    {parseErrors.slice(0, 4).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parseErrors.length > 4 && (
                      <li>+ {parseErrors.length - 4} more rows skipped or flagged</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Import Mode Settings */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Import Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                      importMode === 'append'
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-slate-200'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-200">
                        Append & Update (Recommended)
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Adds new banks. If a bank code matches an existing bank, updates branches and info without losing existing records ({existingBankCount} current banks).
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                      importMode === 'replace'
                        ? 'border-red-500/40 bg-red-500/5 text-slate-200'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-red-500 focus:ring-red-500"
                    />
                    <div>
                      <div className="font-semibold text-red-400">
                        Replace Entire Directory
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Clears the current {existingBankCount} banks and sets the directory strictly to the imported records.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Preview of Banks to Register ({parsedBanks.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Showing first {Math.min(parsedBanks.length, 10)} records
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2 font-medium">Bank Name</th>
                        <th className="px-3 py-2 font-medium">Bank Code</th>
                        <th className="px-3 py-2 font-medium">SWIFT / BIC</th>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Branches</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {parsedBanks.slice(0, 10).map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 text-slate-200 font-medium">
                            {b.bankName}
                            {b.shortName && (
                              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                                ({b.shortName})
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-emerald-400 font-semibold">
                            {b.bankCode}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-400">
                            {b.swiftCode || '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-300">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {b.category || 'Commercial'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            <span className="text-[11px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {b.branches?.length || 0} branches
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            Cancel
          </button>

          {isParsed && parsedBanks.length > 0 ? (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:translate-y-[-1px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm Import ({parsedBanks.length} Banks)
            </button>
          ) : (
            <div className="text-xs text-slate-500">
              Select a file or preset to proceed with bank import
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
