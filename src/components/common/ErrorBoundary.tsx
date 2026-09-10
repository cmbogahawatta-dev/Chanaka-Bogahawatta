import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Applet ErrorBoundary] Uncaught runtime exception caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear ONLY transient UI caches, explicitly preserving all business data
      const preservedPrefixes = [
        'ema_petty_',
        'ema_fleet_',
        'ema_staff_',
        'ema_erp_',
        'ema_payment_',
        'ema_invoice_',
        'ema_doc_',
        'ema_procure_'
      ];

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const isBusinessData = preservedPrefixes.some(prefix => key.startsWith(prefix));
          // Only clear temporary caches or UI error state
          if (!isBusinessData || key.includes('_cache_') || key.includes('_temp_')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing temporary cache:', e);
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'An unexpected runtime error occurred.';
      const errorStack = this.state.error?.stack || this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Application Encountered an Issue
                </h1>
                <p className="text-xs text-slate-400">
                  The system caught an unexpected exception. Your underlying data is preserved safely.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-rose-300 space-y-1 overflow-x-auto max-h-48 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                <span>{errorMessage}</span>
              </div>
              {errorStack && (
                <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap leading-relaxed mt-2">
                  {errorStack.slice(0, 500)}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                Clear Temporary Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

