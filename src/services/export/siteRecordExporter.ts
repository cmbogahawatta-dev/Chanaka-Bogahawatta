import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { DailySiteRecord } from '../../types/siteRecordTypes';

/**
 * Generate a professional, consultant-grade Daily Site Record (DSR) PDF
 */
export const exportSiteRecordToPDF = (record: DailySiteRecord): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [16, 185, 129]; // Emerald 500
  const secondaryColor: [number, number, number] = [30, 41, 59]; // Slate 800

  // 1. TOP HEADER BANNER
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand / Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('EMA ENTERPRISE CORPORATE SUITE', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('CONSTRUCTION OPERATIONS & DAILY SITE RECORD (DSR)', 14, 18);

  // DSR Ref & Date (Right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(record.dsrNumber, pageWidth - 14, 11, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${record.date} | Shift: ${record.shift}`, pageWidth - 14, 18, { align: 'right' });

  // Accent Line
  doc.setFillColor(...accentColor);
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  let currentY = 34;

  // 2. PROJECT & SITE META BOX
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Project:', 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.projectCode} - ${record.projectName}`, 35, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Location:', 18, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(record.siteLocation || 'Main Project Site', 35, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Hours:', 18, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.workingHoursStart || '07:30'} to ${record.workingHoursEnd || '17:30'}`, 35, currentY + 18);

  // Status & Weather Badge in Meta Box
  doc.setFont('helvetica', 'bold');
  doc.text('Weather:', 115, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.weatherMorning} (AM) / ${record.weatherAfternoon} (PM)`, 132, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Rainfall / Temp:', 115, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${record.rainfallMm} mm | ${record.temperatureC}°C | Ground: ${record.groundCondition}`, 142, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 115, currentY + 18);
  doc.setFont('helvetica', 'bold');
  if (record.signOff.status === 'Verified & Approved') {
    doc.setTextColor(16, 185, 129); // Green
  } else {
    doc.setTextColor(234, 88, 12); // Orange
  }
  doc.text(record.signOff.status, 130, currentY + 18);

  currentY += 27;

  // 3. EXECUTIVE SUMMARY
  if (record.executiveSummary) {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('EXECUTIVE SITE SUMMARY', 14, currentY);
    currentY += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(record.executiveSummary, pageWidth - 28);
    doc.text(splitSummary, 14, currentY);
    currentY += splitSummary.length * 4.5 + 4;
  }

  // 4. MANPOWER TABLE
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. MANPOWER & LABOUR DEPLOYMENT', 14, currentY);
  currentY += 2;

  const totalHeadcount = record.manpower.reduce((acc, curr) => acc + (curr.headCount || 0), 0);
  const totalManHours = record.manpower.reduce(
    (acc, curr) => acc + (curr.headCount || 0) * ((curr.regularHours || 0) + (curr.overtimeHours || 0)),
    0
  );

  const manpowerRows = record.manpower.map((mp, index) => [
    (index + 1).toString(),
    mp.category === 'DIRECT' ? 'Direct Labour' : (mp.subcontractorName || 'Subcontractor'),
    mp.trade,
    mp.headCount.toString(),
    `${mp.regularHours}h`,
    `${mp.overtimeHours || 0}h`,
    `${mp.headCount * (mp.regularHours + (mp.overtimeHours || 0))}h`,
    mp.locationAssigned || '-'
  ]);

  // Add footer row for totals
  manpowerRows.push([
    '',
    'TOTAL LABOUR FORCE',
    '',
    `${totalHeadcount} Men`,
    '',
    '',
    `${totalManHours} Man-Hours`,
    ''
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Category / Subcontractor', 'Trade / Designation', 'Headcount', 'Reg Hrs', 'OT Hrs', 'Total Hrs', 'Location / Area']],
    body: manpowerRows,
    theme: 'grid',
    headStyles: {
      fillColor: secondaryColor,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59]
    },
    styles: { cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === manpowerRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 5. PLANT & EQUIPMENT TABLE
  if (record.equipment && record.equipment.length > 0) {
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('2. PLANT & HEAVY MACHINERY UTILIZATION', 14, currentY);
    currentY += 2;

    const equipmentRows = record.equipment.map((eq, index) => [
      (index + 1).toString(),
      eq.equipmentName,
      eq.assetOrRegNo,
      eq.operatorName,
      `${eq.hoursWorked}h`,
      `${eq.hoursIdle}h`,
      `${eq.fuelLitersUsed} L`,
      eq.status,
      eq.activityAssigned
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Machinery / Plant Description', 'Asset / Reg No', 'Operator', 'Work', 'Idle', 'Fuel', 'Status', 'Activity Assigned']],
      body: equipmentRows,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      styles: { cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        4: { cellWidth: 14, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' },
        7: { cellWidth: 20, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 6. MATERIAL RECEIPTS TABLE
  if (record.materials && record.materials.length > 0) {
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('3. MATERIAL DELIVERIES & QC INSPECTION', 14, currentY);
    currentY += 2;

    const materialRows = record.materials.map((mat, index) => [
      (index + 1).toString(),
      mat.materialName,
      mat.supplier,
      mat.deliveryTicketNo,
      `${mat.quantity} ${mat.unit}`,
      mat.deliveryTime,
      mat.qcStatus,
      mat.testReference || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Material Description', 'Supplier', 'Ticket #', 'Quantity', 'Time', 'QC Status', 'Test Ref / Notes']],
      body: materialRows,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      styles: { cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 22, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 7. WORK PROGRESS & ACTIVITIES TABLE
  if (record.progress && record.progress.length > 0) {
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('4. WORK PROGRESS & ACTIVITIES LOG', 14, currentY);
    currentY += 2;

    const progressRows = record.progress.map((prg, index) => [
      (index + 1).toString(),
      prg.locationOrChainage,
      prg.tradeOrWorkItem,
      `${prg.plannedQuantity} ${prg.unit}`,
      `${prg.actualQuantity} ${prg.unit}`,
      `${prg.percentageComplete}%`,
      prg.status,
      prg.remarks || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Location / Chainage', 'Trade / Work Item Description', 'Planned', 'Actual Output', 'Progress', 'Status', 'Remarks']],
      body: progressRows,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      styles: { cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 22, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 8. SAFETY HSE & DELAYS BOX
  if (currentY > 225) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('5. HEALTH, SAFETY & ENVIRONMENT (HSE)', 14, currentY);
  currentY += 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Toolbox Talk: ${record.safety.toolboxTalkConducted ? 'Yes (Conducted)' : 'No'}`, 18, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Topic: ${record.safety.toolboxTopic || 'General Site Safety'} (${record.safety.toolboxAttendeesCount || 0} attendees)`, 18, currentY + 10);

  doc.setFont('helvetica', 'bold');
  doc.text(`PPE Compliance: ${record.safety.ppeComplianceRate}%`, 115, currentY + 5);
  doc.text(`Safety Incidents / LTI: ${record.safety.lostTimeInjuriesCount} (First Aid: ${record.safety.firstAidCasesCount})`, 115, currentY + 10);

  if (record.safety.safetyOfficerNotes) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${record.safety.safetyOfficerNotes}`, 18, currentY + 16);
  }

  currentY += 25;

  // 9. SIGN-OFF & VERIFICATION BOX
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('6. VERIFICATION & OFFICIAL SIGN-OFF', 14, currentY);
  currentY += 3;

  const signBoxWidth = (pageWidth - 28 - 6) / 2;

  // Contractor / Site Engineer Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, signBoxWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('PREPARED BY (CONTRACTOR / SITE ENGINEER)', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Name: ${record.signOff.preparedByName}`, 18, currentY + 12);
  doc.text(`Role: ${record.signOff.preparedByRole}`, 18, currentY + 17);
  doc.text(`Date & Time: ${record.signOff.preparedDate}`, 18, currentY + 22);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(16, 185, 129);
  doc.text('Digital Signature Verified', 18, currentY + 28);

  // Client / Consultant Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14 + signBoxWidth + 6, currentY, signBoxWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFIED & APPROVED (CONSULTANT / RESIDENT ENG.)', 14 + signBoxWidth + 10, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Name: ${record.signOff.verifiedByName || record.signOff.clientRepName || 'Pending Consultant Verification'}`, 14 + signBoxWidth + 10, currentY + 12);
  doc.text(`Role: ${record.signOff.verifiedByRole || 'Senior Resident Engineer'}`, 14 + signBoxWidth + 10, currentY + 17);
  doc.text(`Date: ${record.signOff.verifiedDate || record.date}`, 14 + signBoxWidth + 10, currentY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`STATUS: ${record.signOff.status.toUpperCase()}`, 14 + signBoxWidth + 10, currentY + 28);

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by EMA Enterprise Construction Operations System | Page ${i} of ${pageCount} | DSR Ref: ${record.dsrNumber}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${record.dsrNumber}_${record.projectCode}_${record.date}.pdf`);
};

/**
 * Export Multi-Sheet Construction DSR Workbook to Excel (.xlsx)
 */
export const exportSiteRecordsToExcel = (records: DailySiteRecord[], filename = 'Construction_Daily_Site_Records.xlsx'): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: DSR Master Summary
  const summaryData = records.map(r => {
    const totalMen = r.manpower.reduce((sum, m) => sum + (m.headCount || 0), 0);
    const totalHours = r.manpower.reduce((sum, m) => sum + (m.headCount || 0) * (m.regularHours + (m.overtimeHours || 0)), 0);
    const activeMachines = r.equipment.filter(e => e.status === 'Working').length;

    return {
      'DSR Number': r.dsrNumber,
      'Date': r.date,
      'Project Code': r.projectCode,
      'Project Name': r.projectName,
      'Site Location': r.siteLocation,
      'Shift': r.shift,
      'Weather AM': r.weatherMorning,
      'Weather PM': r.weatherAfternoon,
      'Rainfall (mm)': r.rainfallMm,
      'Temp (°C)': r.temperatureC,
      'Ground Condition': r.groundCondition,
      'Lost Hours (Weather)': r.workingHoursLostWeather,
      'Total Labour Headcount': totalMen,
      'Total Man-Hours': totalHours,
      'Active Machinery': activeMachines,
      'Safety LTI': r.safety.lostTimeInjuriesCount,
      'Safety First Aid': r.safety.firstAidCasesCount,
      'Toolbox Talk': r.safety.toolboxTalkConducted ? 'Yes' : 'No',
      'Sign-off Status': r.signOff.status,
      'Prepared By': r.signOff.preparedByName,
      'Verified By': r.signOff.verifiedByName || r.signOff.clientRepName || 'N/A',
      'Executive Summary': r.executiveSummary
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'DSR Master Summary');

  // Sheet 2: Manpower Breakdown
  const manpowerData: any[] = [];
  records.forEach(r => {
    r.manpower.forEach(m => {
      manpowerData.push({
        'DSR Number': r.dsrNumber,
        'Date': r.date,
        'Project Code': r.projectCode,
        'Category': m.category,
        'Subcontractor': m.subcontractorName || 'Direct Hire',
        'Trade / Role': m.trade,
        'Headcount': m.headCount,
        'Regular Hours': m.regularHours,
        'Overtime Hours': m.overtimeHours || 0,
        'Total Hours': m.headCount * (m.regularHours + (m.overtimeHours || 0)),
        'Location Assigned': m.locationAssigned || r.siteLocation
      });
    });
  });
  const wsManpower = XLSX.utils.json_to_sheet(manpowerData);
  XLSX.utils.book_append_sheet(wb, wsManpower, 'Manpower Logs');

  // Sheet 3: Plant & Equipment
  const equipmentData: any[] = [];
  records.forEach(r => {
    r.equipment.forEach(e => {
      equipmentData.push({
        'DSR Number': r.dsrNumber,
        'Date': r.date,
        'Project Code': r.projectCode,
        'Equipment Name': e.equipmentName,
        'Asset / Reg No': e.assetOrRegNo,
        'Operator': e.operatorName,
        'Hours Worked': e.hoursWorked,
        'Hours Idle': e.hoursIdle,
        'Hours Breakdown': e.hoursBreakdown,
        'Fuel Used (L)': e.fuelLitersUsed,
        'Status': e.status,
        'Activity': e.activityAssigned
      });
    });
  });
  const wsEquipment = XLSX.utils.json_to_sheet(equipmentData);
  XLSX.utils.book_append_sheet(wb, wsEquipment, 'Plant & Equipment');

  // Sheet 4: Material Deliveries
  const materialData: any[] = [];
  records.forEach(r => {
    r.materials.forEach(m => {
      materialData.push({
        'DSR Number': r.dsrNumber,
        'Date': r.date,
        'Project Code': r.projectCode,
        'Material Name': m.materialName,
        'Supplier': m.supplier,
        'Ticket / Waybill No': m.deliveryTicketNo,
        'Quantity': m.quantity,
        'Unit': m.unit,
        'Delivery Time': m.deliveryTime,
        'QC Status': m.qcStatus,
        'Test Reference': m.testReference || 'N/A',
        'Linked PO': m.linkedPoNumber || 'N/A'
      });
    });
  });
  const wsMaterials = XLSX.utils.json_to_sheet(materialData);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Material Deliveries');

  // Sheet 5: Work Progress & Quantities
  const progressData: any[] = [];
  records.forEach(r => {
    r.progress.forEach(p => {
      progressData.push({
        'DSR Number': r.dsrNumber,
        'Date': r.date,
        'Project Code': r.projectCode,
        'Location / Chainage': p.locationOrChainage,
        'Trade / Item Description': p.tradeOrWorkItem,
        'Planned Qty': p.plannedQuantity,
        'Actual Output': p.actualQuantity,
        'Unit': p.unit,
        'Percentage Complete (%)': p.percentageComplete,
        'Status': p.status,
        'Assigned Workforce': p.workforceCount || 'N/A',
        'Remarks': p.remarks || ''
      });
    });
  });
  const wsProgress = XLSX.utils.json_to_sheet(progressData);
  XLSX.utils.book_append_sheet(wb, wsProgress, 'Work Progress');

  // Write file
  XLSX.writeFile(wb, filename);
};
