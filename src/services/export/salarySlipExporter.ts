import { PayrollEmployeeLine, PayrollBatch } from '../../types/payrollTypes';
import { StaffMember } from '../../types/staffTypes';
import { SalaryHistoryEntry } from '../../types/salaryHistoryTypes';

export class SalarySlipExporter {
  /**
   * Generates a printable, styled HTML payslip window
   */
  public static printPaySlip(
    line: PayrollEmployeeLine,
    staff?: StaffMember,
    salaryEntry?: SalaryHistoryEntry,
    payrollMonth: string = '2026-08'
  ): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print pay slips.');
      return;
    }

    const earningsRows = line.earnings
      .map(
        e => `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${e.label}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500; font-size: 13px;">${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join('');

    const deductionsRows = line.deductions
      .map(
        d => `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${d.label}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500; font-size: 13px; color: #dc2626;">(${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pay Slip - ${line.employeeName} (${payrollMonth})</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; }
          .payslip-box { max-width: 760px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 28px; }
          .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
          .company-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
          .sub-title { font-size: 12px; color: #64748b; margin-top: 2px; }
          .slip-badge { font-size: 14px; font-weight: 700; color: #2563eb; text-align: right; }
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 6px; }
          .tables-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
          .net-box { background: #0f172a; color: #fff; padding: 16px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
          .net-val { font-size: 22px; font-weight: 800; color: #38bdf8; }
          .statutory-box { margin-top: 16px; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 12px; display: flex; justify-content: space-between; }
          @media print {
            body { padding: 0; }
            .payslip-box { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="company-title">EMA CONSTRUCTIONS (PVT) LTD</div>
                <div class="sub-title">Civil Engineering & Infrastructure Contractors • Sri Lanka</div>
                <div class="sub-title">Reg: PV 89402 • EPF No: EMA/EPF/1042</div>
              </td>
              <td class="slip-badge">
                SALARY PAY SLIP<br>
                <span style="font-size: 12px; color: #64748b; font-weight: 500;">PERIOD: ${payrollMonth}</span>
              </td>
            </tr>
          </table>

          <div class="grid-info">
            <div>
              <strong>Employee:</strong> ${line.employeeName}<br>
              <strong>Emp Code:</strong> ${line.employeeCode}<br>
              <strong>Designation:</strong> ${line.designation}<br>
              <strong>Department:</strong> ${line.department}
            </div>
            <div>
              <strong>Assigned Project:</strong> ${line.projectId}<br>
              <strong>EPF Member No:</strong> ${staff?.epfRegistrationNumber || staff?.epfNo || staff?.nicNumber || 'EMA-EPF-1042'}<br>
              <strong>Bank Account:</strong> ${staff?.salaryStructure?.bankName || staff?.bankName || salaryEntry?.bankName || 'Commercial Bank'} (${staff?.salaryStructure?.accountNumber || staff?.bankAccountNo || salaryEntry?.bankAccountNo || '8004592014'})<br>
              <strong>Payment Mode:</strong> ${staff?.salaryStructure?.paymentMode || salaryEntry?.paymentMode || 'Bank Transfer'}
            </div>
          </div>

          <div class="tables-container">
            <div>
              <table>
                <thead>
                  <tr>
                    <th>Earnings</th>
                    <th style="text-align: right;">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${earningsRows}
                  <tr style="background: #f8fafc; font-weight: 700;">
                    <td style="padding: 8px 10px; border-top: 2px solid #cbd5e1;">Gross Earnings</td>
                    <td style="padding: 8px 10px; border-top: 2px solid #cbd5e1; text-align: right; color: #0f172a;">${line.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <table>
                <thead>
                  <tr>
                    <th>Deductions</th>
                    <th style="text-align: right;">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${deductionsRows}
                  <tr style="background: #f8fafc; font-weight: 700;">
                    <td style="padding: 8px 10px; border-top: 2px solid #cbd5e1;">Total Deductions</td>
                    <td style="padding: 8px 10px; border-top: 2px solid #cbd5e1; text-align: right; color: #dc2626;">(${line.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="net-box">
            <div>
              <span style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; opacity: 0.8;">Net Remittance Payable</span><br>
              <span style="font-size: 13px; font-weight: 500;">Transferred via SLIPS / CEFT</span>
            </div>
            <div class="net-val">
              LKR ${line.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div class="statutory-box">
            <div>
              <strong>Employer EPF (12%):</strong> LKR ${line.employerEpf.toLocaleString(undefined, { minimumFractionDigits: 2 })} &nbsp;|&nbsp;
              <strong>Employer ETF (3%):</strong> LKR ${line.employerEtf.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div>
              <strong>Total Employer Cost:</strong> LKR ${line.totalEmployerCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div style="margin-top: 28px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <div>Computer generated salary document. No physical signature required.</div>
            <div>Generated: ${new Date().toLocaleDateString('en-GB')} • EMA ERP Core</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  public static printEmployeeSalarySlip(line: PayrollEmployeeLine, staff?: StaffMember, salaryEntry?: SalaryHistoryEntry): void {
    SalarySlipExporter.printPaySlip(line, staff, salaryEntry, line.batchId);
  }

  /**
   * Export CSV Bank Transfer Advice
   */
  public static exportBankTransferAdviceCSV(batch: PayrollBatch, staffMembers?: StaffMember[]): void {
    const headers = [
      'Beneficiary Name',
      'Employee Code',
      'Bank Name',
      'Account Number',
      'Net Amount (LKR)',
      'Reference / Narration'
    ];

    const rows = batch.lines.map(line => {
      const staff = staffMembers?.find(s => s.id === line.employeeId);
      return [
        `"${line.employeeName.replace(/"/g, '""')}"`,
        `"${line.employeeCode}"`,
        `"${staff?.salaryStructure?.bankName || staff?.bankName || 'Commercial Bank of Ceylon'}"`,
        `"${staff?.salaryStructure?.accountNumber || staff?.bankAccountNo || '8004592014'}"`,
        line.netSalary.toFixed(2),
        `"SALARY ${batch.payrollMonth} ${line.employeeCode}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bank_Transfer_Advice_${batch.payrollMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public static exportBankTransferAdvice(batch: PayrollBatch, staffMembers?: StaffMember[]): void {
    SalarySlipExporter.exportBankTransferAdviceCSV(batch, staffMembers);
  }

  /**
   * Export EPF Form C & ETF Monthly Return Schedule
   */
  public static exportEpfEtfSchedule(batch: PayrollBatch, staffMembers?: StaffMember[]): void {
    const headers = [
      'Member NIC',
      'EPF Member No',
      'Employee Code',
      'Member Full Name',
      'Basic + BRA (LKR)',
      'Employee EPF 8% (LKR)',
      'Employer EPF 12% (LKR)',
      'Total EPF 20% (LKR)',
      'Employer ETF 3% (LKR)'
    ];

    const rows = batch.lines.map(line => {
      const staff = staffMembers?.find(s => s.id === line.employeeId);
      const epfEe = line.deductions.find(d => d.code === 'EPF_EE')?.amount || 0;
      const epfEr = line.employerEpf;
      const totalEpf = epfEe + epfEr;
      const etfEr = line.employerEtf;

      return [
        `"${staff?.nicNumber || staff?.nicNo || ''}"`,
        `"${staff?.epfRegistrationNumber || staff?.epfNo || staff?.employeeCode}"`,
        `"${line.employeeCode}"`,
        `"${line.employeeName.replace(/"/g, '""')}"`,
        line.basicSalary.toFixed(2),
        epfEe.toFixed(2),
        epfEr.toFixed(2),
        totalEpf.toFixed(2),
        etfEr.toFixed(2)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EPF_ETF_Return_Schedule_${batch.payrollMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
