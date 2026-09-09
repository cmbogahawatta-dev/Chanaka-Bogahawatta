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
 * NOTE: Standard business & engineering practice:
 * Letterhead artwork/header is STRICTLY rendered on Page 1.
 * Remaining continuation pages (Page > 1) are clean BLANK pages without letterhead background.
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
  const leftMargin = letterhead?.contentLeftMargin || 20;
  const rightMargin = letterhead?.contentRightMargin || 20;

  const legalName = profile?.legalName || profile?.tradingName || enterpriseName;

  // =========================================================================
  // CONTINUATION PAGES (PAGE > 1): BLANK SHEET WITHOUT LETTERHEAD BACKGROUND
  // =========================================================================
  if (pageNumber > 1) {
    // Pure blank page - no letterhead artwork, no header banner, no footer banner.
    // Subtle, professional continuation header line:
    const contHeaderY = 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(100, 116, 139);

    if (referenceNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Ref: ${referenceNumber}`, leftMargin, contHeaderY);
      doc.setFont('helvetica', 'normal');
    }
    if (dateStr) {
      doc.text(`Date: ${dateStr}`, pageWidth / 2, contHeaderY, { align: 'center' });
    }
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - rightMargin, contHeaderY, { align: 'right' });

    // Hairline rule underneath continuation header
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, contHeaderY + 3, pageWidth - rightMargin, contHeaderY + 3);

    // Minimal continuation footer at bottom of blank sheet
    const contFooterY = pageHeight - 15;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, contFooterY - 3, pageWidth - rightMargin, contFooterY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${legalName} • Continuation Sheet (Page ${pageNumber} of ${totalPages})`, leftMargin, contFooterY + 2);
    doc.text('Authenticated Official Correspondence Record', pageWidth - rightMargin, contFooterY + 2, {
      align: 'right'
    });

    // Content on blank continuation page starts safely at 25mm
    return 25;
  }

  // =========================================================================
  // PAGE 1: OFFICIAL LETTERHEAD SHEET
  // =========================================================================

  // 1. FULL PAGE LETTERHEAD BACKGROUND (if uploaded, PAGE 1 ONLY)
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

  // 2. HEADER BANNER (if uploaded, PAGE 1 ONLY)
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

  // 3. STYLED FALLBACK HEADER (if no custom header image uploaded, PAGE 1 ONLY)
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

  // 4. CONFIDENTIALITY BADGE (Page 1)
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

  // 5. FOOTER BANNER / TEXT (Page 1)
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
    doc.text(`Page 1 of ${totalPages}`, pageWidth - rightMargin, footerY + 14, {
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

export interface RenderLetterPdfResult {
  doc: jsPDF;
  filename: string;
  totalPages: number;
  letterhead: LetterheadTemplate;
  dataUri: string;
  blob: Blob;
  fileSize: number;
}

/**
 * Builds and renders the complete letter jsPDF document without saving.
 */
export const renderLetterPdfDocument = (
  letter: Letter,
  profile?: EnterpriseProfileDetails,
  enterpriseName: string = 'EMA CORPORATE ENTERPRISE',
  explicitLetterhead?: LetterheadTemplate
): RenderLetterPdfResult => {
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

  // Clean HTML text into plain text paragraphs
  const cleanBody = letter.bodyHtml
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  const paragraphs = (cleanBody || 'No text provided.')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const lineHeight = 5.2;
  const paragraphSpacing = 3.5;
  const signoffHeight = 36;

  // Box Dimensions on Page 1
  const colWidth = (contentWidth - 4) / 2;
  const boxesHeight = 36;

  // Subject Box Height calculation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const subjLines = doc.splitTextToSize(`SUBJECT: ${letter.subject.toUpperCase()}`, contentWidth - 14);
  const subjBoxHeight = Math.max(10, subjLines.length * 4.6 + 4.5);

  // Height of header content blocks on Page 1
  const page1MetaTotalHeight = boxesHeight + 3.5 + subjBoxHeight + 5;
  const page1BodyStartY = topMargin + page1MetaTotalHeight;
  const page1SafeBottomY = pageHeight - bottomMargin;

  const contBodyStartY = 25;
  const contSafeBottomY = pageHeight - 22;

  // Distribute paragraphs across pages with justified layout calculation
  interface PageParagraphItem {
    text: string;
    y: number;
    linesCount: number;
  }

  const pageItemsMap: { [pageNum: number]: PageParagraphItem[] } = { 1: [] };

  let curPage = 1;
  let curY = page1BodyStartY;
  let curSafeBottomY = page1SafeBottomY;

  const paraQueue = [...paragraphs];

  while (paraQueue.length > 0) {
    const para = paraQueue.shift()!;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const pLines = doc.splitTextToSize(para, contentWidth);
    const pHeight = pLines.length * lineHeight;

    if (curY + pHeight <= curSafeBottomY) {
      pageItemsMap[curPage].push({ text: para, y: curY, linesCount: pLines.length });
      curY += pHeight + paragraphSpacing;
    } else {
      const remainingHeight = curSafeBottomY - curY;
      const fitLines = Math.floor(remainingHeight / lineHeight);

      if (fitLines >= 2 && pLines.length - fitLines >= 1) {
        // Split paragraph across the page boundary
        const part1 = pLines.slice(0, fitLines).join(' ');
        const part2 = pLines.slice(fitLines).join(' ');

        pageItemsMap[curPage].push({ text: part1, y: curY, linesCount: fitLines });

        curPage++;
        pageItemsMap[curPage] = [];
        curY = contBodyStartY;
        curSafeBottomY = contSafeBottomY;
        paraQueue.unshift(part2);
      } else {
        // Push entire paragraph to continuation page
        curPage++;
        pageItemsMap[curPage] = [];
        curY = contBodyStartY;
        curSafeBottomY = contSafeBottomY;
        paraQueue.unshift(para);
      }
    }
  }

  // Determine Sign-off Page placement
  let signoffPage = curPage;
  let signoffY = curY + 3;

  if (signoffY + signoffHeight > curSafeBottomY) {
    curPage++;
    pageItemsMap[curPage] = [];
    signoffPage = curPage;
    signoffY = contBodyStartY + 3;
  }

  const totalPages = curPage;

  // === RENDER PAGES ===
  for (let p = 1; p <= totalPages; p++) {
    if (p > 1) {
      doc.addPage();
    }

    // Draw Letterhead: Strictly Page 1 has letterhead; Page > 1 are blank continuation sheets
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

    // =======================================================================
    // PAGE 1: STRUCTURED CORRESPONDENCE DETAILS & SUBJECT BOXES
    // =======================================================================
    if (p === 1) {
      const boxY = topMargin;

      // 1. RECIPIENT DETAILS BOX (LEFT)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.35);
      doc.roundedRect(leftMargin, boxY, colWidth, boxesHeight, 1.5, 1.5, 'FD');

      // Header strip for Recipient Box
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.roundedRect(leftMargin, boxY, colWidth, 5.5, 1.5, 1.5, 'F');
      doc.rect(leftMargin, boxY + 3.5, colWidth, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(leftMargin, boxY + 5.5, leftMargin + colWidth, boxY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.text('TO: RECIPIENT & ADDRESSEE', leftMargin + 3.5, boxY + 4);

      // Organization name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42); // Slate 900
      const orgLines = doc.splitTextToSize(letter.recipientOrganization || 'General Addressee / Employer', colWidth - 7);
      doc.text(orgLines.slice(0, 2), leftMargin + 3.5, boxY + 10.5);

      let recY = boxY + 10.5 + (orgLines.length > 1 ? 8 : 4.5);

      if (letter.attention) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Attn: ${letter.attention}`, leftMargin + 3.5, recY);
        recY += 4.5;
      }

      if (letter.recipientAddress) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(100, 116, 139);
        const addrLines = doc.splitTextToSize(letter.recipientAddress, colWidth - 7);
        doc.text(addrLines.slice(0, 2), leftMargin + 3.5, recY);
      }

      // 2. CORRESPONDENCE PARTICULARS BOX (RIGHT)
      const rightBoxX = leftMargin + colWidth + 4;

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.35);
      doc.roundedRect(rightBoxX, boxY, colWidth, boxesHeight, 1.5, 1.5, 'FD');

      // Header strip for Particulars Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(rightBoxX, boxY, colWidth, 5.5, 1.5, 1.5, 'F');
      doc.rect(rightBoxX, boxY + 3.5, colWidth, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(rightBoxX, boxY + 5.5, rightBoxX + colWidth, boxY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85);
      doc.text('CORRESPONDENCE PARTICULARS', rightBoxX + 3.5, boxY + 4);

      // Key-Value rows
      const lblX = rightBoxX + 3.5;
      const valX = rightBoxX + 23;
      let rowY = boxY + 10.5;

      // Row 1: Date
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text('Date:', lblX, rowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(letter.date || new Date().toLocaleDateString('en-GB'), valX, rowY);

      rowY += 4.8;
      // Row 2: Our Ref
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Our Ref:', lblX, rowY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(67, 56, 202); // Indigo 700
      doc.text(letter.ourReference || letter.letterNumber, valX, rowY);

      rowY += 4.8;
      // Row 3: Your Ref
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Your Ref:', lblX, rowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(letter.theirReference ? 15 : 148, letter.theirReference ? 23 : 163, letter.theirReference ? 42 : 184);
      doc.text(letter.theirReference || '—', valX, rowY);

      rowY += 4.8;
      // Row 4: Project
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Project:', lblX, rowY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(4, 120, 87); // Emerald 700
      const projLabel = `[${letter.projectAffix || letter.projectCode || 'GEN'}] ${letter.projectName || 'General'}`;
      doc.text(doc.splitTextToSize(projLabel, colWidth - 25)[0], valX, rowY);

      rowY += 4.8;
      // Row 5: Category & Classification
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Category:', lblX, rowY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${letter.category || 'General'} • ${letter.confidentiality || 'Normal'}`, valX, rowY);

      // 3. SUBJECT BOX (FULL WIDTH WITH ACCENT STRIPE)
      const subjBoxY = boxY + boxesHeight + 3.5;

      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.35);
      doc.roundedRect(leftMargin, subjBoxY, contentWidth, subjBoxHeight, 1.5, 1.5, 'FD');

      // Left Accent Stripe
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.roundedRect(leftMargin, subjBoxY, 3, subjBoxHeight, 1, 1, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(subjLines, leftMargin + 6, subjBoxY + 5.5);
    }

    // =======================================================================
    // RENDER JUSTIFIED BODY PARAGRAPHS IN BOX FOR PAGE p
    // =======================================================================
    const itemsForPage = pageItemsMap[p] || [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    for (let itemIdx = 0; itemIdx < itemsForPage.length; itemIdx++) {
      const item = itemsForPage[itemIdx];
      // Standard practice: Letter body paragraphs are fully justified within the safe content width
      doc.text(item.text, leftMargin, item.y, {
        maxWidth: contentWidth,
        align: 'justify'
      });
    }

    // =======================================================================
    // RENDER SIGN-OFF ON SIGNOFF PAGE
    // =======================================================================
    if (p === signoffPage) {
      const sY = signoffY;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Yours faithfully,', leftMargin, sY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(profile?.legalName || enterpriseName, leftMargin, sY + 5);

      // Signature line & official verification seal representation
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.35);
      doc.line(leftMargin, sY + 18, leftMargin + 65, sY + 18);

      // Sealed badge representation
      if (letter.status === 'Approved') {
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(leftMargin + 72, sY + 7, 45, 14, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(22, 101, 52);
        doc.text('AUTHENTICATED & SEALED', leftMargin + 75, sY + 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(21, 128, 61);
        doc.text('BOARD APPROVED SIGNATURE', leftMargin + 75, sY + 18);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(letter.approvedBy || letter.preparedBy || 'Authorized Signatory', leftMargin, sY + 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Status: ${letter.status.toUpperCase()} | Version ${letter.version} | Authenticated Corporate Record`,
        leftMargin,
        sY + 27
      );
    }
  }

  const filename = `${letter.letterNumber.replace(/[\/\\:]/g, '_')}_Official_Correspondence.pdf`;
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');

  return {
    doc,
    filename,
    totalPages,
    letterhead,
    dataUri,
    blob,
    fileSize: blob.size
  };
};

/**
 * Render and immediately trigger browser download of the official PDF.
 */
export const exportLetterToPDF = (
  letter: Letter,
  profile?: EnterpriseProfileDetails,
  enterpriseName?: string,
  explicitLetterhead?: LetterheadTemplate
): RenderLetterPdfResult => {
  const result = renderLetterPdfDocument(letter, profile, enterpriseName, explicitLetterhead);
  result.doc.save(result.filename);
  return result;
};

export const generateLetterPdf = exportLetterToPDF;
