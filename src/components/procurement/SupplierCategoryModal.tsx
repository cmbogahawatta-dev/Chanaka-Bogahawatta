import React, { useState } from 'react';
import {
  X,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  FolderTree
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { SupplierCategory } from '../../types/supplierTypes';

interface SupplierCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupplierCategoryModal: React.FC<SupplierCategoryModalProps> = ({
  isOpen,
  onClose
}) => {
  const { categories, addCategory, deleteCategory } = useSupplier();

  const [name, setName] = useState('');
  const [group, setGroup] = useState<SupplierCategory['group']>('Materials');
  const [description, setDescription] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name: name.trim(),
      group,
      description: description.trim() || undefined
    });

    setName('');
    setDescription('');
  };

  const filteredCategories = categories.filter(c =>
    filterGroup === 'ALL' || c.group === filterGroup
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-800/80 flex items-center justify-center text-orange-400 font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Supplier & Procurement Categories
              </h3>
              <p className="text-xs text-slate-400">
                Manage material classifications, trade contracts, equipment hire and service categories.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-orange-400 block">+ Add New Classification</span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Structural Steel & Rebars"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category Group</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="Materials">Materials</option>
                  <option value="Services">Services</option>
                  <option value="Subcontractors">Subcontractors</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description / specification codes..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Registered Categories ({categories.length})
              </span>

              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'Materials', 'Services', 'Subcontractors', 'Equipment'].map(grp => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setFilterGroup(grp)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                      filterGroup === grp
                        ? 'bg-orange-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{cat.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Group: {cat.group}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
