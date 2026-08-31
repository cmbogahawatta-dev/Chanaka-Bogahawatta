import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  ExternalLink,
  Plus,
  CheckCircle2,
  FolderOpen,
  Image as ImageIcon,
  FileCheck
} from 'lucide-react';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { useFleet } from '../../context/FleetContext';
import { EnterpriseDocument } from '../../types/enterpriseTypes';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';

export const DocumentsView: React.FC = () => {
  const { documents, addDocument, updateDocument, deleteDocument, clearDocumentsHistory, currentUser, currentRole } = useEnterprise();
  const { projects, expenses } = usePettyCash();
  const { vehicles } = useFleet();
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'OWNER';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EnterpriseDocument | null>(null);

  // Form State
  const [docTitle, setDocTitle] = useState('');
  const [docModule, setDocModule] = useState<EnterpriseDocument['MODULE']>('Petty Cash');
  const [docCategory, setDocCategory] = useState<EnterpriseDocument['CATEGORY']>('Receipt');
  const [linkedEntityType, setLinkedEntityType] = useState<EnterpriseDocument['LINKED_ENTITY_TYPE']>('EXPENSE');
  const [linkedEntityId, setLinkedEntityId] = useState('EXP-1001');
  const [remarks, setRemarks] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchSearch = searchTerm === '' ||
        d.DOC_REF.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.TITLE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.LINKED_ENTITY_ID.toLowerCase().includes(searchTerm.toLowerCase());

      const matchModule = selectedModule === 'ALL' || d.MODULE === selectedModule;
      const matchCat = selectedCategory === 'ALL' || d.CATEGORY === selectedCategory;

      return matchSearch && matchModule && matchCat;
    });
  }, [documents, searchTerm, selectedModule, selectedCategory]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !fileName) {
      alert('Please enter document title and select a file.');
      return;
    }

    addDocument({
      TITLE: docTitle.trim(),
      MODULE: docModule,
      CATEGORY: docCategory,
      LINKED_ENTITY_TYPE: linkedEntityType,
      LINKED_ENTITY_ID: linkedEntityId,
      FILE_NAME: fileName,
      FILE_TYPE: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      FILE_DATA: fileData,
      UPLOADED_BY: currentUser,
      UPLOADED_DATE: new Date().toISOString().slice(0, 10),
      FILE_SIZE_KB: 450,
      REMARKS: remarks.trim() || undefined
    });

    setIsUploadModalOpen(false);
    setDocTitle('');
    setFileName('');
    setFileData('');
    setRemarks('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Universal Enterprise Document Vault</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized document repository linking expense receipts, vehicle fitness & insurance, site permits, and payment proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AdminClearHistoryButton
            id="btn-admin-clear-documents"
            moduleName="Document Vault"
            itemCount={documents.length}
            itemDescription="scanned attachments, receipts, and PDF files"
            preservedItemsDescription="Underlying transaction records and project data remain intact."
            onClear={() => clearDocumentsHistory()}
          />
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>+ Upload Document</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search document title, ref, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Modules</option>
            <option value="Petty Cash">Petty Cash</option>
            <option value="FleetTrack">FleetTrack</option>
            <option value="Projects">Projects</option>
            <option value="Procurement">Procurement</option>
            <option value="Payments">Payments</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Receipt">Receipt</option>
            <option value="Vehicle Insurance">Vehicle Insurance</option>
            <option value="Revenue License">Revenue License</option>
            <option value="Inspection Certificate">Inspection Certificate</option>
            <option value="Site Permit">Site Permit</option>
            <option value="Site Contract">Site Contract</option>
          </select>
        </div>
      </div>

      {/* 3. Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                  doc.MODULE === 'Petty Cash' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  doc.MODULE === 'FleetTrack' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                  doc.MODULE === 'Projects' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                  'bg-indigo-950 text-indigo-300 border border-indigo-800'
                }`}>
                  {doc.MODULE} • {doc.CATEGORY}
                </span>
                <span className="font-mono text-[11px] text-slate-400">{doc.DOC_REF}</span>
              </div>

              <h4 className="font-bold text-slate-100 text-sm mt-2 line-clamp-2">{doc.TITLE}</h4>

              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span className="font-mono font-bold text-slate-300">Linked: {doc.LINKED_ENTITY_ID}</span>
                <span>•</span>
                <span>{doc.UPLOADED_DATE}</span>
              </div>
            </div>

            {doc.FILE_DATA && (
              <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                <img
                  src={doc.FILE_DATA}
                  alt={doc.TITLE}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-mono">{doc.FILE_NAME}</span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Admin: Are you sure you want to delete document "${doc.TITLE}" (${doc.DOC_REF})?`)) {
                        deleteDocument(doc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                    title="Admin: Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold">{previewDoc.DOC_REF}</span>
                <h3 className="font-bold text-slate-100 text-base">{previewDoc.TITLE}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                <div><span className="text-slate-400 block">Module:</span> <strong className="text-slate-200">{previewDoc.MODULE}</strong></div>
                <div><span className="text-slate-400 block">Category:</span> <strong className="text-slate-200">{previewDoc.CATEGORY}</strong></div>
                <div><span className="text-slate-400 block">Linked Entity:</span> <strong className="text-slate-200 font-mono">{previewDoc.LINKED_ENTITY_ID}</strong></div>
              </div>

              {previewDoc.FILE_DATA ? (
                <div className="max-h-96 overflow-auto rounded-xl border border-slate-800 flex items-center justify-center bg-black/40 p-2">
                  <img src={previewDoc.FILE_DATA} alt={previewDoc.TITLE} className="max-h-80 object-contain rounded-lg" />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="font-bold text-slate-300">{previewDoc.FILE_NAME}</p>
                  <p className="text-[11px]">Stored securely in EMA Cloud Document Storage</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">Upload Enterprise Document</h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WP-CAB-4521 Revenue License 2026/2027"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Module</label>
                  <select
                    value={docModule}
                    onChange={(e) => setDocModule(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="FleetTrack">FleetTrack</option>
                    <option value="Projects">Projects</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Payments">Payments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Receipt">Receipt</option>
                    <option value="Vehicle Insurance">Vehicle Insurance</option>
                    <option value="Revenue License">Revenue License</option>
                    <option value="Inspection Certificate">Inspection Certificate</option>
                    <option value="Site Permit">Site Permit</option>
                    <option value="Site Contract">Site Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Linked Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. EXP-1001 or veh-1 or PRJ-001"
                  value={linkedEntityId}
                  onChange={(e) => setLinkedEntityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Select File / Receipt Image *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
