/**
 * Admin Security Verification & Key Management Service
 * EMA Enterprise Suite / FleetTrack Platform
 * 
 * IMPORTANT ARCHITECTURAL SECURITY NOTICE:
 * Client-side authentication is not sufficient for high-security production authorization.
 * A backend authentication and authorization service is required for tamper-resistant security.
 * 
 * This service implements:
 * 1. SHA-256 salted cryptographic one-way hashing using Web Crypto API
 * 2. Zero hardcoded master passwords or bypass PINs (no 1234, no hardcoded admin hashes)
 * 3. Owner/Admin initial setup with strong key enforcement
 * 4. Controlled failed-attempt tracking & progressive temporary lockout (5 attempts -> 5 min lockout)
 * 5. Comprehensive security audit logging with sanitization (never logs raw keys or hashes)
 * 6. Fail-closed verification behavior
 */

export type SecurityActionType =
  | 'SECURITY_KEY_CREATED'
  | 'SECURITY_KEY_CHANGED'
  | 'SECURITY_KEY_RESET_REQUESTED'
  | 'SECURITY_AUTH_SUCCESS'
  | 'SECURITY_AUTH_FAILED'
  | 'SECURITY_ACTION_BLOCKED'
  | 'ADMIN_OVERRIDE'
  | 'PAYROLL_OVERRIDE'
  | 'ATTENDANCE_OVERRIDE'
  | 'GEOFENCE_CHANGED'
  | 'STAFF_MASTER_DATA_RESET'
  | 'HISTORY_CLEARED';

export interface SecurityAuditEvent {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: SecurityActionType;
  targetRecord?: string;
  result: 'SUCCESS' | 'FAILED' | 'BLOCKED';
  timestamp: string;
  reason?: string;
}

interface StoredSecurityCredential {
  salt: string;
  hash: string;
  createdAt: string;
  lastChangedAt: string;
  configured: boolean;
}

interface FailedAttemptTracker {
  attempts: number;
  lastAttemptTime: number;
  lockoutUntil: number;
}

const STORAGE_KEY_CREDENTIAL = 'ema_enterprise_admin_security_cred_v2';
const STORAGE_KEY_AUDIT_LOGS = 'ema_enterprise_security_audit_logs_v2';
const STORAGE_KEY_FAILED_TRACKER = 'ema_security_failed_tracker_v2';
const SESSION_AUTH_KEY = 'ema_admin_security_verified_session_v2';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour verified session

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes lockout

const WEAK_KEYS_BLACKLIST = new Set<string>([
  '1234',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '0000',
  '000000',
  '1111',
  '111111',
  'password',
  'admin',
  'admin123',
  'qwerty',
  '123123',
  '654321',
  '012345',
  '112233'
]);

/**
 * Generate a cryptographically secure random 16-byte hex salt
 */
function generateSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback pseudorandom hex for non-standard environments
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Computes SHA-256 hash using Web Crypto API.
 * Enforces fail-closed behavior if cryptographic subsystem is unavailable.
 */
async function computeSha256(dataString: string): Promise<string | null> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return null;
    }
  }
  return null;
}

export class AdminSecurityService {
  /**
   * Check if an Admin Security Key has been initialized and configured
   */
  static hasSecurityKey(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CREDENTIAL);
      if (!raw) return false;
      const cred: StoredSecurityCredential = JSON.parse(raw);
      return Boolean(cred.configured && cred.salt && cred.hash);
    } catch {
      return false;
    }
  }

  /**
   * Validates key strength:
   * - 6 to 20 characters
   * - Not in weak/common keys list
   * - Not all identical characters
   */
  static validateKeyStrength(key: string): { valid: boolean; message?: string } {
    const trimmed = (key || '').trim();
    if (!trimmed) {
      return { valid: false, message: 'Security key is required.' };
    }
    if (trimmed.length < 6) {
      return { valid: false, message: 'Security key must be at least 6 characters or digits in length.' };
    }
    if (trimmed.length > 20) {
      return { valid: false, message: 'Security key cannot exceed 20 characters.' };
    }
    if (WEAK_KEYS_BLACKLIST.has(trimmed.toLowerCase())) {
      return { valid: false, message: 'Weak security key rejected. Please choose a stronger combination.' };
    }
    // Check if all characters are the same
    if (/^(.)\1+$/.test(trimmed)) {
      return { valid: false, message: 'Repeated single-character keys (e.g. 111111) are not permitted.' };
    }
    return { valid: true };
  }

  /**
   * Initialize a new Admin Security Key (First-time setup by Owner/Admin)
   */
  static async initializeSecurityKey(
    key: string,
    user?: { id?: string; name?: string; role?: string }
  ): Promise<{ success: boolean; message: string }> {
    const strengthCheck = this.validateKeyStrength(key);
    if (!strengthCheck.valid) {
      return { success: false, message: strengthCheck.message || 'Invalid security key.' };
    }

    const salt = generateSalt();
    const hash = await computeSha256(`${salt}:${key.trim()}`);
    if (!hash) {
      return {
        success: false,
        message: 'Cryptographic subsystem unavailable. Failed to generate secure credential.'
      };
    }

    const now = new Date().toISOString();
    const cred: StoredSecurityCredential = {
      salt,
      hash,
      createdAt: now,
      lastChangedAt: now,
      configured: true
    };

    localStorage.setItem(STORAGE_KEY_CREDENTIAL, JSON.stringify(cred));

    // Reset failed tracker
    this.resetFailedTracker();

    // Establish immediate session
    this.setSessionVerified();

    // Audit Log
    this.recordAuditEvent({
      userId: user?.id || 'admin-usr',
      userName: user?.name || 'Enterprise Administrator',
      userRole: user?.role || 'ADMIN',
      action: 'SECURITY_KEY_CREATED',
      targetRecord: 'AdminSecurityCredential',
      result: 'SUCCESS',
      reason: 'Owner established initial cryptographic Admin Security Key.'
    });

    return {
      success: true,
      message: 'Security Key Created Successfully.'
    };
  }

  /**
   * Verify an entered Security Key against the securely stored salted hash.
   * Tracks failed attempts and triggers temporary lockout on repeated failures.
   */
  static async verifySecurityKey(
    inputKey: string,
    actionName: string = 'Administrative Action',
    user?: { id?: string; name?: string; role?: string }
  ): Promise<{
    success: boolean;
    message: string;
    sessionToken?: string;
    isLockedOut?: boolean;
    lockoutRemainingSeconds?: number;
  }> {
    const tracker = this.getFailedTracker();
    const now = Date.now();

    // Check if locked out
    if (tracker.lockoutUntil > now) {
      const remainingSec = Math.ceil((tracker.lockoutUntil - now) / 1000);
      this.recordAuditEvent({
        userId: user?.id || 'unknown-usr',
        userName: user?.name || 'User',
        userRole: user?.role || 'UNKNOWN',
        action: 'SECURITY_ACTION_BLOCKED',
        targetRecord: actionName,
        result: 'BLOCKED',
        reason: `Temporary security lockout active (${remainingSec}s remaining).`
      });
      return {
        success: false,
        message: `Security authorization is temporarily locked due to repeated failed attempts. Please retry in ${remainingSec} seconds.`,
        isLockedOut: true,
        lockoutRemainingSeconds: remainingSec
      };
    }

    if (!inputKey || !inputKey.trim()) {
      return { success: false, message: 'Please enter your Admin Security Key.' };
    }

    // Check if security key is configured
    const raw = localStorage.getItem(STORAGE_KEY_CREDENTIAL);
    if (!raw) {
      return {
        success: false,
        message: 'Security Key has not been established. An Administrator must create the initial Security Key.'
      };
    }

    let cred: StoredSecurityCredential;
    try {
      cred = JSON.parse(raw);
    } catch {
      return { success: false, message: 'Security credential storage corrupted. Please re-initialize.' };
    }

    if (!cred.configured || !cred.salt || !cred.hash) {
      return { success: false, message: 'Security Key is not configured.' };
    }

    // Compute hash with stored salt
    const computedHash = await computeSha256(`${cred.salt}:${inputKey.trim()}`);
    if (!computedHash) {
      return {
        success: false,
        message: 'Cryptographic engine error during verification. Access denied.'
      };
    }

    if (computedHash === cred.hash) {
      // SUCCESS: Clear failures, set session, log audit
      this.resetFailedTracker();
      const token = this.setSessionVerified();

      this.recordAuditEvent({
        userId: user?.id || 'admin-usr',
        userName: user?.name || 'Administrator',
        userRole: user?.role || 'ADMIN',
        action: 'SECURITY_AUTH_SUCCESS',
        targetRecord: actionName,
        result: 'SUCCESS',
        reason: `Authorized action: ${actionName}`
      });

      return {
        success: true,
        message: 'Admin security verification successful.',
        sessionToken: token
      };
    }

    // FAILURE: Increment failed attempts
    const newAttempts = (tracker.attempts || 0) + 1;
    let lockoutUntil = 0;
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      lockoutUntil = now + LOCKOUT_DURATION_MS;
    }

    this.saveFailedTracker({
      attempts: newAttempts,
      lastAttemptTime: now,
      lockoutUntil
    });

    this.recordAuditEvent({
      userId: user?.id || 'unknown-usr',
      userName: user?.name || 'User',
      userRole: user?.role || 'UNKNOWN',
      action: newAttempts >= MAX_FAILED_ATTEMPTS ? 'SECURITY_ACTION_BLOCKED' : 'SECURITY_AUTH_FAILED',
      targetRecord: actionName,
      result: 'FAILED',
      reason: newAttempts >= MAX_FAILED_ATTEMPTS
        ? `5 failed authorization attempts reached. 5-minute lockout engaged.`
        : `Incorrect Security Key attempt (${newAttempts}/${MAX_FAILED_ATTEMPTS}).`
    });

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        success: false,
        message: 'Too many incorrect attempts. Security authorization locked for 5 minutes.',
        isLockedOut: true,
        lockoutRemainingSeconds: 300
      };
    }

    return {
      success: false,
      message: `Invalid Admin Security Key. (${MAX_FAILED_ATTEMPTS - newAttempts} attempt(s) remaining before temporary lockout).`
    };
  }

  /**
   * Compatibility alias for verifySecurityKey
   */
  static async verifyCode(
    code: string,
    actionName: string = 'Data Import & Migration',
    user?: { id?: string; name?: string; role?: string }
  ): Promise<{ success: boolean; message: string; sessionToken?: string }> {
    return this.verifySecurityKey(code, actionName, user);
  }

  /**
   * Change Security Key (Requires verifying current key first)
   */
  static async changeSecurityKey(
    currentKey: string,
    newKey: string,
    confirmNewKey: string,
    user?: { id?: string; name?: string; role?: string }
  ): Promise<{ success: boolean; message: string }> {
    if (!currentKey || !currentKey.trim()) {
      return { success: false, message: 'Current Security Key is required.' };
    }
    if (newKey !== confirmNewKey) {
      return { success: false, message: 'New Security Key and Confirmation Key do not match.' };
    }

    const strengthCheck = this.validateKeyStrength(newKey);
    if (!strengthCheck.valid) {
      return { success: false, message: strengthCheck.message || 'Invalid new security key.' };
    }

    // Verify current key
    const currentVerification = await this.verifySecurityKey(currentKey, 'Change Security Key', user);
    if (!currentVerification.success) {
      return { success: false, message: 'Current Security Key verification failed. Access denied.' };
    }

    // Create new salt and hash
    const newSalt = generateSalt();
    const newHash = await computeSha256(`${newSalt}:${newKey.trim()}`);
    if (!newHash) {
      return { success: false, message: 'Cryptographic hash calculation failed.' };
    }

    const raw = localStorage.getItem(STORAGE_KEY_CREDENTIAL);
    const existing = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();

    const updatedCred: StoredSecurityCredential = {
      salt: newSalt,
      hash: newHash,
      createdAt: existing.createdAt || now,
      lastChangedAt: now,
      configured: true
    };

    localStorage.setItem(STORAGE_KEY_CREDENTIAL, JSON.stringify(updatedCred));

    // Clear and renew session
    this.clearSession();
    this.setSessionVerified();

    this.recordAuditEvent({
      userId: user?.id || 'admin-usr',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'ADMIN',
      action: 'SECURITY_KEY_CHANGED',
      targetRecord: 'AdminSecurityCredential',
      result: 'SUCCESS',
      reason: 'Admin Security Key changed and previous credential invalidated.'
    });

    return {
      success: true,
      message: 'Admin Security Key updated successfully. Previous key has been invalidated.'
    };
  }

  /**
   * Request Security Key Reset (Authenticated Admin/Owner recovery)
   * With clear notice that secure account recovery requires backend authentication.
   */
  static async requestSecurityKeyReset(
    user?: { id?: string; name?: string; role?: string }
  ): Promise<{ success: boolean; message: string }> {
    localStorage.removeItem(STORAGE_KEY_CREDENTIAL);
    this.clearSession();
    this.resetFailedTracker();

    this.recordAuditEvent({
      userId: user?.id || 'owner-admin',
      userName: user?.name || 'System Administrator',
      userRole: user?.role || 'ADMIN',
      action: 'SECURITY_KEY_RESET_REQUESTED',
      targetRecord: 'AdminSecurityCredential',
      result: 'SUCCESS',
      reason: 'Security key reset requested. Secure account recovery requires backend authentication in multi-tenant environments.'
    });

    return {
      success: true,
      message: 'Security Key reset successfully. Please configure a new Security Key immediately.'
    };
  }

  /**
   * Get metadata status about the security key (never returns hash or plaintext key)
   */
  static getSecurityStatus(): {
    configured: boolean;
    createdAt?: string;
    lastChanged?: string;
    isLockedOut: boolean;
    lockoutRemainingSeconds: number;
    failedAttempts: number;
    isSessionActive: boolean;
  } {
    const isConfigured = this.hasSecurityKey();
    let createdAt: string | undefined;
    let lastChanged: string | undefined;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CREDENTIAL);
      if (raw) {
        const cred: StoredSecurityCredential = JSON.parse(raw);
        createdAt = cred.createdAt;
        lastChanged = cred.lastChangedAt;
      }
    } catch {
      // ignore
    }

    const tracker = this.getFailedTracker();
    const now = Date.now();
    const isLockedOut = tracker.lockoutUntil > now;
    const lockoutRemainingSeconds = isLockedOut ? Math.ceil((tracker.lockoutUntil - now) / 1000) : 0;

    return {
      configured: isConfigured,
      createdAt,
      lastChanged,
      isLockedOut,
      lockoutRemainingSeconds,
      failedAttempts: tracker.attempts || 0,
      isSessionActive: this.isSessionVerified()
    };
  }

  /**
   * Session verification status in current browser session
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

  static setSessionVerified(): string {
    const token = `sess_sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const sessionData = {
      token,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY_MS
    };
    sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(sessionData));
    return token;
  }

  static clearSession(): void {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  }

  // --- FAILED ATTEMPTS TRACKER ---

  private static getFailedTracker(): FailedAttemptTracker {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAILED_TRACKER);
      if (!raw) return { attempts: 0, lastAttemptTime: 0, lockoutUntil: 0 };
      const data: FailedAttemptTracker = JSON.parse(raw);
      // If last attempt was more than 10 minutes ago and not locked, reset
      if (Date.now() - data.lastAttemptTime > 10 * 60 * 1000 && data.lockoutUntil <= Date.now()) {
        return { attempts: 0, lastAttemptTime: 0, lockoutUntil: 0 };
      }
      return data;
    } catch {
      return { attempts: 0, lastAttemptTime: 0, lockoutUntil: 0 };
    }
  }

  private static saveFailedTracker(tracker: FailedAttemptTracker): void {
    try {
      localStorage.setItem(STORAGE_KEY_FAILED_TRACKER, JSON.stringify(tracker));
    } catch {
      // ignore
    }
  }

  private static resetFailedTracker(): void {
    localStorage.removeItem(STORAGE_KEY_FAILED_TRACKER);
  }

  // --- AUDIT LOGGING ---

  /**
   * Record a security audit event.
   * Sanitizes to ensure NO credentials, raw keys, or hashes are ever saved.
   */
  static recordAuditEvent(event: Omit<SecurityAuditEvent, 'id' | 'timestamp'>): void {
    try {
      const newEvent: SecurityAuditEvent = {
        id: `sec-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: event.userId || 'system-usr',
        userName: event.userName || 'System User',
        userRole: event.userRole || 'UNKNOWN',
        action: event.action,
        targetRecord: event.targetRecord || 'General Security',
        result: event.result,
        reason: event.reason || ''
      };

      const existingLogs = this.getAuditLogs();
      const updated = [newEvent, ...existingLogs.slice(0, 199)]; // retain last 200 logs
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updated));
    } catch {
      // Fail safely without throwing in production
    }
  }

  /**
   * Retrieve all recorded security audit logs
   */
  static getAuditLogs(): SecurityAuditEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  /**
   * Clear audit logs (Protected admin function)
   */
  static clearAuditLogs(user?: { id?: string; name?: string; role?: string }): void {
    localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
    this.recordAuditEvent({
      userId: user?.id || 'admin-usr',
      userName: user?.name || 'Administrator',
      userRole: user?.role || 'ADMIN',
      action: 'HISTORY_CLEARED',
      targetRecord: 'SecurityAuditLogs',
      result: 'SUCCESS',
      reason: 'Security audit logs cleared by administrator.'
    });
  }
}

export const adminSecurityService = AdminSecurityService;
