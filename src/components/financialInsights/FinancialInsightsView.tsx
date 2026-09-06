import React, { useState } from 'react';
import {
  Camera,
  Layers,
  LayoutDashboard,
  ScanLine,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { PaymentProofGalleryView } from '../payments/views/PaymentProofGalleryView';
import { LinkedProjectExpensesView } from '../payments/views/LinkedProjectExpensesView';
import { PaymentAnalyticsDashboard } from '../payments/views/PaymentAnalyticsDashboard';
import { PaymentProofScannerModal } from '../payments/PaymentProofScannerModal';
import { PRVDetailModal } from '../payments/PRVDetailModal';

export type FinancialInsightTab = 'proof_documents' | 'project_expenses' | 'dashboard';

interface FinancialInsightsViewProps {
  initialTab?: FinancialInsightTab;
}

export const FinancialInsightsView: React.FC<FinancialInsightsViewProps> = ({
  initialTab = 'proof_documents'
}) => {
  const [activeTab, setActiveTab] = useState<FinancialInsightTab>(initialTab);
  const { paymentProofs = [], isDetailModalOpen, setIsDetailModalOpen } = usePRV();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="space-y-4 w-full">
      {/* Horizontal Navigation Pane */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs shadow-sm">
          {/* Tab 1: Payment Proof Documents */}
          <button
            id="tab-insights-proofs"
            type="button"
            onClick={() => setActiveTab('proof_documents')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'proof_documents'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Payment Proofs & Slips</span>
            {paymentProofs.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'proof_documents'
                    ? 'bg-rose-950 text-rose-200 border border-rose-400/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {paymentProofs.length}
              </span>
            )}
          </button>

          {/* Tab 2: Linked Project Expenses */}
          <button
            id="tab-insights-expenses"
            type="button"
            onClick={() => setActiveTab('project_expenses')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'project_expenses'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Linked Project Expenses</span>
          </button>

          {/* Tab 3: Payment Analytics Dashboard */}
          <button
            id="tab-insights-analytics"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Payment Analytics</span>
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap active:scale-95"
          >
            <ScanLine className="w-3.5 h-3.5 text-blue-400" />
            <span>Scan Bank Slip</span>
          </button>
        </div>
      </div>

      {/* Views */}
      {activeTab === 'proof_documents' && (
        <div className="animate-in fade-in duration-200">
          <PaymentProofGalleryView />
        </div>
      )}

      {activeTab === 'project_expenses' && (
        <div className="animate-in fade-in duration-200">
          <LinkedProjectExpensesView />
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in duration-200">
          <PaymentAnalyticsDashboard />
        </div>
      )}

      {/* Modals */}
      <PaymentProofScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      <PRVDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};
