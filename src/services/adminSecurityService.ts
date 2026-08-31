/**
 * Admin Security Verification Service for EMA Enterprise Suite
 * Secure SHA-256 hashing and session management for Data Import & Migration
 */

// Supported Admin Security Code Hashes (SHA-256 in lowercase hex)
// Pre-computed hashes for authorized enterprise passcodes (normalized uppercase input)
const KNOWN_ADMIN_CODE_HASHES = new Set<string>([
  '0791b8d57f5299c49265b2e5343b51e935c3b30e760ca38ed286d3680e83acfd',
  '64e48f3bf07307f751c02213b95e0b5e1e8351597dfbe12bce5cbf115591ce3f',
  'f64ea5c6cec61b664c8d31d6e28f73bec4f132afc8499961c35fb662f950f9be',
  'e87a060ac260ed4c65bf0e9d933c5c19025642fdb108aad3a242e772cc3a3b2f',
  'd7a39993b089ffd2470da9d6b9498dce9bfa170901bda586b179f2b33c91f890',
  'ef295df92ef4c4c5fd84f72f40ad30389f781aa78bb65e372187035b4ed223e0',
  '1ade942a8448f36f19ea477cb578d43ed34541d7599fb2218a287bb785706b1b',
]);

const SESSION_AUTH_KEY = 'ema_admin_data_import_auth_session_v1';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour session

/**
 * Computes SHA-256 hash using crypto.subtle.
 * Enforces fail-closed behavior if Web Crypto API is unavailable.
 */
async function hashStringSha256(str: string): Promise<string | null> {
  const normalized = str.trim().toUpperCase();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return null;
    }
  }
  // Fail-closed: do not allow weak or unverified fallback hashes
  return null;
}

export class AdminSecurityService {
  /**
   * Verify the admin security code against valid secure credentials
   */
  static async verifyCode(inputCode: string): Promise<{ success: boolean; message: string; sessionToken?: string }> {
    if (!inputCode || !inputCode.trim()) {
      return { success: false, message: 'Admin Security Code is required.' };
    }

    const inputHash = await hashStringSha256(inputCode);
    if (!inputHash) {
      return {
        success: false,
        message: 'Cryptographic verification unavailable or failed in this environment. Access denied.'
      };
    }

    const isValid = KNOWN_ADMIN_CODE_HASHES.has(inputHash);

    if (isValid) {
      const token = `sess_adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const sessionData = {
        token,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY_MS
      };
      sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(sessionData));
      return {
        success: true,
        message: 'Admin security verification successful.',
        sessionToken: token
      };
    }

    return {
      success: false,
      message: 'Invalid Admin Security Code. Access denied.'
    };
  }

  /**
   * Check if current browser session has active valid admin verification
   */
  static isSessionVerified(): boolean {
    try {
      const saved = sessionStorage.getItem(SESSION_AUTH_KEY);
      if (!saved) return false;
      const data = JSON.parse(saved);
      if (Date.now() > data.expiresAt) {
        sessionStorage.removeItem(SESSION_AUTH_KEY);
        return false;
      }
      return Boolean(data.token);
    } catch {
      return false;
    }
  }

  static isVerified(): boolean {
    return this.isSessionVerified();
  }

  /**
   * Clear verified session upon logout or security lock
   */
  static clearSession(): void {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }
}

export const adminSecurityService = AdminSecurityService;

