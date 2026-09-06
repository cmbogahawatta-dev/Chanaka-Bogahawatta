import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Briefcase,
  Building2,
  ShieldAlert,
  FileText,
  Upload,
  Ruler,
  Layers,
  Sparkles
} from 'lucide-react';
import { LetterheadTemplate, LetterheadScope } from '../../types/correspondenceTypes';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { LetterheadPreviewModal } from './LetterheadPreviewModal';
import { LetterheadFormModal } from './LetterheadFormModal';

interface LetterheadManagerViewProps {
  onBackToCorrespondence?: () => void;
  onComposeWithLetterhead?: (letterheadId: string) => void;
}

export const LetterheadManagerView: React.FC<LetterheadManagerViewProps> = ({
  onBackToCorrespondence,
  onComposeWithLetterhead
}) => {
  const {
    letterheads,
    deleteLetterhead,
    duplicateLetterhead,
    setDefaultLetterhead,
    toggleLetterheadActive
  } = useEnterpriseCorrespondence();

  const { currentRole, currentUser } = useEnterprise();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [previewTarget, setPreviewTarget] = useState<LetterheadTemplate | null>(null);
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingTarget, setEditingTarget] = useState<LetterheadTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered Letterheads
  const filteredLetterheads = useMemo(() => {
    return letterheads.filter(l => {
      // Scope
      if (selectedScope !== 'ALL' && l.scope !== selectedScope) return false;
      // Status
      if (selectedStatus === 'ACTIVE' && !l.active) return false;
      if (selectedStatus === 'INACTIVE' && l.active) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesDesc = l.description?.toLowerCase().includes(q) || false;
        const matchesClient = l.clientName?.toLowerCase().includes(q) || l.clientAffix?.toLowerCase().includes(q) || false;
        const matchesProject = l.projectName?.toLowerCase().includes(q) || l.projectCode?.toLowerCase().includes(q) || false;
        return matchesName || matchesDesc || matchesClient || matchesProject;
      }
      return true;
    });
  }, [letterheads, selectedScope, selectedStatus, searchQuery]);

  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (lh: LetterheadTemplate) => {
    setEditingTarget(lh);
    setFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteLetterhead(id, currentUser || 'Administrator');
    setDeleteConfirmId(null);
  };

  const getScopeBadgeColor = (scope: LetterheadScope) => {
    switch (scope) {
      case 'Corporate':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'Client':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'Project':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'Finance':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      case 'Tender':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'Confidential':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              LETTERHEAD MANAGEMENT
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-semibold">
                Official Stationery Registry
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure, upload, and calibrate actual company letterheads with safe printable margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Letterhead</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Role Required to Edit Letterheads</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search letterheads, clients, projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Filter */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <span className="px-2 text-slate-400 text-[11px]">Scope:</span>
            {['ALL', 'Corporate', 'Client', 'Project', 'Finance', 'Tender', 'Confidential'].map(sc => (
              <button
                key={sc}
                onClick={() => setSelectedScope(sc)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  selectedScope === sc
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Letterheads List / Cards */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filteredLetterheads.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-lg mx-auto">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Letterheads Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try modifying your search or scope filters, or create a new company letterhead.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Create Letterhead
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredLetterheads.map(lh => (
              <div
                key={lh.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-700 shadow-xl ${
                  lh.isDefault ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-slate-800'
                }`}
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getScopeBadgeColor(
                            lh.scope
                          )}`}
                        >
                          {lh.scope} Scope
                        </span>
                        {lh.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                            DEFAULT
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            lh.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {lh.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-500" /> Inactive
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-100 mt-2 tracking-tight">
                        {lh.name}
                      </h3>
                      {lh.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lh.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Associated Client / Project Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 my-3">
                    {lh.clientAffix && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {lh.clientAffix} ({lh.clientName || 'Client'})
                      </span>
                    )}
                    {lh.projectAffix && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-semibold flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {lh.projectAffix} ({lh.projectCode || lh.projectName || 'Project'})
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {lh.pageSize || 'A4'} {lh.orientation || 'Portrait'}
                    </span>
                  </div>

                  {/* Artwork status & Margins */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 my-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Letterhead Graphic:</span>
                      <span className="font-semibold text-slate-200">
                        {lh.fullLetterheadImageUrl
                          ? 'Full A4 Artwork'
                          : lh.headerImageUrl
                          ? 'Custom Header Banner'
                          : 'EMA Vector Graphics'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-800/60">
                      <div>
                        Header: <strong className="text-purple-300">{lh.headerHeight || 45}mm</strong>
                      </div>
                      <div>
                        Footer: <strong className="text-purple-300">{lh.footerHeight || 30}mm</strong>
                      </div>
                      <div>
                        Top: <strong className="text-emerald-300">{lh.contentTopMargin || 50}mm</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Toolbar */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewTarget(lh)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      title="Preview A4 Sheet"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      <span>Preview</span>
                    </button>

                    {/* Compose using this Letterhead */}
                    {onComposeWithLetterhead && lh.active && (
                      <button
                        onClick={() => onComposeWithLetterhead(lh.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                        title="Compose official letter using this letterhead"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Use</span>
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {/* Set Default */}
                      {!lh.isDefault && lh.active && (
                        <button
                          onClick={() => setDefaultLetterhead(lh.id, currentUser || 'Administrator')}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Set as Default Letterhead"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}

                      {/* Duplicate */}
                      <button
                        onClick={() => duplicateLetterhead(lh.id, currentUser || 'Administrator')}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Duplicate Letterhead"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => toggleLetterheadActive(lh.id, currentUser || 'Administrator')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          lh.active
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                        title={lh.active ? 'Deactivate Letterhead' : 'Activate Letterhead'}
                      >
                        {lh.active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(lh)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Letterhead Settings"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      {!lh.isDefault && (
                        <button
                          onClick={() => setDeleteConfirmId(lh.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Letterhead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Delete Confirmation In-card Alert */}
                {deleteConfirmId === lh.id && (
                  <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2">
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      Confirm Delete Letterhead
                    </div>
                    <p className="text-[11px] text-rose-200">
                      Are you sure you want to permanently remove <strong>{lh.name}</strong>?
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleDelete(lh.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTarget && (
        <LetterheadPreviewModal
          isOpen={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          letterhead={previewTarget}
        />
      )}

      {/* Create / Edit Form Modal */}
      {formModalOpen && (
        <LetterheadFormModal
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingTarget(null);
          }}
          letterheadToEdit={editingTarget}
        />
      )}
    </div>
  );
};
