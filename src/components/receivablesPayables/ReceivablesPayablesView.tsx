import React, { useState } from 'react';
import {
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  FileText,
  Receipt,
  RotateCcw,
  Trash2,
  Plus,
  Clock,
  DollarSign
} from 'lucide-react';
import { useReceivablesPayables } from '../../context/ReceivablesPayablesContext';
import { ReceivableInvoice, PayableBill } from '../../types/receivablesPayablesTypes';
import { ReceivablesDashboardView, formatMillions } from './ReceivablesDashboardView';
import { AccountsReceivableView } from './AccountsReceivableView';
import { AccountsPayableView } from './AccountsPayableView';
import { ReceivableInvoiceModal } from './modals/ReceivableInvoiceModal';
import { RecordReceivablePaymentModal } from './modals/RecordReceivablePaymentModal';
import { PayableBillModal } from './modals/PayableBillModal';
import { RecordPayablePaymentModal } from './modals/RecordPayablePaymentModal';
import { RPDeleteModal } from './modals/RPDeleteModal';
import { RPClearHistoryModal } from './modals/RPClearHistoryModal';

export type ReceivablesPayablesTab = 'dashboard' | 'receivables' | 'payables';

interface ReceivablesPayablesViewProps {
  initialTab?: ReceivablesPayablesTab;
}

export const ReceivablesPayablesView: React.FC<ReceivablesPayablesViewProps> = ({
  initialTab = 'dashboard'
}) => {
  const [activeTab, setActiveTab] = useState<ReceivablesPayablesTab>(initialTab);
  const { receivables, payables, dashboardMetrics, deleteReceivable, deletePayable } = useReceivablesPayables();

  // Modals state
  const [isNewARModalOpen, setIsNewARModalOpen] = useState(false);
  const [editingARInvoice, setEditingARInvoice] = useState<ReceivableInvoice | null>(null);
  const [paymentARInvoice, setPaymentARInvoice] = useState<ReceivableInvoice | null>(null);

  const [isNewAPModalOpen, setIsNewAPModalOpen] = useState(false);
  const [editingAPBill, setEditingAPBill] = useState<PayableBill | null>(null);
  const [paymentAPBill, setPaymentAPBill] = useState<PayableBill | null>(null);

  // Universal Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type: 'RECEIVABLE' | 'PAYABLE';
    id: string;
    code: string;
    partyName: string;
    amount: number;
    outstanding: number;
    referenceExtra?: string;
  }>({
    isOpen: false,
    type: 'RECEIVABLE',
    id: '',
    code: '',
    partyName: '',
    amount: 0,
    outstanding: 0
  });

  // Clear History Modal State
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  // Total active records
  const totalLedgerRecords = receivables.length + payables.length;

  const handleDeleteConfirm = () => {
    if (deleteTarget.type === 'RECEIVABLE') {
      deleteReceivable(deleteTarget.id);
    } else {
      deletePayable(deleteTarget.id);
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* Top Header Rail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">
                11. Receivables &amp; Payables
              </h1>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                Commercial Finance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cash inflow management, supplier obligations, aging schedules &amp; working capital liquidity
            </p>
          </div>
        </div>

        {/* Action Controls & Clear History */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsClearHistoryModalOpen(true)}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-rose-900/50 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all group"
            title="Clear transaction history or restore baseline demo data"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
            <span>Clear History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
              {totalLedgerRecords}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewARModalOpen(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Receivable</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewAPModalOpen(true)}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-950/40 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Payable</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs shadow-sm">
        {/* Tab 1: Dashboard */}
        <button
          id="tab-rp-dashboard"
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard &amp; Net Position</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'dashboard'
                ? 'bg-blue-950 text-blue-200 border border-blue-400/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Net {formatMillions(dashboardMetrics.netPosition)}
          </span>
        </button>

        {/* Tab 2: Accounts Receivable */}
        <button
          id="tab-rp-receivables"
          type="button"
          onClick={() => setActiveTab('receivables')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'receivables'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-300" />
          <span>Accounts Receivable</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'receivables'
                ? 'bg-emerald-950 text-emerald-200 border border-emerald-400/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {formatMillions(dashboardMetrics.totalReceivable)}
          </span>
        </button>

        {/* Tab 3: Accounts Payable */}
        <button
          id="tab-rp-payables"
          type="button"
          onClick={() => setActiveTab('payables')}
          className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payables'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-rose-300" />
          <span>Accounts Payable</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'payables'
                ? 'bg-rose-950 text-rose-200 border border-rose-400/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {formatMillions(dashboardMetrics.totalPayable)}
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'dashboard' && (
        <ReceivablesDashboardView
          onNavigateToAR={() => setActiveTab('receivables')}
          onNavigateToAP={() => setActiveTab('payables')}
          onOpenNewARModal={() => setIsNewARModalOpen(true)}
          onOpenNewAPModal={() => setIsNewAPModalOpen(true)}
        />
      )}

      {activeTab === 'receivables' && (
        <AccountsReceivableView
          onOpenCreateModal={() => setIsNewARModalOpen(true)}
          onOpenEditModal={inv => setEditingARInvoice(inv)}
          onOpenPaymentModal={inv => setPaymentARInvoice(inv)}
          onOpenDeleteModal={inv =>
            setDeleteTarget({
              isOpen: true,
              type: 'RECEIVABLE',
              id: inv.id,
              code: inv.invoiceNumber,
              partyName: inv.client,
              amount: inv.amount,
              outstanding: inv.outstanding,
              referenceExtra: inv.project
            })
          }
        />
      )}

      {activeTab === 'payables' && (
        <AccountsPayableView
          onOpenCreateModal={() => setIsNewAPModalOpen(true)}
          onOpenEditModal={bill => setEditingAPBill(bill)}
          onOpenPaymentModal={bill => setPaymentAPBill(bill)}
          onOpenDeleteModal={bill =>
            setDeleteTarget({
              isOpen: true,
              type: 'PAYABLE',
              id: bill.id,
              code: bill.invoiceNumber,
              partyName: bill.supplier,
              amount: bill.amount,
              outstanding: bill.outstanding,
              referenceExtra: `PO: ${bill.poNumber} | GRN: ${bill.grnNumber}`
            })
          }
        />
      )}

      {/* Modals */}
      {/* 1. Add / Edit AR Invoice */}
      <ReceivableInvoiceModal
        isOpen={isNewARModalOpen || Boolean(editingARInvoice)}
        onClose={() => {
          setIsNewARModalOpen(false);
          setEditingARInvoice(null);
        }}
        invoiceToEdit={editingARInvoice}
      />

      {/* 2. Record AR Settlement */}
      <RecordReceivablePaymentModal
        isOpen={Boolean(paymentARInvoice)}
        onClose={() => setPaymentARInvoice(null)}
        invoice={paymentARInvoice}
      />

      {/* 3. Add / Edit AP Bill */}
      <PayableBillModal
        isOpen={isNewAPModalOpen || Boolean(editingAPBill)}
        onClose={() => {
          setIsNewAPModalOpen(false);
          setEditingAPBill(null);
        }}
        billToEdit={editingAPBill}
      />

      {/* 4. Record AP Disbursement */}
      <RecordPayablePaymentModal
        isOpen={Boolean(paymentAPBill)}
        onClose={() => setPaymentAPBill(null)}
        bill={paymentAPBill}
      />

      {/* 5. Universal Delete Modal */}
      <RPDeleteModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleDeleteConfirm}
        type={deleteTarget.type}
        title={deleteTarget.type === 'RECEIVABLE' ? 'Receivable Invoice' : 'Payable Bill'}
        code={deleteTarget.code}
        partyName={deleteTarget.partyName}
        amount={deleteTarget.amount}
        outstanding={deleteTarget.outstanding}
        referenceExtra={deleteTarget.referenceExtra}
      />

      {/* 6. Clear History & Demo Data Modal */}
      <RPClearHistoryModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
      />
    </div>
  );
};
