import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Upload,
  Plus,
  Download,
  Search,
  Filter,
  RefreshCw,
  Building,
  CheckCircle2,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  Info,
  MapPin,
  ChevronDown,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { RegisteredBank } from '../../types/bankingTypes';
import { ImportBankListModal } from './ImportBankListModal';
import { AddRegisteredBankModal } from './AddRegisteredBankModal';

interface RegisteredBanksTabProps {
  registeredBanks: RegisteredBank[];
  onAddBank: (bank: Omit<RegisteredBank, 'id'>) => void;
  onUpdateBank: (id: string, updates: Partial<RegisteredBank>) => void;
  onDeleteBank: (id: string) => void;
  onImportBanks: (
    banks: Array<Omit<RegisteredBank, 'id'>>,
    mode: 'append' | 'replace'
  ) => { added: number; updated: number; total: number };
  onResetToDefault: () => void;
}

export const RegisteredBanksTab: React.FC<RegisteredBanksTabProps> = ({
  registeredBanks,
  onAddBank,
  onUpdateBank,
  onDeleteBank,
  onImportBanks,
  onResetToDefault
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<RegisteredBank | null>(null);
  const [viewingBranchesBank, setViewingBranchesBank] = useState<RegisteredBank | null>(null);
  const [deleteConfirmBankId, setDeleteConfirmBankId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    return registeredBanks.filter((b) => {
      const matchesSearch =
        searchTerm === '' ||
        b.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bankCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.shortName && b.shortName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.swiftCode && b.swiftCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        b.branches.some((branch) => branch.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || b.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'All' || b.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [registeredBanks, searchTerm, selectedCategory, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = registeredBanks.length;
    const commercial = registeredBanks.filter(
      (b) => b.category === 'Licensed Commercial Bank'
    ).length;
    const specialized = registeredBanks.filter(
      (b) => b.category === 'Licensed Specialized Bank'
    ).length;
    const foreign = registeredBanks.filter(
      (b) => b.category === 'Foreign Bank'
    ).length;
    return { total, commercial, specialized, foreign };
  }, [registeredBanks]);

  const handleExportCsv = () => {
    const headers = [
      'bank_name',
      'bank_code',
      'swift_code',
      'short_name',
      'branches',
      'category',
      'head_office',
      'status'
    ];
    const rows = registeredBanks.map((b) => [
      `"${b.bankName.replace(/"/g, '""')}"`,
      `"${b.bankCode}"`,
      `"${b.swiftCode || ''}"`,
      `"${b.shortName || ''}"`,
      `"${(b.branches || []).join(';').replace(/"/g, '""')}"`,
      `"${b.category || ''}"`,
      `"${(b.headOffice || '').replace(/"/g, '""')}"`,
      `"${b.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `registered_banks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice(`Exported ${registeredBanks.length} registered banks to CSV.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingBank(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (bank: RegisteredBank) => {
    setEditingBank(bank);
    setIsAddModalOpen(true);
  };

  const handleSaveBank = (bankData: Omit<RegisteredBank, 'id'>) => {
    if (editingBank) {
      onUpdateBank(editingBank.id, bankData);
      setActionNotice(`Updated ${bankData.bankName} successfully.`);
    } else {
      onAddBank(bankData);
      setActionNotice(`Registered ${bankData.bankName} successfully.`);
    }
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDeleteBank = (id: string, name: string) => {
    onDeleteBank(id);
    setDeleteConfirmBankId(null);
    setActionNotice(`Removed ${name} from registered banks.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Notice Alert */}
      {actionNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
              CENTRAL DIRECTORY
            </span>
            <span className="text-xs text-slate-400">• CBSL Recognized Registry</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            Registered Banks & Financial Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Maintain recognized licensed commercial banks, specialized institutions, bank codes, SWIFT IDs, and branches used across corporate accounts, client invoicing, and bank dropdowns.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all hover:translate-y-[-1px]"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Bank List
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            Add Bank
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Export Registered Banks to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset registered banks to the standard Central Bank of Sri Lanka (CBSL) directory? Any custom entries may be overwritten.'
                )
              ) {
                onResetToDefault();
                setActionNotice('Reset to official CBSL registered banks list.');
                setTimeout(() => setActionNotice(null), 3000);
              }
            }}
            className="p-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-xs transition-colors"
            title="Restore CBSL Default Master Directory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Total Registered Banks</div>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{stats.total}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Available for account dropdowns
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Licensed Commercial</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats.commercial}</div>
          <div className="text-[10px] text-slate-500 mt-1">Major clearing banks</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Licensed Specialized</div>
          <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">{stats.specialized}</div>
          <div className="text-[10px] text-slate-500 mt-1">Savings & development banks</div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-medium text-slate-400">Foreign Commercial</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{stats.foreign}</div>
          <div className="text-[10px] text-slate-500 mt-1">International branches in LK</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bank name, code, SWIFT, branch..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
          >
            <option value="All">All Categories ({registeredBanks.length})</option>
            <option value="Licensed Commercial Bank">Licensed Commercial Bank</option>
            <option value="Licensed Specialized Bank">Licensed Specialized Bank</option>
            <option value="Foreign Bank">Foreign Bank</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Banks Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="px-4 py-3">Bank Name & Identity</th>
                <th className="px-4 py-3">Bank Code</th>
                <th className="px-4 py-3">SWIFT / BIC</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Branches</th>
                <th className="px-4 py-3">Head Office</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBanks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Landmark className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-60" />
                    <p className="text-sm text-slate-300 font-medium">No registered banks found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm
                        ? 'Try clearing the search or category filters.'
                        : 'Click "Import Bank List" or "Add Bank" to register banking institutions.'}
                    </p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Import Bank List
                      </button>
                      <button
                        onClick={onResetToDefault}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                      >
                        Load CBSL Preset
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBanks.map((bank) => (
                  <tr key={bank.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                          <Landmark className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{bank.bankName}</span>
                            {bank.shortName && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-300 border border-slate-700 rounded">
                                {bank.shortName}
                              </span>
                            )}
                          </div>
                          {bank.website && (
                            <a
                              href={bank.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 mt-0.5"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="truncate max-w-[180px]">
                                {bank.website.replace(/^https?:\/\//, '')}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-xs">
                      {bank.bankCode}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {bank.swiftCode ? (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-mono text-[11px]">
                          {bank.swiftCode}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                          bank.category === 'Licensed Commercial Bank'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : bank.category === 'Licensed Specialized Bank'
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            : bank.category === 'Foreign Bank'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {bank.category || 'Commercial'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setViewingBranchesBank(bank)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] transition-colors"
                        title="Click to view all registered branches"
                      >
                        <span>{bank.branches?.length || 0} branches</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate" title={bank.headOffice}>
                      {bank.headOffice ? (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{bank.headOffice}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          bank.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            bank.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {bank.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bank)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Bank Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmBankId === bank.id ? (
                          <div className="flex items-center gap-1 bg-red-950/90 border border-red-800 p-1 rounded-lg animate-in fade-in duration-100">
                            <span className="text-[10px] text-red-300 font-semibold px-1">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmBankId(null)}
                              className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmBankId(bank.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Bank"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branches Viewer Modal */}
      {viewingBranchesBank && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {viewingBranchesBank.bankName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Code: {viewingBranchesBank.bankCode} • SWIFT: {viewingBranchesBank.swiftCode || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingBranchesBank(null)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Registered Branches ({viewingBranchesBank.branches?.length || 0}):</span>
                <span className="text-[10px] text-slate-500">Auto-suggested in bank forms</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-slate-950/60 border border-slate-800 rounded-xl">
                {viewingBranchesBank.branches && viewingBranchesBank.branches.length > 0 ? (
                  viewingBranchesBank.branches.map((branch, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {branch}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 p-2">No individual branches listed.</span>
                )}
              </div>

              {viewingBranchesBank.notes && (
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Notes: </span>
                  {viewingBranchesBank.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingBranchesBank(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportBankListModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onImportBanks}
        existingBankCount={registeredBanks.length}
      />

      {/* Add / Edit Bank Modal */}
      <AddRegisteredBankModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBank(null);
        }}
        onSave={handleSaveBank}
        editingBank={editingBank}
      />
    </div>
  );
};
