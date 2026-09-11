import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  Settings,
  GitFork,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Building,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Briefcase,
  Trash2,
  Edit3
} from 'lucide-react';
import { Quotation, QuotationStatus, QuotationType } from '../../types/quotationTypes';
import { useQuotation, QuotationTab } from '../../context/QuotationContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { formatQuotationDate } from '../../utils/quotationUtils';
import { CreateQuotationModal } from './CreateQuotationModal';
import { QuotationDetailModal } from './QuotationDetailModal';
import { QuotationPreviewModal } from './QuotationPreviewModal';
import { QuotationRevisionModal } from './QuotationRevisionModal';
import { ConvertToInvoiceModal } from './ConvertToInvoiceModal';
import { QuotationSettingsModal } from './QuotationSettingsModal';
import { DeleteQuotationModal } from './DeleteQuotationModal';

export const QuotationRegisterView: React.FC = () => {
  const {
    quotations,
    activeTab,
    setActiveTab,
    createRevision,
    convertToTaxInvoice,
    deleteQuotation,
    downloadQuotationPdf,
    printQuotationPdf
  } = useQuotation();

  const { currentUser, navigateToModule } = useEnterprise();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<QuotationType>('QUOTATION');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const [selectedForDetail, setSelectedForDetail] = useState<Quotation | null>(null);
  const [selectedForPreview, setSelectedForPreview] = useState<Quotation | null>(null);
  const [selectedForRevision, setSelectedForRevision] = useState<Quotation | null>(null);
  const [selectedForConvert, setSelectedForConvert] = useState<Quotation | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Quotation | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filter logic
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Tab filter
      if (activeTab === 'quotations' && q.documentType !== 'QUOTATION') return false;
      if (activeTab === 'estimates' && q.documentType !== 'ESTIMATE') return false;
      if (activeTab === 'drafts' && q.status !== 'DRAFT') return false;
      if (activeTab === 'sent' && q.status !== 'SENT') return false;
      if (activeTab === 'accepted' && q.status !== 'ACCEPTED') return false;
      if (activeTab === 'converted' && q.status !== 'CONVERTED') return false;
      if (activeTab === 'expired' && q.status !== 'EXPIRED' && q.status !== 'REJECTED' && q.status !== 'CANCELLED') return false;

      // Project filter
      if (projectFilter !== 'ALL' && q.projectCode !== projectFilter) return false;

      // Date filter
      if (dateFilter && !q.quotationDate.startsWith(dateFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = q.quotationNumber.toLowerCase().includes(query);
        const matchClient = q.clientName.toLowerCase().includes(query);
        const matchProject = (q.projectCode || '').toLowerCase().includes(query) || (q.projectName || '').toLowerCase().includes(query);
        const matchScope = (q.scopeOfWork || '').toLowerCase().includes(query);
        const matchItems = q.lineItems.some(i => i.description.toLowerCase().includes(query));
        if (!matchNumber && !matchClient && !matchProject && !matchScope && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [quotations, activeTab, projectFilter, dateFilter, searchQuery]);

  // Unique projects list for filter dropdown
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    quotations.forEach(q => {
      if (q.projectCode) set.add(q.projectCode);
    });
    return Array.from(set);
  }, [quotations]);

  // Executive KPI calculations
  const kpis = useMemo(() => {
    let totalQuoted = 0;
    let activePipelineValue = 0;
    let activePipelineCount = 0;
    let acceptedValue = 0;
    let acceptedCount = 0;
    let convertedValue = 0;
    let convertedCount = 0;
    let expiredCount = 0;

    quotations.forEach(q => {
      totalQuoted += q.totalAmount;
      if (q.status === 'DRAFT' || q.status === 'SENT') {
        activePipelineValue += q.totalAmount;
        activePipelineCount++;
      } else if (q.status === 'ACCEPTED') {
        acceptedValue += q.totalAmount;
        acceptedCount++;
      } else if (q.status === 'CONVERTED') {
        convertedValue += q.totalAmount;
        convertedCount++;
      } else if (q.status === 'EXPIRED' || q.status === 'REJECTED') {
        expiredCount++;
      }
    });

    const winRate = quotations.length > 0
      ? Math.round(((acceptedCount + convertedCount) / quotations.length) * 100)
      : 0;

    return {
      totalQuoted,
      activePipelineValue,
      activePipelineCount,
      acceptedValue,
      acceptedCount,
      convertedValue,
      convertedCount,
      expiredCount,
      winRate
    };
  }, [quotations]);

  // Handlers
  const handleOpenCreate = (type: QuotationType = 'QUOTATION') => {
    setEditingQuotation(null);
    setCreateModalInitialType(type);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setIsCreateModalOpen(true);
  };

  const handleConfirmRevision = (reason: string, openEditor = true) => {
    if (!selectedForRevision) return;
    const newRev = createRevision(selectedForRevision.id, reason, currentUser || 'Estimator');
    if (newRev) {
      setSelectedForRevision(null);
      if (selectedForDetail) {
        setSelectedForDetail(null);
      }
      if (openEditor) {
        handleOpenEdit(newRev);
      } else {
        setSelectedForDetail(newRev);
      }
    }
  };

  const handleConfirmConvert = (quotationId: string) => {
    const result = convertToTaxInvoice(quotationId, currentUser || 'User');
    if (result.success) {
      alert(`Success! Generated Draft Tax Invoice: ${result.invoiceSerial}`);
      setSelectedForConvert(null);
      if (selectedForDetail?.id === quotationId) {
        setSelectedForDetail(null);
      }
    } else {
      alert(`Error converting to Tax Invoice: ${result.error}`);
    }
  };

  const handleDelete = (quotation: Quotation) => {
    if (confirm(`Are you sure you want to delete ${quotation.quotationNumber}? This action cannot be undone.`)) {
      deleteQuotation(quotation.id);
      if (selectedForDetail?.id === quotation.id) setSelectedForDetail(null);
      if (selectedForPreview?.id === quotation.id) setSelectedForPreview(null);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Document Ref',
      'Type',
      'Revision',
      'Date',
      'Valid Until',
      'Client Name',
      'Client TIN',
      'Project Code',
      'Taxable Amount',
      'VAT Amount',
      'Total Consideration',
      'Status',
      'Converted Invoice'
    ];

    const rows = filteredQuotations.map(q => [
      q.quotationNumber,
      q.documentType,
      q.revision?.revisionLabel || 'Rev.00',
      q.quotationDate,
      q.validUntilDate,
      `"${(q.clientName || '').replace(/"/g, '""')}"`,
      q.clientTin || '',
      q.projectCode || '',
      q.taxableAmount,
      q.vatAmount,
      q.totalAmount,
      q.status,
      q.convertedInvoiceNumber || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EMA_Quotations_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/5">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-slate-100 tracking-tight">
                Commercial Quotations &amp; Estimates
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                {quotations.length} Documents
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Sales proposal registry &amp; cost estimating engine</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Expense Linkage Guarantee
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Quotation Numbering & Boilerplate Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenCreate('ESTIMATE')}
            className="px-4 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-950/50 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cost Estimate</span>
          </button>

          <button
            onClick={() => handleOpenCreate('QUOTATION')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/50 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Quotation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quoted Consideration */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Total Quoted Volume</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-mono font-black text-slate-100">
              LKR {kpis.totalQuoted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across all {quotations.length} commercial submissions
            </div>
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Active Pipeline (Draft / Sent)</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-mono font-black text-blue-400">
              LKR {kpis.activePipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kpis.activePipelineCount} active proposals awaiting acceptance
            </div>
          </div>
        </div>

        {/* Accepted & Win Rate */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Accepted Wins &amp; Rate</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-xl font-mono font-black text-emerald-400">
                {kpis.winRate}%
              </div>
              <div className="text-xs text-slate-400 font-medium">Win Conversion</div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kpis.acceptedCount + kpis.convertedCount} awarded commercial packages
            </div>
          </div>
        </div>

        {/* Converted to Tax Invoice */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Converted to Tax Invoices</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-mono font-black text-purple-300">
              LKR {kpis.convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kpis.convertedCount} converted to formal Tax Invoices
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'all' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All Documents ({quotations.length})
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'quotations' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Quotations (QT)
          </button>
          <button
            onClick={() => setActiveTab('estimates')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'estimates' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Estimates (EST)
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'drafts' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Drafts
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'sent' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sent / In Review
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'accepted' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Accepted
          </button>
          <button
            onClick={() => setActiveTab('converted')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'converted' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Converted
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'expired' ? 'bg-rose-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Expired / Rejected
          </button>
        </div>

        {/* Quick Search & Project Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, client, item..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map(proj => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Quotations Table Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/70">
                <th className="py-3.5 px-4">Document Ref &amp; Rev</th>
                <th className="py-3.5 px-3">Offer Date &amp; Validity</th>
                <th className="py-3.5 px-4">Client / Purchaser</th>
                <th className="py-3.5 px-3">Project Reference</th>
                <th className="py-3.5 px-4 text-right">Taxable Value (LKR)</th>
                <th className="py-3.5 px-4 text-right">Total Consideration (LKR)</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-600" />
                      <span className="font-semibold text-slate-300">No quotation documents found</span>
                      <span className="text-[11px] text-slate-500">
                        Try adjusting search filters or create a new quotation/estimate.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(quotation => {
                  const isQuotation = quotation.documentType === 'QUOTATION';
                  const isAccepted = quotation.status === 'ACCEPTED';
                  const isConverted = quotation.status === 'CONVERTED';
                  const isExpired = quotation.status === 'EXPIRED';
                  const isCancelled = quotation.status === 'CANCELLED';
                  const isRejected = quotation.status === 'REJECTED';
                  const isSent = quotation.status === 'SENT';
                  const isDraft = quotation.status === 'DRAFT';

                  return (
                    <tr
                      key={quotation.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedForDetail(quotation)}
                    >
                      {/* Document Ref & Rev */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedForPreview(quotation)}
                            className="font-mono font-bold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                          >
                            <span>{quotation.quotationNumber}</span>
                          </button>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                            {quotation.revision?.revisionLabel || 'Rev.00'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span className={`font-bold ${isQuotation ? 'text-cyan-400' : 'text-amber-400'}`}>
                            {isQuotation ? 'Quotation' : 'Cost Estimate'}
                          </span>
                          {quotation.tenderRef && (
                            <span className="text-slate-500 truncate max-w-[120px]">
                              • Ref: {quotation.tenderRef}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Offer Date & Validity */}
                      <td className="py-3 px-3">
                        <div className="text-slate-200 font-medium">
                          {formatQuotationDate(quotation.quotationDate)}
                        </div>
                        <div className="text-[11px] mt-0.5 flex items-center gap-1">
                          <span className={isExpired ? 'text-rose-400 font-bold' : 'text-amber-300/90'}>
                            Valid: {formatQuotationDate(quotation.validUntilDate)}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {quotation.clientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          TIN: {quotation.clientTin || 'N/A'} {quotation.clientContactPerson ? `• Attn: ${quotation.clientContactPerson}` : ''}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-purple-300 font-bold">
                          {quotation.projectCode || 'General'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-0.5">
                          {quotation.projectName || quotation.scopeOfWork || 'Commercial Scope'}
                        </div>
                      </td>

                      {/* Taxable Value */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-300">
                        {quotation.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total Consideration */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        <span className="text-cyan-300">
                          {quotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          (Incl. VAT @ {quotation.vatRate}%)
                        </div>
                      </td>

                      {/* Status & Converted Badge */}
                      <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAccepted || isConverted ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          isSent ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                          isExpired ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          isRejected || isCancelled ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {quotation.status}
                        </span>

                        {isConverted && quotation.convertedInvoiceNumber && (
                          <div className="mt-1 text-[10px] font-mono text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            <span>{quotation.convertedInvoiceNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Full Preview */}
                          <button
                            onClick={() => setSelectedForPreview(quotation)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Print / PDF Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Download PDF */}
                          <button
                            onClick={() => downloadQuotationPdf(quotation)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Create Revision */}
                          <button
                            onClick={() => setSelectedForRevision(quotation)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-950/40 transition-colors"
                            title="Create Revision (Rev.01, etc.)"
                          >
                            <GitFork className="w-4 h-4" />
                          </button>

                          {/* Convert to Tax Invoice */}
                          {!isConverted && (
                            <button
                              onClick={() => setSelectedForConvert(quotation)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition-colors"
                              title="Convert to Tax Invoice"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Quotation / Estimate */}
                          <button
                            onClick={() => handleOpenEdit(quotation)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Edit Quotation / Estimate"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setSelectedForDelete(quotation)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete Quotation / Estimate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-300">{filteredQuotations.length}</strong> of {quotations.length} commercial estimation records
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400/90">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Commercial Independence: Zero impact on Expenses, Petty Cash, or Payment Vouchers.</span>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isCreateModalOpen && (
        <CreateQuotationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          editQuotation={editingQuotation}
          initialType={createModalInitialType}
        />
      )}

      {selectedForDetail && (
        <QuotationDetailModal
          isOpen={!!selectedForDetail}
          onClose={() => setSelectedForDetail(null)}
          quotation={selectedForDetail}
          onOpenPreview={q => setSelectedForPreview(q)}
          onOpenRevisionModal={q => setSelectedForRevision(q)}
          onOpenConvertModal={q => setSelectedForConvert(q)}
          onOpenEditModal={q => handleOpenEdit(q)}
          onOpenDeleteModal={q => setSelectedForDelete(q)}
          onNavigateToInvoice={() => {
            setSelectedForDetail(null);
            navigateToModule('tax-invoices');
          }}
        />
      )}

      {selectedForPreview && (
        <QuotationPreviewModal
          isOpen={!!selectedForPreview}
          onClose={() => setSelectedForPreview(null)}
          quotation={selectedForPreview}
          onOpenDetails={q => setSelectedForDetail(q)}
          onOpenEdit={q => handleOpenEdit(q)}
          onOpenDelete={q => setSelectedForDelete(q)}
        />
      )}

      {selectedForDelete && (
        <DeleteQuotationModal
          isOpen={!!selectedForDelete}
          onClose={() => setSelectedForDelete(null)}
          quotation={selectedForDelete}
          onConfirmDelete={id => {
            deleteQuotation(id);
            if (selectedForDetail?.id === id) setSelectedForDetail(null);
            if (selectedForPreview?.id === id) setSelectedForPreview(null);
            setSelectedForDelete(null);
          }}
        />
      )}

      {selectedForRevision && (
        <QuotationRevisionModal
          isOpen={!!selectedForRevision}
          onClose={() => setSelectedForRevision(null)}
          quotation={selectedForRevision}
          onConfirmRevision={handleConfirmRevision}
        />
      )}

      {selectedForConvert && (
        <ConvertToInvoiceModal
          isOpen={!!selectedForConvert}
          onClose={() => setSelectedForConvert(null)}
          quotation={selectedForConvert}
          onConfirmConvert={handleConfirmConvert}
        />
      )}

      {isSettingsOpen && (
        <QuotationSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
