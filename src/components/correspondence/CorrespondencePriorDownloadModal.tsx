import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Eye,
  Download,
  Printer,
  FileText,
  History,
  CheckCircle2,
  Calendar,
  Building2,
  Briefcase,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Letter, LetterheadTemplate, LetterDownloadRecord } from '../../types/correspondenceTypes';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { renderLetterPdfDocument, exportLetterToPDF } from '../../services/export/letterheadRenderer';
import { exportLetterToWord } from '../../services/export/wordExportService';

interface CorrespondencePriorDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: Letter;
  initialTab?: 'preview' | 'history';
}

export const CorrespondencePriorDownloadModal: React.FC<CorrespondencePriorDownloadModalProps> = ({
  isOpen,
  onClose,
  letter,
  initialTab = 'preview'
}) => {
  const { letterheads, recordLetterDownload } = useEnterpriseCorrespondence();
  const { profile } = useEnterpriseCompany();
  const { currentEnterprise } = useEnterprise();

  const [activeTab, setActiveTab] = useState<'preview' | 'history'>(initialTab);
  const [selectedLetterheadId, setSelectedLetterheadId] = useState<string>(
    letter.letterheadId || (letterheads.find(l => l.isDefault)?.id || letterheads[0]?.id || '')
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'a4-interactive' | 'pdf-native'>('a4-interactive');
  const [activePage, setActivePage] = useState<'all' | number>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Synchronize initial tab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Selected letterhead
  const activeLetterhead = useMemo(() => {
    return letterheads.find(l => l.id === selectedLetterheadId) || letterheads[0];
  }, [letterheads, selectedLetterheadId]);

  // Generate PDF blob preview for native viewer or download stats
  useEffect(() => {
    if (!isOpen || !letter) return;
    let url: string | null = null;
    try {
      setIsGeneratingPdf(true);
      const res = renderLetterPdfDocument(
        letter,
        profile,
        currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
        activeLetterhead
      );
      url = URL.createObjectURL(res.blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('Failed to generate preview PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [isOpen, letter, activeLetterhead, profile, currentEnterprise]);

  if (!isOpen) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(letter.ourReference || letter.letterNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    try {
      setIsDownloadingPdf(true);
      const res = exportLetterToPDF(
        letter,
        profile,
        currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
        activeLetterhead
      );

      // Record download audit log
      recordLetterDownload(letter.id, {
        format: 'PDF',
        filename: res.filename,
        downloadedBy: letter.preparedBy || 'Executive Secretariat',
        fileSize: res.fileSize,
        letterheadId: activeLetterhead?.id,
        letterheadName: activeLetterhead?.name,
        notes: `Downloaded after preview verification (v${letter.version})`
      });
    } catch (e) {
      console.error('Failed to download PDF:', e);
      alert('Failed to generate and download PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      await exportLetterToWord(
        letter,
        profile,
        currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
        activeLetterhead
      );

      const filename = `${letter.letterNumber.replace(/[\/\\:]/g, '_')}_Official_Correspondence.docx`;
      // Record download audit log
      recordLetterDownload(letter.id, {
        format: 'DOCX',
        filename,
        downloadedBy: letter.preparedBy || 'Executive Secretariat',
        fileSize: 85000,
        letterheadId: activeLetterhead?.id,
        letterheadName: activeLetterhead?.name,
        notes: `Exported to Microsoft Word for external review (v${letter.version})`
      });
    } catch (e) {
      console.error('Failed to export Word file:', e);
      alert('Failed to export to Microsoft Word');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    // Record download / print action
    recordLetterDownload(letter.id, {
      format: 'PRINT',
      filename: `${letter.letterNumber.replace(/[\/\\:]/g, '_')}_Printout`,
      downloadedBy: letter.preparedBy || 'Executive Secretariat',
      letterheadId: activeLetterhead?.id,
      letterheadName: activeLetterhead?.name,
      notes: 'Browser printout triggered from view prior to download'
    });

    if (pdfBlobUrl) {
      const printWindow = window.open(pdfBlobUrl);
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
        return;
      }
    }
    window.print();
  };

  const downloadHistory: LetterDownloadRecord[] = letter.downloadHistory || [];

  return (
    <div
      id="correspondence-prior-download-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ================================================================= */}
        {/* MODAL HEADER                                                      */}
        {/* ================================================================= */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-lg shadow-sm shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-purple-400 text-sm tracking-wide">
                  {letter.letterNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
                  title="Copy reference number"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    letter.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : letter.status === 'Issued'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {letter.status} (v{letter.version})
                </span>
              </div>
              <h3 className="text-xs text-slate-300 font-semibold truncate max-w-lg mt-0.5">
                {letter.subject}
              </h3>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              View Prior to Download
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Prior Downloads
              {downloadHistory.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-purple-900/60 text-purple-200 text-[10px] rounded-full font-mono font-bold">
                  {downloadHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* SUB-TOOLBAR (When in Preview Tab)                                */}
        {/* ================================================================= */}
        {activeTab === 'preview' && (
          <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {/* Stationery Letterhead Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-lg">
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-400 text-[11px] font-medium">Letterhead:</span>
                <select
                  value={selectedLetterheadId}
                  onChange={e => setSelectedLetterheadId(e.target.value)}
                  className="bg-transparent text-slate-100 text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
                  title="Switch letterhead stationery for this download"
                >
                  {letterheads.filter(l => l.active).map(lh => (
                    <option key={lh.id} value={lh.id} className="bg-slate-900 text-slate-200">
                      [{lh.scope}] {lh.name} {lh.isDefault ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-800/90 border border-slate-700/80 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('a4-interactive')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    viewMode === 'a4-interactive'
                      ? 'bg-purple-600/80 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  A4 Paper View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('pdf-native')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    viewMode === 'pdf-native'
                      ? 'bg-purple-600/80 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Native PDF Stream
                </button>
              </div>

              {/* Zoom Controls (for paper view) */}
              {viewMode === 'a4-interactive' && (
                <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 px-2 py-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-300 w-10 text-center font-bold">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(140, prev + 15))}
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(100)}
                    className="text-[10px] text-purple-400 hover:text-purple-300 ml-1 font-semibold"
                    title="Reset to 100%"
                  >
                    100%
                  </button>
                </div>
              )}
            </div>

            {/* DOWNLOAD ACTIONS RIGHT IN THE PREVIEW */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                title="Send directly to printer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                Print
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                disabled={isExportingWord}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-blue-700/20 disabled:opacity-50"
                title="Download authentic Microsoft Word (.docx) letter with corporate formatting"
              >
                <span className="w-3.5 h-3.5 rounded bg-white text-blue-700 font-black text-[10px] flex items-center justify-center leading-none">
                  W
                </span>
                {isExportingWord ? 'Exporting...' : 'Open in MS Word (.docx)'}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                title="Download verified official PDF document"
              >
                <Download className="w-3.5 h-3.5" />
                {isDownloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL BODY CONTAINER                                              */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 flex flex-col items-center">
          {activeTab === 'preview' ? (
            viewMode === 'pdf-native' && pdfBlobUrl ? (
              <div className="w-full h-full max-w-5xl rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
                <iframe
                  src={`${pdfBlobUrl}#toolbar=1&navpanes=0`}
                  title="PDF Preview Prior to Download"
                  className="w-full h-full border-none rounded-xl"
                />
              </div>
            ) : (
              /* A4 Paper View */
              <div
                className="transition-transform duration-150 origin-top flex flex-col items-center gap-6 pb-12 w-full"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              >
                {/* PAGE 1: OFFICIAL LETTERHEAD SHEET */}
                <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 p-8 sm:p-12 relative flex flex-col justify-between">
                  {/* Page Indicator Tag */}
                  <div className="absolute top-2 right-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Page 1 of 2 • Official Letterhead
                  </div>

                  <div>
                    {/* LETTERHEAD ARTWORK OR CORPORATE BANNER */}
                    {activeLetterhead.headerImageUrl ? (
                      <div className="mb-6">
                        <img
                          src={activeLetterhead.headerImageUrl}
                          alt="Company Letterhead Header"
                          className="w-full object-contain max-h-32"
                        />
                      </div>
                    ) : (
                      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-xl tracking-wider">
                            EMA
                          </div>
                          <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                              {profile.legalName || currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE'}
                            </h2>
                            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                              Engineering & Infrastructure Construction Directorate
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              CIDA SP-1 / ISO 9001:2015 Registered • Registration No: PV 129088
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 space-y-0.5 font-mono">
                          <div>{profile.registeredAddress || 'Level 14, World Trade Centre, Colombo 01, Sri Lanka'}</div>
                          <div>Tel: {profile.telephone || '+94 11 289 4000'} • Mobile: {profile.mobile || '+94 77 123 4567'}</div>
                          <div>Web: {profile.website || 'https://apexlogistics.lk'}</div>
                        </div>
                      </div>
                    )}

                    {/* STRUCTURED TWO-BOX SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      {/* Left Box: Recipient Addressee */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          ADDRESSEE / RECIPIENT
                        </div>
                        <div className="p-3 text-xs space-y-1">
                          <div className="font-bold text-sm text-slate-900 leading-snug">
                            {letter.recipientOrganization || 'General Addressee / Employer'}
                          </div>
                          {letter.attention && (
                            <div className="italic text-slate-700 font-medium">
                              Attn: {letter.attention}
                            </div>
                          )}
                          <div className="text-slate-500 whitespace-pre-line leading-relaxed text-[11px] pt-0.5">
                            {letter.recipientAddress || 'Corporate Office / Project Site'}
                          </div>
                        </div>
                      </div>

                      {/* Right Box: Correspondence Particulars */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                        <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-700 uppercase flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-slate-500" />
                            CORRESPONDENCE PARTICULARS
                          </span>
                          <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                            {letter.ourReference || letter.letterNumber}
                          </span>
                        </div>
                        <div className="p-3 text-xs text-slate-700 space-y-1.5">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-600 text-[11px]">Date:</span>
                            <span className="font-medium text-slate-900">{letter.date}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-600 text-[11px]">Our Ref:</span>
                            <span className="font-mono font-bold text-purple-700">
                              {letter.ourReference || letter.letterNumber}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-600 text-[11px]">Your Ref:</span>
                            <span className="font-medium text-slate-800">
                              {letter.theirReference || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-600 text-[11px]">Project:</span>
                            <span className="text-[11px] text-emerald-700 font-semibold truncate max-w-[180px]" title={letter.projectName}>
                              [{letter.projectAffix || letter.projectCode || 'GEN'}]{' '}
                              {letter.projectName || 'General Operations'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-600 text-[11px]">Classification:</span>
                            <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {letter.category} ({letter.confidentiality || 'Normal'})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SUBJECT CONTAINER */}
                    <div className="mb-6 p-3.5 bg-slate-50 border-l-4 border-slate-900 border-y border-r border-slate-200 rounded-r shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        OFFICIAL SUBJECT MATTER:
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide leading-relaxed">
                        SUBJECT: {letter.subject}
                      </div>
                    </div>

                    {/* LETTER BODY (STANDARD JUSTIFIED PRACTICE) */}
                    <div className="mb-8">
                      <div
                        className="text-sm leading-relaxed text-slate-800 space-y-4 font-serif text-justify [&>p]:text-justify [&>p]:leading-relaxed [&>p]:mb-4"
                        style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                        dangerouslySetInnerHTML={{ __html: letter.bodyHtml }}
                      />
                    </div>
                  </div>

                  {/* SIGNATORY & SEAL BLOCK */}
                  <div className="border-t border-slate-200 pt-6 mt-6 flex justify-between items-end">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-700">Yours faithfully,</div>
                      <div className="font-black text-slate-900 text-sm">
                        {profile.legalName || currentEnterprise?.name}
                      </div>
                      <div className="h-12 flex items-center">
                        {letter.status === 'Approved' ? (
                          <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            OFFICIALLY SIGNED & SEALED
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">
                            [Official Signature & Seal on Approval]
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {letter.approvedBy || letter.preparedBy}
                      </div>
                      <div className="text-slate-500 text-[11px]">Authorized Signatory</div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      <div>Ref: {letter.letterNumber}</div>
                      <div>EMA Project & Client Registry</div>
                    </div>
                  </div>
                </div>

                {/* PAGE 2: CONTINUATION SHEET */}
                <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 p-8 sm:p-12 relative flex flex-col justify-between">
                  <div className="absolute top-2 right-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Page 2 of 2 • Blank Continuation Sheet
                  </div>

                  <div>
                    {/* STANDARD ENGINEERING MINIMAL HEADER */}
                    <div className="flex items-center justify-between pb-3 mb-6 border-b border-slate-200 text-xs text-slate-600 font-mono">
                      <div>
                        <span className="font-bold text-slate-800">Ref:</span>{' '}
                        {letter.ourReference || letter.letterNumber}
                      </div>
                      <div className="text-slate-500 font-normal">
                        Date: {letter.date}
                      </div>
                      <div className="font-bold text-slate-800">
                        Page 2 of 2 <span className="font-normal text-slate-500">(Continuation Sheet)</span>
                      </div>
                    </div>

                    {/* CONTINUATION BODY CONTENT */}
                    <div className="mb-8">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Continuation from Page 1:
                      </div>
                      <div
                        className="text-sm leading-relaxed text-slate-800 space-y-4 font-serif text-justify [&>p]:text-justify [&>p]:leading-relaxed [&>p]:mb-4"
                        style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                        dangerouslySetInnerHTML={{ __html: letter.bodyHtml }}
                      />
                    </div>
                  </div>

                  {/* SIGNATORY REPEAT */}
                  <div className="border-t border-slate-200 pt-6 mt-6 flex justify-between items-end">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-700">Yours faithfully,</div>
                      <div className="font-black text-slate-900 text-sm">
                        {profile.legalName || currentEnterprise?.name}
                      </div>
                      <div className="h-12 flex items-center">
                        {letter.status === 'Approved' ? (
                          <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 rounded text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            OFFICIALLY SIGNED & SEALED
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">
                            [Official Signature & Seal on Approval]
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-slate-900">
                        {letter.approvedBy || letter.preparedBy}
                      </div>
                      <div className="text-slate-500 text-[11px]">Authorized Signatory</div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      <div>Ref: {letter.letterNumber}</div>
                      <div>EMA Project & Client Registry</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* TAB 2: PRIOR DOWNLOADS & AUDIT TRAIL */
            <div className="w-full max-w-4xl space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Prior Downloads
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">
                      {downloadHistory.length}
                    </span>
                    <span className="text-xs text-slate-400">Events Logged</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Current Version
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-400 font-mono">
                      v{letter.version}
                    </span>
                    <span className="text-xs text-slate-400">{letter.status}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Stationery Used
                  </span>
                  <div className="text-sm font-bold text-slate-200 truncate">
                    {activeLetterhead.name}
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">
                    [{activeLetterhead.scope}]
                  </span>
                </div>
              </div>

              {/* History Table / Records */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Immutable Download & Export Audit Log
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Tracked in compliance with ISO 9001 Document Control
                  </span>
                </div>

                {downloadHistory.length === 0 ? (
                  <div className="py-12 text-center p-6">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">
                      No prior downloads recorded for this letter yet
                    </p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Every time an official PDF or Microsoft Word copy is generated and downloaded, a tamper-resistant record is automatically stored here.
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Official PDF Now
                      </button>
                      <button
                        type="button"
                        onClick={handleExportWord}
                        className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                      >
                        <span className="w-3.5 h-3.5 rounded bg-white text-blue-700 font-bold text-[10px] flex items-center justify-center">W</span>
                        Export to MS Word (.docx)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {downloadHistory.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                              item.format === 'DOCX'
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : item.format === 'PDF'
                                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700/40 text-slate-300 border border-slate-600/40'
                            }`}
                          >
                            {item.format === 'DOCX' ? 'W' : item.format === 'PDF' ? 'PDF' : 'PRN'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-200 font-mono truncate">
                                {item.filename}
                              </span>
                              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.2 rounded font-mono font-bold">
                                Version {item.version}
                              </span>
                              {item.fileSize && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {(item.fileSize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span>Downloaded by: <strong className="text-slate-300">{item.downloadedBy}</strong></span>
                              <span>•</span>
                              <span>{new Date(item.downloadedAt).toLocaleString()}</span>
                              {item.letterheadName && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 truncate max-w-[200px]">
                                    Stationery: {item.letterheadName}
                                  </span>
                                </>
                              )}
                            </div>

                            {item.notes && (
                              <p className="text-[11px] text-slate-400 italic mt-1">
                                Note: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.format === 'PDF' ? (
                            <button
                              type="button"
                              onClick={handleDownloadPdf}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Re-Download PDF copy"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-400" />
                              Re-Download PDF
                            </button>
                          ) : item.format === 'DOCX' ? (
                            <button
                              type="button"
                              onClick={handleExportWord}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Re-Download Word (.docx) copy"
                            >
                              <RotateCcw className="w-3 h-3 text-blue-400" />
                              Re-Download Word
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handlePrint}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Printer className="w-3 h-3 text-slate-400" />
                              Print Again
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* MODAL FOOTER NOTE                                                 */}
        {/* ================================================================= */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>
              ISO Document Control: Review all particulars, references, and justification before official issue.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-400">
              Ref: {letter.ourReference || letter.letterNumber}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
