import { QuotationItem, Quotation, QuotationSettings, QuotationType } from '../types/quotationTypes';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Formats a Date object or string to formal display format: "DD Month YYYY"
 * e.g. "12 September 2026"
 */
export function formatQuotationDate(dateInput?: string | Date): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  let day = d.getDate();
  let month = MONTH_NAMES[d.getMonth()];
  let year = d.getFullYear();

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const parts = dateInput.split('T')[0].split('-');
    year = parseInt(parts[0], 10);
    const mIdx = parseInt(parts[1], 10) - 1;
    month = MONTH_NAMES[mIdx] || MONTH_NAMES[0];
    day = parseInt(parts[2], 10);
  }

  return `${String(day).padStart(2, '0')} ${month} ${year}`;
}

/**
 * Generates an official, sequential Quotation or Estimate reference number:
 * Format: QT-YYYY-XXXXX or EST-YYYY-XXXXX
 */
export function generateQuotationNumber(
  type: QuotationType,
  dateInput: string | Date,
  sequenceNumber: number,
  customPrefix?: string
): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  let year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();

  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    year = parseInt(dateInput.split('-')[0], 10);
  }

  const prefix = customPrefix || (type === 'QUOTATION' ? 'QT' : 'EST');
  const cleanSeq = String(Math.max(1, Math.floor(sequenceNumber))).padStart(5, '0');

  return `${prefix}-${year}-${cleanSeq}`;
}

/**
 * Calculates line item and total amounts for quotations/estimates
 */
export function calculateQuotationTotals(
  lineItems: QuotationItem[],
  vatRate = 18
): {
  subtotalAmount: number;
  totalDiscountAmount: number;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  computedItems: QuotationItem[];
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalVat = 0;

  const computedItems = lineItems.map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.unitPrice) || 0;
    const itemSubtotal = Math.round(qty * rate * 100) / 100;

    // Calculate discount
    let itemDiscount = 0;
    if (item.discountPercent !== undefined && item.discountPercent > 0) {
      itemDiscount = Math.round(itemSubtotal * (Number(item.discountPercent) / 100) * 100) / 100;
    } else if (item.discountAmount !== undefined && item.discountAmount > 0) {
      itemDiscount = Math.round(Number(item.discountAmount) * 100) / 100;
    }

    const taxableValue = Math.max(0, Math.round((itemSubtotal - itemDiscount) * 100) / 100);
    const itemVatRate = item.vatRate !== undefined ? Number(item.vatRate) : vatRate;
    const itemVatAmount = Math.round(taxableValue * (itemVatRate / 100) * 100) / 100;
    const itemTotal = Math.round((taxableValue + itemVatAmount) * 100) / 100;

    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    totalTaxable += taxableValue;
    totalVat += itemVatAmount;

    return {
      ...item,
      itemNumber: index + 1,
      quantity: qty,
      unitPrice: rate,
      discountAmount: itemDiscount,
      taxableValue,
      vatRate: itemVatRate,
      vatAmount: itemVatAmount,
      totalAmount: itemTotal
    };
  });

  const totalAmount = Math.round((totalTaxable + totalVat) * 100) / 100;

  return {
    subtotalAmount: Math.round(subtotal * 100) / 100,
    totalDiscountAmount: Math.round(totalDiscount * 100) / 100,
    taxableAmount: Math.round(totalTaxable * 100) / 100,
    vatAmount: Math.round(totalVat * 100) / 100,
    totalAmount,
    computedItems
  };
}

/**
 * Checks if a quotation has passed its validity expiration date
 */
export function isQuotationExpired(validUntilDate: string): boolean {
  if (!validUntilDate) return false;
  const today = new Date().toISOString().split('T')[0];
  return validUntilDate < today;
}

/**
 * Converts financial amount in LKR to formal words
 */
export function amountToWordsLKR(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Sri Lankan Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + ' ';
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) {
        str += singleDigits[n % 10] + ' ';
      }
    } else if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let result = '';

  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (billions > 0) {
    result += convertHundreds(billions) + ' Billion ';
  }
  if (millions > 0) {
    result += convertHundreds(millions) + ' Million ';
  }
  if (thousands > 0) {
    result += convertHundreds(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    result += convertHundreds(remainder) + ' ';
  }

  result = result.trim();
  if (!result) {
    result = 'Zero';
  }

  let finalWords = `Sri Lankan Rupees ${result}`;

  if (decimalPart > 0) {
    finalWords += ` and ${convertHundreds(decimalPart)} Cents`;
  }

  return `${finalWords} Only`;
}

/**
 * Resolves full client address from quotation snapshot or client list
 */
export function resolveClientAddress(quotation: Quotation, clients: any[] = []): string {
  if (quotation.clientSnapshot?.registeredAddress) {
    return quotation.clientSnapshot.registeredAddress;
  }
  if (quotation.clientAddress && quotation.clientAddress.trim() !== '') {
    return quotation.clientAddress;
  }

  if (quotation.clientId && clients.length > 0) {
    const matched = clients.find(c => c.id === quotation.clientId);
    if (matched) {
      const reg = matched.registeredAddress;
      if (reg) {
        const parts = [
          reg.line1,
          reg.line2,
          reg.city,
          reg.district,
          reg.province,
          reg.postalCode,
          reg.country
        ].map((p: any) => p?.trim()).filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
      if (matched.address) return matched.address;
    }
  }

  return 'Colombo, Western Province, Sri Lanka';
}

export const DEFAULT_QUOTATION_SETTINGS: QuotationSettings = {
  quotationPrefix: 'QT',
  estimatePrefix: 'EST',
  entityCode: 'EMA',
  nextQuotationSequence: 4, // 00004
  nextEstimateSequence: 3, // 00003
  standardVatRate: 18,
  defaultValidityDays: 30,
  companyName: 'Apex Global Logistics Corp / EMA Construction (Pvt) Ltd',
  companyTin: '102938475',
  companyVatNumber: '102938475-7000',
  companyAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka',
  companyPhone: '+94 11 244 8900',
  companyEmail: 'commercial@apexlogistics.lk',
  defaultPaymentTerms: '30% Advance on Acceptance, 60% Progress Milestones against measurement, 10% on Handover & Final Inspection.',
  defaultDeliveryTerms: 'Site mobilization within 14 calendar days from signing of agreement and receipt of advance.',
  defaultWarranty: '12 Months Defects Liability Period (DLP) covering structural craftsmanship and equipment installations.',
  defaultExclusions: 'Statutory government approval levies, environmental impact assessment permits (by employer), site power & water connection charges.',
  defaultTermsAndConditions: '1. Quotation prices are strictly valid for the validity duration specified above.\n2. Variations or site condition divergences shall be billed on mutual unit rate revision.\n3. Taxes are charged in accordance with Inland Revenue statutory provisions in effect at time of invoicing.\n4. Workmanship conforms to ICTAD / CIDA Standard Specifications for Building and Civil Works.',
  defaultBankDetails: 'Commercial Bank of Ceylon PLC • Echelon Square Corporate Branch • A/C 1000-8491-0028 • SWIFT: CCEYLKFX'
};

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'qt-001',
    documentType: 'QUOTATION',
    quotationNumber: 'QT-2026-00001',
    revision: {
      revisionNumber: 0,
      revisionLabel: 'Rev.00',
      revisionDate: '2026-09-02',
      revisedBy: 'Kasun Perera (Head of Estimating)',
      revisionReason: 'Initial commercial submission'
    },
    status: 'ACCEPTED',
    quotationDate: '2026-09-02',
    validUntilDate: '2026-10-02',
    validityDays: 30,
    expectedStartDate: '2026-10-15',
    estimatedDuration: '4 Months',
    supplierName: 'Apex Global Logistics Corp / EMA Construction (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / commercial@apexlogistics.lk',
    clientId: 'client-portcity',
    clientName: 'Colombo Port City Development Authority',
    clientTin: '204918274',
    clientVatNumber: '204918274-7000',
    clientAddress: 'Block A, Port City Boulevard, Colombo 01, Sri Lanka',
    clientContactPerson: 'Eng. K. Wickramasinghe (Chief Engineer)',
    clientPhone: '+94 11 755 4000',
    clientEmail: 'procurement@portcity.lk',
    projectCode: 'PRJ-PORT-01',
    projectName: 'Colombo Port Expansion Phase II',
    scopeOfWork: 'Breakwater Core Armor Rock Placement and Bored Piling Reinforcement Package C',
    tenderRef: 'CPCDA/ENG/2026/08',
    rfqNumber: 'RFQ-PORT-2026-88',
    lineItems: [
      {
        id: 'item-1',
        itemNumber: 1,
        description: 'Deep Water Quay Wall Concrete Casting - High Strength Marine Grade C40/50',
        unitOfMeasure: 'm³',
        quantity: 350,
        unitPrice: 18500,
        discountPercent: 2,
        discountAmount: 129500,
        taxableValue: 6345500,
        vatRate: 18,
        vatAmount: 1142190,
        totalAmount: 7487690
      },
      {
        id: 'item-2',
        itemNumber: 2,
        description: 'Bored Piling Reinforcement & Ultrasonic Non-Destructive Integrity Testing',
        unitOfMeasure: 'Nos',
        quantity: 60,
        unitPrice: 32000,
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 1920000,
        vatRate: 18,
        vatAmount: 345600,
        totalAmount: 2265600
      }
    ],
    currency: 'LKR',
    subtotalAmount: 8395000,
    totalDiscountAmount: 129500,
    taxableAmount: 8265500,
    vatRate: 18,
    vatAmount: 1487790,
    totalAmount: 9753290,
    amountInWords: 'Sri Lankan Rupees Nine Million Seven Hundred Fifty Three Thousand Two Hundred and Ninety Only',
    paymentTerms: '30% Advance on Acceptance, 60% Progress Milestones against measurement, 10% on Handover.',
    deliveryTerms: 'Mobilization within 14 calendar days of advance payment clearance.',
    warrantyPeriod: '12 Months Defects Liability Period (DLP).',
    exclusions: 'Government authority environmental clearance fees and site permanent utility tariffs.',
    termsAndConditions: 'Valid for 30 calendar days. Workmanship strictly complies with CIDA/ICTAD SP-01.',
    notes: 'Submitted following joint site reconnaissance and soil sounding verification.',
    preparedBy: 'Kasun Perera (Head of Estimating)',
    approvedBy: 'Director of Civil Engineering',
    approvedAt: '2026-09-02T14:30:00Z',
    sentTo: 'procurement@portcity.lk',
    sentAt: '2026-09-03T09:00:00Z',
    acceptedAt: '2026-09-08T11:20:00Z',
    auditTrail: [
      {
        id: 'aud-1',
        timestamp: '2026-09-02T10:00:00Z',
        action: 'CREATED',
        performedBy: 'Kasun Perera',
        notes: 'Draft quotation prepared from preliminary bill of quantities'
      },
      {
        id: 'aud-2',
        timestamp: '2026-09-03T09:00:00Z',
        action: 'SENT',
        performedBy: 'Kasun Perera',
        notes: 'Dispatched official PDF commercial proposal to client'
      },
      {
        id: 'aud-3',
        timestamp: '2026-09-08T11:20:00Z',
        action: 'ACCEPTED',
        performedBy: 'Client Acceptance',
        notes: 'Client confirmed procurement award via formal Letter of Acceptance'
      }
    ],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-08T11:20:00Z'
  },
  {
    id: 'qt-002',
    documentType: 'QUOTATION',
    quotationNumber: 'QT-2026-00002',
    revision: {
      revisionNumber: 1,
      revisionLabel: 'Rev.01',
      revisionDate: '2026-09-06',
      revisedBy: 'T. Samarasinghe (Senior Estimator)',
      revisionReason: 'Incorporated revised client earthworks grading specifications'
    },
    parentQuotationId: 'qt-002-prev',
    status: 'SENT',
    quotationDate: '2026-09-06',
    validUntilDate: '2026-10-06',
    validityDays: 30,
    expectedStartDate: '2026-10-20',
    estimatedDuration: '60 Calendar Days',
    supplierName: 'Apex Global Logistics Corp / EMA Construction (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / commercial@apexlogistics.lk',
    clientName: 'Access Infrastructure Holdings PLC',
    clientTin: '105829147',
    clientVatNumber: '105829147-7000',
    clientAddress: 'Access Towers, 278 Union Place, Colombo 02, Sri Lanka',
    clientContactPerson: 'Mr. Rohan Fernando (Commercial Director)',
    clientPhone: '+94 11 230 2300',
    clientEmail: 'tenders@access.lk',
    projectCode: 'PRJ-ACC-03',
    projectName: 'Southern Expressway Drainage & Culvert Rehabilitation',
    scopeOfWork: 'Precast Box Culvert Supply, Heavy Excavation & Subbase Stabilization',
    tenderRef: 'AIH/SUB/2026/044',
    rfqNumber: 'RFQ-AIH-771',
    lineItems: [
      {
        id: 'item-201',
        itemNumber: 1,
        description: 'Supply & Placement of Precast Reinforced Box Culverts (2.0m x 2.0m)',
        unitOfMeasure: 'Units',
        quantity: 24,
        unitPrice: 165000,
        discountPercent: 3,
        discountAmount: 118800,
        taxableValue: 3841200,
        vatRate: 18,
        vatAmount: 691416,
        totalAmount: 4532616
      },
      {
        id: 'item-202',
        itemNumber: 2,
        description: 'Hydraulic Excavator Trenching, Bedding Gravel & Geotextile Liner (Grade 300)',
        unitOfMeasure: 'm',
        quantity: 180,
        unitPrice: 9500,
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 1710000,
        vatRate: 18,
        vatAmount: 307800,
        totalAmount: 2017800
      }
    ],
    currency: 'LKR',
    subtotalAmount: 5670000,
    totalDiscountAmount: 118800,
    taxableAmount: 5551200,
    vatRate: 18,
    vatAmount: 999216,
    totalAmount: 6550416,
    amountInWords: 'Sri Lankan Rupees Six Million Five Hundred Fifty Thousand Four Hundred and Sixteen Only',
    paymentTerms: '20% Mobilization advance, monthly IPC progress valuations, 5% retention for 12 months.',
    deliveryTerms: 'Subcontractor site team arrival within 10 days of notice to proceed.',
    warrantyPeriod: '12 Months Defects Liability Guarantee.',
    exclusions: 'Traffic diversion police permits (handled by Employer).',
    termsAndConditions: 'Based on ICTAD Conditions of Subcontract. Valid for 30 calendar days.',
    preparedBy: 'T. Samarasinghe (Senior Estimator)',
    approvedBy: 'General Manager (Operations)',
    approvedAt: '2026-09-06T15:00:00Z',
    sentTo: 'tenders@access.lk',
    sentAt: '2026-09-07T08:30:00Z',
    auditTrail: [
      {
        id: 'aud-21',
        timestamp: '2026-09-06T11:00:00Z',
        action: 'REVISED',
        performedBy: 'T. Samarasinghe',
        notes: 'Created Revision 01 reflecting updated box culvert diameter specifications'
      },
      {
        id: 'aud-22',
        timestamp: '2026-09-07T08:30:00Z',
        action: 'SENT',
        performedBy: 'T. Samarasinghe',
        notes: 'Submitted Rev.01 proposal package to Access Infrastructure Procurement'
      }
    ],
    createdAt: '2026-09-06T11:00:00Z',
    updatedAt: '2026-09-07T08:30:00Z'
  },
  {
    id: 'est-001',
    documentType: 'ESTIMATE',
    quotationNumber: 'EST-2026-00001',
    revision: {
      revisionNumber: 0,
      revisionLabel: 'Rev.00',
      revisionDate: '2026-09-04',
      revisedBy: 'Mahesh Bandara (Fleet & Plant Manager)',
      revisionReason: 'Preliminary budget estimation for heavy fleet haulage'
    },
    status: 'DRAFT',
    quotationDate: '2026-09-04',
    validUntilDate: '2026-10-04',
    validityDays: 30,
    expectedStartDate: '2026-10-01',
    estimatedDuration: '45 Days',
    supplierName: 'Apex Global Logistics Corp / EMA Construction (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / commercial@apexlogistics.lk',
    clientName: 'Magampura Port Management Company',
    clientTin: '194820194',
    clientVatNumber: '194820194-7000',
    clientAddress: 'Hambantota International Port, Mirijjawila, Hambantota',
    clientContactPerson: 'Capt. N. Jayawardena (Harbour Master)',
    clientPhone: '+94 47 222 3400',
    clientEmail: 'fleet.operations@hipg.lk',
    projectCode: 'PRJ-HIPG-01',
    projectName: 'Hambantota Port Heavy Equipment Haulage & Rigging',
    scopeOfWork: 'Heavy Low-Bed Trailer Haulage and Mobile Crane Lifting of Gantry Cranes Components',
    tenderRef: 'HIPG/EST/2026/19',
    lineItems: [
      {
        id: 'est-item-1',
        itemNumber: 1,
        description: 'Multi-Axle Hydraulic Low-Bed Transport - Colombo WTC to Hambantota HIP (Round Trip x 6 trips)',
        unitOfMeasure: 'Trips',
        quantity: 6,
        unitPrice: 425000,
        discountPercent: 5,
        discountAmount: 127500,
        taxableValue: 2422500,
        vatRate: 18,
        vatAmount: 436050,
        totalAmount: 2858550
      },
      {
        id: 'est-item-2',
        itemNumber: 2,
        description: '80-Ton All Terrain Mobile Crane Rental with Certified Rigging Crew (100 Operating Hours)',
        unitOfMeasure: 'Hours',
        quantity: 100,
        unitPrice: 22000,
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 2200000,
        vatRate: 18,
        vatAmount: 396000,
        totalAmount: 2596000
      }
    ],
    currency: 'LKR',
    subtotalAmount: 4750000,
    totalDiscountAmount: 127500,
    taxableAmount: 4622500,
    vatRate: 18,
    vatAmount: 832050,
    totalAmount: 5454550,
    amountInWords: 'Sri Lankan Rupees Five Million Four Hundred Fifty Four Thousand Five Hundred and Fifty Only',
    paymentTerms: 'Preliminary rough-order-of-magnitude estimate for client budgetary planning.',
    deliveryTerms: 'Equipment dispatch subject to 7 days prior road transport clearance notice.',
    warrantyPeriod: 'Transit marine liability insurance cover included.',
    exclusions: 'Expressway overweight toll surcharges (billed at actuals against RDA receipt).',
    termsAndConditions: 'Non-binding engineering budgetary estimate. Formal rates confirmed on technical site survey.',
    notes: 'Budgetary cost estimate requested for fiscal allocation approval.',
    preparedBy: 'Mahesh Bandara (Fleet & Plant Manager)',
    auditTrail: [
      {
        id: 'aud-31',
        timestamp: '2026-09-04T16:00:00Z',
        action: 'CREATED',
        performedBy: 'Mahesh Bandara',
        notes: 'Generated draft fleet haulage cost estimate'
      }
    ],
    createdAt: '2026-09-04T16:00:00Z',
    updatedAt: '2026-09-04T16:00:00Z'
  },
  {
    id: 'qt-003',
    documentType: 'QUOTATION',
    quotationNumber: 'QT-2026-00003',
    revision: {
      revisionNumber: 0,
      revisionLabel: 'Rev.00',
      revisionDate: '2026-08-20',
      revisedBy: 'Kasun Perera',
      revisionReason: 'Tender quote'
    },
    status: 'EXPIRED',
    quotationDate: '2026-08-20',
    validUntilDate: '2026-09-05',
    validityDays: 16,
    supplierName: 'Apex Global Logistics Corp / EMA Construction (Pvt) Ltd',
    supplierTin: '102938475',
    supplierVatNumber: '102938475-7000',
    supplierAddress: 'Level 14, West Tower, World Trade Center, Echelon Square, Colombo 01',
    supplierContact: '+94 11 244 8900 / commercial@apexlogistics.lk',
    clientName: 'Sanken Construction (Pvt) Ltd',
    clientTin: '100481928',
    clientVatNumber: '100481928-7000',
    clientAddress: 'No. 295, Madampitiya Road, Colombo 14',
    clientContactPerson: 'Mr. Lalith Weerasinghe',
    clientPhone: '+94 11 252 2841',
    clientEmail: 'commercial@sanken.lk',
    projectCode: 'PRJ-SNK-02',
    projectName: 'Cinnamon Life Luxury Residence Partitioning',
    scopeOfWork: 'Drywall partitioning and architectural acoustic ceilings',
    lineItems: [
      {
        id: 'item-301',
        itemNumber: 1,
        description: 'Fire-Rated Gypsum Board Partitioning with Sound Insulation (120 min rated)',
        unitOfMeasure: 'm²',
        quantity: 850,
        unitPrice: 4200,
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 3570000,
        vatRate: 18,
        vatAmount: 642600,
        totalAmount: 4212600
      }
    ],
    currency: 'LKR',
    subtotalAmount: 3570000,
    totalDiscountAmount: 0,
    taxableAmount: 3570000,
    vatRate: 18,
    vatAmount: 642600,
    totalAmount: 4212600,
    amountInWords: 'Sri Lankan Rupees Four Million Two Hundred Twelve Thousand Six Hundred Only',
    paymentTerms: '30% Advance, progress claims fortnightly.',
    deliveryTerms: 'Installation over 3 weeks.',
    warrantyPeriod: '6 Months workmanship warranty.',
    termsAndConditions: 'Quotation expired on 05 September 2026.',
    preparedBy: 'Kasun Perera',
    sentTo: 'commercial@sanken.lk',
    sentAt: '2026-08-20T10:00:00Z',
    auditTrail: [
      {
        id: 'aud-41',
        timestamp: '2026-08-20T10:00:00Z',
        action: 'SENT',
        performedBy: 'Kasun Perera',
        notes: 'Quotation sent to Sanken procurement'
      },
      {
        id: 'aud-42',
        timestamp: '2026-09-06T00:00:00Z',
        action: 'EXPIRED',
        performedBy: 'System Watchdog',
        notes: 'Validity period expired without formal acceptance'
      }
    ],
    createdAt: '2026-08-20T09:00:00Z',
    updatedAt: '2026-09-06T00:00:00Z'
  }
];
