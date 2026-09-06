import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, HardDrive, Plus, Eye } from 'lucide-react';
import { SupportingDocument } from '../../types/enterpriseProfileTypes';

interface SupportingDocumentUploadInputProps {
  documents: SupportingDocument[];
  onDocumentsChange: (docs: SupportingDocument[]) => void;
  label?: string;
  helperText?: string;
  categoryDefault?: string;
  allowMultiple?: boolean;
  compact?: boolean;
  idPrefix?: string;
  onPreview?: (doc: SupportingDocument) => void;
}

export const SupportingDocumentUploadInput: React.FC<SupportingDocumentUploadInputProps> = ({
  documents,
  onDocumentsChange,
  label = 'Supporting Documents & Proof',
  helperText = 'Upload PDF certificates, scans, NIC/Passport copies, or contracts (Max 10MB each)',
  categoryDefault = 'Supporting Document',
  allowMultiple = true,
  compact = false,
  idPrefix = 'supp-doc',
  onPreview
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [docDescription, setDocDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newDoc: SupportingDocument = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          fileSize: formatFileSize(file.size),
          fileType: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString().slice(0, 10),
          category: categoryDefault,
          description: docDescription.trim() || undefined
        };

        if (allowMultiple) {
          onDocumentsChange([...documents, newDoc]);
        } else {
          onDocumentsChange([newDoc]);
        }
        setDocDescription('');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    onDocumentsChange(documents.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300">
            {label}
          </label>
          <span className="text-[11px] text-slate-500 font-mono">
            {documents.length} attached
          </span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          compact ? 'p-3' : 'p-4'
        } ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-slate-900/70 text-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          id={`${idPrefix}-file-input`}
          type="file"
          multiple={allowMultiple}
          accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center justify-center gap-3 text-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-400 font-semibold underline underline-offset-2">
                Click to browse
              </span>
              <span className="text-slate-400">or drag & drop supporting file</span>
            </div>
            {helperText && <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>}
          </div>
        </div>
      </div>

      {/* Attached Documents List */}
      {documents.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-2 p-2 bg-slate-800/80 border border-slate-700/70 rounded-lg text-xs hover:border-slate-600 transition-colors"
            >
              <div
                className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                onClick={() => onPreview && onPreview(doc)}
                title="Click to preview document"
              >
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-200 truncate hover:text-emerald-300">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {doc.fileSize && <span>{doc.fileSize}</span>}
                    {doc.uploadedAt && <span>• {doc.uploadedAt}</span>}
                    {doc.category && (
                      <span className="text-emerald-400 font-medium">[{doc.category}]</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {onPreview && (
                  <button
                    type="button"
                    onClick={() => onPreview(doc)}
                    className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={e => handleRemove(doc.id, e)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  title="Remove Document"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
