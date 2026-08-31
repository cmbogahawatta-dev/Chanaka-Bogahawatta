import React, { useState } from 'react';
import { Users, PlusCircle, UserCheck, Phone, Mail, DollarSign, Building, Trash2, ShieldAlert, Edit2, FileSpreadsheet } from 'lucide-react';
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
    addSupervisor,
    updateSupervisor,
    deleteSupervisor,
    clearSupervisorsDirectory,
    projects
  } = usePettyCash();
  const { currentRole } = useEnterprise();
  const { isAdmin } = useFleet();
  const isRoleAdmin = currentRole === 'ADMIN' || isAdmin;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [defaultProject, setDefaultProject] = useState<string>('PIDM 26');
  const [openingBalance, setOpeningBalance] = useState<string>('');

  const formatLKR = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'LKR ');
  };

  const handleOpenAdd = () => {
    setEditingSupervisor(null);
    setName('');
    setPhone('');
    setEmail('');
    setDefaultProject(projects[0]?.PROJECT_CODE || 'PIDM 26');
    setOpeningBalance('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supervisor) => {
    setEditingSupervisor(sup);
    setName(sup.SUPERVISOR_NAME);
    setPhone(sup.PHONE || '');
    setEmail(sup.EMAIL || '');
    setDefaultProject(sup.DEFAULT_PROJECT || projects[0]?.PROJECT_CODE || 'PIDM 26');
    setOpeningBalance(sup.OPENING_PETTY_CASH ? sup.OPENING_PETTY_CASH.toString() : '0');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupervisor) {
      updateSupervisor(editingSupervisor.id, {
        SUPERVISOR_NAME: name.trim().toUpperCase(),
        PHONE: phone.trim() || '+94 77 000 0000',
        EMAIL: email.trim() || `${name.trim().toLowerCase()}@company.com`,
        DEFAULT_PROJECT: defaultProject,
        OPENING_PETTY_CASH: parseFloat(openingBalance) || 0
      });
    } else {
      addSupervisor({
        SUPERVISOR_NAME: name.trim().toUpperCase(),
        PHONE: phone.trim() || '+94 77 000 0000',
        EMAIL: email.trim() || `${name.trim().toLowerCase()}@company.com`,
        DEFAULT_PROJECT: defaultProject,
        OPENING_PETTY_CASH: parseFloat(openingBalance) || 0,
        ACTIVE: true
      });
    }

    setName('');
    setPhone('');
    setEmail('');
    setOpeningBalance('');
    setEditingSupervisor(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Site Supervisors Master Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage site officers authorized to receive petty cash float and submit expense vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <button
            id="btn-add-supervisor"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Supervisor</span>
          </button>
        </div>
      </div>

      {/* Supervisors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">ID</th>
                <th className="py-3 px-3">Supervisor Name</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3">Assigned Site</th>
                <th className="py-3 px-3 text-right">Opening Float</th>
                <th className="py-3 px-3 text-right">Current Available Balance</th>
                <th className="py-3 px-3 text-center">{isRoleAdmin ? 'Actions / Status' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {supervisors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-400 text-sm">Supervisors Directory is Empty</p>
                    <p className="text-[11px] text-slate-600 mt-1">Click "Add Supervisor" to register site officers, or restore sample data from Administration.</p>
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
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-400">{sup.SUPERIOR_ID || sup.SUPERVISOR_ID}</td>
                      <td className="py-3 px-3 font-bold text-slate-100 flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white ${
                          bal.isOverdrawn ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}>
                          {sup.SUPERVISOR_NAME.slice(0, 2)}
                        </div>
                        <span>{sup.SUPERVISOR_NAME}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{sup.PHONE}</div>
                        <div className="text-[10px] text-slate-500">{sup.EMAIL}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[11px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {sup.DEFAULT_PROJECT || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatLKR(sup.OPENING_PETTY_CASH)}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-black ${
                        bal.isOverdrawn ? 'text-rose-400' : 'text-emerald-300'
                      }`}>
                        {formatLKR(bal.currentBalance)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Active
                          </span>
                          {isRoleAdmin && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(sup)}
                                title="Admin: Edit Supervisor"
                                className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Admin: Are you sure you want to remove supervisor "${sup.SUPERVISOR_NAME}"?`)) {
                                    deleteSupervisor(sup.id);
                                  }
                                }}
                                title="Admin: Delete Supervisor"
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
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

      {/* Add / Edit Supervisor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-100">
              {editingSupervisor ? `Edit Supervisor: ${editingSupervisor.SUPERVISOR_NAME}` : 'Add New Site Supervisor'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Supervisor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KAMAL PERERA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. kamal@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Default Site Project</label>
                <select
                  value={defaultProject}
                  onChange={(e) => setDefaultProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.PROJECT_CODE}>
                      {p.PROJECT_CODE} - {p.PROJECT_NAME.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Opening Petty Cash Float (LKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {editingSupervisor ? 'Save Changes' : 'Save Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
