import React, { useState } from 'react';
import {
  Landmark,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Calendar,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  FileText,
  Search,
  Check,
  X,
  Building2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useEnterpriseBanking } from '../../context/EnterpriseBankingContext';
import { CompanyBankAccount, BankStatement, RegisteredBank } from '../../types/bankingTypes';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { ImportBankListModal } from '../enterpriseProfile/ImportBankListModal';
import { RegisteredBanksTab } from '../enterpriseProfile/RegisteredBanksTab';

export const EnterpriseBankingView: React.FC = () => {
  const {
    accounts,
    registeredBanks,
    auditEntries,
    statements,
    reconciliations,
    addAccount,
    updateAccount,
    deleteAccount,
    deleteStatement,
    deleteReconciliation,
    uploadStatement,
    verifyStatement,
    reconcileStatement,
    maskAccountNumber,
    addRegisteredBank,
    updateRegisteredBank,
    deleteRegisteredBank,
    importRegisteredBanks,
    resetRegisteredBanksToDefault
  } = useEnterpriseBanking();

  const [activeTab, setActiveTab] = useState<'accounts' | 'statements' | 'reconciliation' | 'audits'>('accounts');

  // Registered Banks Directory Modal
  const [isBankDirectoryModalOpen, setIsBankDirectoryModalOpen] = useState(false);
  const [isImportBankModalOpen, setIsImportBankModalOpen] = useState(false);
  const [selectedRegisteredBankId, setSelectedRegisteredBankId] = useState<string>('');
  const [isCustomBankMode, setIsCustomBankMode] = useState<boolean>(false);

  // Account Unmasking State: Map of accountId -> boolean
  const [unmaskedAccounts, setUnmaskedAccounts] = useState<Record<string, boolean>>({});

  // Deletion Target State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'account' | 'statement' | 'reconciliation';
    id: string;
    title: string;
  } | null>(null);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<Omit<CompanyBankAccount, 'id'>>({
    enterpriseId: 'ent-apex',
    bank: '',
    bankCode: '',
    branch: '',
    branchCode: '',
    accountName: '',
    accountNumber: '',
    accountType: 'Current',
    currency: 'LKR',
    swift: '',
    status: 'Active',
    isPrimary: false,
    purpose: '',
    responsiblePerson: '',
    currentBalance: 0
  });

  const [isUploadStatementOpen, setIsUploadStatementOpen] = useState(false);
  const [statementForm, setStatementForm] = useState<Omit<BankStatement, 'id' | 'uploadedDate'>>({
    bankAccountId: accounts[0]?.id || '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    openingBalance: 0,
    closingBalance: 0,
    statementReference: '',
    documentFileName: '',
    uploadedBy: 'Current User',
    status: 'Uploaded',
    reconciliationStatus: 'Not Started',
    remarks: ''
  });

  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [reconcileTargetStatement, setReconcileTargetStatement] = useState<BankStatement | null>(null);
  const [bookBalance, setBookBalance] = useState<number>(0);
  const [reconcileNotes, setReconcileNotes] = useState<string>('');

  const toggleMask = (accountId: string, fullNumber: string) => {
    const isCurrentlyUnmasked = !!unmaskedAccounts[accountId];
    if (!isCurrentlyUnmasked) {
      // Prompt user or log unmasking action
      setUnmaskedAccounts(prev => ({ ...prev, [accountId]: true }));
    } else {
      setUnmaskedAccounts(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const handleOpenReconcile = (stmt: BankStatement) => {
    setReconcileTargetStatement(stmt);
    setBookBalance(stmt.closingBalance); // Default equal
    setReconcileNotes('');
    setIsReconcileOpen(true);
  };

  const handleSubmitReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileTargetStatement) return;

    const diff = Number((reconcileTargetStatement.closingBalance - bookBalance).toFixed(2));
    const status = diff === 0 ? 'Reconciled' : 'Discrepancy';

    reconcileStatement({
      bankAccountId: reconcileTargetStatement.bankAccountId,
      statementId: reconcileTargetStatement.id,
      month: reconcileTargetStatement.month,
      year: reconcileTargetStatement.year,
      statementBalance: reconcileTargetStatement.closingBalance,
      bookBalance: bookBalance,
      difference: diff,
      matchedCount: 24,
      unmatchedCount: diff === 0 ? 0 : 2,
      reconciledBy: 'Ananda Jayawardena, FCA',
      status: status,
      notes: reconcileNotes
    });

    setIsReconcileOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Corporate Banking & Cashbook
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                {accounts.length} Active Accounts
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Multi-Currency Bank Mandates, Account Auditing, Monthly E-Statements & GL Reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsBankDirectoryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
            title="Browse or Import Registered Bank Directory"
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Bank Directory ({registeredBanks.length})</span>
          </button>
          <button
            onClick={() => setIsUploadStatementOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Bank Statement
          </button>
          <button
            onClick={() => {
              setIsAddAccountOpen(true);
              if (!accountForm.bank && registeredBanks.length > 0) {
                const first = registeredBanks[0];
                setSelectedRegisteredBankId(first.id);
                setIsCustomBankMode(false);
                setAccountForm(prev => ({
                  ...prev,
                  bank: first.bankName,
                  bankCode: first.bankCode,
                  swift: first.swiftCode || '',
                  branch: first.branches?.[0] || 'Corporate Branch'
                }));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Bank Account
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mt-6 gap-2">
        {[
          { id: 'accounts', label: `Bank Accounts (${accounts.length})`, icon: Landmark },
          { id: 'statements', label: `Monthly Statements (${statements.length})`, icon: FileSpreadsheet },
          { id: 'reconciliation', label: `Reconciliation Logs (${reconciliations.length})`, icon: CheckCircle2 },
          { id: 'audits', label: `Security Audit Trail (${auditEntries.length})`, icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BANK ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(acc => {
              const isUnmasked = !!unmaskedAccounts[acc.id];
              return (
                <div
                  key={acc.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-slate-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {acc.currency} • {acc.accountType}
                        </span>
                        {acc.isPrimary && (
                          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Primary Operating
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{acc.bankCode || 'CODE'}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 mt-3">{acc.bank}</h3>
                    <p className="text-xs text-slate-400">{acc.branch} Branch</p>

                    <div className="mt-4 p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100">
                            {isUnmasked ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
                          </span>
                          <button
                            onClick={() => toggleMask(acc.id, acc.accountNumber)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title={isUnmasked ? 'Mask Account Number' : 'Unmask for Verification'}
                          >
                            {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Account Name:</span>
                        <span className="text-slate-300 font-medium text-right truncate max-w-[180px]">
                          {acc.accountName}
                        </span>
                      </div>

                      {acc.swift && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">SWIFT / BIC:</span>
                          <span className="font-mono text-slate-300">{acc.swift}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Current Balance:</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">
                        {acc.currency} {Number(acc.currentBalance || 0).toLocaleString()}
                      </span>
                    </div>

                    {acc.purpose && (
                      <p className="text-xs text-slate-400 mt-2 italic">Purpose: {acc.purpose}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      GL: <span className="font-mono text-slate-300">{acc.glAccountCode || '1010'}</span>
                    </span>
                    <button
                      onClick={() => {
                        setDeleteTarget({
                          type: 'account',
                          id: acc.id,
                          title: `${acc.bank} (${acc.accountNumber})`
                        });
                      }}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium transition-colors"
                      title="Remove Bank Account (Admin Security Key Required)"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY STATEMENTS */}
      {activeTab === 'statements' && (
        <div className="mt-6 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Bank & Account</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Closing Balance</th>
                  <th className="px-4 py-3">Doc Status</th>
                  <th className="px-4 py-3">Reconciliation</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {statements.map(stmt => {
                  const matchedAcc = accounts.find(a => a.id === stmt.bankAccountId);
                  return (
                    <tr key={stmt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-100">{matchedAcc?.bank || 'Bank Account'}</div>
                        <div className="text-xs font-mono text-slate-400">
                          {maskAccountNumber(matchedAcc?.accountNumber || '')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {stmt.month}/{stmt.year}
                        <div className="text-xs text-slate-400">
                          {stmt.startDate} to {stmt.endDate}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-blue-400">
                        {stmt.statementReference || 'E-STMT'}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-100">
                        {matchedAcc?.currency || 'LKR'} {Number(stmt.closingBalance).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            stmt.status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {stmt.status}
                        </span>
                        {stmt.verifiedBy && (
                          <div className="text-[10px] text-slate-400 mt-0.5">By {stmt.verifiedBy}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            stmt.reconciliationStatus === 'Reconciled'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : stmt.reconciliationStatus === 'In Progress'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {stmt.reconciliationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        {stmt.status === 'Uploaded' && (
                          <button
                            onClick={() => verifyStatement(stmt.id, 'Ananda Jayawardena, FCA')}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-xs font-medium"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenReconcile(stmt)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium"
                        >
                          Reconcile
                        </button>
                        <button
                          onClick={() => setDeleteTarget({
                            type: 'statement',
                            id: stmt.id,
                            title: `Statement ${stmt.statementReference || ''} (${stmt.month}/${stmt.year})`
                          })}
                          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded text-xs font-medium inline-flex items-center gap-1"
                          title="Delete Statement (Admin Security Key Required)"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIATION LOGS */}
      {activeTab === 'reconciliation' && (
        <div className="mt-6 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Month / Year</th>
                  <th className="px-4 py-3">Statement Balance</th>
                  <th className="px-4 py-3">General Ledger Balance</th>
                  <th className="px-4 py-3">Variance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reconciled By</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {reconciliations.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-semibold text-slate-100">
                      {rec.month}/{rec.year}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-200">
                      LKR {Number(rec.statementBalance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-200">
                      LKR {Number(rec.bookBalance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold">
                      {rec.difference === 0 ? (
                        <span className="text-emerald-400">0.00 (Balanced)</span>
                      ) : (
                        <span className="text-rose-400">LKR {Number(rec.difference).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rec.status === 'Reconciled'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      {rec.reconciledBy}
                      <div className="text-slate-500">{rec.reconciledDate}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 italic">{rec.notes || '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setDeleteTarget({
                          type: 'reconciliation',
                          id: rec.id,
                          title: `Reconciliation ${rec.month}/${rec.year}`
                        })}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded text-xs font-medium inline-flex items-center gap-1"
                        title="Delete Reconciliation (Admin Security Key Required)"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audits' && (
        <div className="mt-6 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-slate-400 text-xs border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Bank Account</th>
                  <th className="px-4 py-3">Operation / Field</th>
                  <th className="px-4 py-3">Previous Value</th>
                  <th className="px-4 py-3">New Value</th>
                  <th className="px-4 py-3">Authorized By</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {auditEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{entry.timestamp}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-blue-400">{entry.bankAccountId}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-200">{entry.field}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">{entry.previousValue || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-emerald-400 font-mono">{entry.newValue}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-300">{entry.userName}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 italic">{entry.reason || 'Routine Audit'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD BANK ACCOUNT */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-400" />
                Add Corporate Bank Account
              </h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addAccount(accountForm);
                setIsAddAccountOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              {/* Bank Selection Dropdown / Custom Bank Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Bank Name / Financial Institution <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBankMode(!isCustomBankMode);
                        if (!isCustomBankMode) {
                          setSelectedRegisteredBankId('');
                          setAccountForm(prev => ({ ...prev, bank: '', bankCode: '', swift: '' }));
                        }
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {isCustomBankMode ? '← Choose from Registered Banks' : '➕ Enter Custom / Other Bank'}
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setIsImportBankModalOpen(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Import Bank List
                    </button>
                  </div>
                </div>

                {!isCustomBankMode ? (
                  <div className="space-y-2">
                    <select
                      value={selectedRegisteredBankId}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__CUSTOM__') {
                          setIsCustomBankMode(true);
                          setSelectedRegisteredBankId('');
                          setAccountForm(prev => ({ ...prev, bank: '', bankCode: '', swift: '' }));
                          return;
                        }
                        setSelectedRegisteredBankId(val);
                        const found = registeredBanks.find(b => b.id === val);
                        if (found) {
                          setAccountForm(prev => ({
                            ...prev,
                            bank: found.bankName,
                            bankCode: found.bankCode,
                            swift: found.swiftCode || '',
                            branch: found.branches && found.branches.length > 0 ? found.branches[0] : prev.branch
                          }));
                        }
                      }}
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="" disabled>
                        — Select from Registered Banks ({registeredBanks.length} Institutions) —
                      </option>
                      <optgroup label="Licensed Commercial Banks">
                        {registeredBanks
                          .filter(b => b.category === 'Licensed Commercial Bank')
                          .map(b => (
                            <option key={b.id} value={b.id}>
                              [{b.bankCode}] {b.bankName} {b.shortName ? `(${b.shortName})` : ''}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Licensed Specialized & Foreign Banks">
                        {registeredBanks
                          .filter(b => b.category !== 'Licensed Commercial Bank')
                          .map(b => (
                            <option key={b.id} value={b.id}>
                              [{b.bankCode}] {b.bankName} {b.shortName ? `(${b.shortName})` : ''} - {b.category || 'Specialized'}
                            </option>
                          ))}
                      </optgroup>
                      <option value="__CUSTOM__">
                        ➕ Bank not listed? Click to enter custom bank...
                      </option>
                    </select>

                    {/* Verification Notice Card */}
                    {(() => {
                      const selectedBankObj = registeredBanks.find(
                        b => b.id === selectedRegisteredBankId || b.bankName.toLowerCase() === (accountForm.bank || '').toLowerCase()
                      );
                      if (!selectedBankObj) return null;
                      return (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              <strong className="font-semibold text-emerald-200">Registered:</strong>{' '}
                              Code <span className="font-mono font-bold text-emerald-300">{selectedBankObj.bankCode}</span>
                              {selectedBankObj.swiftCode ? ` • SWIFT: ${selectedBankObj.swiftCode}` : ''}
                              {selectedBankObj.category ? ` • ${selectedBankObj.category}` : ''}
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-semibold">
                            CBSL Verified
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter Custom Bank Name"
                        value={accountForm.bank}
                        onChange={e => setAccountForm({ ...accountForm, bank: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Bank Code (e.g. 7010)"
                        value={accountForm.bankCode}
                        onChange={e => setAccountForm({ ...accountForm, bankCode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Branch Selection & SWIFT Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Branch Name <span className="text-red-400">*</span>
                  </label>
                  {(() => {
                    const selectedBankObj = registeredBanks.find(
                      b => b.id === selectedRegisteredBankId || b.bankName.toLowerCase() === (accountForm.bank || '').toLowerCase()
                    );
                    const hasBranches = selectedBankObj && selectedBankObj.branches && selectedBankObj.branches.length > 0;

                    if (hasBranches) {
                      return (
                        <div className="space-y-1.5">
                          <select
                            value={
                              selectedBankObj.branches.includes(accountForm.branch)
                                ? accountForm.branch
                                : accountForm.branch
                                ? '__CUSTOM_BRANCH__'
                                : ''
                            }
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '__CUSTOM_BRANCH__') {
                                setAccountForm(prev => ({ ...prev, branch: '' }));
                              } else {
                                setAccountForm(prev => ({ ...prev, branch: val }));
                              }
                            }}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="" disabled>— Select Registered Branch —</option>
                            {selectedBankObj.branches.map((br, idx) => (
                              <option key={idx} value={br}>
                                {br}
                              </option>
                            ))}
                            <option value="__CUSTOM_BRANCH__">
                              ➕ Other / Custom Branch...
                            </option>
                          </select>
                          {(!selectedBankObj.branches.includes(accountForm.branch) || accountForm.branch === '') && (
                            <input
                              type="text"
                              required
                              placeholder="Type specific branch location"
                              value={accountForm.branch}
                              onChange={e => setAccountForm({ ...accountForm, branch: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          )}
                        </div>
                      );
                    }

                    return (
                      <input
                        type="text"
                        required
                        placeholder="e.g. World Trade Centre Branch"
                        value={accountForm.branch}
                        onChange={e => setAccountForm({ ...accountForm, branch: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    SWIFT / BIC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CCEYLKFX"
                    value={accountForm.swift || ''}
                    onChange={e => setAccountForm({ ...accountForm, swift: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1000849201"
                    value={accountForm.accountNumber}
                    onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    value={accountForm.accountName}
                    onChange={e => setAccountForm({ ...accountForm, accountName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Account Type</label>
                  <select
                    value={accountForm.accountType}
                    onChange={e => setAccountForm({ ...accountForm, accountType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Current">Current</option>
                    <option value="Savings">Savings</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="Loan">Loan</option>
                    <option value="Overdraft">Overdraft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Currency</label>
                  <select
                    value={accountForm.currency}
                    onChange={e => setAccountForm({ ...accountForm, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="LKR">LKR (Rs.)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    value={accountForm.currentBalance}
                    onChange={e => setAccountForm({ ...accountForm, currentBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={accountForm.isPrimary}
                  onChange={e => setAccountForm({ ...accountForm, isPrimary: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600"
                />
                <label htmlFor="isPrimary" className="text-xs text-slate-300">
                  Designate as Primary Operating Account
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD STATEMENT */}
      {isUploadStatementOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Upload Monthly Bank Statement
              </h3>
              <button onClick={() => setIsUploadStatementOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                uploadStatement(statementForm);
                setIsUploadStatementOpen(false);
              }}
              className="mt-4 space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Bank Account</label>
                <select
                  value={statementForm.bankAccountId}
                  onChange={e => setStatementForm({ ...statementForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.bank} - {maskAccountNumber(a.accountNumber)} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Month</label>
                  <select
                    value={statementForm.month}
                    onChange={e => setStatementForm({ ...statementForm, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>
                        Month {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Year</label>
                  <input
                    type="number"
                    value={statementForm.year}
                    onChange={e => setStatementForm({ ...statementForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Opening Balance</label>
                  <input
                    type="number"
                    value={statementForm.openingBalance}
                    onChange={e => setStatementForm({ ...statementForm, openingBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Closing Balance</label>
                  <input
                    type="number"
                    value={statementForm.closingBalance}
                    onChange={e => setStatementForm({ ...statementForm, closingBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Statement File Name / Document Reference</label>
                <input
                  type="text"
                  placeholder="e.g. ComBank_Statement_Aug2026.pdf"
                  value={statementForm.documentFileName}
                  onChange={e => setStatementForm({ ...statementForm, documentFileName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadStatementOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                >
                  Submit Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECONCILE */}
      {isReconcileOpen && reconcileTargetStatement && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Bank Statement GL Reconciliation
              </h3>
              <button onClick={() => setIsReconcileOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReconciliation} className="mt-4 space-y-4 text-sm">
              <div className="p-3 bg-slate-800 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Statement Period:</span>
                  <span className="font-semibold text-slate-200">
                    {reconcileTargetStatement.month}/{reconcileTargetStatement.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank Statement Closing Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    LKR {Number(reconcileTargetStatement.closingBalance).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Cashbook / GL Closing Balance</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={bookBalance}
                  onChange={e => setBookBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-base"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">Reconciliation Variance:</span>
                <span
                  className={`font-mono font-bold text-base ${
                    reconcileTargetStatement.closingBalance - bookBalance === 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  LKR {Number(reconcileTargetStatement.closingBalance - bookBalance).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Reconciliation Remarks</label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={e => setReconcileNotes(e.target.value)}
                  placeholder="e.g. Matched all bank debits and credits against petty cash disbursements."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReconcileOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                >
                  Endorse Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Strict Security Key Delete Confirmation Modal */}
      {deleteTarget && (
        <UniversalDeleteModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          recordType={
            deleteTarget.type === 'account'
              ? 'Bank Account'
              : deleteTarget.type === 'statement'
              ? 'Bank Statement'
              : 'Reconciliation Record'
          }
          recordTitle={deleteTarget.title}
          recordId={deleteTarget.id}
          module="Corporate Banking & GL"
          onDelete={async () => {
            if (deleteTarget.type === 'account') {
              deleteAccount(deleteTarget.id);
            } else if (deleteTarget.type === 'statement') {
              deleteStatement(deleteTarget.id);
            } else if (deleteTarget.type === 'reconciliation') {
              deleteReconciliation(deleteTarget.id);
            }
            setDeleteTarget(null);
          }}
        />
      )}

      {/* MODAL: REGISTERED BANKS DIRECTORY MODAL (POPUP FROM BANKING) */}
      {isBankDirectoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Master Registered Banks & Clearing Directory
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official Central Bank codes, branch networks, and SWIFT identifiers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBankDirectoryModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <RegisteredBanksTab
                registeredBanks={registeredBanks}
                onAddBank={addRegisteredBank}
                onUpdateBank={updateRegisteredBank}
                onDeleteBank={deleteRegisteredBank}
                onImportBanks={importRegisteredBanks}
                onResetToDefault={resetRegisteredBanksToDefault}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT BANK LIST DIRECTLY FROM BANKING */}
      <ImportBankListModal
        isOpen={isImportBankModalOpen}
        onClose={() => setIsImportBankModalOpen(false)}
        onImport={importRegisteredBanks}
        existingBankCount={registeredBanks.length}
      />
    </div>
  );
};
