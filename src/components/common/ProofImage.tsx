import React, { useState, useEffect } from 'react';
import { resolveProofDocument, resolveProofDocumentSync } from '../../services/pettyCashStorage';
import { Image as ImageIcon } from 'lucide-react';

interface ProofImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackText?: string;
}

export const ProofImage: React.FC<ProofImageProps> = ({
  src,
  alt = 'Proof Document',
  className = '',
  fallbackText = 'Receipt Attachment',
  ...rest
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(() => {
    if (!src) return undefined;
    return resolveProofDocumentSync(src) || (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:') ? src : undefined);
  });
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!src) return false;
    return !imgSrc && (src.startsWith('idb:') || src.startsWith('attachment:') || src.startsWith('att-'));
  });

  useEffect(() => {
    if (!src) {
      setImgSrc(undefined);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Direct synchronous hit
    const syncRes = resolveProofDocumentSync(src);
    if (syncRes) {
      setImgSrc(syncRes);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
      setImgSrc(src);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    resolveProofDocument(src)
      .then((resolved) => {
        if (isMounted) {
          setImgSrc(resolved);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 text-xs text-center ${className}`}>
        <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
        <span className="truncate max-w-[150px]">{fallbackText}</span>
      </div>
    );
  }

  if (isLoading && !imgSrc) {
    return (
      <div className={`animate-pulse bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs min-h-[80px] ${className}`}>
        <ImageIcon className="w-4 h-4 animate-spin mr-1.5 opacity-60" />
        <span>Loading receipt...</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc || src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};
