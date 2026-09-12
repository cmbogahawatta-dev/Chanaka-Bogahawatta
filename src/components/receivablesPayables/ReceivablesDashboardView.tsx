import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  Receipt,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { useReceivablesPayables } from '../../context/ReceivablesPayablesContext';
import { formatLKR } from '../../utils/helpers';

export function formatMillions(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const m = (abs / 1_000_000).toFixed(1);
    return `${sign}LKR ${m.endsWith('.0') ? m.slice(0, -2) : m}M`;
  }
  if (abs >= 1_000) {
    return `${sign}LKR ${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}LKR ${abs.toLocaleString('en-LK')}`;
}

interface ReceivablesDashboardViewProps {
  onNavigateToAR: () => void;
  onNavigateToAP: () => void;
  onOpenNewARModal: () => void;
  onOpenNewAPModal: () => void;
}

export const ReceivablesDashboardView: React.FC<ReceivablesDashboardViewProps> = ({
  onNavigateToAR,
  onNavigateToAP,
  onOpenNewARModal,
  onOpenNewAPModal
}) => {
  const { receivables, payables, dashboardMetrics } = useReceivablesPayables();

  const {
    totalReceivable,
    totalReceivableInvoiced,
    totalReceivablePaid,
    receivableOverdueAmount,
    receivableOverdueCount,

    totalPayable,
    totalPayableBilled,
    totalPayablePaid,
    payableOverdueAmount,
    payableOverdueCount,

    netPosition,

    receivableAging,
    payableAging
  } = dashboardMetrics;

  const totalWorkingCapital = totalReceivable + totalPayable;
  const receivablePercentage = totalWorkingCapital > 0 ? (totalReceivable / totalWorkingCapital) * 100 : 50;
  const payablePercentage = totalWorkingCapital > 0 ? (totalPayable / totalWorkingCapital) * 100 : 50;

  // Top Receivables
  const topReceivables = [...receivables]
    .filter(r => r.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 4);

  // Top Payables
  const topPayables = [...payables]
    .filter(p => p.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 3 Prominent Hero KPI Cards (Exact specification from prompt) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Receivable */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl transition-all hover:border-emerald-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" />
              Receivable
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {receivables.filter(r => r.outstanding > 0).length} Invoices
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {formatMillions(totalReceivable)}
            </div>
            <div className="text-xs font-mono text-emerald-300/80 mt-1">
              Exact: {formatLKR(totalReceivable)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Invoiced</span>
              <span className="font-mono font-semibold text-slate-200">{formatMillions(totalReceivableInvoiced)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Collected to Date</span>
              <span className="font-mono font-semibold text-emerald-400">{formatMillions(totalReceivablePaid)}</span>
            </div>
          </div>

          {receivableOverdueAmount > 0 && (
            <div className="mt-3 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between text-[11px] text-rose-300">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Overdue ({receivableOverdueCount})
              </span>
              <span className="font-mono font-bold">{formatMillions(receivableOverdueAmount)}</span>
            </div>
          )}

          <button
            onClick={onNavigateToAR}
            className="mt-4 w-full py-1.5 px-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
          >
            <span>View Accounts Receivable Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Payable */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-rose-500/30 rounded-2xl p-5 shadow-xl transition-all hover:border-rose-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4" />
              Payable
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              {payables.filter(p => p.outstanding > 0).length} Bills
            </span>
          </div>

          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {formatMillions(totalPayable)}
            </div>
            <div className="text-xs font-mono text-rose-300/80 mt-1">
              Exact: {formatLKR(totalPayable)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Billed</span>
              <span className="font-mono font-semibold text-slate-200">{formatMillions(totalPayableBilled)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Disbursed to Date</span>
              <span className="font-mono font-semibold text-emerald-400">{formatMillions(totalPayablePaid)}</span>
            </div>
          </div>

          {payableOverdueAmount > 0 && (
            <div className="mt-3 px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-between text-[11px] text-rose-300">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Overdue ({payableOverdueCount})
              </span>
              <span className="font-mono font-bold">{formatMillions(payableOverdueAmount)}</span>
            </div>
          )}

          <button
            onClick={onNavigateToAP}
            className="mt-4 w-full py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
          >
            <span>View Accounts Payable Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Net Position */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 rounded-2xl p-5 shadow-xl transition-all hover:border-blue-500/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              Net Position
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              netPosition >= 0
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}>
              {netPosition >= 0 ? 'Surplus / Net Positive' : 'Net Deficit'}
            </span>
          </div>

          <div className="mt-3">
            <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
              netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatMillions(netPosition)}
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              Exact: {formatLKR(netPosition)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Coverage Ratio</span>
              <span className="font-mono font-semibold text-blue-300">
                {totalPayable > 0 ? (totalReceivable / totalPayable).toFixed(2) + 'x' : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Liquidity Headroom</span>
              <span className="font-mono font-semibold text-blue-300">
                {totalReceivable > 0 ? Math.round((netPosition / totalReceivable) * 100) + '%' : '0%'}
              </span>
            </div>
          </div>

          <div className="mt-3 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Receivables vs Payables Share</span>
              <span className="font-mono">{Math.round(receivablePercentage)}% : {Math.round(payablePercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${receivablePercentage}%` }}
                title={`Receivable: ${formatMillions(totalReceivable)}`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${payablePercentage}%` }}
                title={`Payable: ${formatMillions(totalPayable)}`}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={onOpenNewARModal}
              className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-950/40"
            >
              <span>+ New Invoice</span>
            </button>
            <button
              onClick={onOpenNewAPModal}
              className="py-1.5 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-rose-950/40"
            >
              <span>+ New Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aging Analysis Comparison Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Maturity &amp; Overdue Aging Analysis
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cash realization and disbursement liability across standard aging buckets
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Receivables (Inflow)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Payables (Outflow)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Current (Not Overdue) */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Current / On Time</div>
            <div>
              <div className="text-[10px] text-slate-400">AR Inflow</div>
              <div className="text-xs font-mono font-bold text-emerald-400">{formatMillions(receivableAging.current)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">AP Liability</div>
              <div className="text-xs font-mono font-bold text-rose-400">{formatMillions(payableAging.current)}</div>
            </div>
          </div>

          {/* 1 - 30 Days Overdue */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">1 - 30 Days Overdue</div>
            <div>
              <div className="text-[10px] text-slate-400">AR Inflow</div>
              <div className="text-xs font-mono font-bold text-emerald-400">{formatMillions(receivableAging.days1to30)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">AP Liability</div>
              <div className="text-xs font-mono font-bold text-rose-400">{formatMillions(payableAging.days1to30)}</div>
            </div>
          </div>

          {/* 31 - 60 Days Overdue */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">31 - 60 Days Overdue</div>
            <div>
              <div className="text-[10px] text-slate-400">AR Inflow</div>
              <div className="text-xs font-mono font-bold text-emerald-400">{formatMillions(receivableAging.days31to60)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">AP Liability</div>
              <div className="text-xs font-mono font-bold text-rose-400">{formatMillions(payableAging.days31to60)}</div>
            </div>
          </div>

          {/* 61 - 90 Days Overdue */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">61 - 90 Days Overdue</div>
            <div>
              <div className="text-[10px] text-slate-400">AR Inflow</div>
              <div className="text-xs font-mono font-bold text-emerald-400">{formatMillions(receivableAging.days61to90)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">AP Liability</div>
              <div className="text-xs font-mono font-bold text-rose-400">{formatMillions(payableAging.days61to90)}</div>
            </div>
          </div>

          {/* 90+ Days Overdue */}
          <div className="p-3 bg-slate-950 rounded-xl border border-rose-900/40 space-y-2">
            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">90+ Days Overdue</div>
            <div>
              <div className="text-[10px] text-slate-400">AR Inflow</div>
              <div className="text-xs font-mono font-bold text-emerald-400">{formatMillions(receivableAging.days90Plus)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">AP Liability</div>
              <div className="text-xs font-mono font-bold text-rose-400">{formatMillions(payableAging.days90Plus)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Ledger Breakdowns (Dual Column: Key Clients vs Key Suppliers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top AR Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Top Outstanding Customer Invoices</h4>
                <p className="text-[11px] text-slate-400">Highest value client claims due for collection</p>
              </div>
            </div>
            <button
              onClick={onNavigateToAR}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topReceivables.map(rec => (
              <div
                key={rec.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{rec.invoiceNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-slate-300">
                      {rec.project}
                    </span>
                    {rec.overdueDays > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
                        {rec.overdueDays}d Overdue
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{rec.client}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Due: {rec.dueDate}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    {formatLKR(rec.outstanding)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Paid: {formatLKR(rec.paid)} / {formatLKR(rec.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top AP Bills */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Top Outstanding Supplier Bills</h4>
                <p className="text-[11px] text-slate-400">Major vendor liabilities linked to PO &amp; GRN</p>
              </div>
            </div>
            <button
              onClick={onNavigateToAP}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topPayables.map(bill => (
              <div
                key={bill.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{bill.invoiceNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300">
                      {bill.poNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800/80 text-cyan-300">
                      {bill.grnNumber}
                    </span>
                    {bill.overdueDays > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
                        {bill.overdueDays}d Overdue
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{bill.supplier}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Due: {bill.dueDate}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-rose-400">
                    {formatLKR(bill.outstanding)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Paid: {formatLKR(bill.paid)} / {formatLKR(bill.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
