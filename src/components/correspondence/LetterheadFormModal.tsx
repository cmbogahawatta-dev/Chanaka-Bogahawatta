import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Eye,
  Sliders,
  Ruler,
  FileText,
  Trash2,
  HelpCircle,
  Layers
} from 'lucide-react';
import { LetterheadTemplate, LetterheadScope } from '../../types/correspondenceTypes';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterpriseCompany } from '../../context/EnterpriseCompanyContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { readFileAsDataUrl } from '../../utils/letterheadUtils';
import { LetterheadPreviewModal } from './LetterheadPreviewModal';

interface LetterheadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  letterheadToEdit?: LetterheadTemplate | null;
  onSaved?: (saved: LetterheadTemplate) => void;
}

export const LetterheadFormModal: React.FC<LetterheadFormModalProps> = ({
  isOpen,
  onClose,
  letterheadToEdit,
  onSaved
}) => {
  const { createLetterhead, updateLetterhead } = useEnterpriseCorrespondence();
  const { clients } = useEnterpriseCompany();
  const { projects } = usePettyCash();
  const { currentUser } = useEnterprise();

  // Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<LetterheadScope>('Corporate');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');

  // Uploaded Assets (Base64 Data URLs)
  const [fullLetterheadImageUrl, setFullLetterheadImageUrl] = useState<string | undefined>(undefined);
  const [headerImageUrl, setHeaderImageUrl] = useState<string | undefined>(undefined);
  const [footerImageUrl, setFooterImageUrl] = useState<string | undefined>(undefined);

  // Position Dimensions (in mm)
  const [headerHeight, setHeaderHeight] = useState<number>(45);
  const [footerHeight, setFooterHeight] = useState<number>(30);
  const [contentTopMargin, setContentTopMargin] = useState<number>(50);
  const [contentBottomMargin, setContentBottomMargin] = useState<number>(35);
  const [contentLeftMargin, setContentLeftMargin] = useState<number>(20);
  const [contentRightMargin, setContentRightMargin] = useState<number>(20);

  // Status & Default
  const [active, setActive] = useState<boolean>(true);
  const [isDefault, setIsDefault] = useState<boolean>(false);

  // Upload feedback state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  const fullFileInputRef = useRef<HTMLInputElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  // Populate form on edit
  useEffect(() => {
    if (letterheadToEdit) {
      setName(letterheadToEdit.name);
      setDescription(letterheadToEdit.description || '');
      setScope(letterheadToEdit.scope);
      setSelectedClientId(letterheadToEdit.clientId || '');
      setSelectedProjectId(letterheadToEdit.projectId || '');
      setPageSize(letterheadToEdit.pageSize || 'A4');
      setOrientation(letterheadToEdit.orientation || 'Portrait');
      setFullLetterheadImageUrl(letterheadToEdit.fullLetterheadImageUrl);
      setHeaderImageUrl(letterheadToEdit.headerImageUrl);
      setFooterImageUrl(letterheadToEdit.footerImageUrl);
      setHeaderHeight(letterheadToEdit.headerHeight ?? 45);
      setFooterHeight(letterheadToEdit.footerHeight ?? 30);
      setContentTopMargin(letterheadToEdit.contentTopMargin ?? 50);
      setContentBottomMargin(letterheadToEdit.contentBottomMargin ?? 35);
      setContentLeftMargin(letterheadToEdit.contentLeftMargin ?? 20);
      setContentRightMargin(letterheadToEdit.contentRightMargin ?? 20);
      setActive(letterheadToEdit.active ?? true);
      setIsDefault(letterheadToEdit.isDefault ?? false);
    } else {
      setName('');
      setDescription('');
      setScope('Corporate');
      setSelectedClientId('');
      setSelectedProjectId('');
      setPageSize('A4');
      setOrientation('Portrait');
      setFullLetterheadImageUrl(undefined);
      setHeaderImageUrl(undefined);
      setFooterImageUrl(undefined);
      setHeaderHeight(45);
      setFooterHeight(30);
      setContentTopMargin(50);
      setContentBottomMargin(35);
      setContentLeftMargin(20);
      setContentRightMargin(20);
      setActive(true);
      setIsDefault(false);
    }
    setUploadError(null);
  }, [letterheadToEdit, isOpen]);

  if (!isOpen) return null;

  // File Upload Handlers
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'full' | 'header' | 'footer'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed types: PNG, JPG, JPEG, SVG, PDF
    const validExtensions = ['png', 'jpg', 'jpeg', 'svg', 'pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setUploadError(`Unsupported format .${ext}. Please upload a PNG, JPG, JPEG, SVG, or PDF file.`);
      return;
    }

    try {
      setUploadError(null);
      const dataUrl = await readFileAsDataUrl(file);
      if (type === 'full') {
        setFullLetterheadImageUrl(dataUrl);
      } else if (type === 'header') {
        setHeaderImageUrl(dataUrl);
      } else if (type === 'footer') {
        setFooterImageUrl(dataUrl);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Error processing uploaded file.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setUploadError('Letterhead Name is required.');
      return;
    }

    // Resolve client & project info if selected
    const clientObj = clients.find(c => c.id === selectedClientId);
    const projectObj = projects.find(p => p.id === selectedProjectId);

    const payload = {
      enterpriseId: 'ent-apex',
      name: name.trim(),
      description: description.trim() || undefined,
      scope,
      clientId: selectedClientId || undefined,
      clientName: clientObj?.name,
      clientAffix: clientObj ? (clientObj as any).affix || clientObj.name.slice(0, 4).toUpperCase() : undefined,
      projectId: selectedProjectId || undefined,
      projectCode: projectObj?.CODE || (projectObj as any)?.code,
      projectName: projectObj?.NAME || (projectObj as any)?.name,
      projectAffix: projectObj ? (projectObj as any).affix || (projectObj.CODE || '').replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase() : undefined,
      pageSize,
      orientation,
      fullLetterheadImageUrl,
      headerImageUrl,
      footerImageUrl,
      headerHeight: Number(headerHeight) || 45,
      footerHeight: Number(footerHeight) || 30,
      contentTopMargin: Number(contentTopMargin) || 50,
      contentBottomMargin: Number(contentBottomMargin) || 35,
      contentLeftMargin: Number(contentLeftMargin) || 20,
      contentRightMargin: Number(contentRightMargin) || 20,
      active,
      isDefault,
      createdBy: currentUser || 'Administrator'
    };

    if (letterheadToEdit) {
      updateLetterhead(letterheadToEdit.id, payload, currentUser || 'Administrator');
      if (onSaved) onSaved({ ...letterheadToEdit, ...payload, updatedAt: new Date().toISOString() });
    } else {
      const created = createLetterhead(payload, currentUser || 'Administrator');
      if (onSaved) onSaved(created);
    }

    onClose();
  };

  // Construct momentary draft for preview modal
  const currentDraftLetterhead: LetterheadTemplate = {
    id: letterheadToEdit?.id || 'lh-draft-preview',
    enterpriseId: 'ent-apex',
    name: name.trim() || 'Custom EMA Letterhead Draft',
    description,
    scope,
    pageSize,
    orientation,
    fullLetterheadImageUrl,
    headerImageUrl,
    footerImageUrl,
    headerHeight: Number(headerHeight) || 45,
    footerHeight: Number(footerHeight) || 30,
    contentTopMargin: Number(contentTopMargin) || 50,
    contentBottomMargin: Number(contentBottomMargin) || 35,
    contentLeftMargin: Number(contentLeftMargin) || 20,
    contentRightMargin: Number(contentRightMargin) || 20,
    active,
    isDefault,
    createdBy: currentUser || 'Administrator',
    createdAt: letterheadToEdit?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {letterheadToEdit ? 'Edit Company Letterhead' : 'Create Custom Company Letterhead'}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-500/30">
                    EMA Corporate Studio
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Upload actual high-resolution EMA stationery and configure safe print boundaries.
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

          {/* Form Content */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* SECTION 1: Master Letterhead Details */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> 1. Letterhead Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Letterhead Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMA Corporate Master Letterhead"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Scope</label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as LetterheadScope)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Corporate">Corporate (Master / General)</option>
                    <option value="Client">Client-Specific (Employer)</option>
                    <option value="Project">Project-Specific (Site Office)</option>
                    <option value="Finance">Finance & Banking</option>
                    <option value="Tender">Tender & Procurement</option>
                    <option value="Confidential">Confidential / Board Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding intended departments, contracts, or statutory filings..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Conditional Client / Project Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Associated Client (Optional)
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={e => setSelectedClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- No specific client restriction --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Associated Project (Optional)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">-- No specific project restriction --</option>
                    {projects.map((p, idx) => (
                      <option key={`${p.id || (p as any).CODE || (p as any).code}-${idx}`} value={p.id}>
                        [{p.CODE || (p as any).code}] {p.NAME || (p as any).name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Page Format</label>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="A4">A4 (210 × 297 mm)</option>
                    <option value="Letter">Letter (8.5 × 11 in)</option>
                    <option value="Legal">Legal (8.5 × 14 in)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={e => setOrientation(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Portrait">Portrait</option>
                    <option value="Landscape">Landscape</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-800 border-slate-700"
                    />
                    <span>Active Status</span>
                  </label>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={e => setIsDefault(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                    />
                    <span className="font-semibold text-emerald-400">Set as Primary Default</span>
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 2: Custom Company Letterhead Upload */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" /> 2. Upload Custom Letterhead Artwork
                </h3>
                <span className="text-[11px] text-slate-400">Supported: PNG, JPG, JPEG, SVG, PDF</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Upload Option A: Full Page Letterhead */}
                <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Full Page Letterhead</span>
                      {fullLetterheadImageUrl && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                          LOADED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload entire A4 sheet with company header, watermark, and footer already laid out.
                    </p>
                  </div>

                  {fullLetterheadImageUrl ? (
                    <div className="space-y-2">
                      <div className="h-28 bg-white/5 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={fullLetterheadImageUrl}
                          alt="Full Letterhead Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => fullFileInputRef.current?.click()}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setFullLetterheadImageUrl(undefined)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Remove uploaded full letterhead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fullFileInputRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl text-xs text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                    >
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      <span className="font-semibold text-emerald-400">Upload Letterhead</span>
                      <span className="text-[10px] text-slate-500">Full A4 background asset</span>
                    </button>
                  )}
                  <input
                    ref={fullFileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf"
                    onChange={e => handleFileUpload(e, 'full')}
                    className="hidden"
                  />
                </div>

                {/* Upload Option B: Header Banner */}
                <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Header Banner Image</span>
                      {headerImageUrl && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-mono">
                          LOADED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload top corporate masthead, logo, and company registration bar.
                    </p>
                  </div>

                  {headerImageUrl ? (
                    <div className="space-y-2">
                      <div className="h-28 bg-white/5 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center p-2">
                        <img
                          src={headerImageUrl}
                          alt="Header Banner Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => headerFileInputRef.current?.click()}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderImageUrl(undefined)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Remove uploaded header"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => headerFileInputRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-purple-500/60 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl text-xs text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                    >
                      <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                      <span className="font-semibold text-purple-400">Upload Header</span>
                      <span className="text-[10px] text-slate-500">Top masthead / logo banner</span>
                    </button>
                  )}
                  <input
                    ref={headerFileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf"
                    onChange={e => handleFileUpload(e, 'header')}
                    className="hidden"
                  />
                </div>

                {/* Upload Option C: Footer Banner */}
                <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">Footer Banner Image</span>
                      {footerImageUrl && (
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full font-mono">
                          LOADED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Upload bottom address block, contact info, and legal registration tags.
                    </p>
                  </div>

                  {footerImageUrl ? (
                    <div className="space-y-2">
                      <div className="h-28 bg-white/5 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center p-2">
                        <img
                          src={footerImageUrl}
                          alt="Footer Banner Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => footerFileInputRef.current?.click()}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setFooterImageUrl(undefined)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Remove uploaded footer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => footerFileInputRef.current?.click()}
                      className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-800/40 hover:bg-slate-800/80 rounded-xl text-xs text-slate-300 flex flex-col items-center justify-center gap-1.5 transition-all group"
                    >
                      <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      <span className="font-semibold text-indigo-400">Upload Footer</span>
                      <span className="text-[10px] text-slate-500">Bottom contact / address block</span>
                    </button>
                  )}
                  <input
                    ref={footerFileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.pdf"
                    onChange={e => handleFileUpload(e, 'footer')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Letterhead Position Settings (in mm) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5" /> 3. Letterhead Position Settings (Dimensions in mm)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Defines safe content boundary so text never overlaps company header/footer
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Header Height
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={headerHeight}
                      onChange={e => setHeaderHeight(Number(e.target.value))}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-purple-300 font-mono font-bold focus:border-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      mm
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 45 mm</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Footer Height
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={footerHeight}
                      onChange={e => setFooterHeight(Number(e.target.value))}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-purple-300 font-mono font-bold focus:border-purple-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      mm
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 30 mm</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Content Top
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={140}
                      value={contentTopMargin}
                      onChange={e => setContentTopMargin(Number(e.target.value))}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      mm
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 50 mm</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Content Bottom
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={contentBottomMargin}
                      onChange={e => setContentBottomMargin(Number(e.target.value))}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      mm
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 35 mm</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Left Margin
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={contentLeftMargin}
                      onChange={e => setContentLeftMargin(Number(e.target.value))}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      mm
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 20 mm</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Right Margin
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={contentRightMargin}
                      onChange={e => setContentRightMargin(Number(e.target.value))}
                      className="w-full pl-3 pr-7 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">
                      mm
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Default: 20 mm</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Eye className="w-4 h-4 text-purple-400" />
                <span>Live A4 Preview</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-purple-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>{letterheadToEdit ? 'Update Letterhead' : 'Save Letterhead'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Live Preview Modal */}
      {previewModalOpen && (
        <LetterheadPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          letterhead={currentDraftLetterhead}
        />
      )}
    </>
  );
};
