import React from 'react';
import {
  X,
  User,
  Building2,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  Award,
  ChevronRight,
  Users,
  AlertCircle,
  Clock,
  HeartHandshake,
  DollarSign,
  FileBadge,
  Printer,
  Lock
} from 'lucide-react';
import { StaffMember } from '../../types/staffTypes';
import { useStaff } from '../../context/StaffContext';
import { useEnterprise } from '../../context/EnterpriseContext';

interface StaffProfileModalProps {
  member: StaffMember | null;
  onClose: () => void;
  onEdit?: (member: StaffMember) => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  member,
  onClose,
  onEdit
}) => {
  const { getDirectReports, getReportingHierarchyChain, setSelectedStaffMember } = useStaff();
  const { currentRole } = useEnterprise();

  if (!member) return null;

  const canViewSalary =
    currentRole === 'ADMIN' ||
    currentRole === 'OWNER' ||
    currentRole === 'FINANCE';

  const directReports = getDirectReports(member.id);
  const hierarchyChain = getReportingHierarchyChain(member.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'On Leave':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Probation':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Resigned':
      case 'Terminated':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const grossSalary =
    (member.salaryStructure.basicSalary || 0) +
    (member.salaryStructure.budgetaryReliefAllowance || 0) +
    (member.salaryStructure.siteAllowance || 0) +
    (member.salaryStructure.transportAllowance || 0) +
    (member.salaryStructure.phoneAllowance || 0);

  const epfEmployeeDeduction = ((member.salaryStructure.basicSalary || 0) * (member.salaryStructure.epfEmployeeRate || 8)) / 100;
  const epfEmployerContribution = ((member.salaryStructure.basicSalary || 0) * (member.salaryStructure.epfEmployerRate || 12)) / 100;
  const etfEmployerContribution = ((member.salaryStructure.basicSalary || 0) * (member.salaryStructure.etfEmployerRate || 3)) / 100;

  // Export / Print Printable PDF Dossier
  const handlePrintDossier = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const salaryHtml = canViewSalary
      ? `
        <div class="section">
          <div class="section-title">COMPENSATION & STATUTORY REMITS (LKR)</div>
          <table class="grid-table">
            <tr>
              <td><strong>Basic Salary:</strong> LKR ${(member.salaryStructure.basicSalary || 0).toLocaleString()}</td>
              <td><strong>Site Allowance:</strong> LKR ${(member.salaryStructure.siteAllowance || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Transport Allowance:</strong> LKR ${(member.salaryStructure.transportAllowance || 0).toLocaleString()}</td>
              <td><strong>Phone Allowance:</strong> LKR ${(member.salaryStructure.phoneAllowance || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Budgetary Relief:</strong> LKR ${(member.salaryStructure.budgetaryReliefAllowance || 0).toLocaleString()}</td>
              <td><strong>Gross Monthly Total:</strong> LKR ${grossSalary.toLocaleString()}</td>
            </tr>
          </table>
          <table class="grid-table" style="margin-top: 8px;">
            <tr>
              <td><strong>Bank:</strong> ${member.salaryStructure.bankName || 'N/A'} (${member.salaryStructure.bankBranch || ''})</td>
              <td><strong>Account No:</strong> ${member.salaryStructure.accountNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>EPF Employee (8%):</strong> LKR ${epfEmployeeDeduction.toLocaleString()}</td>
              <td><strong>EPF Employer (12%):</strong> LKR ${epfEmployerContribution.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>ETF Employer (3%):</strong> LKR ${etfEmployerContribution.toLocaleString()}</td>
              <td><strong>Payment Mode:</strong> ${member.salaryStructure.paymentMode || 'Bank Transfer'}</td>
            </tr>
          </table>
        </div>
      `
      : `
        <div class="section">
          <div class="section-title">COMPENSATION & STATUTORY REMITS</div>
          <p style="font-style: italic; color: #666;">[CONFIDENTIAL - Compensation records restricted to authorized Finance & HR Directors]</p>
        </div>
      `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Dossier - ${member.employeeCode} - ${member.fullName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #1e293b; line-height: 1.4; font-size: 12px; }
          .header { border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .company-name { font-size: 16px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .company-sub { font-size: 10px; color: #64748b; font-weight: bold; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
          .section { margin-bottom: 16px; }
          .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0891b2; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
          .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .grid-table td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; font-size: 11px; }
          .grid-table td strong { color: #475569; display: inline-block; width: 140px; }
          .sign-box { margin-top: 36px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sign-line { width: 200px; border-top: 1px solid #64748b; text-align: center; padding-top: 4px; font-size: 10px; color: #475569; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">EMA CONSTRUCTION (PVT) LTD</div>
            <div class="company-sub">HIGHWAYS, INFRASTRUCTURE, WATER SUPPLY & BUILDING CONTRACTORS</div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 6px; color: #0e7490;">OFFICIAL EMPLOYEE DOSSIER</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">${member.employeeCode}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Status: <strong>${member.status}</strong></div>
            <div style="font-size: 10px; color: #64748b;">Printed: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">1. BASIC EMPLOYMENT IDENTITY</div>
          <table class="grid-table">
            <tr>
              <td><strong>Full Legal Name:</strong> ${member.fullName}</td>
              <td><strong>Preferred Name:</strong> ${member.preferredName}</td>
            </tr>
            <tr>
              <td><strong>NIC Number:</strong> ${member.nicNumber}</td>
              <td><strong>EPF Registration:</strong> ${member.epfRegistrationNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Designation:</strong> ${member.designation}</td>
              <td><strong>Department:</strong> ${member.department}</td>
            </tr>
            <tr>
              <td><strong>Role Category:</strong> ${member.role}</td>
              <td><strong>Employment Type:</strong> ${member.employmentType}</td>
            </tr>
            <tr>
              <td><strong>Assigned Project/Site:</strong> ${member.assignedProjectName || member.assignedProjectCode}</td>
              <td><strong>Reports To:</strong> ${member.reportsToName || 'Direct to Board'}</td>
            </tr>
            <tr>
              <td><strong>Date of Joining:</strong> ${member.joinedDate}</td>
              <td><strong>Confirmation Date:</strong> ${member.confirmationDate || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">2. CONTACT & RESIDENTIAL PROFILE</div>
          <table class="grid-table">
            <tr>
              <td><strong>Mobile Phone:</strong> ${member.phone}</td>
              <td><strong>Alternate Phone:</strong> ${member.alternatePhone || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Email Address:</strong> ${member.email}</td>
              <td><strong>Residential Address:</strong> ${member.residentialAddress}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">3. EMERGENCY CONTACT INFORMATION</div>
          <table class="grid-table">
            <tr>
              <td><strong>Contact Name:</strong> ${member.emergencyContact.name}</td>
              <td><strong>Relationship:</strong> ${member.emergencyContact.relationship}</td>
            </tr>
            <tr>
              <td><strong>Emergency Phone:</strong> ${member.emergencyContact.phone}</td>
              <td><strong>Alternate Phone:</strong> ${member.emergencyContact.alternatePhone || 'N/A'}</td>
            </tr>
          </table>
        </div>

        ${salaryHtml}

        <div class="section">
          <div class="section-title">4. QUALIFICATIONS & CORPORATE REMARKS</div>
          <p><strong>Certifications / Degrees:</strong> ${member.qualifications?.join(', ') || 'Standard Trade / Corporate Verification'}</p>
          <p style="margin-top: 4px;"><strong>Internal HR Notes:</strong> ${member.notes || 'No adverse disciplinary records.'}</p>
        </div>

        <div class="sign-box">
          <div class="sign-line">Employee Signature</div>
          <div class="sign-line">Head of HR & Admin</div>
          <div class="sign-line">Managing Director / Finance</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-lg shadow-inner">
              {member.preferredName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{member.fullName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(member.status)}`}>
                  {member.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {member.employeeCode}
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-medium">{member.designation}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintDossier}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Print Official Dossier / Export PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Dossier</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
              >
                Edit Details
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs scrollbar-thin scrollbar-thumb-slate-700">
          {/* 1. Core Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Department & Site
              </span>
              <div>
                <p className="text-sm font-bold text-slate-100">{member.department}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Site: <span className="text-cyan-300 font-medium">{member.assignedProjectName || member.assignedProjectCode}</span>
                </p>
                <p className="text-[11px] text-slate-400">Employment: <span className="text-slate-200">{member.employmentType}</span></p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileBadge className="w-3.5 h-3.5 text-amber-400" />
                Identity & EPF
              </span>
              <div>
                <p className="text-xs text-slate-400">NIC Number:</p>
                <p className="text-sm font-mono font-bold text-slate-100">{member.nicNumber}</p>
                <p className="text-xs text-slate-400 mt-1">EPF Registration:</p>
                <p className="text-xs font-mono font-medium text-amber-300">{member.epfRegistrationNumber || 'Pending / N/A'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Service Timeline
              </span>
              <div>
                <p className="text-xs text-slate-400">Joined Corporate Date:</p>
                <p className="text-xs font-bold text-slate-200">{member.joinedDate}</p>
                {member.confirmationDate && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Confirmed: <span className="text-emerald-400">{member.confirmationDate}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Contact & Emergency Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Contact Channels</span>
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Mobile:</span>
                  <a href={`tel:${member.phone}`} className="font-mono text-cyan-300 hover:underline">
                    {member.phone}
                  </a>
                </div>
                {member.alternatePhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400">Alternate:</span>
                    <span className="font-mono text-slate-300">{member.alternatePhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">Email:</span>
                  <a href={`mailto:${member.email}`} className="text-slate-300 hover:text-cyan-300 hover:underline">
                    {member.email}
                  </a>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-[11px] leading-relaxed">{member.residentialAddress}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                <span>Emergency Contact Person</span>
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Contact Name:</span>
                  <span className="font-bold text-slate-100">{member.emergencyContact.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Relationship:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 text-[10px] font-bold">
                    {member.emergencyContact.relationship}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <a href={`tel:${member.emergencyContact.phone}`} className="font-mono text-rose-300 font-bold hover:underline">
                    {member.emergencyContact.phone}
                  </a>
                </div>
                {member.emergencyContact.alternatePhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Alt Phone:</span>
                    <span className="font-mono text-slate-300">{member.emergencyContact.alternatePhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Statutory Compensation & Banking Structure (ROLE GATED) */}
          {canViewSalary ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Compensation & Remuneration Structure (LKR)</span>
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
                  Gross: LKR {grossSalary.toLocaleString()} / mo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Basic Salary</span>
                  <span className="text-xs font-mono font-bold text-slate-100">
                    LKR {(member.salaryStructure.basicSalary || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Site Allowance</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    LKR {(member.salaryStructure.siteAllowance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Transport / Travel</span>
                  <span className="text-xs font-mono font-bold text-blue-300">
                    LKR {(member.salaryStructure.transportAllowance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Phone / Comm.</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    LKR {(member.salaryStructure.phoneAllowance || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Budgetary Relief</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    LKR {(member.salaryStructure.budgetaryReliefAllowance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Banking & EPF/ETF Rates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Bank Disbursement Account</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Bank:</span>
                    <span className="font-bold text-slate-200">{member.salaryStructure.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="text-slate-300">{member.salaryStructure.bankBranch}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Account No:</span>
                    <span className="font-mono font-bold text-cyan-300">{member.salaryStructure.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span className="text-slate-200 font-medium">{member.salaryStructure.paymentMode}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Statutory Deductions & Contributions</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">EPF Employee (8%):</span>
                    <span className="font-mono text-rose-400">- LKR {epfEmployeeDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">EPF Employer (12%):</span>
                    <span className="font-mono text-emerald-400">+ LKR {epfEmployerContribution.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ETF Employer (3%):</span>
                    <span className="font-mono text-emerald-400">+ LKR {etfEmployerContribution.toLocaleString()}</span>
                  </div>
                  {member.salaryStructure.taxDeductions !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">APIT / PAYE Tax:</span>
                      <span className="font-mono text-rose-400">- LKR {member.salaryStructure.taxDeductions.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Compensation & Remuneration Structure</p>
                  <p className="text-[11px] text-slate-500">Confidential — Access restricted to Executive & Finance roles.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 font-bold">
                RESTRICTED
              </span>
            </div>
          )}

          {/* 4. Reporting Line & Hierarchy Chain */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reporting Hierarchy & Supervisory Chain</span>
            </h4>

            {/* Upward chain */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Upward Line of Command:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {hierarchyChain.map((chainNode, idx) => (
                  <React.Fragment key={chainNode.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedStaffMember(chainNode)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        chainNode.id === member.id
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-cyan-500'
                      }`}
                    >
                      {chainNode.preferredName} ({chainNode.designation})
                    </button>
                    {idx < hierarchyChain.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Direct Reports */}
            {directReports.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Direct Reports ({directReports.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {directReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedStaffMember(report)}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-200 block text-xs">{report.preferredName}</span>
                        <span className="text-[10px] text-slate-400">{report.designation}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400">{report.employeeCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Qualifications & Notes */}
          {(member.qualifications?.length || member.notes) && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              {member.qualifications && member.qualifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Professional Qualifications & Certifications</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {member.qualifications.map((q, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700 text-[11px]"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {member.notes && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Corporate Notes:</span>
                  <p className="text-xs text-slate-300 italic">{member.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Employee Record ID: {member.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

