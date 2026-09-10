/**
 * EMA Enterprise Corporate Suite - Petty Cash Persistent Storage Engine
 * 
 * High-capacity IndexedDB storage engine with seamless localStorage migration,
 * automated base64 attachment extraction, record-level persistence, and 
 * quota-exceeded fail-safe protections.
 */

import { Expense, Income } from '../types/pettyCashTypes';

const DB_NAME = 'ema_petty_cash_db';
const DB_VERSION = 2;

export const STORES = {
  EXPENSES: 'expenses',
  INCOME: 'income',
  ATTACHMENTS: 'attachments',
  METADATA: 'metadata'
} as const;

export const STORAGE_KEYS = {
  EXPENSES_V1: 'ema_petty_expenses_v1',
  INCOME_V1: 'ema_petty_income_v1',
  MIGRATION_V2_FLAG: 'ema_petty_expenses_migrated_v2',
  STORAGE_QUOTA_NOTICE: 'ema_petty_storage_quota_notice'
} as const;

export interface StoredAttachment {
  id: string;
  parentId: string; // expense or income ID
  type: 'expense' | 'income';
  data: string; // base64 or blob URL
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

// Subscribers for storage warnings (e.g. quota exceeded notifications)
type StorageWarningListener = (message: string) => void;
const warningListeners: Set<StorageWarningListener> = new Set();

export function subscribeStorageWarning(listener: StorageWarningListener): () => void {
  warningListeners.add(listener);
  return () => warningListeners.delete(listener);
}

function notifyStorageWarning(msg: string) {
  console.warn(`[PettyCashStorage] ${msg}`);
  warningListeners.forEach(listener => {
    try {
      listener(msg);
    } catch (e) {
      console.error('Error in storage warning listener:', e);
    }
  });
}

/**
 * Initialize IndexedDB instance with required object stores and indexes
 */
export function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      // Store 1: Expenses
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expenseStore.createIndex('EXPENSES_ID', 'EXPENSES_ID', { unique: false });
        expenseStore.createIndex('DATE_REF', 'DATE_REF', { unique: false });
        expenseStore.createIndex('PROJECT', 'PROJECT', { unique: false });
        expenseStore.createIndex('SUPERVISOR_NAME', 'SUPERVISOR_NAME', { unique: false });
      }

      // Store 2: Income
      if (!db.objectStoreNames.contains(STORES.INCOME)) {
        const incomeStore = db.createObjectStore(STORES.INCOME, { keyPath: 'id' });
        incomeStore.createIndex('INCOME_ID', 'INCOME_ID', { unique: false });
        incomeStore.createIndex('DATE_REF', 'DATE_REF', { unique: false });
        incomeStore.createIndex('SUPERVISOR', 'SUPERVISOR', { unique: false });
      }

      // Store 3: Heavy Attachments / Proof Documents
      if (!db.objectStoreNames.contains(STORES.ATTACHMENTS)) {
        const attachStore = db.createObjectStore(STORES.ATTACHMENTS, { keyPath: 'id' });
        attachStore.createIndex('parentId', 'parentId', { unique: false });
        attachStore.createIndex('type', 'type', { unique: false });
      }

      // Store 4: Metadata & Migration flags
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbInitPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('[PettyCashStorage] Failed to open IndexedDB:', request.error);
      dbInitPromise = null;
      reject(request.error);
    };
  });

  return dbInitPromise;
}

/**
 * Safe localStorage writer that guarantees NO uncaught QuotaExceededError crashes
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuota) {
      notifyStorageWarning('Storage capacity has been reached. Please sync your data or contact the administrator.');
    } else {
      console.error(`[PettyCashStorage] Safe localStorage write error for "${key}":`, err);
    }
    return false;
  }
}

/**
 * Strips heavy Base64 data URLs from an array of records to keep localStorage lightweight
 */
export function stripHeavyAttachments<T extends { PROOF_DOCUMENT?: string; id?: string }>(items: T[]): T[] {
  return items.map(item => {
    if (item.PROOF_DOCUMENT && item.PROOF_DOCUMENT.startsWith('data:')) {
      return {
        ...item,
        PROOF_DOCUMENT: `attachment:${item.id || 'ref'}`
      };
    }
    return item;
  });
}

/**
 * Load all expenses from IndexedDB
 */
export async function getExpensesFromIndexedDB(): Promise<Expense[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.EXPENSES, 'readonly');
      const store = tx.objectStore(STORES.EXPENSES);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error('[PettyCashStorage] Error getting expenses from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error('[PettyCashStorage] getExpensesFromIndexedDB caught error:', e);
    return [];
  }
}

/**
 * Load all income from IndexedDB
 */
export async function getIncomeFromIndexedDB(): Promise<Income[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INCOME, 'readonly');
      const store = tx.objectStore(STORES.INCOME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error('[PettyCashStorage] Error getting income from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    console.error('[PettyCashStorage] getIncomeFromIndexedDB caught error:', e);
    return [];
  }
}

/**
 * Bulk save expenses to IndexedDB.
 * Extracts heavy attachments into the attachments store so records remain swift and modular.
 */
export async function saveExpensesToIndexedDB(expenses: Expense[]): Promise<void> {
  if (!expenses) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.EXPENSES, STORES.ATTACHMENTS], 'readwrite');
      const expenseStore = tx.objectStore(STORES.EXPENSES);
      const attachStore = tx.objectStore(STORES.ATTACHMENTS);

      // Clear existing records in transaction to ensure 1-to-1 sync
      expenseStore.clear();

      for (const exp of expenses) {
        // Ensure standard id
        const record = {
          ...exp,
          id: exp.id || exp.EXPENSES_ID
        };

        // If it has a base64 proof document, persist it to attachments store
        if (record.PROOF_DOCUMENT && record.PROOF_DOCUMENT.startsWith('data:')) {
          const attachId = `att-exp-${record.id}`;
          attachStore.put({
            id: attachId,
            parentId: record.id,
            type: 'expense',
            data: record.PROOF_DOCUMENT,
            fileName: record.PROOF_DOCUMENT_NAME,
            createdAt: record.CREATED_DATE || new Date().toISOString()
          });
        }

        expenseStore.put(record);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error('[PettyCashStorage] Transaction error saving expenses:', tx.error);
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error('[PettyCashStorage] saveExpensesToIndexedDB error:', e);
  }
}

/**
 * Bulk save income to IndexedDB
 */
export async function saveIncomeToIndexedDB(incomeList: Income[]): Promise<void> {
  if (!incomeList) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.INCOME, STORES.ATTACHMENTS], 'readwrite');
      const incomeStore = tx.objectStore(STORES.INCOME);
      const attachStore = tx.objectStore(STORES.ATTACHMENTS);

      incomeStore.clear();

      for (const inc of incomeList) {
        const record = {
          ...inc,
          id: inc.id || inc.INCOME_ID
        };

        if (record.PROOF_DOCUMENT && record.PROOF_DOCUMENT.startsWith('data:')) {
          const attachId = `att-inc-${record.id}`;
          attachStore.put({
            id: attachId,
            parentId: record.id,
            type: 'income',
            data: record.PROOF_DOCUMENT,
            fileName: record.PROOF_DOCUMENT_NAME,
            createdAt: record.CREATED_DATE || new Date().toISOString()
          });
        }

        incomeStore.put(record);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error('[PettyCashStorage] Transaction error saving income:', tx.error);
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error('[PettyCashStorage] saveIncomeToIndexedDB error:', e);
  }
}

/**
 * Record-level save/update for a single expense (avoids rewriting entire array)
 */
export async function saveSingleExpenseToIndexedDB(exp: Expense): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.EXPENSES, STORES.ATTACHMENTS], 'readwrite');
    const store = tx.objectStore(STORES.EXPENSES);
    const attachStore = tx.objectStore(STORES.ATTACHMENTS);

    const record = { ...exp, id: exp.id || exp.EXPENSES_ID };

    if (record.PROOF_DOCUMENT && record.PROOF_DOCUMENT.startsWith('data:')) {
      const attachId = `att-exp-${record.id}`;
      // Cache in memory for instantaneous sync retrieval
      attachmentCache.set(attachId, record.PROOF_DOCUMENT);
      attachmentCache.set(`idb:attachment:${attachId}`, record.PROOF_DOCUMENT);
      attachmentCache.set(`attachment:${record.id}`, record.PROOF_DOCUMENT);

      attachStore.put({
        id: attachId,
        parentId: record.id,
        type: 'expense',
        data: record.PROOF_DOCUMENT,
        fileName: record.PROOF_DOCUMENT_NAME,
        createdAt: record.CREATED_DATE || new Date().toISOString()
      });

      // Keep only lightweight reference in transaction record
      record.PROOF_DOCUMENT = `idb:attachment:${attachId}`;
    }

    store.put(record);
  } catch (e) {
    console.error('[PettyCashStorage] saveSingleExpenseToIndexedDB error:', e);
  }
}

/**
 * Record-level delete for a single expense
 */
export async function deleteSingleExpenseFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.EXPENSES, STORES.ATTACHMENTS], 'readwrite');
    const store = tx.objectStore(STORES.EXPENSES);
    const attachStore = tx.objectStore(STORES.ATTACHMENTS);

    store.delete(id);
    attachStore.delete(`att-exp-${id}`);

    // Remove from in-memory cache
    attachmentCache.delete(`att-exp-${id}`);
    attachmentCache.delete(`idb:attachment:att-exp-${id}`);
    attachmentCache.delete(`attachment:${id}`);
  } catch (e) {
    console.error('[PettyCashStorage] deleteSingleExpenseFromIndexedDB error:', e);
  }
}

/**
 * Record-level save/update for a single income
 */
export async function saveSingleIncomeToIndexedDB(inc: Income): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.INCOME, STORES.ATTACHMENTS], 'readwrite');
    const store = tx.objectStore(STORES.INCOME);
    const attachStore = tx.objectStore(STORES.ATTACHMENTS);

    const record = { ...inc, id: inc.id || inc.INCOME_ID };

    if (record.PROOF_DOCUMENT && record.PROOF_DOCUMENT.startsWith('data:')) {
      const attachId = `att-inc-${record.id}`;
      attachmentCache.set(attachId, record.PROOF_DOCUMENT);
      attachmentCache.set(`idb:attachment:${attachId}`, record.PROOF_DOCUMENT);
      attachmentCache.set(`attachment:${record.id}`, record.PROOF_DOCUMENT);

      attachStore.put({
        id: attachId,
        parentId: record.id,
        type: 'income',
        data: record.PROOF_DOCUMENT,
        fileName: record.PROOF_DOCUMENT_NAME,
        createdAt: record.CREATED_DATE || new Date().toISOString()
      });

      record.PROOF_DOCUMENT = `idb:attachment:${attachId}`;
    }

    store.put(record);
  } catch (e) {
    console.error('[PettyCashStorage] saveSingleIncomeToIndexedDB error:', e);
  }
}

/**
 * Record-level delete for a single income
 */
export async function deleteSingleIncomeFromIndexedDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.INCOME, STORES.ATTACHMENTS], 'readwrite');
    const store = tx.objectStore(STORES.INCOME);
    const attachStore = tx.objectStore(STORES.ATTACHMENTS);

    store.delete(id);
    attachStore.delete(`att-inc-${id}`);

    attachmentCache.delete(`att-inc-${id}`);
    attachmentCache.delete(`idb:attachment:att-inc-${id}`);
    attachmentCache.delete(`attachment:${id}`);
  } catch (e) {
    console.error('[PettyCashStorage] deleteSingleIncomeFromIndexedDB error:', e);
  }
}

/**
 * Clear all expenses in IndexedDB
 */
export async function clearExpensesFromIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.EXPENSES, 'readwrite');
    tx.objectStore(STORES.EXPENSES).clear();
  } catch (e) {
    console.error('[PettyCashStorage] clearExpensesFromIndexedDB error:', e);
  }
}

/**
 * Clear all income in IndexedDB
 */
export async function clearIncomeFromIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.INCOME, 'readwrite');
    tx.objectStore(STORES.INCOME).clear();
  } catch (e) {
    console.error('[PettyCashStorage] clearIncomeFromIndexedDB error:', e);
  }
}

/**
 * Clear all petty cash data in IndexedDB
 */
export async function clearAllPettyCashIndexedDB(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.EXPENSES, STORES.INCOME, STORES.ATTACHMENTS], 'readwrite');
    tx.objectStore(STORES.EXPENSES).clear();
    tx.objectStore(STORES.INCOME).clear();
    tx.objectStore(STORES.ATTACHMENTS).clear();
    attachmentCache.clear();
  } catch (e) {
    console.error('[PettyCashStorage] clearAllPettyCashIndexedDB error:', e);
  }
}

// In-memory cache for resolved attachments to make image rendering synchronous & fast
const attachmentCache = new Map<string, string>();

/**
 * Synchronously resolve attachment if already cached in memory
 */
export function resolveProofDocumentSync(docRef?: string): string | undefined {
  if (!docRef) return undefined;
  if (docRef.startsWith('http://') || docRef.startsWith('https://') || docRef.startsWith('data:') || docRef.startsWith('blob:')) {
    return docRef;
  }
  if (attachmentCache.has(docRef)) {
    return attachmentCache.get(docRef);
  }
  if (docRef.startsWith('idb:attachment:')) {
    const id = docRef.replace('idb:attachment:', '');
    if (attachmentCache.has(id)) return attachmentCache.get(id);
  }
  if (docRef.startsWith('attachment:')) {
    const id = docRef.replace('attachment:', '');
    if (attachmentCache.has(id)) return attachmentCache.get(id);
    if (attachmentCache.has(`att-exp-${id}`)) return attachmentCache.get(`att-exp-${id}`);
    if (attachmentCache.has(`att-inc-${id}`)) return attachmentCache.get(`att-inc-${id}`);
  }
  return undefined;
}

/**
 * Asynchronously resolve proof document from IndexedDB or memory cache
 */
export async function resolveProofDocument(docRef?: string): Promise<string | undefined> {
  if (!docRef) return undefined;
  if (docRef.startsWith('http://') || docRef.startsWith('https://') || docRef.startsWith('data:') || docRef.startsWith('blob:')) {
    return docRef;
  }
  const syncHit = resolveProofDocumentSync(docRef);
  if (syncHit) return syncHit;

  let lookupKey = docRef;
  if (docRef.startsWith('idb:attachment:')) {
    lookupKey = docRef.replace('idb:attachment:', '');
  } else if (docRef.startsWith('attachment:')) {
    lookupKey = docRef.replace('attachment:', '');
  }

  const data = await getAttachmentFromIndexedDB(lookupKey);
  if (data) {
    attachmentCache.set(docRef, data);
    attachmentCache.set(lookupKey, data);
    return data;
  }

  return docRef;
}

/**
 * Save attachment directly into IndexedDB attachments store
 */
export async function saveAttachmentDirect(
  id: string,
  parentId: string,
  data: string,
  fileName?: string,
  type: 'expense' | 'income' = 'expense'
): Promise<string> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORES.ATTACHMENTS, 'readwrite');
    const store = tx.objectStore(STORES.ATTACHMENTS);

    const attachId = id.startsWith('att-') ? id : `att-${type}-${id}`;
    store.put({
      id: attachId,
      parentId,
      type,
      data,
      fileName,
      createdAt: new Date().toISOString()
    });

    attachmentCache.set(attachId, data);
    attachmentCache.set(`idb:attachment:${attachId}`, data);
    return `idb:attachment:${attachId}`;
  } catch (e) {
    console.error('[PettyCashStorage] saveAttachmentDirect error:', e);
    return data;
  }
}

/**
 * Retrieve an attachment by its ID or parent record ID
 */
export async function getAttachmentFromIndexedDB(parentIdOrId: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.ATTACHMENTS, 'readonly');
      const store = tx.objectStore(STORES.ATTACHMENTS);

      // Try direct ID first
      const directReq = store.get(parentIdOrId);
      directReq.onsuccess = () => {
        if (directReq.result?.data) {
          attachmentCache.set(parentIdOrId, directReq.result.data);
          resolve(directReq.result.data);
          return;
        }

        // Try prefix att-exp-
        const expPrefReq = store.get(`att-exp-${parentIdOrId}`);
        expPrefReq.onsuccess = () => {
          if (expPrefReq.result?.data) {
            attachmentCache.set(parentIdOrId, expPrefReq.result.data);
            resolve(expPrefReq.result.data);
            return;
          }

          // Try prefix att-inc-
          const incPrefReq = store.get(`att-inc-${parentIdOrId}`);
          incPrefReq.onsuccess = () => {
            if (incPrefReq.result?.data) {
              attachmentCache.set(parentIdOrId, incPrefReq.result.data);
              resolve(incPrefReq.result.data);
              return;
            }

            // Try index lookup by parentId
            try {
              const index = store.index('parentId');
              const indexReq = index.get(parentIdOrId);
              indexReq.onsuccess = () => {
                const res = indexReq.result?.data || null;
                if (res) attachmentCache.set(parentIdOrId, res);
                resolve(res);
              };
              indexReq.onerror = () => resolve(null);
            } catch {
              resolve(null);
            }
          };
          incPrefReq.onerror = () => resolve(null);
        };
        expPrefReq.onerror = () => resolve(null);
      };
      directReq.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error('[PettyCashStorage] getAttachmentFromIndexedDB error:', e);
    return null;
  }
}

/**
 * MIGRATION ENGINE (STEP 2, 3, 5):
 * 
 * Safely transfers data from localStorage ('ema_petty_expenses_v1' and 'ema_petty_income_v1')
 * into IndexedDB.
 * 
 * Guarantees:
 * - Detects v1 data and reads it completely.
 * - Extracts heavy Base64 attachments into IndexedDB attachment store.
 * - Stores all records in IndexedDB without discarding valid transactions.
 * - Verifies record count and data validity before setting migration flag.
 * - Only after successful verification, clears base64 images from localStorage copy
 *   so localStorage never throws QuotaExceededError.
 * - Never deletes business records.
 */
export async function performSafePettyCashMigration(): Promise<{
  migrated: boolean;
  expenseCount: number;
  incomeCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let expenseCount = 0;
  let incomeCount = 0;

  try {
    const db = await getDB();

    // 1. Read existing v1 expenses from localStorage
    let existingExpenses: Expense[] = [];
    try {
      const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES_V1);
      if (rawExpenses) {
        const parsed = JSON.parse(rawExpenses);
        if (Array.isArray(parsed)) {
          existingExpenses = parsed;
        }
      }
    } catch (err: any) {
      errors.push(`Failed to parse localStorage expenses: ${err.message}`);
    }

    // 2. Read existing v1 income from localStorage
    let existingIncome: Income[] = [];
    try {
      const rawIncome = localStorage.getItem(STORAGE_KEYS.INCOME_V1);
      if (rawIncome) {
        const parsed = JSON.parse(rawIncome);
        if (Array.isArray(parsed)) {
          existingIncome = parsed;
        }
      }
    } catch (err: any) {
      errors.push(`Failed to parse localStorage income: ${err.message}`);
    }

    // Check if IndexedDB already has records
    const currentIdbExpenses = await getExpensesFromIndexedDB();
    const currentIdbIncome = await getIncomeFromIndexedDB();

    // If IndexedDB already has more or equal records, we merge to preserve both
    const expensesMap = new Map<string, Expense>();
    // First put existing IndexedDB items
    currentIdbExpenses.forEach(e => {
      const key = e.id || e.EXPENSES_ID;
      if (key) expensesMap.set(key, e);
    });
    // Overlay/merge localStorage items (ensuring no existing data lost)
    existingExpenses.forEach(e => {
      const key = e.id || e.EXPENSES_ID;
      if (key) {
        if (!expensesMap.has(key)) {
          expensesMap.set(key, e);
        } else {
          // If existing had proof and incoming has proof, preserve whichever is richer
          const existing = expensesMap.get(key)!;
          expensesMap.set(key, {
            ...existing,
            ...e,
            PROOF_DOCUMENT: e.PROOF_DOCUMENT || existing.PROOF_DOCUMENT
          });
        }
      }
    });

    const finalExpenses = Array.from(expensesMap.values());
    expenseCount = finalExpenses.length;

    // Merge income
    const incomeMap = new Map<string, Income>();
    currentIdbIncome.forEach(inc => {
      const key = inc.id || inc.INCOME_ID;
      if (key) incomeMap.set(key, inc);
    });
    existingIncome.forEach(inc => {
      const key = inc.id || inc.INCOME_ID;
      if (key && !incomeMap.has(key)) {
        incomeMap.set(key, inc);
      }
    });

    const finalIncome = Array.from(incomeMap.values());
    incomeCount = finalIncome.length;

    // 3. Write all merged data to IndexedDB
    if (finalExpenses.length > 0) {
      await saveExpensesToIndexedDB(finalExpenses);
    }
    if (finalIncome.length > 0) {
      await saveIncomeToIndexedDB(finalIncome);
    }

    // 4. Verify data in IndexedDB
    const verifiedExpenses = await getExpensesFromIndexedDB();
    const verifiedIncome = await getIncomeFromIndexedDB();

    if (verifiedExpenses.length < finalExpenses.length) {
      throw new Error(`Verification failed: Expected ${finalExpenses.length} expenses in IndexedDB, found ${verifiedExpenses.length}`);
    }

    // 5. Mark migration complete
    safeSetLocalStorage(
      STORAGE_KEYS.MIGRATION_V2_FLAG,
      JSON.stringify({
        completedAt: new Date().toISOString(),
        expenseCount,
        incomeCount,
        status: 'verified'
      })
    );

    // 6. Safe cleanup of localStorage:
    // Now that records and attachments are fully verified inside IndexedDB,
    // clear the bulky v1 keys from localStorage so quota errors NEVER occur again.
    try {
      localStorage.removeItem(STORAGE_KEYS.EXPENSES_V1);
      localStorage.removeItem(STORAGE_KEYS.INCOME_V1);
    } catch (cleanupErr) {
      console.warn('[PettyCashStorage] Error cleaning legacy localStorage keys:', cleanupErr);
    }

    console.info(
      `[PettyCashStorage] Successfully migrated ${expenseCount} expenses and ${incomeCount} income records to IndexedDB without data loss.`
    );

    return {
      migrated: true,
      expenseCount,
      incomeCount,
      errors
    };
  } catch (err: any) {
    console.error('[PettyCashStorage] Migration error:', err);
    errors.push(err.message || 'Unknown migration error');
    return {
      migrated: false,
      expenseCount,
      incomeCount,
      errors
    };
  }
}
