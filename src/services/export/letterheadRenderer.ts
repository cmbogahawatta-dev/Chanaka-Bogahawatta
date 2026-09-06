import jsPDF from 'jspdf';
import { EnterpriseProfileDetails } from '../../types/enterpriseProfileTypes';
import { Letter } from '../../types/correspondenceTypes';

export type LetterheadVariant = 'Company' | 'Project' | 'Finance' | 'Tender' | 'Confidential';

export interface DrawLetterheadOptions {
  doc: jsPDF;
  profile?: EnterpriseProfileDetails;
  enterpriseName?: string;
  variant?: LetterheadVariant;
  documentTitle?: string;
  referenceNumber?: string;
  dateStr?: string;
  confidentiality?: 'Normal' | 'Restricted' | 'Confidential';
}

/**
 * Shared official letterhead renderer for Enterprise Corporate Suite.
 * Factors out corporate branding, address blocks, compliance tags and footer.
 */
export const drawLetterhead = (options: DrawLetterheadOptions): number => {
  const {
    doc,
    profile,
    enterpriseName = 'EMA ENTERPRISE CORPORATE SUITE',
    variant = 'Company',
    documentTitle,
    referenceNumber,
    dateStr,
    confidentiality = 'Normal'
  } = options;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Color variants
  let primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  let accentColor: [number, number, number] = [16, 185, 129]; // Emerald 500

  if (variant === 'Project') {
    primaryColor = [30, 27, 75]; // Indigo 950
    accentColor = [99, 102, 241]; // Indigo 500
  } else if (variant === 'Finance') {
    primaryColor = [76, 5, 25]; // Rose 950
    accentColor = [244, 63, 94]; // Rose 500
  } else if (variant === 'Tender') {
    primaryColor = [59, 7, 100]; // Purple 950
    accentColor = [168, 85, 247]; // Purple 500
  } else if (variant === 'Confidential') {
    primaryColor = [69, 26, 3]; // Amber 950
    accentColor = [245, 158, 11]; // Amber 500
  }

  // 1. TOP HEADER BANNER
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Corporate Legal / Trading Name
  const legalName = profile?.legalName || profile?.tradingName || enterpriseName;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(legalName.toUpperCase(), 14, 11);

  // Subtitle / Compliance Info
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  const regParts: string[] = [];
  if (profile?.registrationNumber) regParts.push(`Reg No: ${profile.registrationNumber}`);
  if (profile?.vatNumber) regParts.push(`VAT: ${profile.vatNumber}`);
  if (profile?.cidaRegistrationNumber) regParts.push(`CIDA: ${profile.cidaRegistrationNumber}`);
  const regText = regParts.length > 0 ? regParts.join(' | ') : 'CORPORATE HEADQUARTERS & CONTRACT ADMINISTRATION';
  doc.text(regText, 14, 18);

  // Reference & Date on the right
  if (referenceNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(referenceNumber, pageWidth - 14, 11, { align: 'right' });
  }

  if (dateStr) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Date: ${dateStr}`, pageWidth - 14, 18, { align: 'right' });
  }

  // 2. ACCENT BAR
  doc.setFillColor(...accentColor);
  doc.rect(0, 28, pageWidth, 1.8, 'F');

  // 3. WATERMARK / BADGE IF CONFIDENTIAL
  if (confidentiality === 'Confidential' || confidentiality === 'Restricted') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...accentColor);
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.roundedRect(pageWidth - 45, 33, 31, 5.5, 1, 1, 'FD');
    doc.text(confidentiality.toUpperCase(), pageWidth - 29.5, 37, { align: 'center' });
  }

  // 4. BOTTOM CORPORATE FOOTER
  const footerY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.line(14, footerY - 3, pageWidth - 14, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate 500

  const address = profile?.registeredAddress || profile?.businessAddress || 'Level 14, World Trade Centre, Colombo 01, Sri Lanka';
  const contacts = [profile?.telephone, profile?.website, profile?.postalAddress].filter(Boolean).join(' | ') || 'Tel: +94 11 289 4000 | https://apexlogistics.lk';

  doc.text(`${address} | ${contacts}`, 14, footerY);
  doc.text(`Page 1 of 1 - Official Record`, pageWidth - 14, footerY, { align: 'right' });

  return 36; // Returns content start Y position
};

/**
 * Render complete letter to a consultant-grade PDF and trigger download.
 */
export const exportLetterToPDF = (
  letter: Letter,
  profile?: EnterpriseProfileDetails,
  enterpriseName?: string
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = drawLetterhead({
    doc,
    profile,
    enterpriseName,
    variant: letter.letterheadVariant || 'Company',
    referenceNumber: letter.letterNumber,
    dateStr: letter.date,
    confidentiality: letter.confidentiality
  });

  currentY += 4;

  // Recipient Box / Meta Section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RECIPIENT:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(letter.recipientOrganization || 'General Addressee / Contractor', 18, currentY + 12);
  if (letter.attention) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text(`Attn: ${letter.attention}`, 18, currentY + 17);
  }
  if (letter.recipientAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(letter.recipientAddress, 18, currentY + 22);
  }

  // Right column: Category & References
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CORRESPONDENCE DETAILS:', pageWidth / 2 + 10, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Category: ${letter.category}`, pageWidth / 2 + 10, currentY + 11);

  const refToDisplay = letter.ourReference || letter.letterNumber;
  if (refToDisplay) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Our Ref: ${refToDisplay}`, pageWidth / 2 + 10, currentY + 16);
    doc.setFont('helvetica', 'normal');
  }

  if (letter.projectName || letter.projectCode || letter.projectAffix) {
    const projLabel = `Project: [${letter.projectAffix || letter.projectCode || 'GEN'}] ${letter.projectName || ''}`.trim();
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(projLabel, pageWidth / 2 - 24)[0], pageWidth / 2 + 10, currentY + 21);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8.5);
  }

  if (letter.theirReference) {
    doc.text(`Your Ref: ${letter.theirReference}`, pageWidth / 2 + 10, currentY + 25);
  }
  if (letter.replyDueDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // Rose 600
    doc.text(`Reply Due: ${letter.replyDueDate}`, pageWidth / 2 + 10, currentY + 29);
  }

  currentY += 36;

  // Subject line with highlight bar
  doc.setFillColor(241, 245, 249);
  doc.rect(14, currentY, pageWidth - 28, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, currentY, pageWidth - 28, 8, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`SUBJECT: ${letter.subject.toUpperCase()}`, 18, currentY + 5.5);

  currentY += 14;

  // Clean html tags from bodyHtml for text placement
  const cleanBody = letter.bodyHtml
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const lines = doc.splitTextToSize(cleanBody || 'No text provided.', pageWidth - 28);
  doc.text(lines, 14, currentY);

  currentY += lines.length * 5 + 15;

  // Sign-off / Signature section
  if (currentY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    currentY = 30;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Yours faithfully,', 14, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(profile?.legalName || enterpriseName, 14, currentY + 5);

  doc.setDrawColor(148, 163, 184);
  doc.line(14, currentY + 20, 70, currentY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(letter.preparedBy || 'Authorized Signatory', 14, currentY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Status: ${letter.status.toUpperCase()} | Version ${letter.version}`, 14, currentY + 29);

  const filename = `${letter.letterNumber.replace(/[\/\\:]/g, '_')}.pdf`;
  doc.save(filename);
};

export const generateLetterPdf = exportLetterToPDF;
