import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  FileCheck,
  ArrowUpRight,
  RotateCcw,
  ArrowLeftRight,
  Sliders,
  ClipboardCheck,
  Package,
  Building2,
  Boxes
} from 'lucide-react';

export type InventoryDeleteType =
  | 'grn'
  | 'issue'
  | 'return'
  | 'transfer'
  | 'adjustment'
  | 'count'
  | 'material'
  | 'store'
  | 'batch'
  | 'balance';

export interface InventoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InventoryDeleteType;
  id: string;
  title: string;
  code?: string;
  subtitle?: string;
  details?: Array<{ label: string; value: string | number }>;
  onConfirm: () => void | Promise<void>;
  successMessage?: string;
}

export const InventoryDeleteModal: React.FC<InventoryDeleteModalProps> = ({
  isOpen,
  onClose,
  type,
  id,
  title,
  code,
  subtitle,
  details,
  onConfirm,
  successMessage
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const getTypeMeta = () => {
    switch (type) {
      case 'grn':
        return {
          label: 'Inward GRN Voucher',
          icon: FileCheck,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        };
      case 'issue':
        return {
          label: 'Material Issue Note (MIN)',
          icon: ArrowUpRight,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
          badgeColor: 'bg-purple-950 text-purple-300 border-purple-800'
        };
      case 'return':
        return {
          label: 'Material Return Note (MRN)',
          icon: RotateCcw,
          color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
          badgeColor: 'bg-teal-950 text-teal-300 border-teal-800'
        };
      case 'transfer':
        return {
          label: 'Stock Transfer (STR)',
          icon: ArrowLeftRight,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        };
      case 'adjustment':
        return {
          label: 'Stock Adjustment Voucher',
          icon: Sliders,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
        };
      case 'count':
        return {
          label: 'Physical Stocktake Count Sheet',
          icon: ClipboardCheck,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
          badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800'
        };
      case 'material':
        return {
          label: 'Material Master Item',
          icon: Package,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
        };
      case 'store':
        return {
          label: 'Store / Warehouse Facility',
          icon: Building2,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          badgeColor: 'bg-blue-950 text-blue-300 border-blue-800'
        };
      case 'batch':
        return {
          label: 'Stock Batch & Mill Cert',
          icon: Boxes,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
        };
      case 'balance':
        return {
          label: 'Warehouse Stock Balance',
          icon: Boxes,
          color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  const meta = getTypeMeta();
  const IconComponent = meta.icon;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      setIsDone(true);
      setTimeout(() => {
        setIsDeleting(false);
        setIsDone(false);
        onClose();
      }, 700);
    } catch (error) {
      console.error('Delete failed:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${meta.badgeColor}`}>
                {meta.label}
              </span>
              <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                Delete Record Confirmation
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Target Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Identifier:</span>
              <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {code || id}
              </span>
            </div>
            <div className="flex items-start gap-2.5 pt-1">
              <div className={`p-2 rounded-lg shrink-0 border ${meta.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{title}</h4>
                {subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>}
              </div>
            </div>

            {/* Optional details grid */}
            {details && details.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                {details.map((d, i) => (
                  <div key={i} className="truncate">
                    <span className="text-slate-500">{d.label}:</span>{' '}
                    <span className="text-slate-200 font-semibold">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Are you sure you want to delete this record?</p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                This action will permanently delete this {meta.label.toLowerCase()} from the database and refresh all dependent store totals and balances.
              </p>
            </div>
          </div>

          {/* Success Banner if done */}
          {isDone && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMessage || 'Record deleted successfully.'}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isDone}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/30 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : isDone ? 'Deleted' : 'Delete Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
