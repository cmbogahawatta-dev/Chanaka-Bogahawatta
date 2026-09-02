import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  EnterpriseModule,
  EnterpriseRole,
  SyncStatus,
  ProcurementOrder,
  PaymentVoucher,
  EnterpriseDocument,
  EnterpriseNotification
} from '../types/enterpriseTypes';

interface EnterpriseContextType {
  currentModule: EnterpriseModule;
  setCurrentModule: (module: EnterpriseModule) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  currentRole: EnterpriseRole;
  setCurrentRole: (role: EnterpriseRole) => void;
  currentUser: string;
  setCurrentUser: (name: string) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  lastSyncTime: string;
  
  // Procurement
  procurementOrders: ProcurementOrder[];
  addProcurementOrder: (order: Omit<ProcurementOrder, 'id' | 'PO_NUMBER'>) => void;
  updateProcurementOrder: (id: string, updates: Partial<ProcurementOrder>) => void;
  deleteProcurementOrder: (id: string) => void;
  updateProcurementStatus: (id: string, status: ProcurementOrder['STATUS']) => void;
  
  // Payments
  paymentVouchers: PaymentVoucher[];
  addPaymentVoucher: (voucher: Omit<PaymentVoucher, 'id' | 'PAYMENT_ID'>) => void;
  updatePaymentVoucher: (id: string, updates: Partial<PaymentVoucher>) => void;
  deletePaymentVoucher: (id: string) => void;
  updatePaymentStatus: (id: string, status: PaymentVoucher['STATUS'], approvedBy?: string) => void;
  
  // Documents
  documents: EnterpriseDocument[];
  addDocument: (doc: Omit<EnterpriseDocument, 'id' | 'DOC_REF'>) => void;
  updateDocument: (id: string, updates: Partial<EnterpriseDocument>) => void;
  deleteDocument: (id: string) => void;
  
  // Notifications
  notifications: EnterpriseNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationsCount: number;

  // History Clearing & Reset (Admin Only)
  clearProcurementHistory: () => void;
  clearPaymentsHistory: () => void;
  clearDocumentsHistory: () => void;
  clearNotificationsHistory: () => void;
  resetProcurementData: () => void;
  resetPaymentsData: () => void;
  resetDocumentsData: () => void;
  
  // Bulk Import Actions
  bulkImportProcurementOrders: (imported: Partial<ProcurementOrder>[]) => { count: number; batchId: string };
  bulkImportPaymentVouchers: (imported: Partial<PaymentVoucher>[]) => { count: number; batchId: string };
  bulkImportDocuments: (imported: Partial<EnterpriseDocument>[]) => { count: number; batchId: string };
  
  // Navigation helper
  navigateToModule: (module: EnterpriseModule, subTab?: string) => void;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

// Initial Sample Data for Procurement
const INITIAL_PROCUREMENT: ProcurementOrder[] = [
  {
    id: 'po-1',
    PO_NUMBER: 'PO-202608-010',
    DATE: '2026-08-25',
    PROJECT_CODE: 'PIDM 26',
    REQUESTED_BY: 'BUDDIKA',
    SUPPLIER_NAME: 'Lanka ReadyMix (Pvt) Ltd',
    ITEM_DESCRIPTION: 'Grade 30 Ready Mix Concrete for Culvert Base',
    QUANTITY: 18,
    UNIT: 'Cubes',
    UNIT_PRICE: 28500,
    TOTAL_AMOUNT: 513000,
    STATUS: 'Approved',
    PRIORITY: 'High',
    DELIVERY_LOCATION: 'PIDM 26 Site Yard, Ch 14+200',
    REMARKS: 'Required urgently for structural inspection'
  },
  {
    id: 'po-2',
    PO_NUMBER: 'PO-202608-011',
    DATE: '2026-08-26',
    PROJECT_CODE: 'PIDM 28',
    REQUESTED_BY: 'GEETH',
    SUPPLIER_NAME: 'Tokyo Super Cement PLC',
    ITEM_DESCRIPTION: 'Portland Hydraulic Cement 50kg Bags',
    QUANTITY: 250,
    UNIT: 'Bags',
    UNIT_PRICE: 2450,
    TOTAL_AMOUNT: 612500,
    STATUS: 'Delivered',
    PRIORITY: 'Medium',
    DELIVERY_LOCATION: 'PIDM 28 Central Warehouse, Gampaha',
    REMARKS: 'Batch testing reports attached'
  },
  {
    id: 'po-3',
    PO_NUMBER: 'PO-202608-012',
    DATE: '2026-08-27',
    PROJECT_CODE: 'PIDM 27',
    REQUESTED_BY: 'LASANTHA',
    SUPPLIER_NAME: 'Maha Oya River Sand Suppliers',
    ITEM_DESCRIPTION: 'River Sand for Masonry and Plastering',
    QUANTITY: 8,
    UNIT: 'Cubes',
    UNIT_PRICE: 32000,
    TOTAL_AMOUNT: 256000,
    STATUS: 'Pending Approval',
    PRIORITY: 'High',
    DELIVERY_LOCATION: 'PIDM 27 Bridge Abutment Section',
    REMARKS: 'Awaiting site engineer quantity certification'
  }
];

// Initial Sample Data for Payments
const INITIAL_PAYMENTS: PaymentVoucher[] = [
  {
    id: 'pay-1',
    PAYMENT_ID: 'PAY-202608-001',
    DATE: '2026-08-20',
    PROJECT_CODE: 'PIDM 26',
    BENEFICIARY: 'Ceylinco General Insurance PLC',
    CATEGORY: 'Vehicle & Equipment Comprehensive Insurance',
    AMOUNT: 185000,
    PAYMENT_METHOD: 'Direct Bank Transfer',
    CHEQUE_OR_REF_NO: 'TXN-BOC-884219',
    STATUS: 'Settled',
    REQUESTED_BY: 'Finance Officer',
    APPROVED_BY: 'Managing Director',
    REMARKS: 'Annual fleet policy renewal for WP-CAB-4521 and WP-NA-8842'
  },
  {
    id: 'pay-2',
    PAYMENT_ID: 'PAY-202608-002',
    DATE: '2026-08-24',
    PROJECT_CODE: 'PIDM 28',
    BENEFICIARY: 'Toyota Lanka (Pvt) Ltd',
    CATEGORY: 'Heavy Vehicle Maintenance & Engine Overhaul',
    AMOUNT: 142500,
    PAYMENT_METHOD: 'Cheque',
    CHEQUE_OR_REF_NO: 'CHQ-741952',
    STATUS: 'Settled',
    REQUESTED_BY: 'Fleet Manager',
    APPROVED_BY: 'Operations Director',
    REMARKS: 'Scheduled 60,000km major service and timing belt replacement for WP-PX-9921',
    LINKED_VEHICLE_ID: 'veh-1'
  },
  {
    id: 'pay-3',
    PAYMENT_ID: 'PAY-202608-003',
    DATE: '2026-08-27',
    PROJECT_CODE: 'PIDM 26',
    BENEFICIARY: 'Lanka IOC Petroleum',
    CATEGORY: 'Monthly Bulk Diesel Depot Refill',
    AMOUNT: 480000,
    PAYMENT_METHOD: 'Direct Bank Transfer',
    STATUS: 'Pending Approval',
    REQUESTED_BY: 'BUDDIKA',
    REMARKS: 'Monthly fuel allocation for site excavators, dump trucks, and roller compactors'
  }
];

// Initial Sample Documents
const INITIAL_DOCUMENTS: EnterpriseDocument[] = [
  {
    id: 'doc-1',
    DOC_REF: 'DOC-2026-001',
    TITLE: 'WP-CAB-4521 Insurance Certificate (Comprehensive)',
    MODULE: 'FleetTrack',
    CATEGORY: 'Vehicle Insurance',
    LINKED_ENTITY_TYPE: 'VEHICLE',
    LINKED_ENTITY_ID: 'veh-1',
    FILE_NAME: 'Insurance_CAB4521_2026_2027.pdf',
    FILE_TYPE: 'application/pdf',
    FILE_DATA: '',
    UPLOADED_BY: 'Fleet Admin',
    UPLOADED_DATE: '2026-01-15',
    FILE_SIZE_KB: 450,
    REMARKS: 'Valid until 14 Jan 2027'
  },
  {
    id: 'doc-2',
    DOC_REF: 'DOC-2026-002',
    TITLE: 'PIDM 26 Road Work Permit & RDA Approvals',
    MODULE: 'Projects',
    CATEGORY: 'Site Permit',
    LINKED_ENTITY_TYPE: 'PROJECT',
    LINKED_ENTITY_ID: 'PRJ-001',
    FILE_NAME: 'RDA_Permit_PIDM26_Signed.pdf',
    FILE_TYPE: 'application/pdf',
    FILE_DATA: '',
    UPLOADED_BY: 'BUDDIKA',
    UPLOADED_DATE: '2026-03-01',
    FILE_SIZE_KB: 1200,
    REMARKS: 'Approved with traffic diversion plan'
  },
  {
    id: 'doc-3',
    DOC_REF: 'DOC-2026-003',
    TITLE: 'Site Hardware & Concrete Reinforcement Invoice',
    MODULE: 'Petty Cash',
    CATEGORY: 'Receipt',
    LINKED_ENTITY_TYPE: 'EXPENSE',
    LINKED_ENTITY_ID: 'EXP-1001',
    FILE_NAME: 'Receipt_EXP1001_CementSand.jpg',
    FILE_TYPE: 'image/jpeg',
    FILE_DATA: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=60',
    UPLOADED_BY: 'BUDDIKA',
    UPLOADED_DATE: '2026-08-01',
    FILE_SIZE_KB: 320,
    REMARKS: 'Signed voucher attached with official cashier seal'
  }
];

// Initial Notifications across modules
const INITIAL_NOTIFICATIONS: EnterpriseNotification[] = [
  {
    id: 'notif-1',
    TIMESTAMP: '10 mins ago',
    MODULE: 'Petty Cash',
    SEVERITY: 'warning',
    TITLE: 'Pending Voucher Approval',
    MESSAGE: 'Expense EXP-1002 (LKR 18,500 by GEETH) is waiting for executive sign-off.',
    TARGET_MODULE: 'petty-cash',
    TARGET_TAB: 'expenses',
    READ: false,
    LINKED_ID: 'EXP-1002'
  },
  {
    id: 'notif-2',
    TIMESTAMP: '45 mins ago',
    MODULE: 'FleetTrack',
    SEVERITY: 'urgent',
    TITLE: 'Vehicle Service Overdue',
    MESSAGE: 'Toyota Hilux (WP-CAB-4521) exceeded 45,000 km threshold. Immediate oil & filter change required.',
    TARGET_MODULE: 'fleet',
    TARGET_TAB: 'maintenance',
    READ: false,
    LINKED_ID: 'veh-1'
  },
  {
    id: 'notif-3',
    TIMESTAMP: '2 hours ago',
    MODULE: 'Payments',
    SEVERITY: 'info',
    TITLE: 'Payment Request Pending',
    MESSAGE: 'Payment PAY-202608-003 (LKR 480,000 for Lanka IOC Fuel Depot) is awaiting Managing Director authorization.',
    TARGET_MODULE: 'payments',
    TARGET_TAB: 'all',
    READ: false,
    LINKED_ID: 'PAY-202608-003'
  },
  {
    id: 'notif-4',
    TIMESTAMP: '1 day ago',
    MODULE: 'Projects',
    SEVERITY: 'info',
    TITLE: 'PIDM 26 Milestone Progress',
    MESSAGE: 'Site culvert excavation reached 85% completion. Budget utilization within projected limits.',
    TARGET_MODULE: 'projects',
    TARGET_TAB: 'all',
    READ: true,
    LINKED_ID: 'PRJ-001'
  }
];

export const EnterpriseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentModule, setCurrentModule] = useState<EnterpriseModule>('overview');
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<EnterpriseRole>('ADMIN');
  const [currentUser, setCurrentUser] = useState<string>('BUDDIKA');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('ONLINE');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Data Collections with local persistence
  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>(() => {
    try {
      const saved = localStorage.getItem('ema_enterprise_procurement_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    try {
      localStorage.setItem('ema_enterprise_procurement_v1', JSON.stringify(INITIAL_PROCUREMENT));
    } catch {}
    return INITIAL_PROCUREMENT;
  });

  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>(() => {
    try {
      const saved = localStorage.getItem('ema_enterprise_payments_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    try {
      localStorage.setItem('ema_enterprise_payments_v1', JSON.stringify(INITIAL_PAYMENTS));
    } catch {}
    return INITIAL_PAYMENTS;
  });

  const [documents, setDocuments] = useState<EnterpriseDocument[]>(() => {
    try {
      const saved = localStorage.getItem('ema_enterprise_documents_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    try {
      localStorage.setItem('ema_enterprise_documents_v1', JSON.stringify(INITIAL_DOCUMENTS));
    } catch {}
    return INITIAL_DOCUMENTS;
  });

  const [notifications, setNotifications] = useState<EnterpriseNotification[]>(() => {
    try {
      const saved = localStorage.getItem('ema_enterprise_notifications_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback to initial
    }
    try {
      localStorage.setItem('ema_enterprise_notifications_v1', JSON.stringify(INITIAL_NOTIFICATIONS));
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('ema_enterprise_procurement_v1', JSON.stringify(procurementOrders));
  }, [procurementOrders]);

  useEffect(() => {
    localStorage.setItem('ema_enterprise_payments_v1', JSON.stringify(paymentVouchers));
  }, [paymentVouchers]);

  useEffect(() => {
    localStorage.setItem('ema_enterprise_documents_v1', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('ema_enterprise_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('SYNCING');
      setTimeout(() => {
        setSyncStatus('ONLINE');
        setLastSyncTime(new Date().toLocaleTimeString());
      }, 1200);
    };

    const handleOffline = () => {
      setSyncStatus('OFFLINE');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addProcurementOrder = (order: Omit<ProcurementOrder, 'id' | 'PO_NUMBER'>) => {
    const newId = `po-${Date.now()}`;
    const poNumber = `PO-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(procurementOrders.length + 1).padStart(3, '0')}`;
    const newOrder: ProcurementOrder = {
      ...order,
      id: newId,
      PO_NUMBER: poNumber
    };
    setProcurementOrders(prev => [newOrder, ...prev]);

    // Add notification
    const newNotif: EnterpriseNotification = {
      id: `notif-${Date.now()}`,
      TIMESTAMP: 'Just now',
      MODULE: 'Procurement',
      SEVERITY: 'info',
      TITLE: 'New Purchase Order Created',
      MESSAGE: `PO ${poNumber} for ${order.ITEM_DESCRIPTION} (LKR ${order.TOTAL_AMOUNT.toLocaleString()}) submitted.`,
      TARGET_MODULE: 'procurement',
      READ: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateProcurementOrder = (id: string, updates: Partial<ProcurementOrder>) => {
    setProcurementOrders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProcurementOrder = (id: string) => {
    setProcurementOrders(prev => prev.filter(p => p.id !== id));
  };

  const updateProcurementStatus = (id: string, status: ProcurementOrder['STATUS']) => {
    setProcurementOrders(prev => prev.map(p => p.id === id ? { ...p, STATUS: status } : p));
  };

  const addPaymentVoucher = (voucher: Omit<PaymentVoucher, 'id' | 'PAYMENT_ID'>) => {
    const newId = `pay-${Date.now()}`;
    const payId = `PAY-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(paymentVouchers.length + 1).padStart(3, '0')}`;
    const newVoucher: PaymentVoucher = {
      ...voucher,
      id: newId,
      PAYMENT_ID: payId
    };
    setPaymentVouchers(prev => [newVoucher, ...prev]);

    // Add notification
    const newNotif: EnterpriseNotification = {
      id: `notif-${Date.now()}`,
      TIMESTAMP: 'Just now',
      MODULE: 'Payments',
      SEVERITY: 'warning',
      TITLE: 'New Payment Voucher Submitted',
      MESSAGE: `Payment ${payId} to ${voucher.BENEFICIARY} (LKR ${voucher.AMOUNT.toLocaleString()}) requires approval.`,
      TARGET_MODULE: 'payments',
      READ: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updatePaymentVoucher = (id: string, updates: Partial<PaymentVoucher>) => {
    setPaymentVouchers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePaymentVoucher = (id: string) => {
    setPaymentVouchers(prev => prev.filter(p => p.id !== id));
  };

  const updatePaymentStatus = (id: string, status: PaymentVoucher['STATUS'], approvedBy?: string) => {
    setPaymentVouchers(prev => prev.map(p => p.id === id ? {
      ...p,
      STATUS: status,
      ...(approvedBy ? { APPROVED_BY: approvedBy } : {})
    } : p));
  };

  const addDocument = (doc: Omit<EnterpriseDocument, 'id' | 'DOC_REF'>) => {
    const newId = `doc-${Date.now()}`;
    const docRef = `DOC-${new Date().getFullYear()}-${String(documents.length + 1).padStart(3, '0')}`;
    const newDoc: EnterpriseDocument = {
      ...doc,
      id: newId,
      DOC_REF: docRef
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const updateDocument = (id: string, updates: Partial<EnterpriseDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, READ: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, READ: true })));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.READ).length;
  }, [notifications]);

  // Admin Clear and Reset operations
  const clearProcurementHistory = () => {
    localStorage.setItem('ema_enterprise_procurement_v1', JSON.stringify([]));
    setProcurementOrders([]);
  };

  const clearPaymentsHistory = () => {
    localStorage.setItem('ema_enterprise_payments_v1', JSON.stringify([]));
    setPaymentVouchers([]);
  };

  const clearDocumentsHistory = () => {
    localStorage.setItem('ema_enterprise_documents_v1', JSON.stringify([]));
    setDocuments([]);
  };

  const clearNotificationsHistory = () => {
    localStorage.setItem('ema_enterprise_notifications_v1', JSON.stringify([]));
    setNotifications([]);
  };

  const resetProcurementData = () => {
    localStorage.setItem('ema_enterprise_procurement_v1', JSON.stringify(INITIAL_PROCUREMENT));
    setProcurementOrders(INITIAL_PROCUREMENT);
  };

  const resetPaymentsData = () => {
    localStorage.setItem('ema_enterprise_payments_v1', JSON.stringify(INITIAL_PAYMENTS));
    setPaymentVouchers(INITIAL_PAYMENTS);
  };

  const resetDocumentsData = () => {
    localStorage.setItem('ema_enterprise_documents_v1', JSON.stringify(INITIAL_DOCUMENTS));
    setDocuments(INITIAL_DOCUMENTS);
  };

  // Bulk Import Methods
  const bulkImportProcurementOrders = (imported: Partial<ProcurementOrder>[]): { count: number; batchId: string } => {
    const batchId = `BATCH-PO-${Date.now().toString().slice(-6)}`;
    const newItems: ProcurementOrder[] = imported.map((p, i) => ({
      id: p.id || `po-imp-${Date.now()}-${i}`,
      PO_NUMBER: p.PO_NUMBER || `PO-2026-${String(procurementOrders.length + i + 1).padStart(4, '0')}`,
      DATE: p.DATE || new Date().toISOString().slice(0, 10),
      PROJECT_CODE: p.PROJECT_CODE || 'PIDM 26',
      REQUESTED_BY: p.REQUESTED_BY || currentUser,
      SUPPLIER_NAME: p.SUPPLIER_NAME || 'Supplier',
      ITEM_DESCRIPTION: p.ITEM_DESCRIPTION || 'Materials / Equipment Requisition',
      QUANTITY: Number(p.QUANTITY) || 1,
      UNIT: p.UNIT || 'Units',
      UNIT_PRICE: Number(p.UNIT_PRICE) || 1000,
      TOTAL_AMOUNT: Number(p.TOTAL_AMOUNT) || ((Number(p.QUANTITY) || 1) * (Number(p.UNIT_PRICE) || 1000)),
      STATUS: (p.STATUS as any) || 'Pending Approval',
      PRIORITY: (p.PRIORITY as any) || 'Medium',
      DELIVERY_LOCATION: p.DELIVERY_LOCATION || 'Main Construction Yard',
      REMARKS: p.REMARKS ? `[BULK IMPORT] ${p.REMARKS}` : `Imported via batch ${batchId}`
    }));

    setProcurementOrders(prev => {
      const merged = [...prev];
      newItems.forEach(newItem => {
        const existingIdx = merged.findIndex(
          x => x.PO_NUMBER.toUpperCase() === newItem.PO_NUMBER.toUpperCase()
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...newItem };
        } else {
          merged.unshift(newItem);
        }
      });
      return merged;
    });

    return { count: newItems.length, batchId };
  };

  const bulkImportPaymentVouchers = (imported: Partial<PaymentVoucher>[]): { count: number; batchId: string } => {
    const batchId = `BATCH-PAY-${Date.now().toString().slice(-6)}`;
    const newItems: PaymentVoucher[] = imported.map((p, i) => ({
      id: p.id || `pay-imp-${Date.now()}-${i}`,
      PAYMENT_ID: p.PAYMENT_ID || `PAY-2026-${String(paymentVouchers.length + i + 1).padStart(4, '0')}`,
      DATE: p.DATE || new Date().toISOString().slice(0, 10),
      PROJECT_CODE: p.PROJECT_CODE || 'PIDM 26',
      BENEFICIARY: p.BENEFICIARY || 'Vendor / Contractor',
      CATEGORY: p.CATEGORY || 'Procurement Settlement',
      AMOUNT: Number(p.AMOUNT) || 50000,
      PAYMENT_METHOD: p.PAYMENT_METHOD || 'Direct Bank Transfer',
      CHEQUE_OR_REF_NO: p.CHEQUE_OR_REF_NO || `REF-${Date.now().toString().slice(-6)}`,
      STATUS: (p.STATUS as any) || 'Pending Approval',
      REQUESTED_BY: p.REQUESTED_BY || currentUser,
      APPROVED_BY: p.APPROVED_BY,
      REMARKS: p.REMARKS ? `[BULK IMPORT] ${p.REMARKS}` : `Imported via batch ${batchId}`
    }));

    setPaymentVouchers(prev => {
      const merged = [...prev];
      newItems.forEach(newItem => {
        const existingIdx = merged.findIndex(
          x => x.PAYMENT_ID.toUpperCase() === newItem.PAYMENT_ID.toUpperCase()
        );
        if (existingIdx >= 0) {
          merged[existingIdx] = { ...merged[existingIdx], ...newItem };
        } else {
          merged.unshift(newItem);
        }
      });
      return merged;
    });

    return { count: newItems.length, batchId };
  };

  const bulkImportDocuments = (imported: Partial<EnterpriseDocument>[]): { count: number; batchId: string } => {
    const batchId = `BATCH-DOC-${Date.now().toString().slice(-6)}`;
    const newItems: EnterpriseDocument[] = imported.map((d, i) => ({
      id: d.id || `doc-imp-${Date.now()}-${i}`,
      DOC_REF: d.DOC_REF || `DOC-2026-${String(documents.length + i + 1).padStart(4, '0')}`,
      TITLE: d.TITLE || 'Uploaded Document',
      MODULE: d.MODULE || 'Petty Cash',
      CATEGORY: (d.CATEGORY as any) || 'Invoice',
      LINKED_ENTITY_TYPE: d.LINKED_ENTITY_TYPE || 'PROJECT',
      LINKED_ENTITY_ID: d.LINKED_ENTITY_ID || 'PIDM 26',
      FILE_NAME: d.FILE_NAME || `Document_${Date.now()}.pdf`,
      FILE_TYPE: d.FILE_TYPE || 'application/pdf',
      FILE_DATA: d.FILE_DATA || '',
      UPLOADED_BY: d.UPLOADED_BY || currentUser,
      UPLOADED_DATE: d.UPLOADED_DATE || new Date().toISOString().slice(0, 10),
      FILE_SIZE_KB: Number(d.FILE_SIZE_KB) || 250,
      REMARKS: d.REMARKS ? `[BULK IMPORT] ${d.REMARKS}` : `Batch import ${batchId}`
    }));

    setDocuments(prev => [...newItems, ...prev]);
    return { count: newItems.length, batchId };
  };

  const navigateToModule = (module: EnterpriseModule, subTab?: string) => {
    setCurrentModule(module);
    if (subTab) {
      setActiveSubTab(subTab);
    }
  };

  return (
    <EnterpriseContext.Provider
      value={{
        currentModule,
        setCurrentModule,
        activeSubTab,
        setActiveSubTab,
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser,
        syncStatus,
        setSyncStatus,
        lastSyncTime,
        procurementOrders,
        addProcurementOrder,
        updateProcurementOrder,
        deleteProcurementOrder,
        updateProcurementStatus,
        paymentVouchers,
        addPaymentVoucher,
        updatePaymentVoucher,
        deletePaymentVoucher,
        updatePaymentStatus,
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationsCount,
        clearProcurementHistory,
        clearPaymentsHistory,
        clearDocumentsHistory,
        clearNotificationsHistory,
        resetProcurementData,
        resetPaymentsData,
        resetDocumentsData,
        bulkImportProcurementOrders,
        bulkImportPaymentVouchers,
        bulkImportDocuments,
        navigateToModule
      }}
    >
      {children}
    </EnterpriseContext.Provider>
  );
};

export const useEnterprise = (): EnterpriseContextType => {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
};
