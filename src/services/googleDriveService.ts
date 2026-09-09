/**
 * Google Drive Integration Service
 * Provides secure OAuth token handling (in-memory / sessionStorage, NEVER localStorage)
 * and Drive API v3 operations for Correspondence document control.
 */

// In-memory token store (Never stored in localStorage as per strict security rules)
let inMemoryAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface GoogleDriveConfigStatus {
  isConfigured: boolean;
  clientId?: string;
  hasActiveSessionToken: boolean;
  message?: string;
}

/**
 * Checks whether Google OAuth / Drive integration credentials are configured.
 */
export function isGoogleDriveConfigured(): boolean {
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  return Boolean(clientId && String(clientId).trim().length > 0);
}

/**
 * Returns configuration status.
 */
export function getGoogleDriveConfigStatus(): GoogleDriveConfigStatus {
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(clientId && String(clientId).trim().length > 0);
  const hasActive = Boolean(inMemoryAccessToken && Date.now() < tokenExpiresAt);

  return {
    isConfigured,
    clientId: isConfigured ? String(clientId) : undefined,
    hasActiveSessionToken: hasActive,
    message: isConfigured
      ? 'Google Workspace OAuth configured.'
      : 'Google Docs integration is not configured.'
  };
}

/**
 * Set session token safely in memory (and sessionStorage only if needed, never localStorage)
 */
export function setSessionGoogleToken(token: string, expiresInSeconds: number = 3600): void {
  inMemoryAccessToken = token;
  tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
  try {
    sessionStorage.setItem('_g_sess_active', 'true');
  } catch {}
}

/**
 * Clears active session token.
 */
export function clearSessionGoogleToken(): void {
  inMemoryAccessToken = null;
  tokenExpiresAt = 0;
  try {
    sessionStorage.removeItem('_g_sess_active');
  } catch {}
}

/**
 * Retrieves an active access token using Google Identity Services (GSI) or in-memory session.
 * Throws a descriptive user error if credentials are not configured.
 */
export async function getGoogleAccessToken(interactive: boolean = true): Promise<string> {
  // Check in-memory validity
  if (inMemoryAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return inMemoryAccessToken;
  }

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || !String(clientId).trim()) {
    throw new Error('Google Docs integration is not configured.');
  }

  // Ensure Google Identity Services script is available or loaded
  if (typeof window === 'undefined') {
    throw new Error('Google Docs integration is only available in browser environments.');
  }

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    // Attempt dynamic load if script not yet inserted
    await new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('gsi-client-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services library.')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
      document.head.appendChild(script);
    });
  }

  return new Promise<string>((resolve, reject) => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file',
        callback: (resp: any) => {
          if (resp.error) {
            reject(new Error(`Google authentication failed: ${resp.error_description || resp.error}`));
            return;
          }
          if (resp.access_token) {
            const expiresIn = resp.expires_in ? Number(resp.expires_in) : 3600;
            setSessionGoogleToken(resp.access_token, expiresIn);
            resolve(resp.access_token);
          } else {
            reject(new Error('Failed to obtain Google access token.'));
          }
        }
      });

      if (interactive) {
        client.requestAccessToken({ prompt: '' });
      } else {
        client.requestAccessToken({ prompt: 'none' });
      }
    } catch (err: any) {
      reject(new Error(err?.message || 'Google authentication error.'));
    }
  });
}

/**
 * Fetches file metadata from Google Drive API v3
 */
export async function getDriveFileMetadata(fileId: string): Promise<{
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}> {
  const token = await getGoogleAccessToken(true);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime,webViewLink`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive API error: ${res.status} - ${errText}`);
  }

  return await res.json();
}

/**
 * Exports a Google Docs or Drive file as specific MIME type (e.g. PDF or DOCX)
 */
export async function exportDriveFileAsBlob(fileId: string, mimeType: string): Promise<Blob> {
  const token = await getGoogleAccessToken(true);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(mimeType)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive export failed: ${res.status} - ${errText}`);
  }

  return await res.blob();
}
