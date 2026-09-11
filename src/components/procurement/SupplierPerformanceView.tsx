import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  Star,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileCheck2,
  Filter,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { Supplier, SupplierEvaluation } from '../../types/supplierTypes';
import { SupplierEvaluationModal } from './SupplierEvaluationModal';

export const SupplierPerformanceView: React.FC = () => {
  const { suppliers } = useSupplier();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('ALL');
  const [selectedSupplierForAudit, setSelectedSupplierForAudit] = useState<Supplier | null>(null);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch =
        searchTerm === '' ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.supplierType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRating = selectedRating === 'ALL' || s.performance.rating === selectedRating;

      return matchSearch && matchRating;
    });
  }, [suppliers, searchTerm, selectedRating]);

  // Ranked suppliers by overall score
  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => b.performance.overallScore - a.performance.overallScore);
  }, [filteredSuppliers]);

  // Aggregate evaluations across all suppliers
  const allEvaluations = useMemo(() => {
    const evs: Array<{ supplierName: string; supplierCode: string; evaluation: SupplierEvaluation }> = [];
    suppliers.forEach(s => {
      (s.performance.evaluationHistory || []).forEach(ev => {
        evs.push({
          supplierName: s.name,
          supplierCode: s.code,
          evaluation: ev
        });
      });
    });
    return evs.sort((a, b) => new Date(b.evaluation.evaluationDate).getTime() - new Date(a.evaluation.evaluationDate).getTime());
  }, [suppliers]);

  const topPerformer = sortedSuppliers[0];
  const averageOverallScore = useMemo(() => {
    if (suppliers.length === 0) return 0;
    const sum = suppliers.reduce((acc, curr) => acc + curr.performance.overallScore, 0);
    return Math.round(sum / suppliers.length);
  }, [suppliers]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Supplier Performance Audits & KPI Scorecards</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Periodic performance audits, delivery on-time rates, QA testing pass-rates & corrective action monitoring.
          </p>
        </div>

        <button
          onClick={() => setSelectedSupplierForAudit(suppliers[0] || null)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Conduct Performance Audit</span>
        </button>
      </div>

      {/* 2. KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Network Score</span>
          <div className="text-xl font-mono font-bold text-purple-400 mt-1">{averageOverallScore}% Overall</div>
          <span className="text-[10px] text-slate-400 font-medium">Across all active suppliers</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Top Ranked Vendor</span>
          <div className="text-base font-bold text-emerald-400 mt-1 truncate">{topPerformer?.name || 'N/A'}</div>
          <span className="text-[10px] text-emerald-300 font-mono font-bold">Score: {topPerformer?.performance.overallScore || 0}% ({topPerformer?.performance.rating})</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Audits Logged</span>
          <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{allEvaluations.length} Audits</div>
          <span className="text-[10px] text-cyan-300 font-medium">Site QA & Procurement signoffs</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attention Needed</span>
          <div className="text-xl font-mono font-bold text-rose-400 mt-1">
            {suppliers.filter(s => s.performance.overallScore < 70).length} Vendors
          </div>
          <span className="text-[10px] text-rose-300 font-medium">Score below 70% threshold</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search vendor name, code, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Rating Tiers</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Satisfactory">Satisfactory</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      {/* 4. Scorecard Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Rank & Supplier</th>
                <th className="p-3">Category / Scope</th>
                <th className="p-3">Overall Score</th>
                <th className="p-3">Delivery & Slump</th>
                <th className="p-3">Material Quality</th>
                <th className="p-3">Pricing Fairness</th>
                <th className="p-3">Compliance Docs</th>
                <th className="p-3">Audit Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedSuppliers.map((supplier, idx) => {
                const isTop3 = idx < 3;
                return (
                  <tr key={supplier.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          isTop3 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-100 block text-xs">{supplier.name}</span>
                          <span className="font-mono text-[10px] text-orange-400">{supplier.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-200 block">{supplier.supplierType}</span>
                      <span className="text-[10px] text-slate-500">{supplier.categories.slice(0, 2).join(', ')}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-mono font-bold text-slate-100 text-sm">{supplier.performance.overallScore}%</span>
                        <span className="text-[10px] font-semibold text-slate-400">({supplier.performance.rating})</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${supplier.performance.deliveryScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {supplier.performance.deliveryScore}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${supplier.performance.qualityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {supplier.performance.qualityScore}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${supplier.performance.priceScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {supplier.performance.priceScore}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`font-bold ${supplier.performance.documentationScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {supplier.performance.documentationScore}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {supplier.performance.lastEvaluatedDate || 'Not evaluated'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedSupplierForAudit(supplier)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-[10px] transition-all"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Historical Audit Logs Feed */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-purple-400" />
          Recent Evaluation History & Corrective Actions
        </h3>

        <div className="space-y-3">
          {allEvaluations.slice(0, 5).map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{item.supplierName}</span>
                  <span className="font-mono text-[10px] text-orange-400 font-bold">({item.supplierCode})</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold font-mono">
                    Project: {item.evaluation.projectCode}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400">Score: {item.evaluation.overallScore}% ({item.evaluation.rating})</span>
                </div>
                <span className="text-[10px] text-slate-500">{item.evaluation.evaluationDate}</span>
              </div>

              <p className="text-xs text-slate-300 italic">{item.evaluation.comments}</p>
              {item.evaluation.correctiveAction && (
                <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-900/40">
                  <strong>Corrective Action Required:</strong> {item.evaluation.correctiveAction}
                </div>
              )}
              <div className="text-[10px] text-slate-500">Evaluated by: {item.evaluation.evaluatedBy}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Evaluation */}
      {selectedSupplierForAudit && (
        <SupplierEvaluationModal
          isOpen={Boolean(selectedSupplierForAudit)}
          onClose={() => setSelectedSupplierForAudit(null)}
          supplier={selectedSupplierForAudit}
        />
      )}
    </div>
  );
};
