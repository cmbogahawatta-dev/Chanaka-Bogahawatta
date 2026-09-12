import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  FileCheck,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { useInventory } from '../../../context/InventoryContext';

export interface InventoryClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultScope?: 'ALL' | 'GRN' | 'MATERIAL_ISSUE' | 'MATERIAL_RETURN' | 'STOCK_TRANSFER' | 'STOCK_ADJUSTMENT' | 'STOCK_COUNT';
}

export const InventoryClearHistoryModal: React.FC<InventoryClearHistoryModalProps> = ({
  isOpen,
  onClose,
  defaultScope = 'ALL'
}) => {
  const {
    grns,
    materialIssues,
    materialReturns,
    stockTransfers,
    stockAdjustments,
    stockCounts,
    clearTransactionHistory,
    resetToDefaultInventory
  } = useInventory();

  const [selectedScope, setSelectedScope] = useState<string>(defaultScope);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCount =
    grns.length +
    materialIssues.length +
    materialReturns.length +
    stockTransfers.length +
    stockAdjustments.length +
    stockCounts.length;

  const getScopeCount = (scope: string) => {
    switch (scope) {
      case 'ALL': return totalCount;
      case 'GRN': return grns.length;
      case 'MATERIAL_ISSUE': return materialIssues.length;
      case 'MATERIAL_RETURN': return materialReturns.length;
      case 'STOCK_TRANSFER': return stockTransfers.length;
      case 'STOCK_ADJUSTMENT': return stockAdjustments.length;
      case 'STOCK_COUNT': return stockCounts.length;
      default: return totalCount;
    }
  };

  const handleClear = () => {
    setIsProcessing(true);
    try {
      if (selectedScope === 'RESTORE_DEFAULT') {
        resetToDefaultInventory();
        setSuccessMsg('Default inventory sample records restored successfully.');
      } else {
        clearTransactionHistory(selectedScope);
        setSuccessMsg(
          selectedScope === 'ALL'
            ? `All ${totalCount} transaction history records have been cleared.`
            : `Selected transaction records cleared successfully.`
        );
      }
      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMsg(null);
        onClose();
      }, 900);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-red-950 text-red-300 border-red-800">
                  Inventory Transactions
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold border border-slate-700">
                  {totalCount} Total Records
                </span>
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                Clear Transaction History & Logs
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Summary Breakdown Grid */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                <FileCheck className="w-3.5 h-3.5" />
                <span>GRNs</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">{grns.length}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1 text-purple-400 font-medium text-[11px]">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Issues (MIN)</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">{materialIssues.length}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1 text-teal-400 font-medium text-[11px]">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Returns (MRN)</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">{materialReturns.length}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1 text-cyan-400 font-medium text-[11px]">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transfers</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">{stockTransfers.length}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1 text-rose-400 font-medium text-[11px]">
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjustments</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">{stockAdjustments.length}</div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1 text-indigo-400 font-medium text-[11px]">
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Stock Counts</span>
              </div>
              <div className="text-base font-bold font-mono text-white mt-1">{stockCounts.length}</div>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select What To Clear:
            </label>
            <div className="space-y-1.5">
              <label
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedScope === 'ALL'
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="clearScope"
                    value="ALL"
                    checked={selectedScope === 'ALL'}
                    onChange={() => setSelectedScope('ALL')}
                    className="accent-red-500"
                  />
                  <span className="font-semibold text-white">Clear ALL Transaction Registers</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-400">{totalCount} records</span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedScope === 'GRN'
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="clearScope"
                    value="GRN"
                    checked={selectedScope === 'GRN'}
                    onChange={() => setSelectedScope('GRN')}
                    className="accent-red-500"
                  />
                  <span>GRN (Store Inward Receipts) only</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-300">{grns.length} records</span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedScope === 'MATERIAL_ISSUE'
                    ? 'bg-red-950/40 border-red-500/60 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="clearScope"
                    value="MATERIAL_ISSUE"
                    checked={selectedScope === 'MATERIAL_ISSUE'}
                    onChange={() => setSelectedScope('MATERIAL_ISSUE')}
                    className="accent-red-500"
                  />
                  <span>Material Issues (MIN) only</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-300">{materialIssues.length} records</span>
              </label>

              <label
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  selectedScope === 'RESTORE_DEFAULT'
                    ? 'bg-blue-950/40 border-blue-500/60 text-blue-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="clearScope"
                    value="RESTORE_DEFAULT"
                    checked={selectedScope === 'RESTORE_DEFAULT'}
                    onChange={() => setSelectedScope('RESTORE_DEFAULT')}
                    className="accent-blue-500"
                  />
                  <span className="font-medium text-blue-300 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    Reset & Restore Realistic Sample Data
                  </span>
                </div>
                <span className="text-[11px] text-blue-400 font-medium">Full Construction Set</span>
              </label>
            </div>
          </div>

          {/* Preservation guarantee banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-200">Catalog Preservation Guarantee</p>
              <p className="text-emerald-300/80 text-[11px] mt-0.5">
                Material Master SKUs, Store/Warehouse facilities, and current base warehouse inventory definitions are preserved.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={isProcessing || (selectedScope !== 'RESTORE_DEFAULT' && getScopeCount(selectedScope) === 0)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md disabled:opacity-50 ${
                selectedScope === 'RESTORE_DEFAULT'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              }`}
            >
              {selectedScope === 'RESTORE_DEFAULT' ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {isProcessing ? 'Restoring...' : 'Restore Sample Data'}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {isProcessing ? 'Clearing...' : `Clear Records (${getScopeCount(selectedScope)})`}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
