import { Letter, LetterDirection } from '../types/correspondenceTypes';

/**
 * Intelligent Client Affix Extractor.
 * Extracts standard acronyms (e.g., RDA, CECB, SLPA, MAGA) from client names.
 */
export const extractClientAffix = (clientName?: string): string => {
  if (!clientName || !clientName.trim()) return 'CLIENT';
  const name = clientName.trim();

  // 1. Check for explicit acronym in parentheses: e.g. "Road Development Authority (RDA)"
  const parenMatch = name.match(/\(([A-Za-z0-9\-_]{2,10})\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].toUpperCase();
  }

  // 2. Known engineering and client organizations, statutory authorities & banks
  const lower = name.toLowerCase();

  // Statutory & Government Authorities (CGF, IRD, CIDA, CEA, RDD)
  if (lower.includes('construction guarantee fund') || lower.includes('cgf')) return 'CGF';
  if (lower.includes('inland revenue') || lower.includes('ird')) return 'IRD';
  if (lower.includes('construction industry development') || lower.includes('cida') || lower.includes('ictad')) return 'CIDA';
  if (lower.includes('central environmental') || lower.includes('cea')) return 'CEA';
  if (lower.includes('road development department') || lower.includes('rdd')) return 'RDD';

  // Major Engineering Clients & Employers
  if (lower.includes('road development authority') || lower.includes('rda')) return 'RDA';
  if (lower.includes('central engineering consultancy') || lower.includes('cecb')) return 'CECB';
  if (lower.includes('ports authority') || lower.includes('slpa')) return 'SLPA';
  if (lower.includes('water supply') || lower.includes('nwsdb')) return 'NWSDB';
  if (lower.includes('electricity board') || lower.includes('ceb')) return 'CEB';
  if (lower.includes('maga engineering') || lower.includes('maga')) return 'MAGA';
  if (lower.includes('access engineering') || lower.includes('access')) return 'ACCESS';
  if (lower.includes('provincial road') || lower.includes('prda')) return 'PRDA';
  if (lower.includes('urban development') || lower.includes('uda')) return 'UDA';

  // Recognized Banks
  if (lower.includes('commercial bank') || lower.includes('combank') || lower.includes('comb')) return 'COMB';
  if (lower.includes('bank of ceylon') || lower.includes('boc')) return 'BOC';
  if (lower.includes('hatton national') || lower.includes('hnb')) return 'HNB';
  if (lower.includes('sampath bank') || lower.includes('sampath') || lower.includes('samp')) return 'SAMP';
  if (lower.includes('seylan bank') || lower.includes('seylan') || lower.includes('seyb')) return 'SEYB';
  if (lower.includes('nations trust') || lower.includes('ntb')) return 'NTB';
  if (lower.includes('dfcc bank') || lower.includes('dfcc')) return 'DFCC';
  if (lower.includes('national development bank') || lower.includes('ndb')) return 'NDB';
  if (lower.includes('people\'s bank') || lower.includes('peoples bank') || lower.includes('peop')) return 'PEOP';
  if (lower.includes('pan asia') || lower.includes('pabc')) return 'PABC';
  if (lower.includes('standard chartered') || lower.includes('scb')) return 'SCB';
  if (lower.includes('hongkong and shanghai') || lower.includes('hsbc')) return 'HSBC';
  if (lower.includes('citibank') || lower.includes('citi')) return 'CITI';
  if (lower.includes('union bank') || lower.includes('ubc')) return 'UBC';
  if (lower.includes('amana bank') || lower.includes('amana')) return 'AMANA';
  if (lower.includes('cargills bank') || lower.includes('cbl')) return 'CBL';
  if (lower.includes('sanasa') || lower.includes('sdb')) return 'SDB';
  if (lower.includes('national savings bank') || lower.includes('nsb')) return 'NSB';
  if (lower.includes('regional development bank') || lower.includes('rdb')) return 'RDB';
  if (lower.includes('housing development finance') || lower.includes('hdfc')) return 'HDFC';
  if (lower.includes('state mortgage') || lower.includes('smib')) return 'SMIB';

  // 3. Extract initials of uppercase words
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !['and', 'the', 'of', 'for', 'ltd', 'pvt', 'plc', 'co'].includes(w.toLowerCase()));

  if (words.length >= 2) {
    const acronym = words.map(w => w[0]).join('').toUpperCase();
    if (acronym.length >= 2 && acronym.length <= 6) {
      return acronym;
    }
  }

  // 4. Default: first clean word or sanitized string
  const cleanFirst = (words[0] || name).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return cleanFirst.slice(0, 6) || 'CLIENT';
};

/**
 * Intelligent Project Affix Extractor.
 * Strips out whitespace, dashes, and extra chars to produce standard project affixes like PIDM26, CWP01.
 */
export const extractProjectAffix = (projectCode?: string, fallback = 'GEN'): string => {
  if (!projectCode || !projectCode.trim()) return fallback;
  const sanitized = projectCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return sanitized || fallback;
};

/**
 * Extracts standard acronym/initials for receiver's designation or direction:
 * e.g., "Provincial Director" -> "PD", "Chief Engineer" -> "CE", "Branch Manager" -> "BM", "Director General" -> "DG"
 */
export const extractReceiverInitials = (designation?: string): string => {
  if (!designation || !designation.trim()) return 'DIR';
  const text = designation.trim();

  // 1. Check for explicit acronym in parentheses: e.g. "Provincial Director (PD)"
  const parenMatch = text.match(/\(([A-Za-z0-9\-_]{2,6})\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].toUpperCase();
  }

  const lower = text.toLowerCase();
  // Known recipient directions / designations
  if (lower.includes('provincial director')) return 'PD';
  if (lower.includes('chief engineer')) return 'CE';
  if (lower.includes('executive engineer')) return 'EE';
  if (lower.includes('resident engineer')) return 'RE';
  if (lower.includes('project director')) return 'PD';
  if (lower.includes('project manager')) return 'PM';
  if (lower.includes('director general')) return 'DG';
  if (lower.includes('commissioner general')) return 'CG';
  if (lower.includes('deputy commissioner')) return 'DC';
  if (lower.includes('branch manager')) return 'BM';
  if (lower.includes('general manager')) return 'GM';
  if (lower.includes('chairman')) return 'CH';
  if (lower.includes('credit officer')) return 'CO';
  if (lower.includes('senior manager')) return 'SM';
  if (lower.includes('chief manager')) return 'CM';
  if (lower.includes('relationship manager')) return 'RM';
  if (lower.includes('secretary')) return 'SEC';
  if (lower.includes('deputy general manager') || lower.includes('dgm')) return 'DGM';

  // Extract initials of significant words
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0 && !['and', 'the', 'of', 'for', 'to', 'in', 'at'].includes(w.toLowerCase()));

  if (words.length >= 2) {
    const acronym = words.map(w => w[0]).join('').toUpperCase();
    if (acronym.length >= 2 && acronym.length <= 5) {
      return acronym;
    }
  }

  const clean = (words[0] || text).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean.slice(0, 4) || 'DIR';
};

/**
 * Formats correspondence reference number according to user requirement:
 * EMA/{Client or Authority initials}/{Project initials}/{Receiver initials}/{Suffix}
 * e.g. EMA/RDA/PIDM26/PD/001, EMA/BOC/PIDM26/BM/001, EMA/CGF/PIDM26/GM/001, EMA/IRD/PIDM26/CG/001
 */
export const formatEmaCorrespondenceReference = (
  clientInitials: string,
  projectOrReceiverInitials: string,
  receiverInitialsOrSuffix: string | number,
  suffix?: string | number
): string => {
  const cInit = (clientInitials || 'CLIENT').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();

  // 4 arguments provided: (clientInitials, projectInitials, receiverInitials, suffix)
  if (suffix !== undefined) {
    const pInit = (projectOrReceiverInitials || 'GEN').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    const rInit = (String(receiverInitialsOrSuffix) || 'DIR').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    const sStr = typeof suffix === 'number' ? String(suffix).padStart(3, '0') : String(suffix).padStart(3, '0');
    return `EMA/${cInit}/${pInit}/${rInit}/${sStr}`;
  }

  // 3 arguments fallback: (clientInitials, receiverInitials, suffix)
  const rInit = (projectOrReceiverInitials || 'DIR').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  const sStr = typeof receiverInitialsOrSuffix === 'number'
    ? String(receiverInitialsOrSuffix).padStart(3, '0')
    : String(receiverInitialsOrSuffix).padStart(3, '0');
  return `EMA/${cInit}/${rInit}/${sStr}`;
};

/**
 * Calculates the next sequential order suffix (e.g. '001', '002', '003'...)
 * for OUTGOING letters formatted as EMA/{Client Initials}/{Project Initials}/{Receiver Initials}/{Suffix}.
 * 
 * Strict Requirement:
 * The suffix order is strictly unique to the initial flow prior to suffix:
 * (EMA / Client Initials / Project Initials / Receiver Direction Initials).
 * Letters are NOT numbered based on a common or global counter.
 * Each distinct (Client, Project, Receiver) stream starts independently from 001.
 */
export const getNextEmaLetterSuffix = (
  letters: Letter[],
  clientInitials: string,
  projectOrReceiverInitials: string,
  receiverInitials?: string
): string => {
  const cTarget = (clientInitials || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  let pTarget = '';
  let rTarget = '';

  if (receiverInitials !== undefined) {
    pTarget = (projectOrReceiverInitials || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    rTarget = (receiverInitials || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  } else {
    // 3 args fallback: (letters, clientInitials, receiverInitials)
    rTarget = (projectOrReceiverInitials || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  let maxSeq = 0;

  for (const letter of letters) {
    // 1. MUST be Outgoing only (Incoming letters NEVER increment our outgoing sequence)
    const isOutgoing = letter.direction === 'Outgoing' || letter.direction === 'OUTGOING';
    if (!isOutgoing) continue;

    const ref = (letter.letterNumber || letter.ourReference || '').trim();
    let letterMatchesStream = false;
    let extractedSuffixNum: number | null = null;

    // 2. Parse reference string
    if (ref) {
      const parts = ref.split('/').map(p => p.trim());
      if (parts.length >= 4 && parts[0].toUpperCase() === 'EMA') {
        if (parts.length >= 5) {
          // Standard Format: EMA / {Client} / {Project} / {Receiver} / {Suffix}
          const refClient = parts[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const refProject = parts[2].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const refReceiver = parts[3].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const refSuffixStr = parts[4].replace(/[^0-9]/g, '');

          const clientMatches = refClient === cTarget;
          const projectMatches = !pTarget || refProject === pTarget;
          const receiverMatches = refReceiver === rTarget;

          if (clientMatches && projectMatches && receiverMatches) {
            letterMatchesStream = true;
            const parsed = parseInt(refSuffixStr, 10);
            if (!isNaN(parsed)) {
              extractedSuffixNum = parsed;
            }
          }
        } else if (parts.length === 4) {
          // Corporate/General Format: EMA / {Client} / {Receiver} / {Suffix}
          const refClient = parts[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const refReceiver = parts[2].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const refSuffixStr = parts[3].replace(/[^0-9]/g, '');

          const clientMatches = refClient === cTarget;
          const projectMatches = !pTarget || pTarget === 'CORP' || pTarget === 'GEN';
          const receiverMatches = refReceiver === rTarget;

          if (clientMatches && projectMatches && receiverMatches) {
            letterMatchesStream = true;
            const parsed = parseInt(refSuffixStr, 10);
            if (!isNaN(parsed)) {
              extractedSuffixNum = parsed;
            }
          }
        }
      }
    }

    // 3. Fallback: match by letter metadata properties ONLY if all 3 (Client, Project, Receiver) match
    if (!letterMatchesStream) {
      const letterC = (
        letter.clientAffix ||
        (letter.clientName ? extractClientAffix(letter.clientName) : '')
      ).replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      const letterP = (
        letter.projectAffix ||
        (letter.projectCode ? extractProjectAffix(letter.projectCode) : '')
      ).replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      const letterR = (
        (letter as any).receiverInitials ||
        (letter.receiverDesignation ? extractReceiverInitials(letter.receiverDesignation) : '') ||
        (letter.attention ? extractReceiverInitials(letter.attention) : '')
      ).replace(/[^A-Za-z0-9]/g, '').toUpperCase();

      const metaClientMatches = letterC === cTarget;
      const metaProjectMatches = !pTarget || letterP === pTarget || (pTarget === 'CORP' && (!letterP || letterP === 'CORP'));
      const metaReceiverMatches = letterR && letterR === rTarget;

      if (metaClientMatches && metaProjectMatches && metaReceiverMatches) {
        letterMatchesStream = true;
        const lastPart = ref ? ref.split('/').pop()?.replace(/[^0-9]/g, '') : '';
        const parsedFromRef = lastPart ? parseInt(lastPart, 10) : NaN;
        if (!isNaN(parsedFromRef)) {
          extractedSuffixNum = parsedFromRef;
        } else if (typeof letter.sequenceNumber === 'number') {
          extractedSuffixNum = letter.sequenceNumber;
        }
      }
    }

    // 4. Update max sequence ONLY for letters belonging to this specific stream
    if (letterMatchesStream && extractedSuffixNum !== null && extractedSuffixNum > maxSeq) {
      maxSeq = extractedSuffixNum;
    }
  }

  return String(maxSeq + 1).padStart(3, '0');
};

export interface RecipientOption {
  type: 'CLIENT' | 'BANK' | 'AUTHORITY' | 'OTHER';
  name: string;
  initials: string;
  defaultReceivers?: { designation: string; initials: string }[];
}

export const STANDARD_RECIPIENTS: RecipientOption[] = [
  // Clients / Employers
  {
    type: 'CLIENT',
    name: 'Road Development Authority',
    initials: 'RDA',
    defaultReceivers: [
      { designation: 'Provincial Director', initials: 'PD' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Executive Engineer', initials: 'EE' },
      { designation: 'Project Director', initials: 'PD' },
      { designation: 'Resident Engineer', initials: 'RE' },
      { designation: 'Director General', initials: 'DG' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Central Engineering Consultancy Bureau',
    initials: 'CECB',
    defaultReceivers: [
      { designation: 'General Manager', initials: 'GM' },
      { designation: 'Project Director', initials: 'PD' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Resident Engineer', initials: 'RE' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Sri Lanka Ports Authority',
    initials: 'SLPA',
    defaultReceivers: [
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Managing Director', initials: 'MD' },
      { designation: 'Project Director', initials: 'PD' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'National Water Supply & Drainage Board',
    initials: 'NWSDB',
    defaultReceivers: [
      { designation: 'General Manager', initials: 'GM' },
      { designation: 'Deputy General Manager', initials: 'DGM' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Project Director', initials: 'PD' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Ceylon Electricity Board',
    initials: 'CEB',
    defaultReceivers: [
      { designation: 'General Manager', initials: 'GM' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Deputy General Manager', initials: 'DGM' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Provincial Road Development Authority',
    initials: 'PRDA',
    defaultReceivers: [
      { designation: 'Provincial Director', initials: 'PD' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Executive Engineer', initials: 'EE' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Urban Development Authority',
    initials: 'UDA',
    defaultReceivers: [
      { designation: 'Director General', initials: 'DG' },
      { designation: 'Provincial Director', initials: 'PD' },
      { designation: 'Project Director', initials: 'PD' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Maga Engineering (Pvt) Ltd',
    initials: 'MAGA',
    defaultReceivers: [
      { designation: 'Project Director', initials: 'PD' },
      { designation: 'Project Manager', initials: 'PM' },
      { designation: 'Chief Engineer', initials: 'CE' }
    ]
  },
  {
    type: 'CLIENT',
    name: 'Access Engineering PLC',
    initials: 'ACCESS',
    defaultReceivers: [
      { designation: 'Project Director', initials: 'PD' },
      { designation: 'Project Manager', initials: 'PM' },
      { designation: 'Chief Engineer', initials: 'CE' }
    ]
  },

  // Banks
  {
    type: 'BANK',
    name: 'Bank of Ceylon',
    initials: 'BOC',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Chief Manager', initials: 'CM' },
      { designation: 'Credit Officer', initials: 'CO' },
      { designation: 'Senior Manager - Credit', initials: 'SMC' },
      { designation: 'Trade Services Division', initials: 'TSD' }
    ]
  },
  {
    type: 'BANK',
    name: 'Commercial Bank of Ceylon',
    initials: 'COMB',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Chief Manager', initials: 'CM' },
      { designation: 'Credit Officer', initials: 'CO' },
      { designation: 'Senior Manager - Credit', initials: 'SMC' },
      { designation: 'Trade Services Division', initials: 'TSD' }
    ]
  },
  {
    type: 'BANK',
    name: 'Sampath Bank',
    initials: 'SAMP',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Credit Officer', initials: 'CO' },
      { designation: 'Chief Manager', initials: 'CM' },
      { designation: 'Relationship Manager', initials: 'RM' }
    ]
  },
  {
    type: 'BANK',
    name: 'Hatton National Bank',
    initials: 'HNB',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Credit Officer', initials: 'CO' },
      { designation: 'Senior Manager', initials: 'SM' },
      { designation: 'Relationship Manager', initials: 'RM' }
    ]
  },
  {
    type: 'BANK',
    name: 'People\'s Bank',
    initials: 'PEOP',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Credit Officer', initials: 'CO' },
      { designation: 'Chief Manager', initials: 'CM' }
    ]
  },
  {
    type: 'BANK',
    name: 'Nations Trust Bank',
    initials: 'NTB',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Relationship Manager', initials: 'RM' }
    ]
  },
  {
    type: 'BANK',
    name: 'DFCC Bank',
    initials: 'DFCC',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Credit Officer', initials: 'CO' }
    ]
  },
  {
    type: 'BANK',
    name: 'National Development Bank',
    initials: 'NDB',
    defaultReceivers: [
      { designation: 'Branch Manager', initials: 'BM' },
      { designation: 'Relationship Manager', initials: 'RM' }
    ]
  },

  // Other Authorities (Construction Guarantee Fund, IRD, CIDA, CEA, RDD)
  {
    type: 'AUTHORITY',
    name: 'Construction Guarantee Fund',
    initials: 'CGF',
    defaultReceivers: [
      { designation: 'General Manager', initials: 'GM' },
      { designation: 'Chief Executive Officer', initials: 'CEO' },
      { designation: 'Senior Manager - Guarantees', initials: 'SMG' },
      { designation: 'Credit / Guarantee Officer', initials: 'CGO' }
    ]
  },
  {
    type: 'AUTHORITY',
    name: 'Inland Revenue Department',
    initials: 'IRD',
    defaultReceivers: [
      { designation: 'Commissioner General', initials: 'CG' },
      { designation: 'Deputy Commissioner', initials: 'DC' },
      { designation: 'Senior Assessor', initials: 'SA' },
      { designation: 'Assessor', initials: 'AS' },
      { designation: 'VAT Unit Commissioner', initials: 'VUC' }
    ]
  },
  {
    type: 'AUTHORITY',
    name: 'Construction Industry Development Authority',
    initials: 'CIDA',
    defaultReceivers: [
      { designation: 'Director General', initials: 'DG' },
      { designation: 'Director - Advisory & Registration', initials: 'DAR' },
      { designation: 'Director - Contractor Grading', initials: 'DCG' },
      { designation: 'Director - Dispute Resolution', initials: 'DDR' }
    ]
  },
  {
    type: 'AUTHORITY',
    name: 'Central Environmental Authority',
    initials: 'CEA',
    defaultReceivers: [
      { designation: 'Director General', initials: 'DG' },
      { designation: 'Provincial Director', initials: 'PD' },
      { designation: 'Director - EIA', initials: 'EIA' }
    ]
  },
  {
    type: 'AUTHORITY',
    name: 'Road Development Department',
    initials: 'RDD',
    defaultReceivers: [
      { designation: 'Provincial Director', initials: 'PD' },
      { designation: 'Chief Engineer', initials: 'CE' },
      { designation: 'Executive Engineer', initials: 'EE' }
    ]
  }
];

/**
 * Formats correspondence reference number according to enterprise standard:
 * EMA/{Client Affix}/{Project Affix}/{Year}/{Suffix}
 */
export const formatCorrespondenceReference = (
  clientAffix: string,
  projectAffix: string,
  year: string | number,
  suffix: string | number
): string => {
  const cAffix = (clientAffix || 'CLIENT').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  const pAffix = (projectAffix || 'GEN').replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
  const yStr = String(year || new Date().getFullYear());
  const sStr = typeof suffix === 'number' ? String(suffix).padStart(3, '0') : String(suffix).padStart(3, '0');

  return `EMA/${cAffix}/${pAffix}/${yStr}/${sStr}`;
};

/**
 * Calculates the next sequential order suffix (e.g. '001', '002', '003'...)
 * for OUTGOING letters under a given Project Affix/Code, Client Affix, and Initiation Year.
 * Strictly adheres to:
 * 1. Count ONLY Outgoing records (Incoming records are excluded).
 * 2. Filter by selected project and sequence year.
 * 3. Read the highest existing numeric suffix + 1.
 * 4. Format as 3 digits (e.g., '001').
 */
export const getNextLetterSuffix = (
  letters: Letter[],
  clientAffix: string,
  projectAffix: string,
  year: string | number,
  options?: {
    projectId?: string;
    projectCode?: string;
    direction?: LetterDirection | 'ALL';
    receiverInitials?: string;
  }
): string => {
  const cAffix = (clientAffix || '').trim().toUpperCase();
  const sanitizedCAffix = cAffix.replace(/[^a-zA-Z0-9]/g, '');
  const pAffix = (projectAffix || '').trim().toUpperCase();
  const yStr = String(year || new Date().getFullYear()).trim();
  const targetProjectCode = (options?.projectCode || '').trim().toUpperCase();
  const targetProjectId = (options?.projectId || '').trim();
  const targetDirection = options?.direction || 'Outgoing';
  const targetReceiver = (options?.receiverInitials || '').trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');

  // Normalize project affix/code for comparison
  const sanitizedPAffix = pAffix.replace(/[^a-zA-Z0-9]/g, '');
  const sanitizedTargetCode = targetProjectCode.replace(/[^a-zA-Z0-9]/g, '');

  let maxSeq = 0;

  for (const letter of letters) {
    // 1. FILTER: Count Outgoing Only by default (ignore Incoming unless explicitly requested)
    if (targetDirection === 'Outgoing') {
      const isOutgoing = letter.direction === 'Outgoing' || letter.direction === 'OUTGOING';
      if (!isOutgoing) {
        continue; // DO NOT COUNT INCOMING CORRESPONDENCE
      }
    } else if (targetDirection !== 'ALL') {
      if (letter.direction !== targetDirection) {
        continue;
      }
    }

    // 2. FILTER: Check if letter belongs to selected client (Strict Requirement: unique per client)
    const letterCAffix = (letter.clientAffix || (letter.clientName ? extractClientAffix(letter.clientName) : '')).trim().toUpperCase();
    const sanitizedLetterCAffix = letterCAffix.replace(/[^a-zA-Z0-9]/g, '');

    const refNum = (letter.letterNumber || letter.ourReference || '').trim();
    const refParts = refNum.split('/');
    const isEmaRef = refParts.length >= 4 && refParts[0].toUpperCase() === 'EMA';
    const refClientPart = isEmaRef ? refParts[1]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

    if (sanitizedCAffix) {
      const matchesClient =
        sanitizedLetterCAffix === sanitizedCAffix ||
        (refClientPart && refClientPart === sanitizedCAffix);

      if (!matchesClient) {
        continue; // Skip letters from other clients
      }
    }

    // 3. FILTER: Check if letter belongs to selected project
    const letterPAffix = (letter.projectAffix || extractProjectAffix(letter.projectCode || '')).trim().toUpperCase();
    const sanitizedLetterAffix = letterPAffix.replace(/[^a-zA-Z0-9]/g, '');
    const letterPCode = (letter.projectCode || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const matchesProject =
      (sanitizedPAffix && sanitizedLetterAffix === sanitizedPAffix) ||
      (targetProjectId && letter.projectId === targetProjectId) ||
      (sanitizedTargetCode && (letterPCode === sanitizedTargetCode || sanitizedLetterAffix === sanitizedTargetCode)) ||
      (pAffix && letterPAffix === pAffix);

    // Also check reference string for project identifier (e.g. EMA/.../PIDM26/...)
    const refProjectPart = isEmaRef && refParts.length >= 5 ? refParts[2]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
    const refMatchesProject = refProjectPart && (refProjectPart === sanitizedPAffix || (sanitizedTargetCode && refProjectPart === sanitizedTargetCode));

    if (!matchesProject && !refMatchesProject) {
      continue; // Skip letters from other projects
    }

    // 4. FILTER: Check receiver if provided
    if (targetReceiver) {
      const letterReceiver = (
        (letter as any).receiverInitials ||
        (letter.receiverDesignation ? extractReceiverInitials(letter.receiverDesignation) : '') ||
        (letter.attention ? extractReceiverInitials(letter.attention) : '')
      ).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      const refReceiverPart = isEmaRef && refParts.length >= 5 ? refParts[3]?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
      const matchesReceiver = (letterReceiver && letterReceiver === targetReceiver) || (refReceiverPart && refReceiverPart === targetReceiver);
      if (!matchesReceiver) {
        continue; // Skip letters to different receivers
      }
    }

    // 5. FILTER: Check sequence year if applicable
    const letterYear = (letter.sequenceYear || (letter.date ? letter.date.slice(0, 4) : '')).trim();
    const refYearPart = isEmaRef && refParts.length >= 5 && /^\d{4}$/.test(refParts[3]?.trim()) ? refParts[3]?.trim() : '';
    const matchesYear = !yStr || letterYear === yStr || refYearPart === yStr || refNum.includes(`/${yStr}/`);

    if (!matchesYear && refYearPart) {
      continue; // Skip letters from other years
    }

    // 6. READ NUMERIC SUFFIX FROM EXISTING REFERENCE
    let foundSuffix: number | null = null;

    if (isEmaRef && refParts.length >= 4) {
      const lastPart = refParts[refParts.length - 1]?.replace(/[^0-9]/g, '');
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed)) {
        foundSuffix = parsed;
      }
    } else {
      const match = refNum.match(/\/(\d+)(?:[^\d]*)$/);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed)) {
          foundSuffix = parsed;
        }
      }
    }

    // Also check letter.sequenceNumber if set
    if (typeof letter.sequenceNumber === 'number' && (!foundSuffix || letter.sequenceNumber > foundSuffix)) {
      foundSuffix = letter.sequenceNumber;
    }

    // 7. TRACK HIGHEST SUFFIX FOR THIS STREAM
    if (foundSuffix !== null && foundSuffix > maxSeq) {
      maxSeq = foundSuffix;
    }
  }

  // 8. ADD 1
  const nextNum = maxSeq + 1;

  // 9. FORMAT AS 3 DIGITS
  return String(nextNum).padStart(3, '0');
};

/**
 * Folder structure interfaces for organizing letters by Client and Project.
 */
export interface ProjectFolder {
  projectKey: string;
  projectCode: string;
  projectName: string;
  projectAffix: string;
  letters: Letter[];
}

export interface ClientFolder {
  clientKey: string;
  clientName: string;
  clientAffix: string;
  projects: ProjectFolder[];
  totalLetters: number;
}

/**
 * Groups correspondence letters into Client folders and Project subfolders.
 */
export const groupLettersByClientAndProject = (letters: Letter[]): {
  clientFolders: ClientFolder[];
  generalLetters: Letter[];
} => {
  const clientMap = new Map<string, {
    clientName: string;
    clientAffix: string;
    projectsMap: Map<string, {
      projectCode: string;
      projectName: string;
      projectAffix: string;
      letters: Letter[];
    }>;
  }>();

  const generalLetters: Letter[] = [];

  for (const letter of letters) {
    const cAffix = letter.clientAffix || (letter.clientName ? extractClientAffix(letter.clientName) : (letter.recipientOrganization ? extractClientAffix(letter.recipientOrganization) : ''));
    const cName = letter.clientName || letter.recipientOrganization || (cAffix ? `Client (${cAffix})` : '');

    // If letter has no client or project association, or is generic corporate
    if (!cAffix && !letter.projectId && !letter.projectCode) {
      generalLetters.push(letter);
      continue;
    }

    const clientKey = cAffix || (cName ? cName.toLowerCase() : 'GENERAL_CLIENT');

    if (!clientMap.has(clientKey)) {
      clientMap.set(clientKey, {
        clientName: cName || cAffix || 'General Client Directory',
        clientAffix: cAffix || 'CLIENT',
        projectsMap: new Map()
      });
    }

    const clientEntry = clientMap.get(clientKey)!;
    const pCode = letter.projectCode || letter.projectAffix || 'GEN';
    const pAffix = letter.projectAffix || extractProjectAffix(pCode);
    const pName = letter.projectName || (pCode !== 'GEN' ? `Project ${pCode}` : 'General Client Operations');
    const projectKey = `${clientKey}__${pAffix}`;

    if (!clientEntry.projectsMap.has(projectKey)) {
      clientEntry.projectsMap.set(projectKey, {
        projectCode: pCode,
        projectName: pName,
        projectAffix: pAffix,
        letters: []
      });
    }

    clientEntry.projectsMap.get(projectKey)!.letters.push(letter);
  }

  const clientFolders: ClientFolder[] = Array.from(clientMap.entries()).map(([clientKey, entry]) => {
    const projects: ProjectFolder[] = Array.from(entry.projectsMap.entries()).map(([pKey, pEntry]) => ({
      projectKey: pKey,
      projectCode: pEntry.projectCode,
      projectName: pEntry.projectName,
      projectAffix: pEntry.projectAffix,
      letters: pEntry.letters.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));

    const totalLetters = projects.reduce((acc, p) => acc + p.letters.length, 0);

    return {
      clientKey,
      clientName: entry.clientName,
      clientAffix: entry.clientAffix,
      projects,
      totalLetters
    };
  }).sort((a, b) => b.totalLetters - a.totalLetters);

  return { clientFolders, generalLetters };
};
