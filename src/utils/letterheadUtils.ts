import { LetterheadTemplate, LetterheadScope } from '../types/correspondenceTypes';

/**
 * Creates high-resolution SVG letterhead banner for EMA default corporate letterhead
 */
export const createDefaultEmaHeaderDataUrl = (): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 260" width="1200" height="260">
    <defs>
      <linearGradient id="navGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="60%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#312e81" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
    </defs>
    <!-- Background Header Banner -->
    <rect x="0" y="0" width="1200" height="240" fill="url(#navGrad)" />
    <!-- Accent Line -->
    <rect x="0" y="240" width="1200" height="20" fill="url(#goldGrad)" />
    
    <!-- EMA Geometric Brand Emblem -->
    <g transform="translate(60, 40)">
      <polygon points="40,10 75,75 5,75" fill="#10b981" opacity="0.9" />
      <polygon points="75,25 110,90 40,90" fill="#6366f1" opacity="0.8" />
      <polygon points="110,40 145,105 75,105" fill="#a855f7" opacity="0.9" />
      <circle cx="75" cy="65" r="18" fill="#ffffff" />
      <text x="75" y="71" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" fill="#0f172a" text-anchor="middle">EMA</text>
    </g>

    <!-- Company Name and Identifiers -->
    <text x="240" y="90" font-family="'Helvetica Neue', Arial, sans-serif" font-size="42" font-weight="900" fill="#ffffff" letter-spacing="2">EMA CORPORATE ENTERPRISE</text>
    <text x="242" y="132" font-family="'Helvetica Neue', Arial, sans-serif" font-size="18" font-weight="700" fill="#34d399" letter-spacing="4">HEAVY ENGINEERING • INFRASTRUCTURE • FLEET LOGISTICS</text>
    <text x="242" y="172" font-family="'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="500" fill="#cbd5e1" letter-spacing="1">Reg No: PV-98241/2018 | CIDA Grade: C1 / F1 | VAT Reg: 114872910-7000 | ISO 9001:2015 Certified</text>
    
    <!-- Right side Official Seal / Accreditation Mark -->
    <g transform="translate(1030, 45)">
      <circle cx="65" cy="65" r="55" fill="none" stroke="#6366f1" stroke-width="3" stroke-dasharray="6,4" />
      <circle cx="65" cy="65" r="46" fill="#1e293b" />
      <text x="65" y="55" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10" font-weight="900" fill="#38bdf8" text-anchor="middle">OFFICIAL</text>
      <text x="65" y="72" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle">SEAL</text>
      <text x="65" y="87" font-family="'Helvetica Neue', Arial, sans-serif" font-size="9" font-weight="700" fill="#94a3b8" text-anchor="middle">SRI LANKA</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * Creates high-resolution SVG footer for default corporate letterhead
 */
export const createDefaultEmaFooterDataUrl = (): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 130" width="1200" height="130">
    <defs>
      <linearGradient id="footLine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="50%" stop-color="#6366f1" />
        <stop offset="100%" stop-color="#a855f7" />
      </linearGradient>
    </defs>
    <!-- Divider bar -->
    <rect x="0" y="0" width="1200" height="6" fill="url(#footLine)" />
    <!-- Footer address and contact lines -->
    <text x="60" y="45" font-family="'Helvetica Neue', Arial, sans-serif" font-size="15" font-weight="700" fill="#1e293b">HEADQUARTERS & CORPORATE SECRETARIAT</text>
    <text x="60" y="78" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="500" fill="#64748b">Level 14 & 16, West Tower, World Trade Centre, Echelon Square, Colombo 01, Sri Lanka</text>
    <text x="60" y="105" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="500" fill="#64748b">Direct: +94 11 289 4000 / +94 11 472 8900 | E-Mail: secretariat@emagroup.lk | Web: https://emacorporate.lk</text>
    <!-- Page & Verification notice -->
    <text x="1140" y="45" font-family="'Helvetica Neue', Arial, sans-serif" font-size="13" font-weight="700" fill="#475569" text-anchor="end">EMA AUDIT SECURED</text>
    <text x="1140" y="78" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="500" fill="#94a3b8" text-anchor="end">Cryptographic Reference Verified</text>
    <text x="1140" y="105" font-family="'Helvetica Neue', Arial, sans-serif" font-size="12" font-weight="500" fill="#94a3b8" text-anchor="end">Page [P] of [T]</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * 6 Initial Default Seed Letterheads required by specification
 */
export const defaultLetterheads: LetterheadTemplate[] = [
  {
    id: 'lh-ema-corporate',
    enterpriseId: 'ent-apex',
    name: 'EMA Corporate Letterhead',
    description: 'Master official company letterhead for executive, statutory, and cross-departmental correspondence.',
    scope: 'Corporate',
    pageSize: 'A4',
    orientation: 'Portrait',
    headerImageUrl: createDefaultEmaHeaderDataUrl(),
    footerImageUrl: createDefaultEmaFooterDataUrl(),
    headerHeight: 45,
    footerHeight: 30,
    contentTopMargin: 50,
    contentBottomMargin: 35,
    contentLeftMargin: 20,
    contentRightMargin: 20,
    active: true,
    isDefault: true,
    createdBy: 'System Master Administrator',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z'
  },
  {
    id: 'lh-rda-client',
    enterpriseId: 'ent-apex',
    name: 'RDA Client Letterhead',
    description: 'Designated formal employer transmittal letterhead for Road Development Authority projects and submittals.',
    scope: 'Client',
    clientId: 'cl-rda',
    clientName: 'Road Development Authority (RDA)',
    clientAffix: 'RDA',
    pageSize: 'A4',
    orientation: 'Portrait',
    headerImageUrl: createDefaultEmaHeaderDataUrl(),
    footerImageUrl: createDefaultEmaFooterDataUrl(),
    headerHeight: 45,
    footerHeight: 30,
    contentTopMargin: 50,
    contentBottomMargin: 35,
    contentLeftMargin: 20,
    contentRightMargin: 20,
    active: true,
    isDefault: false,
    createdBy: 'Contracts Department',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z'
  },
  {
    id: 'lh-pidm26-project',
    enterpriseId: 'ent-apex',
    name: 'PIDM-26 Project Letterhead',
    description: 'Site office & engineer transmittal letterhead for Pahalagama Irrigation Drainage & Mitigation Project.',
    scope: 'Project',
    projectId: 'p-pidm26',
    projectCode: 'PIDM-26',
    projectName: 'Pahalagama Irrigation Drainage & Mitigation Project',
    projectAffix: 'PIDM26',
    pageSize: 'A4',
    orientation: 'Portrait',
    headerImageUrl: createDefaultEmaHeaderDataUrl(),
    footerImageUrl: createDefaultEmaFooterDataUrl(),
    headerHeight: 45,
    footerHeight: 30,
    contentTopMargin: 50,
    contentBottomMargin: 35,
    contentLeftMargin: 20,
    contentRightMargin: 20,
    active: true,
    isDefault: false,
    createdBy: 'Project Management Unit',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z'
  },
  {
    id: 'lh-finance-letterhead',
    enterpriseId: 'ent-apex',
    name: 'Finance Letterhead',
    description: 'Corporate treasury, banking facilities, IPC billing, and auditor correspondence letterhead.',
    scope: 'Finance',
    pageSize: 'A4',
    orientation: 'Portrait',
    headerImageUrl: createDefaultEmaHeaderDataUrl(),
    footerImageUrl: createDefaultEmaFooterDataUrl(),
    headerHeight: 45,
    footerHeight: 30,
    contentTopMargin: 50,
    contentBottomMargin: 35,
    contentLeftMargin: 20,
    contentRightMargin: 20,
    active: true,
    isDefault: false,
    createdBy: 'Chief Financial Officer',
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z'
  },
  {
    id: 'lh-tender-letterhead',
    enterpriseId: 'ent-apex',
    name: 'Tender Letterhead',
    description: 'Procurement, bidding bids, expressions of interest (EOI), and pre-qualification submittals.',
    scope: 'Tender',
    pageSize: 'A4',
    orientation: 'Portrait',
    headerImageUrl: createDefaultEmaHeaderDataUrl(),
    footerImageUrl: createDefaultEmaFooterDataUrl(),
    headerHeight: 45,
    footerHeight: 30,
    contentTopMargin: 50,
    contentBottomMargin: 35,
    contentLeftMargin: 20,
    contentRightMargin: 20,
    active: true,
    isDefault: false,
    createdBy: 'Estimating & Bidding Unit',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z'
  },
  {
    id: 'lh-confidential-letterhead',
    enterpriseId: 'ent-apex',
    name: 'Confidential Letterhead',
    description: 'Board of Directors, executive compensation, legal claims, and privileged correspondence.',
    scope: 'Confidential',
    pageSize: 'A4',
    orientation: 'Portrait',
    headerImageUrl: createDefaultEmaHeaderDataUrl(),
    footerImageUrl: createDefaultEmaFooterDataUrl(),
    headerHeight: 45,
    footerHeight: 30,
    contentTopMargin: 50,
    contentBottomMargin: 35,
    contentLeftMargin: 20,
    contentRightMargin: 20,
    active: true,
    isDefault: false,
    createdBy: 'Executive Board Secretariat',
    createdAt: '2026-03-15T00:00:00.000Z',
    updatedAt: '2026-09-06T00:00:00.000Z'
  }
];

/**
 * Intelligent letterhead selector based on priority:
 * 1. Project-specific letterhead
 * 2. Client-specific letterhead
 * 3. Scope match (Finance, Tender, Confidential)
 * 4. Corporate default
 */
export const resolveRecommendedLetterhead = (
  letterheads: LetterheadTemplate[],
  params: {
    projectId?: string;
    projectAffix?: string;
    projectCode?: string;
    clientId?: string;
    clientAffix?: string;
    category?: string;
    confidentiality?: string;
  }
): LetterheadTemplate => {
  const activeList = letterheads.filter(l => l.active);
  const corporateDefault =
    activeList.find(l => l.isDefault) ||
    activeList.find(l => l.scope === 'Corporate') ||
    letterheads[0] ||
    defaultLetterheads[0];

  // 1. Project-specific letterhead
  if (params.projectId || params.projectAffix || params.projectCode) {
    const projMatch = activeList.find(
      l =>
        l.scope === 'Project' &&
        ((params.projectId && l.projectId === params.projectId) ||
          (params.projectAffix && l.projectAffix?.toUpperCase() === params.projectAffix.toUpperCase()) ||
          (params.projectCode && l.projectCode?.toUpperCase() === params.projectCode.toUpperCase()))
    );
    if (projMatch) return projMatch;
  }

  // 2. Client-specific letterhead
  if (params.clientId || params.clientAffix) {
    const clientMatch = activeList.find(
      l =>
        l.scope === 'Client' &&
        ((params.clientId && l.clientId === params.clientId) ||
          (params.clientAffix && l.clientAffix?.toUpperCase() === params.clientAffix.toUpperCase()))
    );
    if (clientMatch) return clientMatch;
  }

  // 3. Scope match based on category / confidentiality
  if (params.confidentiality === 'Confidential' || params.confidentiality === 'Restricted') {
    const confMatch = activeList.find(l => l.scope === 'Confidential');
    if (confMatch) return confMatch;
  }

  if (params.category) {
    const cat = params.category.toLowerCase();
    if (cat.includes('bank') || cat.includes('finance') || cat.includes('payment') || cat.includes('tax') || cat.includes('vat')) {
      const finMatch = activeList.find(l => l.scope === 'Finance');
      if (finMatch) return finMatch;
    }
    if (cat.includes('tender') || cat.includes('procurement') || cat.includes('bidding')) {
      const tenderMatch = activeList.find(l => l.scope === 'Tender');
      if (tenderMatch) return tenderMatch;
    }
  }

  // 4. Default Corporate Letterhead
  return corporateDefault;
};

/**
 * File reader helper that turns an uploaded file (PNG, JPG, JPEG, SVG, PDF) into base64 DataURL
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64 string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
};
