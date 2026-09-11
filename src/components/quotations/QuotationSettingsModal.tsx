import React, { useState } from 'react';
import { X, Settings, CheckCircle2, ShieldCheck, RefreshCw, Landmark } from 'lucide-react';
import { useQuotation } from '../../context/QuotationContext';
import { QuotationSettings } from '../../types/quotationTypes';

interface QuotationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotationSettingsModal: React.FC<QuotationSettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetQuotationsToDefault } = useQuotation();
  const [formData, setFormData] = useState<QuotationSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Quotation &amp; Estimate Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Independent serial sequences, statutory tax rates &amp; default commercial terms
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Numbering Sequences */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <span className="font-bold text-slate-300 text-xs block pb-1 border-b border-slate-800">
              Document Reference Numbering Sequences
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Quotation Prefix
                </label>
                <input
                  type="text"
                  value={formData.quotationPrefix}
                  onChange={e => setFormData({ ...formData, quotationPrefix: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Next Quotation Sequence (e.g. 4 → QT-2026-00004)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.nextQuotationSequence}
                  onChange={e => setFormData({ ...formData, nextQuotationSequence: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Estimate Prefix
                </label>
                <input
                  type="text"
                  value={formData.estimatePrefix}
                  onChange={e => setFormData({ ...formData, estimatePrefix: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Next Estimate Sequence (e.g. 3 → EST-2026-00003)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.nextEstimateSequence}
                  onChange={e => setFormData({ ...formData, nextEstimateSequence: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Tax & Validity Defaults */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <span className="font-bold text-slate-300 text-xs block pb-1 border-b border-slate-800">
              Statutory Tax &amp; Validity Defaults
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Standard VAT Rate (%)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.standardVatRate}
                  onChange={e => setFormData({ ...formData, standardVatRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Validity Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.defaultValidityDays}
                  onChange={e => setFormData({ ...formData, defaultValidityDays: parseInt(e.target.value, 10) || 30 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Default Commercial Terms */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <span className="font-bold text-slate-300 text-xs block pb-1 border-b border-slate-800">
              Default Commercial Boilerplate Text
            </span>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Payment Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.defaultPaymentTerms}
                  onChange={e => setFormData({ ...formData, defaultPaymentTerms: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Delivery Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.defaultDeliveryTerms}
                  onChange={e => setFormData({ ...formData, defaultDeliveryTerms: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Warranty / DLP
                </label>
                <input
                  type="text"
                  value={formData.defaultWarranty}
                  onChange={e => setFormData({ ...formData, defaultWarranty: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Exclusions
                </label>
                <input
                  type="text"
                  value={formData.defaultExclusions}
                  onChange={e => setFormData({ ...formData, defaultExclusions: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset quotation sample data and settings to standard defaults?')) {
                  resetQuotationsToDefault();
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md shadow-cyan-950/60 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
