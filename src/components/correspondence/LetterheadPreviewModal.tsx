import React, { useState } from 'react';
import {
  X,
  Eye,
  FileCheck,
  CheckCircle2,
  Printer,
  Shield,
  Layers,
  Ruler,
  Maximize2
} from 'lucide-react';
import { LetterheadTemplate } from '../../types/correspondenceTypes';
import { exportLetterToPDF } from '../../services/export/letterheadRenderer';
import { useEnterprise } from '../../context/EnterpriseContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';

interface LetterheadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  letterhead: LetterheadTemplate | null;
}

export const LetterheadPreviewModal: React.FC<LetterheadPreviewModalProps> = ({
  isOpen,
  onClose,
  letterhead
}) => {
  const { currentEnterprise } = useEnterprise();
  const { profile } = useEnterpriseCompany();
  const [showMargins, setShowMargins] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('fit');

  if (!isOpen || !letterhead) return null;

  const headerH = letterhead.headerHeight || 45;
  const footerH = letterhead.footerHeight || 30;
  const topMargin = letterhead.contentTopMargin || 50;
  const bottomMargin = letterhead.contentBottomMargin || 35;
  const leftMargin = letterhead.contentLeftMargin || 20;
  const rightMargin = letterhead.contentRightMargin || 20;

  // Percentage calculations for standard A4 (210mm x 297mm)
  const topPct = (topMargin / 297) * 100;
  const bottomPct = (bottomMargin / 297) * 100;
  const leftPct = (leftMargin / 210) * 100;
  const rightPct = (rightMargin / 210) * 100;
  const headerHeightPct = (headerH / 297) * 100;
  const footerHeightPct = (footerH / 297) * 100;

  const handleDownloadSamplePdf = () => {
    const sampleLetter = {
      id: 'sample-preview',
      letterNumber: 'EMA/RDA/PIDM26/2026/001',
      direction: 'Outgoing' as const,
      category: 'Project',
      recipientOrganization: 'Resident Engineer',
      attention: 'Project Manager',
      recipientAddress: 'Site Office, PIDM-26 Project, Central Province',
      subject: 'Sample Official Correspondence',
      date: '06 September 2026',
      priority: 'Normal' as const,
      confidentiality: 'Normal' as const,
      bodyHtml:
        '<p>Dear Sir,</p><p>This is a sample official correspondence generated using the selected EMA company letterhead.</p><p>All margin boundaries, header coordinates, and footer seals have been calibrated strictly according to EMA Corporate Engineering specifications.</p>',
      preparedBy: 'Authorized Signatory',
      approvedBy: 'Eng. K. P. Perera (Director Operations)',
      status: 'Approved' as const,
      version: 1,
      isLocked: false,
      attachedDocumentIds: [],
      createdAt: new Date().toISOString(),
      letterheadId: letterhead.id
    };

    exportLetterToPDF(
      sampleLetter as any,
      profile,
      currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE',
      letterhead
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">{letterhead.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {letterhead.scope} Scope
                </span>
                {letterhead.isDefault && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official A4 Letterhead Layout Simulation (210mm × 297mm)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Safe margins toggle */}
            <button
              onClick={() => setShowMargins(!showMargins)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showMargins
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Safe Boundaries {showMargins ? 'ON' : 'OFF'}</span>
            </button>

            {/* Download Sample PDF */}
            <button
              onClick={handleDownloadSamplePdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Test Export PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Position Metrics Strip */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Header Height: <strong className="text-purple-300">{headerH} mm</strong>
            </span>
            <span>
              Footer Height: <strong className="text-purple-300">{footerH} mm</strong>
            </span>
            <span>
              Top Margin: <strong className="text-emerald-300">{topMargin} mm</strong>
            </span>
            <span>
              Bottom Margin: <strong className="text-emerald-300">{bottomMargin} mm</strong>
            </span>
            <span>
              Left/Right: <strong className="text-emerald-300">{leftMargin}/{rightMargin} mm</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              {letterhead.fullLetterheadImageUrl
                ? 'Full Page Artwork Loaded'
                : letterhead.headerImageUrl
                ? 'Header Banner Uploaded'
                : 'Default EMA Vector Letterhead'}
            </span>
          </div>
        </div>

        {/* Modal Body: A4 Sheet Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start">
          <div
            id="letterhead-preview-sheet"
            className="relative bg-white text-slate-900 shadow-2xl border border-slate-300 w-full max-w-[650px] transition-all"
            style={{
              aspectRatio: '210 / 297',
              minHeight: '840px'
            }}
          >
            {/* 1. Full Letterhead Background (if uploaded) */}
            {letterhead.fullLetterheadImageUrl && (
              <img
                src={letterhead.fullLetterheadImageUrl}
                alt="Full Letterhead Artwork"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
            )}

            {/* 2. Header Banner (if uploaded and not full page) */}
            {!letterhead.fullLetterheadImageUrl && letterhead.headerImageUrl && (
              <div
                className="absolute top-0 left-0 right-0 overflow-hidden"
                style={{ height: `${headerHeightPct}%` }}
              >
                <img
                  src={letterhead.headerImageUrl}
                  alt="Company Header Banner"
                  className="w-full h-full object-contain object-top pointer-events-none"
                />
              </div>
            )}

            {/* 3. Default Styled Header (if no custom uploaded artwork) */}
            {!letterhead.fullLetterheadImageUrl && !letterhead.headerImageUrl && (
              <div
                className="absolute top-0 left-0 right-0 bg-slate-900 text-white p-4 border-b-2 border-emerald-500 flex justify-between items-center"
                style={{ height: `${headerHeightPct}%` }}
              >
                <div>
                  <h3 className="text-lg font-black tracking-wider uppercase">
                    {profile.legalName || currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE'}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">
                    HEAVY ENGINEERING • INFRASTRUCTURE • FLEET LOGISTICS
                  </p>
                  <p className="text-[8px] text-slate-300 mt-1">
                    Reg No: {profile.registrationNumber || 'PV-98241/2018'} | CIDA Grade: C1 / F1 | VAT: 114872910
                  </p>
                </div>
                <div className="text-right text-[8px] text-slate-300">
                  <div className="font-bold text-slate-100">OFFICIAL HEADQUARTERS</div>
                  <div>Colombo 01, Sri Lanka</div>
                </div>
              </div>
            )}

            {/* 4. Footer Banner (if uploaded) */}
            {!letterhead.fullLetterheadImageUrl && letterhead.footerImageUrl && (
              <div
                className="absolute bottom-0 left-0 right-0 overflow-hidden"
                style={{ height: `${footerHeightPct}%` }}
              >
                <img
                  src={letterhead.footerImageUrl}
                  alt="Company Footer Banner"
                  className="w-full h-full object-contain object-bottom pointer-events-none"
                />
              </div>
            )}

            {/* 5. Default Styled Footer (if no custom footer uploaded) */}
            {!letterhead.fullLetterheadImageUrl && !letterhead.footerImageUrl && (
              <div
                className="absolute bottom-0 left-0 right-0 border-t border-slate-200 px-6 py-2 flex justify-between items-center text-[8px] text-slate-500"
                style={{ height: `${footerHeightPct}%` }}
              >
                <div>
                  <div className="font-bold text-slate-700">HEADQUARTERS & CORPORATE SECRETARIAT</div>
                  <div>Level 14 & 16, World Trade Centre, Colombo 01, Sri Lanka | +94 11 289 4000</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-700">EMA AUDIT SECURED</div>
                  <div>Page 1 of 1</div>
                </div>
              </div>
            )}

            {/* Safe Boundaries Visual Overlay (when toggled ON) */}
            {showMargins && (
              <div
                className="absolute border-2 border-dashed border-emerald-500/60 pointer-events-none bg-emerald-500/[0.02]"
                style={{
                  top: `${topPct}%`,
                  bottom: `${bottomPct}%`,
                  left: `${leftPct}%`,
                  right: `${rightPct}%`
                }}
              >
                <div className="absolute -top-5 left-1 text-[9px] font-mono font-bold text-emerald-600 bg-white/90 px-1 rounded shadow-sm border border-emerald-200">
                  Top Safe Content Margin ({topMargin}mm)
                </div>
                <div className="absolute -bottom-5 right-1 text-[9px] font-mono font-bold text-emerald-600 bg-white/90 px-1 rounded shadow-sm border border-emerald-200">
                  Bottom Safe Content Margin ({bottomMargin}mm)
                </div>
              </div>
            )}

            {/* Sample Dynamic Content positioned strictly inside safe content area */}
            <div
              className="absolute overflow-hidden flex flex-col justify-between"
              style={{
                top: `${topPct}%`,
                bottom: `${bottomPct}%`,
                left: `${leftPct}%`,
                right: `${rightPct}%`
              }}
            >
              {/* Top Meta: Date, Ref, Recipient */}
              <div className="space-y-2.5 text-[11px] text-slate-800">
                {/* Structured Dual Boxes */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Recipient Box */}
                  <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
                    <div className="bg-slate-100 border-b border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 uppercase">
                      TO: RECIPIENT & ADDRESSEE
                    </div>
                    <div className="p-1.5 space-y-0.5 text-[10px]">
                      <div className="font-bold text-slate-900 leading-tight">Resident Engineer</div>
                      <div className="text-slate-600 italic text-[9px]">Attention: Project Manager</div>
                      <div className="text-slate-500 text-[9px] leading-tight">Site Office, PIDM-26 Project</div>
                    </div>
                  </div>

                  {/* Particulars Box */}
                  <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
                    <div className="bg-slate-100 border-b border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700 uppercase flex justify-between">
                      <span>CORRESPONDENCE PARTICULARS</span>
                    </div>
                    <div className="p-1.5 space-y-0.5 text-[9px]">
                      <div className="flex justify-between"><span className="text-slate-500 font-semibold">Date:</span> <span>06 September 2026</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-semibold">Our Ref:</span> <span className="font-mono font-bold text-purple-700">EMA/RDA/PIDM26/2026/001</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-semibold">Your Ref:</span> <span>RDA/PIDM/CORR/99</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-semibold">Project:</span> <span className="text-emerald-700 font-semibold">[PIDM-26] Highway Project</span></div>
                    </div>
                  </div>
                </div>

                {/* Subject Line Box */}
                <div className="bg-slate-50 border border-slate-300 border-l-4 border-l-slate-900 px-3 py-1.5 rounded font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                  SUBJECT: Sample Official Correspondence
                </div>

                {/* Body Text in Justified Box */}
                <div className="border border-slate-200 rounded p-2.5 bg-white space-y-1.5 text-slate-800 leading-relaxed font-serif text-[10.5px] text-justify" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>
                  <p>Dear Sir,</p>
                  <p>
                    This is a sample official correspondence generated using the selected EMA company
                    letterhead.
                  </p>
                  <p>
                    All company header coordinates, corporate seals, and footer metadata remain
                    untouched and fixed, while all project transmittal particulars are dynamically
                    flowed into this calibrated safe content area in standard justified format.
                  </p>
                </div>
              </div>

              {/* Sign-off Block */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-end text-[10px] text-slate-700">
                <div>
                  <div>Yours faithfully,</div>
                  <div className="font-bold uppercase text-slate-900 mt-1">
                    {profile.legalName || currentEnterprise?.name || 'EMA CORPORATE ENTERPRISE'}
                  </div>
                  <div className="my-2 py-1 px-2.5 bg-emerald-50 border border-emerald-300 rounded inline-flex items-center gap-1 font-mono text-[9px] text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    AUTHENTICATED CORRESPONDENCE
                  </div>
                  <div className="font-bold text-slate-900">Authorized Signatory</div>
                  <div className="text-slate-500 text-[9px]">Executive Secretariat</div>
                </div>

                <div className="text-right text-[9px] text-slate-400">
                  <div>Ref: EMA/RDA/PIDM26/2026/001</div>
                  <div>Verified Secure Record</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Preview is scaled proportionally to standard International A4 sheet format.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
