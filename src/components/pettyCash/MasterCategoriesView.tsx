import React, { useState } from 'react';
import { Tag, PlusCircle, Folder, Trash2, Edit2 } from 'lucide-react';
import { usePettyCash } from '../../context/PettyCashContext';
import { ExpenseCategory } from '../../types/pettyCashTypes';
import { UniversalDeleteModal } from '../common/UniversalDeleteModal';

export const MasterCategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, pivotMatrix } = usePettyCash();
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [group, setGroup] = useState<string>('Direct Project Cost');
  const [desc, setDesc] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addCategory({
      CATEGORY_CODE: code.trim(),
      CATEGORY_NAME: `${code.trim()} ${name.trim()}`,
      CATEGORY_GROUP: group,
      DESCRIPTION: desc.trim() || undefined
    });

    setCode('');
    setName('');
    setDesc('');
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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Category</span>
        </button>
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
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No expense categories configured. Click "New Category" above to add one.
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
                      <td className="py-3 px-3 text-slate-400">{c.DESCRIPTION || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                        {spent.toLocaleString('en-LK', { minimumFractionDigits: 2 })} LKR
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setCategoryToDelete(c);
                            }}
                            title="Delete Expense Category"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-slate-100">Add New Expense Category</h4>
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
