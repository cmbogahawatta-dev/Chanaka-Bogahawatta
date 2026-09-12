import React, { useState } from 'react';
import {
  Boxes,
  LayoutDashboard,
  Package,
  Building2,
  Layers,
  ArrowLeftRight,
  Plus,
  FileCheck,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  ClipboardCheck,
  Trash2
} from 'lucide-react';
import { MaterialItem, Store, InventoryGRN, MaterialIssue, MaterialReturn, StockTransfer, StockAdjustment, StockCount } from '../../types/inventoryTypes';
import { useInventory } from '../../context/InventoryContext';
import { InventoryDashboardView } from './InventoryDashboardView';
import { MaterialMasterView } from './MaterialMasterView';
import { StoresMasterView } from './StoresMasterView';
import { StockBalancesView } from './StockBalancesView';
import { TransactionsRegisterView, TransactionTab } from './TransactionsRegisterView';

// Modals
import { MaterialFormModal } from './modals/MaterialFormModal';
import { StoreFormModal } from './modals/StoreFormModal';
import { GRNModal } from './modals/GRNModal';
import { MaterialIssueModal } from './modals/MaterialIssueModal';
import { MaterialReturnModal } from './modals/MaterialReturnModal';
import { StockTransferModal } from './modals/StockTransferModal';
import { StockAdjustmentModal } from './modals/StockAdjustmentModal';
import { StockCountModal } from './modals/StockCountModal';
import { InventoryClearHistoryModal } from './modals/InventoryClearHistoryModal';

type InventoryTab = 'dashboard' | 'materials' | 'stores' | 'stock' | 'transactions';

export const InventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('dashboard');
  const [transactionSubTab, setTransactionSubTab] = useState<TransactionTab>('grn');

  // Modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [editingGRN, setEditingGRN] = useState<InventoryGRN | null>(null);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<MaterialIssue | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<MaterialReturn | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<StockAdjustment | null>(null);

  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [editingCount, setEditingCount] = useState<StockCount | null>(null);

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const { grns, materialIssues, materialReturns, stockTransfers, stockAdjustments, stockCounts } = useInventory();
  const totalTxCount = grns.length + materialIssues.length + materialReturns.length + stockTransfers.length + stockAdjustments.length + stockCounts.length;

  // Navigation handlers from Dashboard
  const handleNavigateFromDashboard = (tab: 'materials' | 'stores' | 'stock' | 'transactions', subTab?: string) => {
    setActiveTab(tab);
    if (tab === 'transactions' && subTab) {
      setTransactionSubTab(subTab as TransactionTab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Navigation Rail */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Inventory & Store Management</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Module 12
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Central Materials Catalog, Store Balances, Batches & Construction Site Requisitions
              </p>
            </div>
          </div>
        </div>

        {/* Primary View Switcher */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Material Master</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stores'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Stores & Warehouses</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stock'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stock & Batches</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transactions Register</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* Direct Clear History Access */}
          <button
            onClick={() => setIsClearHistoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 transition-all whitespace-nowrap"
            title="Clear transaction history registers or reset demo data"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800/60">
              {totalTxCount}
            </span>
          </button>
        </div>
      </div>

      {/* View Content */}
      {activeTab === 'dashboard' && (
        <InventoryDashboardView
          onNavigateToTab={handleNavigateFromDashboard}
          onOpenGRN={() => {
            setEditingGRN(null);
            setIsGRNModalOpen(true);
          }}
          onOpenIssue={() => {
            setEditingIssue(null);
            setIsIssueModalOpen(true);
          }}
        />
      )}

      {activeTab === 'materials' && (
        <MaterialMasterView
          onAddMaterial={() => {
            setEditingMaterial(null);
            setIsMaterialModalOpen(true);
          }}
          onEditMaterial={(mat) => {
            setEditingMaterial(mat);
            setIsMaterialModalOpen(true);
          }}
        />
      )}

      {activeTab === 'stores' && (
        <StoresMasterView
          onAddStore={() => {
            setEditingStore(null);
            setIsStoreModalOpen(true);
          }}
          onEditStore={(store) => {
            setEditingStore(store);
            setIsStoreModalOpen(true);
          }}
        />
      )}

      {activeTab === 'stock' && (
        <StockBalancesView />
      )}

      {activeTab === 'transactions' && (
        <TransactionsRegisterView
          activeTab={transactionSubTab}
          onTabChange={setTransactionSubTab}
          onOpenNewGRN={() => {
            setEditingGRN(null);
            setIsGRNModalOpen(true);
          }}
          onOpenNewIssue={() => {
            setEditingIssue(null);
            setIsIssueModalOpen(true);
          }}
          onOpenNewReturn={() => {
            setEditingReturn(null);
            setIsReturnModalOpen(true);
          }}
          onOpenNewTransfer={() => {
            setEditingTransfer(null);
            setIsTransferModalOpen(true);
          }}
          onOpenNewAdjustment={() => {
            setEditingAdjustment(null);
            setIsAdjustmentModalOpen(true);
          }}
          onOpenNewCount={() => {
            setEditingCount(null);
            setIsCountModalOpen(true);
          }}
          onEditGRN={(g) => {
            setEditingGRN(g);
            setIsGRNModalOpen(true);
          }}
          onEditIssue={(i) => {
            setEditingIssue(i);
            setIsIssueModalOpen(true);
          }}
          onEditReturn={(r) => {
            setEditingReturn(r);
            setIsReturnModalOpen(true);
          }}
          onEditTransfer={(t) => {
            setEditingTransfer(t);
            setIsTransferModalOpen(true);
          }}
          onEditAdjustment={(a) => {
            setEditingAdjustment(a);
            setIsAdjustmentModalOpen(true);
          }}
          onEditCount={(c) => {
            setEditingCount(c);
            setIsCountModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <MaterialFormModal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setEditingMaterial(null);
        }}
        material={editingMaterial}
      />

      <StoreFormModal
        isOpen={isStoreModalOpen}
        onClose={() => {
          setIsStoreModalOpen(false);
          setEditingStore(null);
        }}
        store={editingStore}
      />

      <GRNModal
        isOpen={isGRNModalOpen}
        onClose={() => {
          setIsGRNModalOpen(false);
          setEditingGRN(null);
        }}
        grn={editingGRN}
      />

      <MaterialIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setEditingIssue(null);
        }}
        issue={editingIssue}
      />

      <MaterialReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setEditingReturn(null);
        }}
        materialReturn={editingReturn}
      />

      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setEditingTransfer(null);
        }}
        transfer={editingTransfer}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setEditingAdjustment(null);
        }}
        adjustment={editingAdjustment}
      />

      <StockCountModal
        isOpen={isCountModalOpen}
        onClose={() => {
          setIsCountModalOpen(false);
          setEditingCount(null);
        }}
        count={editingCount}
      />

      {/* Global Clear History Modal */}
      <InventoryClearHistoryModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
      />
    </div>
  );
};
