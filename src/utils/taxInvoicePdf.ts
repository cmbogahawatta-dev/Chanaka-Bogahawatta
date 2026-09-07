import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaxInvoice } from '../types/taxInvoiceTypes';
import { formatDateToGazette } from './taxInvoiceUtils';

/**
 * Generates an official, Gazette No. 2481/22 compliant A4 PDF Tax Invoice.
 */
export function generateTaxInvoicePdf(invoice: TaxInvoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const isDraft = invoice.isDraft || invoice.status === 'DRAFT' || invoice.status === 'SUBMITTED' || invoice.status === 'APPROVED';
  const isCancelled = invoice.status === 'CANCELLED' || invoice.isCancelled;

  // Watermarks
  if (isCancelled) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(55);
    doc.setTextColor(240, 150, 150);
    // Draw rotated watermark
    doc.text('CANCELLED - VOID', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  } else if (isDraft) {
    doc.saveGraphicsState();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(220, 225, 230);
    doc.text('PREVIEW - DRAFT', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  }

  // Top Statutory Accent Bar
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Prominent Header "TAX INVOICE"
  let y = 14;

  // Clean Header without dark boxes or legal gazette citations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(invoice.isCreditNote ? 'TAX CREDIT NOTE' : 'TAX INVOICE', margin, y + 6);

  // Directly underneath: Tax Invoice Number :- [serialNumber]
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text('Tax Invoice Number :- ', margin, y + 13);

  const prefixWidth = doc.getTextWidth('Tax Invoice Number :- ');
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199); // Cyan / Blue accent
  doc.text(invoice.serialNumber, margin + prefixWidth, y + 13);

  // Status & Date on right side
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - margin, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(invoice.status === 'PAID' ? 16 : 100, invoice.status === 'PAID' ? 185 : 116, invoice.status === 'PAID' ? 129 : 139);
  doc.text(`Status: ${invoice.status}`, pageWidth - margin, y + 13, { align: 'right' });

  // Thin clean separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 17, pageWidth - margin, y + 17);

  y += 21;

  // Two-Column Section: Service Provider vs Purchaser Details
  const colWidth = (pageWidth - margin * 2 - 6) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 6;
  const cardHeight = 46;

  // Service Provider Card (Left)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(leftColX, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(leftColX, y, colWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('SERVICE PROVIDER', leftColX + 3, y + 5);

  let suppY = y + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.supplierName, leftColX + 3, suppY);

  suppY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const suppAddrLines = doc.splitTextToSize(invoice.supplierAddress, colWidth - 6);
  doc.text(suppAddrLines, leftColX + 3, suppY);
  suppY += Math.max(1, suppAddrLines.length) * 3.5 + 1;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TIN:', leftColX + 3, suppY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(invoice.supplierTin || 'N/A', leftColX + 12, suppY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VAT No:', leftColX + 44, suppY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(invoice.supplierVatNumber || 'N/A', leftColX + 59, suppY);

  suppY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Contact: ${invoice.supplierContact}`, leftColX + 3, suppY);

  suppY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Remittance: Commercial Bank • A/C 1000849201 • CCEYLKFX', leftColX + 3, suppY);

  // Purchaser Card (Right)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightColX, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX, y, colWidth, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PURCHASER', rightColX + 3, y + 5);

  let purchY = y + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.purchaserName, rightColX + 3, purchY);

  purchY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const purchAddrLines = doc.splitTextToSize(invoice.purchaserAddress || 'Registered Office Address', colWidth - 6);
  doc.text(purchAddrLines, rightColX + 3, purchY);
  purchY += Math.max(1, purchAddrLines.length) * 3.5 + 1;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TIN:', rightColX + 3, purchY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(invoice.purchaserTin || 'Unverified', rightColX + 12, purchY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VAT No:', rightColX + 44, purchY);
  doc.setFont('courier', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(invoice.purchaserVatNumber || 'N/A', rightColX + 59, purchY);

  purchY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Attn: ${invoice.purchaserContactPerson || 'Project Director'} ${invoice.purchaserPhone ? `(${invoice.purchaserPhone})` : ''}`, rightColX + 3, purchY);

  y += cardHeight + 4;

  // Metadata Strip: Dates, Project, IPC, Due Date
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 1.5, 1.5, 'FD');

  const metaColW = (pageWidth - margin * 2) / 4;

  // Invoice Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE DATE (CONTROLS SERIAL)', margin + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateToGazette(invoice.invoiceDate), margin + 3, y + 11);

  // Supply / Service Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE / PERIOD OF SUPPLY', margin + metaColW + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateToGazette(invoice.supplyDate || invoice.invoiceDate), margin + metaColW + 3, y + 11);

  // Project & IPC
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PROJECT / IPC CERTIFICATION', margin + metaColW * 2 + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const projText = `${invoice.projectCode} ${invoice.ipcNumber ? '• ' + invoice.ipcNumber : ''}`;
  doc.text(projText.slice(0, 26), margin + metaColW * 2 + 3, y + 11);

  // Payment Terms / Due Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT TERMS / DUE DATE', margin + metaColW * 3 + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateToGazette(invoice.dueDate), margin + metaColW * 3 + 3, y + 11);

  y += 20;

  // Table of Taxable Supplies
  const tableData = invoice.lineItems.map((item, index) => [
    String(index + 1).padStart(2, '0'),
    item.description,
    item.unitOfMeasure || 'Nos',
    item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    item.taxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    `${item.vatRate}%`,
    item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    item.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
  ]);

  autoTable(doc, {
    startY: y,
    head: [[
      '#',
      'Description of Taxable Goods / Engineering Works',
      'Unit',
      'Qty',
      'Unit Rate (LKR)',
      'Taxable Value (LKR)',
      'VAT',
      'VAT Amount (LKR)',
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
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'right', cellWidth: 24 },
      8: { halign: 'right', cellWidth: 26 }
    }
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : y + 50;

  // Financial Totals Summary Block (Right)
  const totalsWidth = 84;
  const totalsX = pageWidth - margin - totalsWidth;
  let totalsY = finalY;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(totalsX, totalsY, totalsWidth, 36, 1.5, 1.5, 'FD');

  // Subtotal (Taxable Value)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Total Value of Taxable Supply (Excl. VAT):', totalsX + 3, totalsY + 6);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`LKR ${invoice.totalTaxableValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 6, { align: 'right' });

  // Output VAT @ 18%
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Value Added Tax (Output VAT @ ${invoice.vatRate}%):`, totalsX + 3, totalsY + 14);
  doc.setFont('courier', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(`LKR ${invoice.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 14, { align: 'right' });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(totalsX + 3, totalsY + 18, totalsX + totalsWidth - 3, totalsY + 18);

  // Total Consideration (Gross Invoiced)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Consideration (Incl. VAT):', totalsX + 3, totalsY + 24);
  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`LKR ${invoice.totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 24, { align: 'right' });

  // Balance Due (if partially paid)
  if (invoice.amountReceived > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`Amount Settled: LKR ${invoice.amountReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + 3, totalsY + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // Amber
    doc.text(`Balance Due: LKR ${invoice.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalsX + totalsWidth - 3, totalsY + 30, { align: 'right' });
  }

  // Left Block: Amount in Words & Bank Details
  const leftBlockWidth = totalsX - margin - 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, totalsY, leftBlockWidth, 36, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AMOUNT IN WORDS (STATUTORY REQUIREMENT):', margin + 3, totalsY + 5);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const splitWords = doc.splitTextToSize(invoice.amountInWords, leftBlockWidth - 6);
  doc.text(splitWords, margin + 3, totalsY + 10);

  // Bank details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DIRECT REMITTANCE DETAILS:', margin + 3, totalsY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Bank: Commercial Bank PLC • Branch: Echelon Square Corporate', margin + 3, totalsY + 25);
  doc.text('Account Name: Apex Global Logistics Corp • Account No: 1000-8491-0028', margin + 3, totalsY + 29);
  doc.text('SWIFT: CCEYLKLX • Currency: LKR (Sri Lankan Rupees)', margin + 3, totalsY + 33);

  // Signatory Authorization Block
  const sigY = pageHeight - 34;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, sigY - 2, pageWidth - margin, sigY - 2);

  const sigColW = (pageWidth - margin * 2) / 3;

  // Prepared By
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED BY (FINANCE OFFICER)', margin + 3, sigY + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.preparedBy || 'Accounts Executive', margin + 3, sigY + 8);
  doc.line(margin + 3, sigY + 16, margin + sigColW - 10, sigY + 16);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature & Date', margin + 3, sigY + 20);

  // Approved By
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('VERIFIED & APPROVED (FINANCE DIRECTOR)', margin + sigColW + 3, sigY + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.approvedBy || (invoice.status === 'ISSUED' ? 'Director of Finance' : 'Pending Authorization'), margin + sigColW + 3, sigY + 8);
  doc.line(margin + sigColW + 3, sigY + 16, margin + sigColW * 2 - 10, sigY + 16);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature & Date', margin + sigColW + 3, sigY + 20);

  // Authorized Stamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ISSUED STAMP & OFFICIAL SEAL', margin + sigColW * 2 + 3, sigY + 3);
  doc.roundedRect(margin + sigColW * 2 + 3, sigY + 5, sigColW - 10, 16, 1, 1, 'D');
  doc.setFontSize(7);
  doc.setFont('courier', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.status === 'ISSUED' || invoice.status === 'PAID' ? 'APEX CORP / OFFICIAL TAX INVOICE' : 'PROVISIONAL DRAFT', margin + sigColW * 2 + (sigColW - 10) / 2, sigY + 13, { align: 'center' });

  // Bottom Footer Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 6, pageWidth, 6, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Inland Revenue Department (Sri Lanka) Gazette Extraordinary No. 2481/22 & No. 2500/106 Compliant Document • Apex Global ERP', margin, pageHeight - 2);
  doc.text(`Page 1 of 1 • Generated ${new Date().toISOString()}`, pageWidth - margin, pageHeight - 2, { align: 'right' });

  return doc;
}
