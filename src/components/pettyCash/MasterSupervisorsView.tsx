import React, { useState } from 'react';
import { Users, UserCheck, Phone, Mail, DollarSign, Building, Edit2, Trash2, FileSpreadsheet, ShieldCheck, Briefcase, Lock } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useFleet } from '../../context/FleetContext';
import { Supervisor } from '../../types/pettyCashTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { BulkImportSupervisorsModal } from './BulkImportSupervisorsModal';

export const MasterSupervisorsView: React.FC = () => {
  const {
    supervisors,
    supervisorBalances,
    updateSupervisor,
    deleteSupervisor,
    clearSupervisorsDirectory
  } = usePettyCash();
  const { currentRole } = useEnterprise();
  const { isAdmin } = useFleet();
  const isAuthorizedFinancialRole =
    currentRole === 'ADMIN' ||
    currentRole === 'FINANCE' ||
    currentRole === 'OWNER' ||
    isAdmin;

  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [openingBalance, setOpeningBalance] = useState<string>('');

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const handleOpenEditFloat = (sup: Supervisor) => {
    setEditingSupervisor(sup);
    setOpeningBalance(sup.OPENING_PETTY_CASH ? sup.OPENING_PETTY_CASH.toString() : '0');
  };

  const handleSaveFloat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupervisor) return;

    updateSupervisor(editingSupervisor.id, {
      OPENING_PETTY_CASH: parseFloat(openingBalance) || 0
    });

    setEditingSupervisor(null);
    setOpeningBalance('');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span>Supervisor Directory & Petty Cash Allocations</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Staff Directory Master
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operational petty cash float ledger powered by central Staff Directory. All active personnel are eligible float holders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAuthorizedFinancialRole && (
            <>
              <button
                id="btn-bulk-import-supervisors"
                onClick={() => setIsBulkImportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold shadow-md transition-all active:scale-95"
                title="Bulk import supervisors from Excel/CSV with Admin PIN approval"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>
              <AdminClearHistoryButton
                id="btn-admin-clear-supervisors"
                moduleName="Site Supervisors Directory"
                itemCount={supervisors.length}
                itemDescription="registered site supervisors and assigned petty cash float allocations"
                preservedItemsDescription="Existing expenses, income receipts, and road project masters will remain intact."
                onClear={() => clearSupervisorsDirectory()}
              />
            </>
          )}
        </div>
      </div>

      {/* Synchronized Master Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-slate-100">Synchronized with Staff Directory:</span> Employee identity, contact info, and project allocations are centrally mastered. Adjust opening float balances below as needed.
          </div>
        </div>
        {!isAuthorizedFinancialRole && (
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded flex items-center gap-1 font-bold shrink-0">
            <Lock className="w-3 h-3" />
            FINANCIAL ACCESS RESTRICTED
          </span>
        )}
      </div>

      {/* Supervisors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Code / ID</th>
                <th className="py-3 px-3">Employee Name</th>
                <th className="py-3 px-3">Designation & Department</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Assigned Projects</th>
                <th className="py-3 px-3 text-right">Opening Float</th>
                <th className="py-3 px-3 text-right">Current Balance</th>
                <th className="py-3 px-3 text-center">{isAuthorizedFinancialRole ? 'Actions / Status' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {supervisors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-400 text-sm">No Active Staff Members Found</p>
                    <p className="text-[11px] text-slate-600 mt-1 mb-4">Active employees registered in Staff Directory will automatically appear here as eligible float holders.</p>
                  </td>
                </tr>
              ) : (
                supervisors.map((sup) => {
                  const bal = supervisorBalances[sup.SUPERVISOR_NAME.trim().toUpperCase()] || {
                    currentBalance: sup.OPENING_PETTY_CASH,
                    isOverdrawn: false
                  };

                  return (
                    <tr key={sup.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-400">
                        <div>{sup.employeeCode || sup.SUPERVISOR_ID}</div>
                        {sup.legacySupervisorId && sup.legacySupervisorId !== sup.employeeCode && (
                          <div className="text-[9px] font-mono text-slate-500 font-normal">Legacy: {sup.legacySupervisorId}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                            bal.isOverdrawn ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}>
                            {sup.SUPERVISOR_NAME.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100">{sup.FULL_NAME || sup.SUPERVISOR_NAME}</div>
                            <div className="text-[10px] font-mono text-emerald-400 font-semibold">{sup.SUPERVISOR_NAME}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="font-medium text-slate-200">{sup.designation || 'Site Personnel'}</div>
                        <div className="text-[10px] text-slate-400">{sup.department || 'Operations'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{sup.PHONE}</div>
                        <div className="text-[10px] text-slate-500">{sup.EMAIL}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {sup.ASSIGNED_PROJECTS && sup.ASSIGNED_PROJECTS.length > 0 ? (
                            sup.ASSIGNED_PROJECTS.map((prj, i) => (
                              <span key={i} className="font-bold text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                                {prj}
                              </span>
                            ))
                          ) : (
                            <span className="font-bold text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {sup.DEFAULT_PROJECT || 'General'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {isAuthorizedFinancialRole ? (
                          formatLKR(sup.OPENING_PETTY_CASH)
                        ) : (
                          <span className="text-slate-500 italic font-normal text-[11px]">Confidential</span>
                        )}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-black ${
                        bal.isOverdrawn ? 'text-rose-400' : 'text-emerald-300'
                      }`}>
                        {isAuthorizedFinancialRole ? (
                          formatLKR(bal.currentBalance)
                        ) : (
                          <span className="text-slate-500 italic font-normal text-[11px]">••••••••</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Active
                          </span>
                          {isAuthorizedFinancialRole && (
                            <>
                              <button
                                onClick={() => handleOpenEditFloat(sup)}
                                title="Adjust Opening Float Allocation"
                                className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  const name = sup.FULL_NAME || sup.SUPERVISOR_NAME;
                                  if (window.confirm(`Are you sure you want to remove supervisor "${name}" (${sup.employeeCode || sup.SUPERVISOR_ID}) from the directory?`)) {
                                    deleteSupervisor(sup.id);
                                  }
                                }}
                                title="Delete Supervisor Entry"
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Float Allocation Modal */}
      {editingSupervisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div>
              <h4 className="text-base font-bold text-slate-100">
                Adjust Opening Float Allocation
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingSupervisor.FULL_NAME || editingSupervisor.SUPERVISOR_NAME} ({editingSupervisor.employeeCode || editingSupervisor.SUPERVISOR_ID})
              </p>
            </div>
            <form onSubmit={handleSaveFloat} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Opening Petty Cash Float (LKR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50000.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This sets the initial opening float balance for this employee. Identity and project assignments are maintained in Staff Directory.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSupervisor(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition active:scale-95"
                >
                  Save Float
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Supervisors Modal */}
      <BulkImportSupervisorsModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
