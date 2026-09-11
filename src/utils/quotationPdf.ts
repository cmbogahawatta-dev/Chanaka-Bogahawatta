import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from '../types/quotationTypes';
import { formatQuotationDate, resolveClientAddress } from './quotationUtils';

/**
 * Generates an executive, publication-grade A4 PDF Commercial Quotation / Cost Estimate.
 */
export function generateQuotationPdf(quotation: Quotation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const isQuotation = quotation.documentType === 'QUOTATION';
  const isDraft = quotation.status === 'DRAFT';
  const isCancelled = quotation.status === 'CANCELLED';
  const isExpired = quotation.status === 'EXPIRED';
  const isAccepted = quotation.status === 'ACCEPTED' || quotation.status === 'CONVERTED';
  const isRejected = quotation.status === 'REJECTED';

  // Watermarks
  if (isCancelled) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.setTextColor(240, 160, 160);
    doc.text('CANCELLED - VOID', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  } else if (isRejected) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.setTextColor(245, 170, 170);
    doc.text('REJECTED', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  } else if (isExpired) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.setTextColor(245, 200, 150);
    doc.text('EXPIRED', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  } else if (isDraft) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(45);
    doc.setTextColor(225, 230, 235);
    doc.text('PROVISIONAL DRAFT', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  } else if (isAccepted) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(45);
    doc.setTextColor(215, 240, 225);
    doc.text('OFFICIALLY ACCEPTED', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  }

  // Top Statutory Accent Bar
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Prominent Header
  let y = 14;

  const docTitle = isQuotation ? 'COMMERCIAL QUOTATION' : 'ENGINEERING COST ESTIMATE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(docTitle, margin, y + 6);

  // Directly underneath: Quotation Number & Revision Badge
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const numberPrefix = isQuotation ? 'Quotation No: ' : 'Estimate No: ';
  doc.text(numberPrefix, margin, y + 13);

  const prefixWidth = doc.getTextWidth(numberPrefix);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199); // Blue accent
  doc.text(quotation.quotationNumber, margin + prefixWidth, y + 13);

  const numWidth = doc.getTextWidth(quotation.quotationNumber);
  const revLabel = quotation.revision?.revisionLabel || 'Rev.00';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(147, 51, 234); // Purple
  doc.text(`[${revLabel}]`, margin + prefixWidth + numWidth + 4, y + 13);

  // Status & Date on right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date: ${formatQuotationDate(quotation.quotationDate)}`, pageWidth - margin, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  let statusColor: [number, number, number] = [100, 116, 139];
  if (quotation.status === 'ACCEPTED' || quotation.status === 'CONVERTED') {
    statusColor = [16, 185, 129];
  } else if (quotation.status === 'SENT') {
    statusColor = [2, 132, 199];
  } else if (quotation.status === 'EXPIRED') {
    statusColor = [217, 119, 6];
  } else if (quotation.status === 'REJECTED' || quotation.status === 'CANCELLED') {
    statusColor = [220, 38, 38];
  }

  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`Status: ${quotation.status}`, pageWidth - margin, y + 13, { align: 'right' });

  // Thin clean separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 17, pageWidth - margin, y + 17);

  y += 21;

  // Two-Column Section: Service Provider vs Client Details
  const colWidth = (pageWidth - margin * 2 - 6) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 6;

  const resolvedAddress = resolveClientAddress(quotation);
  const suppAddrLines = doc.splitTextToSize(quotation.supplierAddress, colWidth - 6);
  const clientAddrLines = doc.splitTextToSize(resolvedAddress, colWidth - 6);
  const maxAddrLines = Math.max(suppAddrLines.length, clientAddrLines.length);
  const cardHeight = Math.max(44, 34 + maxAddrLines * 3.6);

  // Service Provider Card (Left)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftColX, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(leftColX, y, colWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('ISSUED BY (SERVICE PROVIDER)', leftColX + 3, y + 5);

  let suppY = y + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const suppNameLines = doc.splitTextToSize(quotation.supplierName, colWidth - 6);
  doc.text(suppNameLines, leftColX + 3, suppY);
  suppY += suppNameLines.length * 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(suppAddrLines, leftColX + 3, suppY);
  suppY += Math.max(1, suppAddrLines.length) * 3.5 + 1;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TIN:', leftColX + 3, suppY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(quotation.supplierTin || '102938475', leftColX + 11, suppY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VAT:', leftColX + 44, suppY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(quotation.supplierVatNumber || '102938475-7000', leftColX + 54, suppY);

  suppY += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${quotation.supplierContact}`, leftColX + 3, suppY);

  // Client Card (Right)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightColX, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX, y, colWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PREPARED FOR (CLIENT)', rightColX + 3, y + 5);

  let clientY = y + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const clientNameLines = doc.splitTextToSize(quotation.clientName, colWidth - 6);
  doc.text(clientNameLines, rightColX + 3, clientY);
  clientY += clientNameLines.length * 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(clientAddrLines, rightColX + 3, clientY);
  clientY += Math.max(1, clientAddrLines.length) * 3.5 + 1;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TIN:', rightColX + 3, clientY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(quotation.clientTin || 'N/A', rightColX + 11, clientY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VAT:', rightColX + 44, clientY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(quotation.clientVatNumber || 'N/A', rightColX + 54, clientY);

  clientY += 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const contactText = `Attn: ${quotation.clientContactPerson || 'Procurement Director'} ${quotation.clientPhone ? `(${quotation.clientPhone})` : ''}`;
  doc.text(contactText.slice(0, 45), rightColX + 3, clientY);

  y += cardHeight + 4;

  // Metadata Strip: Date, Validity, Project, Estimated Duration
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 1.5, 1.5, 'FD');

  const metaColW = (pageWidth - margin * 2) / 4;

  // Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFER DATE', margin + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatQuotationDate(quotation.quotationDate), margin + 3, y + 11);

  // Validity
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`VALID UNTIL (${quotation.validityDays || 30} DAYS)`, margin + metaColW + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatQuotationDate(quotation.validUntilDate), margin + metaColW + 3, y + 11);

  // Project / Reference
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PROJECT / TENDER REF', margin + metaColW * 2 + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const projText = quotation.projectCode || quotation.tenderRef || quotation.projectName || 'General Commercial Works';
  doc.text(projText.slice(0, 26), margin + metaColW * 2 + 3, y + 11);

  // Duration
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ESTIMATED TIMELINE', margin + metaColW * 3 + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.estimatedDuration || 'As agreed in scope', margin + metaColW * 3 + 3, y + 11);

  y += 20;

  // Table of Items
  const tableData = quotation.lineItems.map((item, index) => {
    const discStr = item.discountPercent && item.discountPercent > 0
      ? `${item.discountPercent}%`
      : item.discountAmount && item.discountAmount > 0
      ? `-${item.discountAmount.toLocaleString()}`
      : '-';

    return [
      String(index + 1).padStart(2, '0'),
      item.description,
      item.unitOfMeasure || 'Nos',
      item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      discStr,
      item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      `${item.vatRate}%`,
      item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [[
      '#',
      'Description of Proposed Works / Supply Items',
      'Unit',
      'Qty',
      'Unit Rate (LKR)',
      'Disc',
      'Taxable (LKR)',
      'VAT',
      'Total (LKR)'
    ]],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'right', cellWidth: 26 },
      7: { halign: 'center', cellWidth: 12 },
      8: { halign: 'right', cellWidth: 26 }
    }
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : y + 50;

  // Financial Summary Block (Right)
  const totalsWidth = 84;
  const totalsX = pageWidth - margin - totalsWidth;
  let totalsY = finalY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, totalsY, totalsWidth, 40, 1.5, 1.5, 'FD');

  // Gross Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal (Before Discount):', totalsX + 3, totalsY + 6);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`LKR ${quotation.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 6, { align: 'right' });

  // Discount
  if (quotation.totalDiscountAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(217, 119, 6);
    doc.text('Total Commercial Discount:', totalsX + 3, totalsY + 12);
    doc.setFont('courier', 'bold');
    doc.text(`- LKR ${quotation.totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 12, { align: 'right' });
  }

  // Taxable Value
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Net Taxable Base Value:', totalsX + 3, totalsY + 18);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`LKR ${quotation.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 18, { align: 'right' });

  // VAT @ 18%
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Value Added Tax (VAT @ ${quotation.vatRate}%):`, totalsX + 3, totalsY + 24);
  doc.setFont('courier', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(`LKR ${quotation.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 24, { align: 'right' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsX + 3, totalsY + 28, totalsX + totalsWidth - 3, totalsY + 28);

  // Total Consideration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Quoted Consideration:', totalsX + 3, totalsY + 34);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`LKR ${quotation.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 34, { align: 'right' });

  // Left Block: Amount in Words & Key Commercial Terms
  const leftBlockWidth = totalsX - margin - 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, totalsY, leftBlockWidth, 40, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AMOUNT IN WORDS:', margin + 3, totalsY + 5);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const splitWords = doc.splitTextToSize(quotation.amountInWords, leftBlockWidth - 6);
  doc.text(splitWords, margin + 3, totalsY + 10);

  // Terms summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('COMMERCIAL CONDITIONS:', margin + 3, totalsY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const payTerms = `Payment Terms: ${quotation.paymentTerms || '30% Advance, balance against progress milestones.'}`;
  const splitPay = doc.splitTextToSize(payTerms, leftBlockWidth - 6);
  doc.text(splitPay, margin + 3, totalsY + 25);

  if (quotation.warrantyPeriod) {
    doc.text(`Warranty/DLP: ${quotation.warrantyPeriod}`, margin + 3, totalsY + 33);
  } else if (quotation.deliveryTerms) {
    doc.text(`Delivery: ${quotation.deliveryTerms}`, margin + 3, totalsY + 33);
  }

  // Signatures Section
  const sigY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, sigY - 2, pageWidth - margin, sigY - 2);

  const sigColW = (pageWidth - margin * 2) / 3;

  // Prepared By
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED BY (ESTIMATING)', margin + 3, sigY + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.preparedBy || 'Estimating Engineer', margin + 3, sigY + 8);
  doc.line(margin + 3, sigY + 16, margin + sigColW - 10, sigY + 16);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature & Date', margin + 3, sigY + 20);

  // Approved By
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AUTHORIZED COMMERCIAL APPROVAL', margin + sigColW + 3, sigY + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.approvedBy || (quotation.status !== 'DRAFT' ? 'Director of Operations' : 'Pending Authorization'), margin + sigColW + 3, sigY + 8);
  doc.line(margin + sigColW + 3, sigY + 16, margin + sigColW * 2 - 10, sigY + 16);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature & Date', margin + sigColW + 3, sigY + 20);

  // Client Acceptance Block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENT CONFIRMATION / ACCEPTANCE', margin + sigColW * 2 + 3, sigY + 3);
  doc.roundedRect(margin + sigColW * 2 + 3, sigY + 5, sigColW - 10, 16, 1, 1, 'D');
  doc.setFontSize(7);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  const acceptText = isAccepted ? 'CONFIRMED & ACCEPTED' : 'AUTHORIZED CLIENT SIGN & STAMP';
  doc.text(acceptText, margin + sigColW * 2 + (sigColW - 10) / 2, sigY + 14, { align: 'center' });

  // Bottom Footer Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Official Commercial Estimation Document • Apex Global ERP / EMA Construction • Strictly Not Linked to Expenses', margin, pageHeight - 2);
  doc.text(`Page 1 of 1 • Generated ${new Date().toISOString()}`, pageWidth - margin, pageHeight - 2, { align: 'right' });

  return doc;
}
