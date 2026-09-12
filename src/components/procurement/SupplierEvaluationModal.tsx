import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  Save,
  MessageSquare
} from 'lucide-react';
import { useSupplier } from '../../context/SupplierContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { Supplier, PerformanceRating, SupplierEvaluation } from '../../types/supplierTypes';

interface SupplierEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  editEvaluation?: SupplierEvaluation;
}

export const SupplierEvaluationModal: React.FC<SupplierEvaluationModalProps> = ({
  isOpen,
  onClose,
  supplier,
  editEvaluation
}) => {
  const { submitPerformanceEvaluation } = useSupplier();
  const { projects } = usePettyCash();

  const [projectCode, setProjectCode] = useState(editEvaluation?.projectCode || projects[0]?.PROJECT_CODE || 'PIDM 26');
  const [deliveryScore, setDeliveryScore] = useState(editEvaluation?.scores?.deliveryScore || editEvaluation?.deliveryScore || supplier.performance.deliveryScore || 85);
  const [qualityScore, setQualityScore] = useState(editEvaluation?.scores?.qualityScore || editEvaluation?.qualityScore || supplier.performance.qualityScore || 85);
  const [priceScore, setPriceScore] = useState(editEvaluation?.scores?.priceScore || editEvaluation?.priceScore || supplier.performance.priceScore || 85);
  const [documentationScore, setDocumentationScore] = useState(editEvaluation?.scores?.documentationScore || editEvaluation?.documentationScore || supplier.performance.documentationScore || 85);
  const [paymentComplianceScore, setPaymentComplianceScore] = useState(editEvaluation?.scores?.paymentComplianceScore || supplier.performance.paymentComplianceScore || 85);
  const [responsivenessScore, setResponsivenessScore] = useState(editEvaluation?.scores?.responsivenessScore || supplier.performance.responsivenessScore || 85);

  const [comments, setComments] = useState(editEvaluation?.comments || '');
  const [correctiveAction, setCorrectiveAction] = useState(editEvaluation?.correctiveAction || '');

  useEffect(() => {
    if (editEvaluation) {
      setProjectCode(editEvaluation.projectCode || projects[0]?.PROJECT_CODE || 'PIDM 26');
      setDeliveryScore(editEvaluation.scores?.deliveryScore || editEvaluation.deliveryScore || 85);
      setQualityScore(editEvaluation.scores?.qualityScore || editEvaluation.qualityScore || 85);
      setPriceScore(editEvaluation.scores?.priceScore || editEvaluation.priceScore || 85);
      setDocumentationScore(editEvaluation.scores?.documentationScore || editEvaluation.documentationScore || 85);
      setPaymentComplianceScore(editEvaluation.scores?.paymentComplianceScore || 85);
      setResponsivenessScore(editEvaluation.scores?.responsivenessScore || 85);
      setComments(editEvaluation.comments || '');
      setCorrectiveAction(editEvaluation.correctiveAction || '');
    } else if (supplier) {
      setProjectCode(projects[0]?.PROJECT_CODE || 'PIDM 26');
      setDeliveryScore(supplier.performance.deliveryScore || 85);
      setQualityScore(supplier.performance.qualityScore || 85);
      setPriceScore(supplier.performance.priceScore || 85);
      setDocumentationScore(supplier.performance.documentationScore || 85);
      setPaymentComplianceScore(supplier.performance.paymentComplianceScore || 85);
      setResponsivenessScore(supplier.performance.responsivenessScore || 85);
      setComments('');
      setCorrectiveAction('');
    }
  }, [editEvaluation, supplier, isOpen, projects]);

  if (!isOpen) return null;

  // Weighted overall calculation:
  // Delivery 25%, Quality 25%, Price 15%, Documentation 15%, Payment Compliance 10%, Responsiveness 10%
  const overallScore = Math.round(
    deliveryScore * 0.25 +
    qualityScore * 0.25 +
    priceScore * 0.15 +
    documentationScore * 0.15 +
    paymentComplianceScore * 0.10 +
    responsivenessScore * 0.10
  );

  let rating: PerformanceRating = 'Satisfactory';
  if (overallScore >= 90) rating = 'Excellent';
  else if (overallScore >= 80) rating = 'Good';
  else if (overallScore >= 65) rating = 'Satisfactory';
  else if (overallScore >= 50) rating = 'Poor';
  else rating = 'Critical';

  const getRatingBadge = (r: PerformanceRating) => {
    switch (r) {
      case 'Excellent':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'Good':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'Satisfactory':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Poor':
        return 'bg-orange-950 text-orange-300 border-orange-800';
      case 'Critical':
        return 'bg-rose-950 text-rose-300 border-rose-800';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert('Please provide evaluation feedback or observations in comments.');
      return;
    }

    submitPerformanceEvaluation(supplier.id, {
      projectCode,
      scores: {
        deliveryScore,
        qualityScore,
        priceScore,
        documentationScore,
        paymentComplianceScore,
        responsivenessScore,
        overallScore,
        rating
      },
      comments: comments.trim(),
      correctiveAction: correctiveAction.trim() || undefined,
      finalRating: rating
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Supplier Performance Evaluation: {supplier.name}
              </h3>
              <p className="text-xs text-slate-400">
                Audit delivery punctuality, material quality, pricing competitiveness & documentation compliance.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Project & Calculated Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Project Evaluation Context
              </label>
              <select
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
              >
                {projects.map((p, idx) => (
                  <option key={`${p.PROJECT_CODE}-${idx}`} value={p.PROJECT_CODE}>
                    {p.PROJECT_CODE} - {p.PROJECT_NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Calculated Rating</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRatingBadge(rating)} inline-block mt-0.5`}>
                  {rating} ({overallScore}%)
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500 flex items-center justify-center text-purple-300 font-mono font-black text-sm">
                {overallScore}
              </div>
            </div>
          </div>

          {/* Criteria Sliders */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Evaluation Scoring Criteria (0 - 100%)
            </h4>

            {/* 1. Delivery */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">1. Delivery & Punctuality (25% Weight)</span>
                <span className="font-mono font-bold text-purple-400">{deliveryScore}%</span>
              </div>
              <p className="text-[10px] text-slate-400">On-time delivery performance against confirmed site schedules.</p>
              <input
                type="range"
                min="0"
                max="100"
                value={deliveryScore}
                onChange={(e) => setDeliveryScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 2. Quality */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">2. Material / Service Quality (25% Weight)</span>
                <span className="font-mono font-bold text-purple-400">{qualityScore}%</span>
              </div>
              <p className="text-[10px] text-slate-400">Cube strengths, sieve analysis, defects, batch compliance & rejection rate.</p>
              <input
                type="range"
                min="0"
                max="100"
                value={qualityScore}
                onChange={(e) => setQualityScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 3. Price */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">3. Price & Commercial Competitiveness (15% Weight)</span>
                <span className="font-mono font-bold text-purple-400">{priceScore}%</span>
              </div>
              <p className="text-[10px] text-slate-400">Comparative market pricing, discount offers, credit stability.</p>
              <input
                type="range"
                min="0"
                max="100"
                value={priceScore}
                onChange={(e) => setPriceScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 4. Documentation */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">4. Documentation & Compliance (15% Weight)</span>
                <span className="font-mono font-bold text-purple-400">{documentationScore}%</span>
              </div>
              <p className="text-[10px] text-slate-400">Delivery notes, VAT receipts, test reports, mining permits, insurance valid.</p>
              <input
                type="range"
                min="0"
                max="100"
                value={documentationScore}
                onChange={(e) => setDocumentationScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 5. Payment Compliance */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">5. Payment Compliance & Billing Accuracy (10% Weight)</span>
                <span className="font-mono font-bold text-purple-400">{paymentComplianceScore}%</span>
              </div>
              <p className="text-[10px] text-slate-400">Accurate tax invoices, transparent statement reconciliations.</p>
              <input
                type="range"
                min="0"
                max="100"
                value={paymentComplianceScore}
                onChange={(e) => setPaymentComplianceScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* 6. Responsiveness */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">6. Responsiveness & Communication (10% Weight)</span>
                <span className="font-mono font-bold text-purple-400">{responsivenessScore}%</span>
              </div>
              <p className="text-[10px] text-slate-400">Response time to emergency requests, replacements, engineer queries.</p>
              <input
                type="range"
                min="0"
                max="100"
                value={responsivenessScore}
                onChange={(e) => setResponsivenessScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Evaluation Remarks & Field Observations <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Detail specific batches, punctuality on site, test certificate compliance..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Corrective Action Request (if score &lt; 80%)
              </label>
              <input
                type="text"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="e.g. Must replace broken bags upon unloading and provide batch certificates within 24h."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Record Performance Audit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
