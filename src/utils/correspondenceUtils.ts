import { Letter } from '../types/correspondenceTypes';

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

  // 2. Known engineering and client organizations & major registered banks
  const lower = name.toLowerCase();
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
 * for letters under a given Client Affix, Project Affix, and Initiation Year.
 */
export const getNextLetterSuffix = (
  letters: Letter[],
  clientAffix: string,
  projectAffix: string,
  year: string | number
): string => {
  const cAffix = (clientAffix || '').trim().toUpperCase();
  const pAffix = (projectAffix || '').trim().toUpperCase();
  const yStr = String(year || new Date().getFullYear()).trim();

  // Pattern to match EMA/{clientAffix}/{projectAffix}/{year}/{suffix}
  const escapedC = cAffix ? cAffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '[^/]+';
  const escapedP = pAffix ? pAffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '[^/]+';
  const escapedY = yStr ? yStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '\\d{4}';

  const exactRegex = new RegExp(`^EMA/${escapedC}/${escapedP}/${escapedY}/(\\d+)`, 'i');

  let maxSeq = 0;

  for (const letter of letters) {
    // 1. Check letterNumber
    if (letter.letterNumber) {
      const match = letter.letterNumber.match(exactRegex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    // 2. Check ourReference
    if (letter.ourReference) {
      const match = letter.ourReference.match(exactRegex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    // 3. Fallback check: matching attributes
    const matchClient = !cAffix || (letter.clientAffix && letter.clientAffix.toUpperCase() === cAffix);
    const matchProj = !pAffix || (letter.projectAffix && letter.projectAffix.toUpperCase() === pAffix);
    const matchYear = letter.sequenceYear === yStr || (letter.date && letter.date.startsWith(yStr));

    if (matchClient && matchProj && matchYear && letter.sequenceNumber) {
      if (letter.sequenceNumber > maxSeq) {
        maxSeq = letter.sequenceNumber;
      }
    }
  }

  const nextNum = maxSeq + 1;
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
