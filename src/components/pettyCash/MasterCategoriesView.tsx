import React, { useState } from 'react';
import { Tag, PlusCircle, Trash2, Edit2, FileSpreadsheet } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { ExpenseCategory } from '../../types/pettyCashTypes';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { BulkImportCategoriesModal } from './BulkImportCategoriesModal';

export const MasterCategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, clearCategoriesHistory, pivotMatrix } = usePettyCash();
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [group, setGroup] = useState<string>('Direct Project Cost');
  const [desc, setDesc] = useState<string>('');

  const handleOpenAddModal = (catToEdit?: ExpenseCategory) => {
    if (catToEdit) {
      setEditingCategory(catToEdit);
      setCode(catToEdit.CATEGORY_CODE);
      const prefix = `${catToEdit.CATEGORY_CODE} `;
      const cleanName = catToEdit.CATEGORY_NAME.startsWith(prefix)
        ? catToEdit.CATEGORY_NAME.slice(prefix.length)
        : catToEdit.CATEGORY_NAME;
      setName(cleanName);
      setGroup(catToEdit.CATEGORY_GROUP);
      setDesc(catToEdit.DESCRIPTION || catToEdit.REMARKS || '');
    } else {
      setEditingCategory(null);
      setCode('');
      setName('');
      setGroup('Direct Project Cost');
      setDesc('');
    }
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const formattedName = name.trim().startsWith(code.trim())
      ? name.trim()
      : `${code.trim()} ${name.trim()}`;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        CATEGORY_CODE: code.trim(),
        CATEGORY_NAME: formattedName,
        CATEGORY_GROUP: group,
        DESCRIPTION: desc.trim() || undefined,
        REMARKS: desc.trim() || undefined
      });
    } else {
      addCategory({
        CATEGORY_CODE: code.trim(),
        CATEGORY_NAME: formattedName,
        CATEGORY_GROUP: group,
        ACTIVE: true,
        DESCRIPTION: desc.trim() || undefined
      });
    }

    setCode('');
    setName('');
    setDesc('');
    setEditingCategory(null);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-emerald-400" />
            <span>Accounting Expense Categories & Cost Codes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            General ledger cost classification mapped to Google Sheets accounting master.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-bulk-import-categories"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold shadow-md transition-all active:scale-95"
            title="Bulk import GL expense categories from Excel, CSV or Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
          <AdminClearHistoryButton
            id="btn-admin-clear-categories"
            moduleName="Expense Categories Directory"
            itemCount={categories.length}
            itemDescription="registered GL expense categories and cost codes"
            preservedItemsDescription="Existing expense transactions and voucher logs will remain safely recorded."
            buttonText="Clear Categories"
            onClear={() => clearCategoriesHistory()}
          />
          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">GL Code</th>
                <th className="py-3 px-3">Category Name</th>
                <th className="py-3 px-3">Cost Group</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 text-right">Total Spent (LKR)</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-sm font-medium text-slate-400">No expense categories configured.</p>
                      <p className="text-xs text-slate-500">
                        Import your chart of accounts via spreadsheet or add single categories manually.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => setIsBulkImportOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Bulk Import Categories</span>
                        </button>
                        <button
                          onClick={() => handleOpenAddModal()}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                        >
                          Add Single Category
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((c) => {
                  const pivotRow = pivotMatrix.rows.find(r => r.categoryCode === c.CATEGORY_CODE);
                  const spent = pivotRow?.rowTotal || 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-400">{c.CATEGORY_CODE}</td>
                      <td className="py-3 px-3 font-semibold text-slate-100">{c.CATEGORY_NAME}</td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {c.CATEGORY_GROUP}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{c.DESCRIPTION || c.REMARKS || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                        {spent.toLocaleString('en-LK', { minimumFractionDigits: 2 })} LKR
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAddModal(c)}
                            title="Edit Category"
                            className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setCategoryToDelete(c);
                            }}
                            title="Delete Expense Category"
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Universal Authorized Delete Modal */}
      {categoryToDelete && (
        <UniversalDeleteModal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          module="CATEGORIES"
          recordId={categoryToDelete.id}
          recordCode={categoryToDelete.CATEGORY_CODE}
          recordName={categoryToDelete.CATEGORY_NAME}
          additionalDetails={`Group: ${categoryToDelete.CATEGORY_GROUP} • GL Code: ${categoryToDelete.CATEGORY_CODE}`}
          onDelete={async () => {
            deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
          }}
          onDeactivate={async () => {
            setCategoryToDelete(null);
          }}
        />
      )}

      {/* Bulk Import GL Categories Modal */}
      {isBulkImportOpen && (
        <BulkImportCategoriesModal
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
        />
      )}

      {/* Add / Edit Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-100">
              {editingCategory ? 'Edit Expense Category' : 'Add New Expense Category'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">GL / Code Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5090"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Safety Gear & PPE"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Cost Group</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                >
                  <option value="Direct Project Cost">Direct Project Cost</option>
                  <option value="Site Overheads">Site Overheads</option>
                  <option value="Admin & Head Office">Admin & Head Office</option>
                  <option value="Special / Non-Project">Special / Non-Project</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Helmets, boots, reflective jackets for workers"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
