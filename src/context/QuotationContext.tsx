import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Quotation,
  QuotationSettings,
  QuotationStatus,
  QuotationType,
  QuotationItem
} from '../types/quotationTypes';
import {
  generateQuotationNumber,
  calculateQuotationTotals,
  amountToWordsLKR,
  isQuotationExpired,
  DEFAULT_QUOTATION_SETTINGS,
  INITIAL_QUOTATIONS
} from '../utils/quotationUtils';
import { generateQuotationPdf } from '../utils/quotationPdf';
import { useTaxInvoice } from './TaxInvoiceContext';
import { useEnterprise } from './EnterpriseContext';

const STORAGE_KEY_QUOTATIONS = 'ema_quotations_v1';
const STORAGE_KEY_SETTINGS = 'ema_quotation_settings_v1';

export type QuotationTab =
  | 'all'
  | 'quotations'
  | 'estimates'
  | 'drafts'
  | 'sent'
  | 'accepted'
  | 'converted'
  | 'expired'
  | 'settings';

interface QuotationContextType {
  quotations: Quotation[];
  settings: QuotationSettings;
  activeTab: QuotationTab;
  setActiveTab: (tab: QuotationTab) => void;
  createQuotation: (data: Partial<Quotation>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  createRevision: (parentQuotationId: string, reason: string, user: string) => Quotation | null;
  deleteQuotation: (id: string) => void;
  updateStatus: (id: string, newStatus: QuotationStatus, user: string, notes?: string) => void;
  convertToTaxInvoice: (quotationId: string, user: string) => { success: boolean; invoiceId?: string; invoiceSerial?: string; error?: string };
  previewNextNumber: (type: QuotationType) => string;
  downloadQuotationPdf: (quotation: Quotation) => void;
  printQuotationPdf: (quotation: Quotation) => void;
  updateSettings: (newSettings: Partial<QuotationSettings>) => void;
  clearQuotationsHistory: (filterStatus?: string) => void;
  resetQuotationsToDefault: () => void;
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export const QuotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useEnterprise();
  const taxInvoiceContext = useTaxInvoice();

  // Settings state
  const [settings, setSettings] = useState<QuotationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_QUOTATION_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading quotation settings from localStorage:', e);
    }
    return DEFAULT_QUOTATION_SETTINGS;
  });

  // Quotations state
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QUOTATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading quotations from localStorage:', e);
    }
    return INITIAL_QUOTATIONS;
  });

  const [activeTab, setActiveTab] = useState<QuotationTab>('all');

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist quotation settings:', e);
    }
  }, [settings]);

  // Persist quotations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(quotations));
    } catch (e) {
      console.error('Failed to persist quotations:', e);
    }
  }, [quotations]);

  // Auto-expire check on mount
  useEffect(() => {
    setQuotations(prev =>
      prev.map(q => {
        if ((q.status === 'SENT' || q.status === 'DRAFT') && isQuotationExpired(q.validUntilDate)) {
          return {
            ...q,
            status: 'EXPIRED',
            updatedAt: new Date().toISOString(),
            auditTrail: [
              ...q.auditTrail,
              {
                id: `aud-${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'EXPIRED',
                performedBy: 'System Watchdog',
                previousStatus: q.status,
                newStatus: 'EXPIRED',
                notes: 'Validity elapsed past validity date'
              }
            ]
          };
        }
        return q;
      })
    );
  }, []);

  const previewNextNumber = (type: QuotationType): string => {
    const today = new Date().toISOString().split('T')[0];
    const seq = type === 'QUOTATION' ? settings.nextQuotationSequence : settings.nextEstimateSequence;
    const prefix = type === 'QUOTATION' ? settings.quotationPrefix : settings.estimatePrefix;
    return generateQuotationNumber(type, today, seq, prefix);
  };

  const createQuotation = (data: Partial<Quotation>): Quotation => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const documentType: QuotationType = data.documentType || 'QUOTATION';

    // Sequence & Reference Number
    const currentSeq = documentType === 'QUOTATION' ? settings.nextQuotationSequence : settings.nextEstimateSequence;
    const customPrefix = documentType === 'QUOTATION' ? settings.quotationPrefix : settings.estimatePrefix;
    const quotationDate = data.quotationDate || todayStr;
    const quotationNumber = data.quotationNumber || generateQuotationNumber(documentType, quotationDate, currentSeq, customPrefix);

    // Calculate totals
    const lineItems = data.lineItems || [];
    const totals = calculateQuotationTotals(lineItems, settings.standardVatRate);
    const amountInWords = amountToWordsLKR(totals.totalAmount);

    // Calculate valid until
    const validityDays = data.validityDays || settings.defaultValidityDays || 30;
    const qDateObj = new Date(quotationDate);
    const validUntilDate = data.validUntilDate || new Date(qDateObj.getTime() + validityDays * 86400000).toISOString().split('T')[0];

    const newQuotation: Quotation = {
      id: `qt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      documentType,
      quotationNumber,
      revision: data.revision || {
        revisionNumber: 0,
        revisionLabel: 'Rev.00',
        revisionDate: quotationDate,
        revisedBy: data.preparedBy || currentUser || 'Estimating Lead',
        revisionReason: 'Initial commercial creation'
      },
      parentQuotationId: data.parentQuotationId,
      status: data.status || 'DRAFT',
      quotationDate,
      validUntilDate,
      validityDays,
      expectedStartDate: data.expectedStartDate,
      estimatedDuration: data.estimatedDuration,

      supplierName: settings.companyName,
      supplierTin: settings.companyTin,
      supplierVatNumber: settings.companyVatNumber,
      supplierAddress: settings.companyAddress,
      supplierContact: `${settings.companyPhone} / ${settings.companyEmail}`,

      clientId: data.clientId,
      clientSnapshot: data.clientSnapshot,
      clientName: data.clientName || 'General Client',
      clientTin: data.clientTin || '',
      clientVatNumber: data.clientVatNumber,
      clientAddress: data.clientAddress || '',
      clientContactPerson: data.clientContactPerson,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,

      projectCode: data.projectCode,
      projectName: data.projectName,
      scopeOfWork: data.scopeOfWork,
      tenderRef: data.tenderRef,
      rfqNumber: data.rfqNumber,

      currency: 'LKR',
      lineItems: totals.computedItems,
      subtotalAmount: totals.subtotalAmount,
      totalDiscountAmount: totals.totalDiscountAmount,
      taxableAmount: totals.taxableAmount,
      vatRate: settings.standardVatRate,
      vatAmount: totals.vatAmount,
      totalAmount: totals.totalAmount,
      amountInWords,

      paymentTerms: data.paymentTerms || settings.defaultPaymentTerms,
      deliveryTerms: data.deliveryTerms || settings.defaultDeliveryTerms,
      warrantyPeriod: data.warrantyPeriod || settings.defaultWarranty,
      exclusions: data.exclusions || settings.defaultExclusions,
      termsAndConditions: data.termsAndConditions || settings.defaultTermsAndConditions,
      notes: data.notes,

      bankAccountId: data.bankAccountId,
      settlementBankDetails: data.settlementBankDetails,

      preparedBy: data.preparedBy || currentUser || 'Estimating Lead',
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      sentTo: data.sentTo,
      sentAt: data.sentAt,

      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now.toISOString(),
          action: 'CREATED',
          performedBy: data.preparedBy || currentUser || 'System User',
          newStatus: data.status || 'DRAFT',
          notes: `Created ${documentType} ${quotationNumber}`
        }
      ],

      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    // Increment corresponding sequence in settings
    setSettings(prev => ({
      ...prev,
      nextQuotationSequence: documentType === 'QUOTATION' ? prev.nextQuotationSequence + 1 : prev.nextQuotationSequence,
      nextEstimateSequence: documentType === 'ESTIMATE' ? prev.nextEstimateSequence + 1 : prev.nextEstimateSequence
    }));

    setQuotations(prev => [newQuotation, ...prev]);
    return newQuotation;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations(prev =>
      prev.map(q => {
        if (q.id !== id) return q;

        let computedTotals = {
          subtotalAmount: q.subtotalAmount,
          totalDiscountAmount: q.totalDiscountAmount,
          taxableAmount: q.taxableAmount,
          vatAmount: q.vatAmount,
          totalAmount: q.totalAmount,
          computedItems: q.lineItems
        };

        if (updates.lineItems) {
          computedTotals = calculateQuotationTotals(updates.lineItems, updates.vatRate || q.vatRate);
        }

        const updated: Quotation = {
          ...q,
          ...updates,
          lineItems: updates.lineItems ? computedTotals.computedItems : q.lineItems,
          subtotalAmount: updates.lineItems ? computedTotals.subtotalAmount : (updates.subtotalAmount ?? q.subtotalAmount),
          totalDiscountAmount: updates.lineItems ? computedTotals.totalDiscountAmount : (updates.totalDiscountAmount ?? q.totalDiscountAmount),
          taxableAmount: updates.lineItems ? computedTotals.taxableAmount : (updates.taxableAmount ?? q.taxableAmount),
          vatAmount: updates.lineItems ? computedTotals.vatAmount : (updates.vatAmount ?? q.vatAmount),
          totalAmount: updates.lineItems ? computedTotals.totalAmount : (updates.totalAmount ?? q.totalAmount),
          amountInWords: updates.lineItems ? amountToWordsLKR(computedTotals.totalAmount) : (updates.amountInWords ?? q.amountInWords),
          updatedAt: new Date().toISOString(),
          auditTrail: [
            ...q.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: new Date().toISOString(),
              action: 'UPDATED',
              performedBy: currentUser || 'User',
              notes: 'Quotation parameters or line items updated'
            }
          ]
        };

        return updated;
      })
    );
  };

  const createRevision = (parentQuotationId: string, reason: string, user: string): Quotation | null => {
    const parent = quotations.find(q => q.id === parentQuotationId);
    if (!parent) return null;

    const nextRevNum = (parent.revision?.revisionNumber || 0) + 1;
    const revLabel = `Rev.${String(nextRevNum).padStart(2, '0')}`;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const validityDays = parent.validityDays || 30;
    const validUntilDate = new Date(now.getTime() + validityDays * 86400000).toISOString().split('T')[0];

    const revisedQuotation: Quotation = {
      ...parent,
      id: `qt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      revision: {
        revisionNumber: nextRevNum,
        revisionLabel: revLabel,
        revisionDate: todayStr,
        revisedBy: user || currentUser || 'Estimator',
        revisionReason: reason || 'Commercial revision requested'
      },
      parentQuotationId: parent.id,
      status: 'DRAFT',
      quotationDate: todayStr,
      validUntilDate,
      auditTrail: [
        ...parent.auditTrail,
        {
          id: `aud-${Date.now()}`,
          timestamp: now.toISOString(),
          action: 'REVISED',
          performedBy: user || currentUser || 'User',
          previousStatus: parent.status,
          newStatus: 'DRAFT',
          notes: `Created new revision ${revLabel}: ${reason}`
        }
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    setQuotations(prev => [revisedQuotation, ...prev]);
    return revisedQuotation;
  };

  const updateStatus = (id: string, newStatus: QuotationStatus, user: string, notes?: string) => {
    const now = new Date().toISOString();
    setQuotations(prev =>
      prev.map(q => {
        if (q.id !== id) return q;

        const extraUpdates: Partial<Quotation> = {};
        if (newStatus === 'SENT') {
          extraUpdates.sentAt = now;
        } else if (newStatus === 'ACCEPTED') {
          extraUpdates.acceptedAt = now;
        } else if (newStatus === 'REJECTED') {
          extraUpdates.rejectedAt = now;
          extraUpdates.rejectionReason = notes;
        } else if (newStatus === 'CANCELLED') {
          extraUpdates.cancelledAt = now;
          extraUpdates.cancelledBy = user;
          extraUpdates.cancellationReason = notes;
        }

        return {
          ...q,
          ...extraUpdates,
          status: newStatus,
          updatedAt: now,
          auditTrail: [
            ...q.auditTrail,
            {
              id: `aud-${Date.now()}`,
              timestamp: now,
              action: newStatus as any,
              performedBy: user || currentUser || 'User',
              previousStatus: q.status,
              newStatus,
              notes: notes || `Status transitioned to ${newStatus}`
            }
          ]
        };
      })
    );
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  /**
   * Safe, explicit conversion of a Quotation to a Tax Invoice.
   * CRITICAL REQUIREMENT: Strictly NO expense creation!
   * Creates a draft Tax Invoice prefilled from the quotation and marks quotation as CONVERTED.
   */
  const convertToTaxInvoice = (
    quotationId: string,
    user: string
  ): { success: boolean; invoiceId?: string; invoiceSerial?: string; error?: string } => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) {
      return { success: false, error: 'Quotation not found' };
    }

    if (!taxInvoiceContext || !taxInvoiceContext.createInvoice) {
      return { success: false, error: 'Tax Invoice engine is not accessible' };
    }

    try {
      // Map quotation line items to invoice supply items
      const invoiceLineItems = quotation.lineItems.map((item, idx) => ({
        id: `inv-item-${Date.now()}-${idx}`,
        itemNumber: idx + 1,
        description: item.description,
        unitOfMeasure: item.unitOfMeasure,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxableValue: item.taxableValue,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        totalAmount: item.totalAmount
      }));

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      // Create Draft Tax Invoice (DOES NOT TOUCH EXPENSES)
      const createdInvoice = taxInvoiceContext.createInvoice(
        {
          clientId: quotation.clientId,
          purchaserSnapshot: quotation.clientSnapshot as any,
          invoiceDate: today,
          supplyDate: today,
          dueDate,
          purchaserName: quotation.clientName,
          purchaserTin: quotation.clientTin,
          purchaserVatNumber: quotation.clientVatNumber,
          purchaserAddress: quotation.clientAddress,
          purchaserContactPerson: quotation.clientContactPerson,
          purchaserPhone: quotation.clientPhone,
          purchaserEmail: quotation.clientEmail,
          projectCode: quotation.projectCode || 'PRJ-GEN-01',
          projectName: quotation.projectName || 'Commercial Works',
          purchaseOrderRef: quotation.tenderRef || quotation.rfqNumber,
          billingDescription: quotation.scopeOfWork || `Derived from Quotation ${quotation.quotationNumber} (${quotation.revision.revisionLabel})`,
          lineItems: invoiceLineItems,
          bankAccountId: quotation.bankAccountId,
          settlementBankDetails: quotation.settlementBankDetails,
          notes: `Converted from Quotation ${quotation.quotationNumber} (${quotation.revision.revisionLabel}). Original validity: ${quotation.validUntilDate}.`
        },
        false // create as draft, do not issue immediately
      );

      // Update Quotation state to CONVERTED
      const now = new Date().toISOString();
      updateQuotation(quotation.id, {
        status: 'CONVERTED',
        convertedInvoiceId: createdInvoice.id,
        convertedInvoiceNumber: createdInvoice.serialNumber,
        convertedAt: now,
        convertedBy: user || currentUser || 'User'
      });

      return {
        success: true,
        invoiceId: createdInvoice.id,
        invoiceSerial: createdInvoice.serialNumber
      };
    } catch (err: any) {
      console.error('Failed to convert quotation to Tax Invoice:', err);
      return {
        success: false,
        error: err.message || 'Failed to convert quotation'
      };
    }
  };

  const downloadQuotationPdf = (quotation: Quotation) => {
    try {
      const doc = generateQuotationPdf(quotation);
      const filename = `${quotation.quotationNumber}_${quotation.revision?.revisionLabel || 'Rev00'}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Unable to generate PDF file. Please verify document details.');
    }
  };

  const printQuotationPdf = (quotation: Quotation) => {
    try {
      const doc = generateQuotationPdf(quotation);
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl.toString();
      document.body.appendChild(iframe);
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Failed to print PDF:', err);
      alert('Unable to send to printer.');
    }
  };

  const updateSettings = (newSettings: Partial<QuotationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const clearQuotationsHistory = (filterStatus?: string) => {
    if (filterStatus && filterStatus !== 'ALL') {
      setQuotations(prev => prev.filter(q => q.status !== filterStatus));
    } else {
      setQuotations([]);
    }
  };

  const resetQuotationsToDefault = () => {
    setQuotations(INITIAL_QUOTATIONS);
    setSettings(DEFAULT_QUOTATION_SETTINGS);
  };

  return (
    <QuotationContext.Provider
      value={{
        quotations,
        settings,
        activeTab,
        setActiveTab,
        createQuotation,
        updateQuotation,
        createRevision,
        deleteQuotation,
        updateStatus,
        convertToTaxInvoice,
        previewNextNumber,
        downloadQuotationPdf,
        printQuotationPdf,
        updateSettings,
        clearQuotationsHistory,
        resetQuotationsToDefault
      }}
    >
      {children}
    </QuotationContext.Provider>
  );
};

export const useQuotation = (): QuotationContextType => {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error('useQuotation must be used within a QuotationProvider');
  }
  return context;
};
