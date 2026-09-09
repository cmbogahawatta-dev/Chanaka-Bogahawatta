import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import './index.css';

// Safety shim for libraries expecting process.env in browser
if (typeof window !== 'undefined') {
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

// Global safety catchers for unhandled rejections or iframe communication anomalies
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Log softly without breaking application rendering
    console.warn('[Global Unhandled Rejection Caught]:', event.reason);
  });

  window.addEventListener('error', (event) => {
    // Log softly for non-fatal window errors
    console.warn('[Global Window Error Caught]:', event.error || event.message);
  });
}

// Register PWA Service Worker if supported in production
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Boolean((import.meta as any)?.env?.PROD)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration skipped:', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

