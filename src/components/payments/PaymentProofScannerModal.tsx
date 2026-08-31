import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  RotateCw,
  Sliders,
  CheckCircle2,
  Upload,
  FileText,
  AlertCircle,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  CreditCard,
  Building2,
  Calendar,
  Lock
} from 'lucide-react';
import { usePRV } from '../../context/PRVContext';
import { PaymentProofDocument, PRVPaymentMethod, PaymentSource } from '../../types/prvTypes';

interface PaymentProofScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentProofScannerModal: React.FC<PaymentProofScannerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { targetPRVForAction, completePaymentWithProof } = usePRV();

  // Mode: 'camera' vs 'upload'
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');

  // Camera stream & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Captured Pages
  interface ScannedPage {
    id: string;
    originalDataUrl: string;
    enhancedDataUrl: string;
    filter: 'none' | 'bw' | 'grayscale' | 'contrast';
    rotation: number;
  }
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Filter & rotation for current active page
  const [currentFilter, setCurrentFilter] = useState<'none' | 'bw' | 'grayscale' | 'contrast'>('bw');
  const [currentRotation, setCurrentRotation] = useState<number>(0);

  // Metadata Form
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState<string>(
    targetPRVForAction?.paymentReference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [paymentMethod, setPaymentMethod] = useState<PRVPaymentMethod>(
    targetPRVForAction?.paymentMethod || 'Bank Transfer'
  );
  const [paymentSource, setPaymentSource] = useState<PaymentSource>(
    targetPRVForAction?.paymentSource || 'Bank Account'
  );
  const [bankAccount, setBankAccount] = useState<string>(
    'EMA Corporate Operations - FAB A/C #104829374619'
  );
  const [documentType, setDocumentType] = useState<PaymentProofDocument['documentType']>(
    'Bank Transfer Confirmation'
  );
  const [proofNotes, setProofNotes] = useState<string>('');

  // Start/Stop Camera
  useEffect(() => {
    if (!isOpen || activeMode !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode]);

  // Sync default values when target PRV changes
  useEffect(() => {
    if (targetPRVForAction) {
      if (targetPRVForAction.paymentReference) {
        setPaymentReference(targetPRVForAction.paymentReference);
      } else {
        setPaymentReference(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
      }
      if (targetPRVForAction.paymentMethod) {
        setPaymentMethod(targetPRVForAction.paymentMethod);
      }
      if (targetPRVForAction.paymentSource) {
        setPaymentSource(targetPRVForAction.paymentSource);
      }
    }
  }, [targetPRVForAction]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera error, falling back to basic stream', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr: any) {
        setCameraError(
          'Could not access camera device. You can upload payment proof receipt files directly via the "Upload Document" tab.'
        );
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Image Processing Filter application
  const applyFilterToImage = (
    dataUrl: string,
    filter: 'none' | 'bw' | 'grayscale' | 'contrast',
    rotation: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const isRotated90or270 = rotation === 90 || rotation === 270;
        canvas.width = isRotated90or270 ? img.height : img.width;
        canvas.height = isRotated90or270 ? img.width : img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        if (filter !== 'none') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (filter === 'grayscale') {
              data[i] = lum;
              data[i + 1] = lum;
              data[i + 2] = lum;
            } else if (filter === 'bw') {
              // High contrast B&W threshold
              const val = lum > 128 ? 255 : 0;
              data[i] = val;
              data[i + 1] = val;
              data[i + 2] = val;
            } else if (filter === 'contrast') {
              // High contrast color
              const factor = (259 * (128 + 255)) / (255 * (259 - 128));
              data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
              data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
              data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = dataUrl;
    });
  };

  // Capture Frame
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    const enhanced = await applyFilterToImage(rawDataUrl, currentFilter, currentRotation);

    const newPage: ScannedPage = {
      id: `pg-${Date.now()}`,
      originalDataUrl: rawDataUrl,
      enhancedDataUrl: enhanced,
      filter: currentFilter,
      rotation: currentRotation
    };

    setPages(prev => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  // Re-apply filter when user changes filter buttons
  const handleFilterChange = async (filter: 'none' | 'bw' | 'grayscale' | 'contrast') => {
    setCurrentFilter(filter);
    if (pages.length > 0 && pages[activePageIndex]) {
      const page = pages[activePageIndex];
      const newEnhanced = await applyFilterToImage(page.originalDataUrl, filter, page.rotation);
      setPages(prev =>
        prev.map((p, idx) => (idx === activePageIndex ? { ...p, filter, enhancedDataUrl: newEnhanced } : p))
      );
    }
  };

  // Rotate
  const handleRotate = async () => {
    const nextRot = (currentRotation + 90) % 360;
    setCurrentRotation(nextRot);
    if (pages.length > 0 && pages[activePageIndex]) {
      const page = pages[activePageIndex];
      const newEnhanced = await applyFilterToImage(page.originalDataUrl, page.filter, nextRot);
      setPages(prev =>
        prev.map((p, idx) => (idx === activePageIndex ? { ...p, rotation: nextRot, enhancedDataUrl: newEnhanced } : p))
      );
    }
  };

  // Delete page
  const handleDeletePage = (index: number) => {
    setPages(prev => prev.filter((_, idx) => idx !== index));
    if (activePageIndex >= pages.length - 1) {
      setActivePageIndex(Math.max(0, pages.length - 2));
    }
  };

  // Handle manual file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const raw = reader.result as string;
        const enhanced = await applyFilterToImage(raw, 'none', 0);
        const newPage: ScannedPage = {
          id: `pg-upload-${Date.now()}-${Math.random()}`,
          originalDataUrl: raw,
          enhancedDataUrl: enhanced,
          filter: 'none',
          rotation: 0
        };
        setPages(prev => [...prev, newPage]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Submit and Complete Payment
  const handleFinalSubmit = () => {
    if (!targetPRVForAction) return;

    if (pages.length === 0) {
      alert('Please scan or upload at least one payment proof document (e.g. Bank slip, wire confirmation, or signed receipt).');
      return;
    }

    if (!paymentReference.trim()) {
      alert('Please provide the Bank Transaction Reference / Cheque number.');
      return;
    }

    const primaryProofImage = pages[0].enhancedDataUrl;
    const fileName = `${targetPRVForAction.prvNumber}_Proof_${documentType.replace(/\s+/g, '_')}.jpg`;

    completePaymentWithProof(
      targetPRVForAction.id,
      {
        documentType,
        file: primaryProofImage,
        fileName,
        fileType: 'image/jpeg',
        capturedMethod: activeMode === 'camera' ? 'CAMERA_SCAN' : 'UPLOAD',
        notes: proofNotes.trim() || `Verified bank payment proof for ${targetPRVForAction.prvNumber}`,
        pagesCount: pages.length
      },
      {
        paymentDate,
        paymentReference: paymentReference.trim(),
        paymentMethod,
        paymentSource,
        bankAccount
      }
    );

    stopCamera();
    onClose();
  };

  if (!isOpen || !targetPRVForAction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  Payment Proof Capture & Completion
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold">
                  {targetPRVForAction.prvNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Amount: <strong className="text-emerald-400">{targetPRVForAction.currency} {targetPRVForAction.totalAmount.toLocaleString()}</strong> • Payee: <strong className="text-slate-200">{targetPRVForAction.payeeName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'camera'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera Scanner</span>
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMode === 'upload'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Audit Vault</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs text-slate-300">
          {/* LEFT: Viewfinder / Scanner Area (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            {activeMode === 'camera' ? (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center min-h-[300px]">
                {cameraError ? (
                  <div className="p-6 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                    <button
                      onClick={() => setActiveMode('upload')}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Switch to File Upload
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Live Video Feed */}
                    <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Optical Document Framing Overlay */}
                      <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <div className="flex justify-between items-start text-[10px] text-emerald-300 font-mono font-bold bg-slate-950/60 px-2 py-0.5 rounded w-fit">
                          ALIGN PAYMENT RECEIPT INSIDE FRAME
                        </div>
                        <div className="text-[10px] text-center text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded self-center">
                          Hold still & tap capture below
                        </div>
                      </div>
                    </div>

                    {/* Camera Controls */}
                    <div className="w-full p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-bold"
                        title="Flip Camera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>

                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg active:scale-95 text-xs"
                      >
                        <Camera className="w-4 h-4" />
                        <span>CAPTURE RECEIPT</span>
                      </button>

                      <div className="text-[10px] text-slate-400 font-mono">
                        {pages.length} Scanned
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Upload Mode Area */
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shadow-md">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-sm">Upload Bank Transfer Receipt or Cheque Copy</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Supported formats: PDF, JPG, PNG, WEBP. You can upload multiple pages.
                  </p>
                </div>

                <label className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Choose Receipt Files</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Scanned Pages Gallery & Enhancement Toolbar */}
            {pages.length > 0 && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Captured Document Pages ({pages.length})
                  </span>

                  {/* Image Enhancement Filters */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFilterChange('bw')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        currentFilter === 'bw'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Crisp Document Scan"
                    >
                      B&W Doc
                    </button>
                    <button
                      onClick={() => handleFilterChange('contrast')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        currentFilter === 'contrast'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Contrast
                    </button>
                    <button
                      onClick={() => handleFilterChange('none')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        currentFilter === 'none'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Color
                    </button>
                    <button
                      onClick={handleRotate}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnails row */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {pages.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`relative shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        activePageIndex === idx
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.enhancedDataUrl}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-center text-[9px] font-mono font-bold text-slate-300 py-0.5">
                        Page {idx + 1}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded bg-rose-900/90 text-rose-200 hover:bg-rose-800"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Payment Confirmation & Metadata Form (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/90">
            <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
              <CreditCard className="w-4 h-4" />
              <span className="uppercase tracking-wider text-[11px]">Payment Completion Data</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Payment Reference / Wire Ref # *
                </label>
                <input
                  type="text"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. FAB-TXN-982144 / CHQ-009182"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PRVPaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Card">Company Card</option>
                    <option value="Online Payment">Online Portal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Payment Source *</label>
                  <select
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value as PaymentSource)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Company Credit Card">Company Credit Card</option>
                    <option value="Owner Payment">Owner Payment</option>
                    <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bank Account</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Proof Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="Bank Transfer Confirmation">Bank Transfer Confirmation</option>
                  <option value="Payment Receipt">Official Payment Receipt</option>
                  <option value="Cheque">Cheque Leaf Copy</option>
                  <option value="Cash Voucher">Signed Cash Voucher</option>
                  <option value="Online Banking Confirmation">Online Banking Confirmation</option>
                  <option value="Other">Other Proof Document</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Verification Notes</label>
                <textarea
                  rows={2}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="e.g. Scanned official wire slip from FAB mobile banking app with confirmation code."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Auto-Posting Info Badge */}
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 space-y-1 mt-2">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Automatic Project Expense Posting</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Submitting this proof will mark <strong>{targetPRVForAction.prvNumber}</strong> as <strong className="text-emerald-400">PAID</strong> and automatically post a Project Expense in <strong>{targetPRVForAction.projectCode}</strong> under <strong>{targetPRVForAction.expenseCategory}</strong> with payment source <em>{paymentSource}</em>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Payment: <strong className="text-emerald-400">{targetPRVForAction.currency} {targetPRVForAction.totalAmount.toLocaleString()}</strong> ({targetPRVForAction.payeeName})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={pages.length === 0}
              className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                pages.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Payment & Post Expense</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
