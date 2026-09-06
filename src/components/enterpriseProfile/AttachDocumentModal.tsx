import React, { useState } from 'react';
import { X, Save, FileText, CheckCircle2, Shield } from 'lucide-react';
import { SupportingDocument } from '../../types/enterpriseProfileTypes';
import { SupportingDocumentUploadInput } from './SupportingDocumentUploadInput';

interface AttachDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'registration' | 'director' | 'shareholder' | 'signatory' | 'client' | 'profile';
  entityTitle: string;
  entitySubtitle?: string;
  initialDocuments: SupportingDocument[];
  onSave: (updatedDocs: SupportingDocument[]) => void;
  onPreview?: (doc: SupportingDocument) => void;
}

export const AttachDocumentModal: React.FC<AttachDocumentModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityTitle,
  entitySubtitle,
  initialDocuments,
  onSave,
  onPreview
}) => {
  const [documents, setDocuments] = useState<SupportingDocument[]>(initialDocuments || []);

  if (!isOpen) return null;

  const getEntityTypeName = () => {
    switch (entityType) {
      case 'registration':
        return 'Statutory Registration';
      case 'director':
        return 'Board Director';
      case 'shareholder':
        return 'Shareholder Record';
      case 'signatory':
        return 'Authorized Signatory';
      case 'client':
        return 'Client / Employer';
      case 'profile':
        return 'Corporate Profile';
    }
  };

  const getCategoryDefault = () => {
    switch (entityType) {
      case 'registration':
        return 'Statutory Certificate';
      case 'director':
        return 'Identification & Form 20';
      case 'shareholder':
        return 'Share Certificate';
      case 'signatory':
        return 'Board Resolution';
      case 'client':
        return 'Contract Agreement';
      case 'profile':
        return 'Corporate Document';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(documents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                {getEntityTypeName()}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-1">
              Attach Supporting Documents
            </h3>
            <p className="text-xs text-slate-400">
              {entityTitle} {entitySubtitle && `• ${entitySubtitle}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <SupportingDocumentUploadInput
            documents={documents}
            onDocumentsChange={setDocuments}
            label="Upload Supporting Files"
            helperText="Supports PDF scans, images (PNG, JPG), or contract documentation."
            categoryDefault={getCategoryDefault()}
            allowMultiple={true}
            idPrefix={`attach-${entityType}`}
            onPreview={onPreview}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs sm:text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              Save Attached Documents ({documents.length})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
