import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  Apple,
  Play,
  Sparkles,
  Share2
} from 'lucide-react';

interface PWAInstallBannerProps {
  onOpenPublishModal: (tab: 'android' | 'ios' | 'pwa' | 'export' | 'preview') => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenPublishModal }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently
    const dismissed = sessionStorage.getItem('fleettrack_pwa_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Open the visual installation & publish guide modal
      onOpenPublishModal(isIOS ? 'ios' : 'android');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('fleettrack_pwa_banner_dismissed', 'true');
  };

  if (isInstalled || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-500/20 px-3 py-2 text-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white truncate">Install FleetTrack Mobile App</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">
                iOS & Android
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Add to Home Screen or publish to Apple App Store & Google Play Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install / Publish</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
