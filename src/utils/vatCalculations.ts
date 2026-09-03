/**
 * Centralized VAT Configuration and Calculation Utilities
 * Standard VAT Rate = 18% (EMA Construction / Corporate Suite)
 * 
 * Rules:
 * A. EXCLUDING_VAT:
 *    NET = enteredAmount
 *    VAT = NET * (VAT_RATE / 100)
 *    GROSS = NET + VAT
 * 
 * B. INCLUDING_VAT:
 *    GROSS = enteredAmount
 *    VAT = GROSS * VAT_RATE / (100 + VAT_RATE)
 *    NET = GROSS - VAT
 * 
 * C. VAT_NOT_APPLICABLE:
 *    NET = enteredAmount
 *    VAT = 0
 *    GROSS = enteredAmount
 */

export const VAT_RATE = 18; // Centralized VAT standard rate (18%)

export type VatTreatment =
  | 'EXCLUDING_VAT'
  | 'INCLUDING_VAT'
  | 'VAT_NOT_APPLICABLE';

export interface VatCalculationResult {
  enteredAmount: number;
  vatTreatment: VatTreatment;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatApplicable: boolean;
}

export const VAT_TREATMENT_LABELS: Record<VatTreatment, string> = {
  EXCLUDING_VAT: 'Excluding VAT',
  INCLUDING_VAT: 'Including VAT',
  VAT_NOT_APPLICABLE: 'VAT Not Applicable'
};

export const VAT_TREATMENT_OPTIONS: { value: VatTreatment; label: string; description: string }[] = [
  {
    value: 'EXCLUDING_VAT',
    label: 'Excluding VAT',
    description: 'Entered amount is Net. 18% VAT will be added to reach Total.'
  },
  {
    value: 'INCLUDING_VAT',
    label: 'Including VAT',
    description: 'Entered amount is Gross Total. 18/118 VAT will be extracted.'
  },
  {
    value: 'VAT_NOT_APPLICABLE',
    label: 'VAT Not Applicable',
    description: 'Non-VATable expense or zero-rated transaction.'
  }
];

/**
 * Rounds monetary amounts cleanly to 2 decimal places.
 */
export const round2 = (val: number): number => {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Formats monetary amounts in Sri Lankan Rupees (LKR) with 2 decimal places.
 */
export const formatLkr = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) return 'LKR 0.00';
  return `LKR ${Number(amount).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Calculates NET, VAT, and GROSS amounts based on the entered amount and VAT treatment.
 * Does NOT simply multiply AMOUNT by 1.18 in every case.
 */
export const calculateVat = (
  enteredAmount: number,
  vatTreatment: VatTreatment = 'EXCLUDING_VAT',
  vatRate: number = VAT_RATE
): VatCalculationResult => {
  const safeAmount = isNaN(enteredAmount) || enteredAmount < 0 ? 0 : round2(enteredAmount);
  const safeRate = isNaN(vatRate) || vatRate < 0 ? 0 : vatRate;

  if (vatTreatment === 'VAT_NOT_APPLICABLE' || safeRate === 0) {
    return {
      enteredAmount: safeAmount,
      vatTreatment: 'VAT_NOT_APPLICABLE',
      vatRate: 0,
      netAmount: safeAmount,
      vatAmount: 0,
      grossAmount: safeAmount,
      vatApplicable: false
    };
  }

  if (vatTreatment === 'INCLUDING_VAT') {
    // Formula B:
    // GROSS = enteredAmount
    // VAT = GROSS * VAT_RATE / (100 + VAT_RATE)
    // NET = GROSS - VAT
    const grossAmount = safeAmount;
    const vatAmount = round2((grossAmount * safeRate) / (100 + safeRate));
    const netAmount = round2(grossAmount - vatAmount);

    return {
      enteredAmount: safeAmount,
      vatTreatment: 'INCLUDING_VAT',
      vatRate: safeRate,
      netAmount,
      vatAmount,
      grossAmount,
      vatApplicable: true
    };
  }

  // Formula A (Default: EXCLUDING_VAT):
  // NET = enteredAmount
  // VAT = NET * (VAT_RATE / 100)
  // GROSS = NET + VAT
  const netAmount = safeAmount;
  const vatAmount = round2(netAmount * (safeRate / 100));
  const grossAmount = round2(netAmount + vatAmount);

  return {
    enteredAmount: safeAmount,
    vatTreatment: 'EXCLUDING_VAT',
    vatRate: safeRate,
    netAmount,
    vatAmount,
    grossAmount,
    vatApplicable: true
  };
};

/**
 * Validates whether user-supplied or imported Net, VAT, and Gross match the VAT treatment.
 * Returns true if mathematically consistent within acceptable tolerance (e.g. 0.05 LKR rounding).
 */
export const validateVatIntegrity = (
  enteredAmount: number,
  treatment: VatTreatment,
  rate: number,
  suppliedNet?: number,
  suppliedVat?: number,
  suppliedGross?: number,
  tolerance: number = 0.05
): { isValid: boolean; expected: VatCalculationResult; mismatchReason?: string } => {
  const expected = calculateVat(enteredAmount, treatment, rate);

  if (suppliedNet !== undefined && Math.abs(suppliedNet - expected.netAmount) > tolerance) {
    return {
      isValid: false,
      expected,
      mismatchReason: `Net amount mismatch: supplied ${suppliedNet}, calculated ${expected.netAmount}`
    };
  }

  if (suppliedVat !== undefined && Math.abs(suppliedVat - expected.vatAmount) > tolerance) {
    return {
      isValid: false,
      expected,
      mismatchReason: `VAT amount mismatch: supplied ${suppliedVat}, calculated ${expected.vatAmount}`
    };
  }

  if (suppliedGross !== undefined && Math.abs(suppliedGross - expected.grossAmount) > tolerance) {
    return {
      isValid: false,
      expected,
      mismatchReason: `Gross amount mismatch: supplied ${suppliedGross}, calculated ${expected.grossAmount}`
    };
  }

  return { isValid: true, expected };
};

/**
 * Determines if an invoice is overdue based on due date and remaining balance.
 */
export const isInvoiceOverdue = (
  dueDate?: string,
  balanceDue?: number,
  status?: string
): boolean => {
  if (status === 'Cancelled' || status === 'Paid') return false;
  if (!dueDate) return false;
  if ((balanceDue ?? 0) <= 0) return false;

  const todayStr = new Date().toISOString().split('T')[0];
  return dueDate < todayStr;
};
