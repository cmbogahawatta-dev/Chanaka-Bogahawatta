import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCheck,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Letter, CorrespondenceAttachment } from '../../types/correspondenceTypes';
import { useEnterpriseCorrespondence } from '../../context/EnterpriseCorrespondenceContext';
import { readWordDocumentFile, WordImportResult } from '../../services/export/wordImportService';

interface CorrespondenceAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter: Letter;
}

export const CorrespondenceAttachmentModal: React.FC<CorrespondenceAttachmentModalProps> = ({
  isOpen,
  onClose,
  letter
}) => {
  const { addAttachmentToLetter, removeAttachmentFromLetter, updateLetter } = useEnterpriseCorrespondence();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedWord, setParsedWord] = useState<WordImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [category, setCategory] = useState<CorrespondenceAttachment['category']>('MODIFIED_WORD_DOC');
  const [notes, setNotes] = useState<string>('Modified in Microsoft Office Word');
  const [syncToBody, setSyncToBody] = useState<boolean>(true);
  const [showTextPreview, setShowTextPreview] = useState<boolean>(false);
  const [previewingAttachment, setPreviewingAttachment] = useState<CorrespondenceAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const currentAttachments = letter.attachments || [];

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setParsedWord(null);

    const isWord =
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc') ||
      file.type.includes('word') ||
      file.type.includes('officedocument');

    if (isWord) {
      setCategory('MODIFIED_WORD_DOC');
      setNotes(`Revised via MS Office Word on ${new Date().toLocaleDateString()}`);
      try {
        setIsProcessing(true);
        const res = await readWordDocumentFile(file);
        setParsedWord(res);
      } catch (err: any) {
        console.warn('Could not parse Word document content:', err);
      } finally {
        setIsProcessing(false);
      }
    } else if (file.name.endsWith('.pdf')) {
      setCategory('SIGNED_SCAN');
      setNotes('Signed & stamped PDF copy');
      setSyncToBody(false);
    } else {
      setCategory('SUPPORTING_DOC');
      setNotes('Supporting annexure/document');
      setSyncToBody(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a file to attach.');
      return;
    }

    try {
      setIsProcessing(true);

      // Convert file to dataUrl if not already parsed
      let dataUrl = parsedWord?.dataUrl;
      if (!dataUrl) {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed reading file'));
          reader.readAsDataURL(selectedFile);
        });
      }

      // 1. Add attachment to letter
      addAttachmentToLetter(letter.id, {
        letterId: letter.id,
        name: selectedFile.name,
        size: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
        uploadedBy: 'Executive Secretariat',
        category,
        description: notes,
        dataUrl,
        wordExtractedText: parsedWord?.rawText,
        versionTagged: letter.version
      });

      // 2. Optionally update letter body if modified in Word
      if (syncToBody && parsedWord?.html && parsedWord.html.trim()) {
        updateLetter(
          letter.id,
          { bodyHtml: parsedWord.html },
          `Imported revised text from MS Word document (${selectedFile.name})`,
          'Executive Secretariat'
        );
      }

      // Reset form
      setSelectedFile(null);
      setParsedWord(null);
      setNotes('');
      setShowTextPreview(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to attach file');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadAttachment = (att: CorrespondenceAttachment) => {
    if (!att.dataUrl) return;
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              W
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Document Correspondence & MS Word Attachments
              </h3>
              <p className="text-xs text-slate-400">
                Link modified Word letters & official document annexures to{' '}
                <span className="text-blue-400 font-mono font-semibold">{letter.letterNumber}</span>
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

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Upload Drop Zone */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800/30 hover:bg-slate-800/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,.pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatFileSize(selectedFile.size)} •{' '}
                      {selectedFile.name.endsWith('.docx') ? 'MS Office Word Document' : selectedFile.type}
                    </p>
                  </div>
                  <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 mt-1">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Upload Modified Word Document (.docx) or Annexure
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Drag and drop your edited MS Word file here, or click to browse
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>Supported: .docx (Word), .pdf, .doc, images</span>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Word Document Detected Banner & Sync Option */}
            {parsedWord && (
              <div className="p-4 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                      W
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-200">
                        Microsoft Word Document Detected
                      </h4>
                      <p className="text-[11px] text-blue-400">
                        Extracted {parsedWord.rawText.split(/\s+/).filter(Boolean).length} words from document
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTextPreview(!showTextPreview)}
                    className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showTextPreview ? 'Hide Extracted Text' : 'Preview Extracted Text'}
                    {showTextPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showTextPreview && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg max-h-44 overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {parsedWord.rawText || 'No text extracted.'}
                  </div>
                )}

                {/* Option to sync Word text into live letter */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncToBody}
                    onChange={(e) => setSyncToBody(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      Update system letter body with modified Word text
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Replaces the current letter draft text with this Word document's text and bumps version to v{letter.version + 1}.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Metadata Fields */}
            {selectedFile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Correspondence Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="MODIFIED_WORD_DOC">Modified MS Word Letter (.docx)</option>
                    <option value="SIGNED_SCAN">Signed & Sealed Scan (.pdf)</option>
                    <option value="TECHNICAL_ANNEXURE">Technical Annexure / Drawing</option>
                    <option value="SUPPORTING_DOC">Supporting Document / Transmittal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Revision Note / Remarks
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Revised Clause 4.2 per Engineer"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedFile && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedWord(null);
                  }}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel Selection
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isProcessing ? 'Processing & Attaching...' : 'Attach as Document Correspondence'}
                </button>
              </div>
            )}
          </form>

          {/* Current Attached Documents Section */}
          <div className="border-t border-slate-800 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Attached Documents & Correspondence Enclosures ({currentAttachments.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Permanently linked to this record</span>
            </h4>

            {currentAttachments.length === 0 ? (
              <div className="py-6 text-center bg-slate-800/30 rounded-xl border border-slate-800/50">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-400">No external documents or Word files attached yet.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Export this letter to MS Word, make your edits, and upload the modified file above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          att.name.endsWith('.docx') || att.category === 'MODIFIED_WORD_DOC'
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : att.name.endsWith('.pdf')
                            ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {att.name.endsWith('.docx') ? 'W' : att.name.endsWith('.pdf') ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-slate-200 truncate">{att.name}</p>
                          <span className="text-[10px] bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                            {formatFileSize(att.size)}
                          </span>
                          {att.category === 'MODIFIED_WORD_DOC' && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                              Word Rev
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {att.description || 'Attached correspondence'} • Uploaded by {att.uploadedBy} on{' '}
                          {new Date(att.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {att.wordExtractedText && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewingAttachment(previewingAttachment?.id === att.id ? null : att)
                          }
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                          title="Preview Extracted Text"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {att.dataUrl && (
                        <button
                          type="button"
                          onClick={() => downloadAttachment(att)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                          title="Download Attached Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeAttachmentFromLetter(letter.id, att.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors"
                        title="Delete Attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Extracted text preview modal/sheet */}
            {previewingAttachment && previewingAttachment.wordExtractedText && (
              <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Previewing content of {previewingAttachment.name}
                  </span>
                  <button
                    onClick={() => setPreviewingAttachment(null)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg max-h-48 overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {previewingAttachment.wordExtractedText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-800/60 border-t border-slate-700/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Official Document Correspondence • Audit Logged
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
