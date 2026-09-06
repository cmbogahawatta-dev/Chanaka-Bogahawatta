import jsPDF from 'jspdf';
import { EnterpriseProfileDetails } from '../../types/enterpriseProfileTypes';
import { Letter, LetterheadTemplate } from '../../types/correspondenceTypes';
import { defaultLetterheads } from '../../utils/letterheadUtils';

export type LetterheadVariant = 'Company' | 'Project' | 'Finance' | 'Tender' | 'Confidential';

export interface DrawLetterheadOptions {
  doc: jsPDF;
  profile?: EnterpriseProfileDetails;
  enterpriseName?: string;
  variant?: LetterheadVariant;
  letterhead?: LetterheadTemplate;
  documentTitle?: string;
  referenceNumber?: string;
  dateStr?: string;
  confidentiality?: 'Normal' | 'Restricted' | 'Confidential';
  pageNumber?: number;
  totalPages?: number;
}

/**
 * Draws letterhead header, background, or footer onto the current jsPDF page.
 * Supports custom uploaded artwork (PNG, JPG, SVG data URLs) or professional fallback banner.
 * Returns the top Y position for safe content rendering.
 */
export const drawLetterhead = (options: DrawLetterheadOptions): number => {
  const {
    doc,
    profile,
    enterpriseName = 'EMA CORPORATE ENTERPRISE',
    variant = 'Company',
    letterhead,
    referenceNumber,
    dateStr,
    confidentiality = 'Normal',
    pageNumber = 1,
    totalPages = 1
  } = options;

  const pageWidth = doc.internal.pageSize.getWidth(); // A4 is 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // A4 is 297mm

  const headerH = letterhead?.headerHeight || 45;
  const footerH = letterhead?.footerHeight || 30;
  const topMargin = letterhead?.contentTopMargin || 50;
  const bottomMargin = letterhead?.contentBottomMargin || 35;
  const leftMargin = letterhead?.contentLeftMargin || 20;
  const rightMargin = letterhead?.contentRightMargin || 20;

  // 1. FULL PAGE LETTERHEAD BACKGROUND (if uploaded)
  if (letterhead?.fullLetterheadImageUrl) {
    try {
      doc.addImage(
        letterhead.fullLetterheadImageUrl,
        'PNG',
        0,
        0,
        pageWidth,
        pageHeight,
        undefined,
        'FAST'
      );
    } catch (e) {
      console.warn('Could not render fullLetterheadImageUrl in PDF, continuing with fallbacks:', e);
    }
  }

  // 2. HEADER BANNER (if uploaded)
  let headerRendered = false;
  if (letterhead?.headerImageUrl && !letterhead?.fullLetterheadImageUrl) {
    try {
      doc.addImage(
        letterhead.headerImageUrl,
        'PNG',
        0,
        0,
        pageWidth,
        headerH,
        undefined,
        'FAST'
      );
      headerRendered = true;
    } catch (e) {
      console.warn('Could not render headerImageUrl in PDF, using styled fallback:', e);
      headerRendered = false;
    }
  }

  // 3. STYLED FALLBACK HEADER (if no custom header image uploaded)
  if (!headerRendered && !letterhead?.fullLetterheadImageUrl) {
    // Determine theme palette by variant or scope
    let primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
    let accentColor: [number, number, number] = [16, 185, 129]; // Emerald 500

    const scopeOrVariant = letterhead?.scope || variant;
    if (scopeOrVariant === 'Project') {
      primaryColor = [30, 27, 75]; // Indigo 950
      accentColor = [99, 102, 241]; // Indigo 500
    } else if (scopeOrVariant === 'Finance') {
      primaryColor = [76, 5, 25]; // Rose 950
      accentColor = [244, 63, 94]; // Rose 500
    } else if (scopeOrVariant === 'Tender') {
      primaryColor = [59, 7, 100]; // Purple 950
      accentColor = [168, 85, 247]; // Purple 500
    } else if (scopeOrVariant === 'Confidential') {
      primaryColor = [69, 26, 3]; // Amber 950
      accentColor = [245, 158, 11]; // Amber 500
    }

    // Top primary header block
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Corporate Title
    const legalName = profile?.legalName || profile?.tradingName || enterpriseName;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(legalName.toUpperCase(), leftMargin, 11);

    // Compliance / Registration
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const regParts: string[] = [];
    if (profile?.registrationNumber) regParts.push(`Reg No: ${profile.registrationNumber}`);
    if (profile?.vatNumber) regParts.push(`VAT: ${profile.vatNumber}`);
    if (profile?.cidaRegistrationNumber) regParts.push(`CIDA: ${profile.cidaRegistrationNumber}`);
    const regText =
      regParts.length > 0 ? regParts.join(' | ') : 'HEAVY ENGINEERING & FLEET LOGISTICS';
    doc.text(regText, leftMargin, 18);

    // Right reference & date
    if (referenceNumber) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(referenceNumber, pageWidth - rightMargin, 11, { align: 'right' });
    }

    if (dateStr) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Date: ${dateStr}`, pageWidth - rightMargin, 18, { align: 'right' });
    }

    // Accent line
    doc.setFillColor(...accentColor);
    doc.rect(0, 28, pageWidth, 2, 'F');
  }

  // 4. CONFIDENTIALITY BADGE
  if (confidentiality === 'Confidential' || confidentiality === 'Restricted') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(pageWidth - rightMargin - 32, headerH - 8, 32, 5.5, 1, 1, 'FD');
    doc.text(confidentiality.toUpperCase(), pageWidth - rightMargin - 16, headerH - 4.5, {
      align: 'center'
    });
  }

  // 5. FOOTER BANNER / TEXT
  const footerY = pageHeight - footerH;
  let footerRendered = false;

  if (letterhead?.footerImageUrl && !letterhead?.fullLetterheadImageUrl) {
    try {
      doc.addImage(
        letterhead.footerImageUrl,
        'PNG',
        0,
        footerY,
        pageWidth,
        footerH,
        undefined,
        'FAST'
      );
      footerRendered = true;
    } catch (e) {
      console.warn('Could not render footerImageUrl in PDF, using fallback:', e);
      footerRendered = false;
    }
  }

  if (!footerRendered && !letterhead?.fullLetterheadImageUrl) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, footerY + 8, pageWidth - rightMargin, footerY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    const address =
      profile?.registeredAddress ||
      profile?.businessAddress ||
      'Level 14 & 16, World Trade Centre, Colombo 01, Sri Lanka';
    const contacts =
      [profile?.telephone, profile?.website].filter(Boolean).join(' | ') ||
      '+94 11 289 4000 | https://emacorporate.lk';

    doc.text(`${address} | ${contacts}`, leftMargin, footerY + 14);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - rightMargin, footerY + 14, {
      align: 'right'
    });
  }

  return topMargin;
};

/**
 * Resolves letterhead template for a given letter with fallback to default corporate
 */
const resolveLetterheadForLetter = (
  letter: Letter,
  customLetterhead?: LetterheadTemplate
): LetterheadTemplate => {
  if (customLetterhead) return customLetterhead;

  // Check if letterhead is stored in localStorage
  try {
    const raw = localStorage.getItem('ema_enterprise_correspondence_v1_letterheads');
    if (raw) {
      const list: LetterheadTemplate[] = JSON.parse(raw);
      if (letter.letterheadId) {
        const match = list.find(l => l.id === letter.letterheadId);
        if (match) return match;
      }
      // Try project match
      if (letter.projectAffix || letter.projectId) {
        const pMatch = list.find(
          l =>
            l.active &&
            l.scope === 'Project' &&
            (l.projectAffix === letter.projectAffix || l.projectId === letter.projectId)
        );
        if (pMatch) return pMatch;
      }
      // Try client match
      if (letter.clientAffix || letter.clientId) {
        const cMatch = list.find(
          l =>
            l.active &&
            l.scope === 'Client' &&
            (l.clientAffix === letter.clientAffix || l.clientId === letter.clientId)
        );
        if (cMatch) return cMatch;
      }
      const def = list.find(l => l.isDefault && l.active) || list[0];
      if (def) return def;
    }
  } catch (e) {
    console.error('Error loading letterhead from storage:', e);
  }

  return defaultLetterheads[0];
};

/**
 * Render complete letter with uploaded EMA letterhead, safe margins, and multi-page support.
 */
export const exportLetterToPDF = (
  letter: Letter,
  profile?: EnterpriseProfileDetails,
  enterpriseName?: string,
  explicitLetterhead?: LetterheadTemplate
): void => {
  const letterhead = resolveLetterheadForLetter(letter, explicitLetterhead);

  const doc = new jsPDF({
    orientation: letterhead.orientation === 'Landscape' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: letterhead.pageSize ? letterhead.pageSize.toLowerCase() : 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const topMargin = letterhead.contentTopMargin || 50;
  const bottomMargin = letterhead.contentBottomMargin || 35;
  const leftMargin = letterhead.contentLeftMargin || 20;
  const rightMargin = letterhead.contentRightMargin || 20;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  const safeBottomY = pageHeight - bottomMargin;

  // Clean HTML text into plain text paragraphs
  const cleanBody = letter.bodyHtml
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  // Split into lines that fit within contentWidth
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const bodyLines: string[] = doc.splitTextToSize(cleanBody || 'No text provided.', contentWidth);

  // Prepare page tracking
  let currentPage = 1;
  const pageLines: { [page: number]: string[] } = { 1: [] };
  let currentY = topMargin;

  // === PAGE 1 CONTENT BLOCKS ===

  // 1. Recipient Box & Metadata
  const metaHeight = 32;
  currentY += metaHeight + 4;

  // 2. Subject Line
  const subjectHeight = 12;
  currentY += subjectHeight + 4;

  // 3. Body Text Distribution across pages
  const lineHeight = 5.2;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    if (currentY + lineHeight > safeBottomY) {
      // Need a new page
      currentPage++;
      pageLines[currentPage] = [];
      currentY = topMargin + 8; // Extra padding at top of continuation page
    }
    pageLines[currentPage].push(line);
    currentY += lineHeight;
  }

  // 4. Sign-off block
  const signoffHeight = 34;
  let signoffPage = currentPage;
  if (currentY + signoffHeight > safeBottomY) {
    // Signature block overflows; place on a new page
    currentPage++;
    signoffPage = currentPage;
  }

  const totalPages = currentPage;

  // === RENDER PAGES ===
  for (let p = 1; p <= totalPages; p++) {
    if (p > 1) {
      doc.addPage();
    }

    // Draw header, background, footer, and page numbers
    drawLetterhead({
      doc,
      profile,
      enterpriseName,
      letterhead,
      variant: letter.letterheadVariant || 'Company',
      referenceNumber: letter.letterNumber,
      dateStr: letter.date,
      confidentiality: letter.confidentiality,
      pageNumber: p,
      totalPages
    });

    let renderY = topMargin;

    // On Page 1: Render Recipient, Ref, and Subject
    if (p === 1) {
      // Recipient Block
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(leftMargin, renderY, contentWidth, 30, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('TO:', leftMargin + 4, renderY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(letter.recipientOrganization || 'General Addressee / Contractor', leftMargin + 4, renderY + 11.5);

      if (letter.attention) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(`Attn: ${letter.attention}`, leftMargin + 4, renderY + 16.5);
      }

      if (letter.recipientAddress) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const addrLines = doc.splitTextToSize(letter.recipientAddress, contentWidth / 2 - 8);
        doc.text(addrLines.slice(0, 2), leftMargin + 4, renderY + 21);
      }

      // Right Column: Date & References
      const rightColX = leftMargin + contentWidth / 2 + 4;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('CORRESPONDENCE DETAILS:', rightColX, renderY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Date: ${letter.date}`, rightColX, renderY + 11);

      const refToDisplay = letter.ourReference || letter.letterNumber;
      doc.setFont('helvetica', 'bold');
      doc.text(`Our Ref: ${refToDisplay}`, rightColX, renderY + 16);
      doc.setFont('helvetica', 'normal');

      if (letter.projectName || letter.projectCode || letter.projectAffix) {
        const projLabel = `Project: [${letter.projectAffix || letter.projectCode || 'GEN'}] ${
          letter.projectName || ''
        }`.trim();
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(doc.splitTextToSize(projLabel, contentWidth / 2 - 8)[0], rightColX, renderY + 21);
        doc.setTextColor(15, 23, 42);
      }

      if (letter.theirReference) {
        doc.setFontSize(7.5);
        doc.text(`Your Ref: ${letter.theirReference}`, rightColX, renderY + 25.5);
      }

      renderY += 34;

      // Subject Bar
      doc.setFillColor(241, 245, 249);
      doc.rect(leftMargin, renderY, contentWidth, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(leftMargin, renderY, contentWidth, 8, 'S');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`SUBJECT: ${letter.subject.toUpperCase()}`, leftMargin + 4, renderY + 5.5);

      renderY += 14;
    } else {
      // Continuation Header Banner Note
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Ref: ${letter.ourReference || letter.letterNumber} | Page ${p} of ${totalPages}`,
        leftMargin,
        renderY + 4
      );
      doc.setDrawColor(226, 232, 240);
      doc.line(leftMargin, renderY + 6, pageWidth - rightMargin, renderY + 6);
      renderY += 12;
    }

    // Render Body Lines for Page p
    const linesForPage = pageLines[p] || [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    for (let lIdx = 0; lIdx < linesForPage.length; lIdx++) {
      doc.text(linesForPage[lIdx], leftMargin, renderY);
      renderY += lineHeight;
    }

    // Render Sign-off on signoffPage
    if (p === signoffPage) {
      renderY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Yours faithfully,', leftMargin, renderY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(profile?.legalName || enterpriseName, leftMargin, renderY + 5);

      // Signature line & seal representation
      doc.setDrawColor(148, 163, 184);
      doc.line(leftMargin, renderY + 18, leftMargin + 60, renderY + 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(letter.approvedBy || letter.preparedBy || 'Authorized Signatory', leftMargin, renderY + 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Status: ${letter.status.toUpperCase()} | Version ${letter.version} | Authenticated`,
        leftMargin,
        renderY + 27
      );
    }
  }

  // Save PDF
  const filename = `${letter.letterNumber.replace(/[\/\\:]/g, '_')}_Official_Correspondence.pdf`;
  doc.save(filename);
};

export const generateLetterPdf = exportLetterToPDF;
