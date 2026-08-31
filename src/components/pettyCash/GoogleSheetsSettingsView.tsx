import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Table,
  Layers,
  Save,
  RotateCcw
} from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';

export const GoogleSheetsSettingsView: React.FC = () => {
  const {
    sheetsConfig,
    updateSheetsConfig,
    syncWithGoogleSheets,
    isSyncingWithSheets,
    resetPettyCashData,
    expenses,
    income,
    supervisors,
    projects,
    categories,
    transfers
  } = usePettyCash();

  const [spreadsheetId, setSpreadsheetId] = useState<string>(sheetsConfig.spreadsheetId);
  const [spreadsheetName, setSpreadsheetName] = useState<string>(sheetsConfig.spreadsheetName);
  const [apiKey, setApiKey] = useState<string>(sheetsConfig.apiKey || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveConfig = () => {
    updateSheetsConfig({
      spreadsheetId: spreadsheetId.trim(),
      spreadsheetName: spreadsheetName.trim(),
      apiKey: apiKey.trim() || undefined
    });
    setStatusMessage('Google Sheets connection settings saved successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTriggerSync = async () => {
    const res = await syncWithGoogleSheets();
    setStatusMessage(res.message);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all Petty Cash data to default sample records?')) {
      resetPettyCashData();
      setStatusMessage('Data reset to original factory blueprint.');
    }
  };

  const tables = [
    { name: 'EXPENSES', records: expenses.length, cols: 'EXPENSES_ID, DATE, SUPERVISOR, PROJECT, CATEGORY, AMOUNT, DESCRIPTION, STATUS, PROOF_URL, CREATED_BY' },
    { name: 'INCOME', records: income.length, cols: 'INCOME_ID, DATE, SUPERVISOR, PROJECT, SOURCE, AMOUNT, PROOF_URL, CREATED_BY, REMARKS' },
    { name: 'INTERNAL_TRANSFERS', records: transfers.length, cols: 'TRANSFER_ID, DATE, FROM_SUPERVISOR, TO_SUPERVISOR, AMOUNT, REMARKS, STATUS' },
    { name: 'SUPERVISOR', records: supervisors.length, cols: 'SUPERVISOR_ID, SUPERVISOR_NAME, PHONE, EMAIL, DEFAULT_PROJECT, OPENING_PETTY_CASH' },
    { name: 'PROJECT', records: projects.length, cols: 'PROJECT_ID, PROJECT_CODE, PROJECT_NAME, CLIENT_NAME, BUDGET, STATUS' },
    { name: 'EXPENSES_CATEGORY', records: categories.length, cols: 'CATEGORY_ID, CATEGORY_CODE, CATEGORY_NAME, CATEGORY_GROUP' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Google Sheets Database Integration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Central spreadsheet synchronization replacing AppSheet with full bi-directional data flow.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncingWithSheets}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-70"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingWithSheets ? 'animate-spin' : ''}`} />
          <span>{isSyncingWithSheets ? 'Syncing Tables...' : 'Sync Now'}</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Spreadsheet Connection Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <span>Connected Google Sheet Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Spreadsheet ID</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Spreadsheet Title</label>
            <input
              type="text"
              value={spreadsheetName}
              onChange={(e) => setSpreadsheetName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-bold mb-1">Google Cloud Apps Script Webhook / API Key (Optional)</label>
            <input
              type="password"
              placeholder="e.g. AIzaSyD..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Last Synced: <span className="text-slate-200 font-medium">{new Date(sheetsConfig.lastSyncedAt).toLocaleString('en-GB')}</span>
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Config</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schema Verification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Table className="w-5 h-5 text-emerald-400" />
          <span>Synchronized Database Tables & Schemas</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Table / Sheet Tab</th>
                <th className="py-2.5 px-3">Synced Rows</th>
                <th className="py-2.5 px-3">Mapped Columns</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tables.map((t) => (
                <tr key={t.name} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-emerald-400 font-mono">{t.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-200">{t.records} records</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{t.cols}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      LIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Reset Utility */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-200">Reset Demo Data</h4>
          <p className="text-xs text-slate-400">Restore all transactions, supervisors, and projects to factory defaults.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Data</span>
        </button>
      </div>
    </div>
  );
};
