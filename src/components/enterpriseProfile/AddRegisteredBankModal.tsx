import React, { useState, useEffect } from 'react';
import {
  X,
  Landmark,
  Save,
  Building,
  Plus,
  Trash2,
  Globe,
  Phone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { RegisteredBank } from '../../types/bankingTypes';

interface AddRegisteredBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bank: Omit<RegisteredBank, 'id'>) => void;
  editingBank?: RegisteredBank | null;
}

export const AddRegisteredBankModal: React.FC<AddRegisteredBankModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBank
}) => {
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [shortName, setShortName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [category, setCategory] = useState<RegisteredBank['category']>('Licensed Commercial Bank');
  const [headOffice, setHeadOffice] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [notes, setNotes] = useState('');
  const [branches, setBranches] = useState<string[]>(['Head Office']);
  const [newBranchInput, setNewBranchInput] = useState('');

  useEffect(() => {
    if (editingBank) {
      setBankName(editingBank.bankName || '');
      setBankCode(editingBank.bankCode || '');
      setShortName(editingBank.shortName || '');
      setSwiftCode(editingBank.swiftCode || '');
      setCategory(editingBank.category || 'Licensed Commercial Bank');
      setHeadOffice(editingBank.headOffice || '');
      setContactNumber(editingBank.contactNumber || '');
      setWebsite(editingBank.website || '');
      setStatus(editingBank.status || 'Active');
      setNotes(editingBank.notes || '');
      setBranches(editingBank.branches?.length ? editingBank.branches : ['Head Office']);
    } else {
      setBankName('');
      setBankCode('');
      setShortName('');
      setSwiftCode('');
      setCategory('Licensed Commercial Bank');
      setHeadOffice('');
      setContactNumber('');
      setWebsite('');
      setStatus('Active');
      setNotes('');
      setBranches(['Head Office']);
    }
    setNewBranchInput('');
  }, [editingBank, isOpen]);

  if (!isOpen) return null;

  const handleAddBranch = () => {
    const trimmed = newBranchInput.trim();
    if (!trimmed) return;
    if (!branches.includes(trimmed)) {
      setBranches([...branches, trimmed]);
    }
    setNewBranchInput('');
  };

  const handleRemoveBranch = (index: number) => {
    setBranches(branches.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankCode.trim()) return;

    onSave({
      bankName: bankName.trim(),
      bankCode: bankCode.trim(),
      shortName: shortName.trim() || undefined,
      swiftCode: swiftCode.trim() || undefined,
      category,
      headOffice: headOffice.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
      website: website.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
      branches: branches.length > 0 ? branches : ['Head Office']
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                {editingBank ? 'Edit Registered Bank' : 'Register New Bank'}
              </h3>
              <p className="text-xs text-slate-400">
                Corporate directory entry for banking operations & project bidding
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Official Bank Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Commercial Bank of Ceylon PLC"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Short Name / Acronym
              </label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                placeholder="e.g. COMBANK"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Bank Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value.trim())}
                placeholder="e.g. 7010"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                SWIFT / BIC Code
              </label>
              <input
                type="text"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value.toUpperCase().trim())}
                placeholder="e.g. CCEYLKFX"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Licensed Commercial Bank">Licensed Commercial Bank</option>
                <option value="Licensed Specialized Bank">Licensed Specialized Bank</option>
                <option value="Foreign Bank">Foreign Bank</option>
                <option value="Other">Other Financial Institution</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Head Office Address
              </label>
              <input
                type="text"
                value={headOffice}
                onChange={(e) => setHeadOffice(e.target.value)}
                placeholder="e.g. 21 Sir Razik Fareed Mawatha, Colombo 01"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Active">Active (Recognized for transactions)</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Contact Hotline
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +94 11 248 6000"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Official Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. https://www.combank.lk"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Branches Section */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Registered Branches ({branches.length})
              </label>
              <span className="text-[10px] text-slate-500">
                Populates branch dropdowns in account forms
              </span>
            </div>

            {/* Branch tags */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {branches.map((branch, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[11px]"
                >
                  <span>{branch}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBranch(idx)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add branch input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newBranchInput}
                onChange={(e) => setNewBranchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBranch();
                  }
                }}
                placeholder="e.g. Kollupitiya Branch, Kandy Metro Branch"
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddBranch}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Branch
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Operational Notes / Mandate Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primary bank used for tax payments, customs escrow, and CIDA performance bonds."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer inside form */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all hover:translate-y-[-1px]"
            >
              <Save className="w-4 h-4" />
              {editingBank ? 'Save Changes' : 'Register Bank'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
