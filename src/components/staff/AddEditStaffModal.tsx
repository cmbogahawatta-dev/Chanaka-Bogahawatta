import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Building2,
  Briefcase,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  HeartHandshake,
  AlertCircle,
  FileBadge,
  CheckCircle2,
  Users,
  Lock
} from 'lucide-react';
import {
  StaffMember,
  Department,
  EmployeeRole,
  EmploymentType,
  StaffStatus
} from '../../types/staffTypes';
import { useStaff } from '../../context/StaffContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import { usePettyCash } from '../../context/PettyCashContext';

interface AddEditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: StaffMember | null;
}

const DEPARTMENTS: Department[] = [
  'Management',
  'Civil Engineering',
  'Project Operations',
  'Commercial & QS',
  'Finance & Accounts',
  'Logistics & Fleet',
  'HR & Administration',
  'Quality & Safety'
];

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: 'DIRECTOR', label: 'Executive Director' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'SITE_ENGINEER', label: 'Site Engineer' },
  { value: 'QUANTITY_SURVEYOR', label: 'Quantity Surveyor' },
  { value: 'SUPERVISOR', label: 'Site Supervisor' },
  { value: 'ACCOUNTANT', label: 'Accountant / Financial Officer' },
  { value: 'FLEET_MANAGER', label: 'Fleet & Logistics Manager' },
  { value: 'HR_OFFICER', label: 'HR & Welfare Officer' },
  { value: 'SAFETY_OFFICER', label: 'HSE Safety Officer' },
  { value: 'TECHNICAL_OFFICER', label: 'Technical Officer' },
  { value: 'SURVEYOR', label: 'Land Surveyor' },
  { value: 'FOREMAN', label: 'General Site Foreman' },
  { value: 'STOREKEEPER', label: 'Site Storekeeper' },
  { value: 'ADMIN_ASSISTANT', label: 'Administrative Assistant' }
];

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Permanent',
  'Contract',
  'Probation',
  'Consultant',
  'Intern'
];

const STATUSES: StaffStatus[] = [
  'Active',
  'On Leave',
  'Probation',
  'Transferred',
  'Resigned',
  'Terminated'
];

const SRI_LANKA_BANKS = [
  'Commercial Bank of Ceylon',
  'Bank of Ceylon (BOC)',
  'People\'s Bank',
  'Sampath Bank PLC',
  'Hatton National Bank (HNB)',
  'Nations Trust Bank (NTB)',
  'Seylan Bank PLC',
  'DFCC Bank',
  'National Development Bank (NDB)',
  'Pan Asia Banking Corporation'
];

export const AddEditStaffModal: React.FC<AddEditStaffModalProps> = ({
  isOpen,
  onClose,
  staffToEdit
}) => {
  const { staffMembers, addStaffMember, updateStaffMember } = useStaff();
  const { currentRole } = useEnterprise();
  const { projects } = usePettyCash();

  const canEditSalary =
    currentRole === 'ADMIN' ||
    currentRole === 'OWNER' ||
    currentRole === 'FINANCE';

  // Basic Info Form State
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [role, setRole] = useState<EmployeeRole>('SITE_ENGINEER');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState<Department>('Civil Engineering');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Permanent');
  const [status, setStatus] = useState<StaffStatus>('Active');
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmationDate, setConfirmationDate] = useState('');
  const [assignedProjectCode, setAssignedProjectCode] = useState('HEAD_OFFICE');
  const [reportsToId, setReportsToId] = useState<string>('');

  // Contact Info
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyAltPhone, setEmergencyAltPhone] = useState('');

  // Salary & Statutory
  const [basicSalary, setBasicSalary] = useState<number>(150000);
  const [siteAllowance, setSiteAllowance] = useState<number>(30000);
  const [transportAllowance, setTransportAllowance] = useState<number>(25000);
  const [phoneAllowance, setPhoneAllowance] = useState<number>(5000);
  const [budgetaryRelief, setBudgetaryRelief] = useState<number>(5000);
  const [bankName, setBankName] = useState(SRI_LANKA_BANKS[0]);
  const [bankBranch, setBankBranch] = useState('Colombo Main');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'Cheque' | 'Petty Cash Voucher' | 'Cash'>('Bank Transfer');
  const [epfRegNo, setEpfRegNo] = useState('');
  const [taxDeductions, setTaxDeductions] = useState<number>(0);

  // Qualifications & Notes
  const [qualificationsText, setQualificationsText] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill or generate defaults when opening
  useEffect(() => {
    if (staffToEdit) {
      setEmployeeCode(staffToEdit.employeeCode);
      setFullName(staffToEdit.fullName);
      setPreferredName(staffToEdit.preferredName);
      setNicNumber(staffToEdit.nicNumber);
      setRole(staffToEdit.role);
      setDesignation(staffToEdit.designation);
      setDepartment(staffToEdit.department);
      setEmploymentType(staffToEdit.employmentType);
      setStatus(staffToEdit.status);
      setJoinedDate(staffToEdit.joinedDate);
      setConfirmationDate(staffToEdit.confirmationDate || '');
      setAssignedProjectCode(staffToEdit.assignedProjectCode || 'HEAD_OFFICE');
      setReportsToId(staffToEdit.reportsToId || '');

      setEmail(staffToEdit.email);
      setPhone(staffToEdit.phone);
      setAlternatePhone(staffToEdit.alternatePhone || '');
      setResidentialAddress(staffToEdit.residentialAddress);

      setEmergencyName(staffToEdit.emergencyContact.name);
      setEmergencyRelationship(staffToEdit.emergencyContact.relationship);
      setEmergencyPhone(staffToEdit.emergencyContact.phone);
      setEmergencyAltPhone(staffToEdit.emergencyContact.alternatePhone || '');

      setBasicSalary(staffToEdit.salaryStructure.basicSalary);
      setSiteAllowance(staffToEdit.salaryStructure.siteAllowance || 0);
      setTransportAllowance(staffToEdit.salaryStructure.transportAllowance || 0);
      setPhoneAllowance(staffToEdit.salaryStructure.phoneAllowance || 0);
      setBudgetaryRelief(staffToEdit.salaryStructure.budgetaryReliefAllowance || 0);
      setBankName(staffToEdit.salaryStructure.bankName || SRI_LANKA_BANKS[0]);
      setBankBranch(staffToEdit.salaryStructure.bankBranch || '');
      setAccountNumber(staffToEdit.salaryStructure.accountNumber || '');
      setPaymentMode(staffToEdit.salaryStructure.paymentMode || 'Bank Transfer');
      setTaxDeductions(staffToEdit.salaryStructure.taxDeductions || 0);
      setEpfRegNo(staffToEdit.epfRegistrationNumber || '');

      setQualificationsText(staffToEdit.qualifications ? staffToEdit.qualifications.join(', ') : '');
      setNotes(staffToEdit.notes || '');
      setErrorMsg('');
    } else {
      // New member code generation
      const nextNum = staffMembers.length + 1;
      setEmployeeCode(`EMA-EMP-${String(nextNum).padStart(3, '0')}`);
      setFullName('');
      setPreferredName('');
      setNicNumber('');
      setRole('SITE_ENGINEER');
      setDesignation('Resident Site Engineer');
      setDepartment('Civil Engineering');
      setEmploymentType('Permanent');
      setStatus('Active');
      setJoinedDate(new Date().toISOString().split('T')[0]);
      setConfirmationDate('');
      setAssignedProjectCode('HEAD_OFFICE');
      setReportsToId('');

      setEmail('');
      setPhone('+94 ');
      setAlternatePhone('');
      setResidentialAddress('');

      setEmergencyName('');
      setEmergencyRelationship('Spouse');
      setEmergencyPhone('+94 ');
      setEmergencyAltPhone('');

      setBasicSalary(180000);
      setSiteAllowance(30000);
      setTransportAllowance(30000);
      setPhoneAllowance(5000);
      setBudgetaryRelief(5000);
      setBankName(SRI_LANKA_BANKS[0]);
      setBankBranch('Corporate City Branch');
      setAccountNumber('');
      setPaymentMode('Bank Transfer');
      setTaxDeductions(0);
      setEpfRegNo(`EMA/EPF/${String(nextNum).padStart(3, '0')}`);

      setQualificationsText('');
      setNotes('');
      setErrorMsg('');
    }
  }, [staffToEdit, isOpen, staffMembers.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMsg('Full legal name is required.');
      return;
    }
    if (!employeeCode.trim()) {
      setErrorMsg('Employee Code is required.');
      return;
    }
    if (!nicNumber.trim()) {
      setErrorMsg('National Identity Card (NIC) is required.');
      return;
    }

    // Resolve assigned project name
    let assignedProjectName = 'Corporate Head Office';
    if (assignedProjectCode !== 'HEAD_OFFICE') {
      const proj = projects.find(p => p.PROJECT_CODE === assignedProjectCode);
      if (proj) assignedProjectName = proj.PROJECT_NAME;
    }

    // Resolve reportsToName
    let reportsToName: string | undefined = undefined;
    if (reportsToId) {
      const manager = staffMembers.find(m => m.id === reportsToId);
      if (manager) reportsToName = manager.fullName;
    }

    const qualifications = qualificationsText
      ? qualificationsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const memberPayload = {
      employeeCode: employeeCode.trim(),
      nicNumber: nicNumber.trim(),
      fullName: fullName.trim(),
      preferredName: preferredName.trim() || fullName.trim().split(' ')[0],
      email: email.trim() || `${employeeCode.toLowerCase()}@emaconstruction.lk`,
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim() || undefined,
      role,
      designation: designation.trim() || role,
      department,
      employmentType,
      status,
      joinedDate,
      confirmationDate: confirmationDate || undefined,
      assignedProjectCode,
      assignedProjectName,
      reportsToId: reportsToId || undefined,
      reportsToName,
      residentialAddress: residentialAddress.trim() || 'No address provided',
      emergencyContact: {
        name: emergencyName.trim() || 'Emergency Contact',
        relationship: emergencyRelationship,
        phone: emergencyPhone.trim(),
        alternatePhone: emergencyAltPhone.trim() || undefined
      },
      salaryStructure: canEditSalary
        ? {
            basicSalary: Number(basicSalary) || 0,
            budgetaryReliefAllowance: Number(budgetaryRelief) || 0,
            siteAllowance: Number(siteAllowance) || 0,
            transportAllowance: Number(transportAllowance) || 0,
            phoneAllowance: Number(phoneAllowance) || 0,
            epfEmployeeRate: 8,
            epfEmployerRate: 12,
            etfEmployerRate: 3,
            bankName,
            bankBranch: bankBranch.trim() || 'Main Branch',
            accountNumber: accountNumber.trim() || '0000000000',
            paymentMode,
            taxDeductions: Number(taxDeductions) || 0,
            effectiveDate: joinedDate
          }
        : staffToEdit?.salaryStructure || {
            basicSalary: 0,
            budgetaryReliefAllowance: 0,
            siteAllowance: 0,
            transportAllowance: 0,
            phoneAllowance: 0,
            epfEmployeeRate: 8,
            epfEmployerRate: 12,
            etfEmployerRate: 3,
            bankName: SRI_LANKA_BANKS[0],
            bankBranch: 'Main Branch',
            accountNumber: 'CONFIDENTIAL',
            paymentMode: 'Bank Transfer',
            taxDeductions: 0,
            effectiveDate: joinedDate
          },
      qualifications,
      notes: notes.trim() || undefined,
      epfRegistrationNumber: epfRegNo.trim() || undefined
    };

    if (staffToEdit) {
      updateStaffMember(staffToEdit.id, memberPayload);
    } else {
      addStaffMember(memberPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {staffToEdit ? 'Edit Employee Profile' : 'Register New Staff Member'}
              </h3>
              <p className="text-xs text-slate-400">
                Corporate HR database, site allocation & remuneration structures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identification & Designation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 pb-1 border-b border-slate-800">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>1. Corporate Identity & Role</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Employee Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. EMA-EMP-017"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Full Legal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eng. Sunil Samantha Perera"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Preferred / Display Name
                </label>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(e) => setPreferredName(e.target.value)}
                  placeholder="e.g. Sunil Perera"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  NIC Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value)}
                  placeholder="e.g. 198512345678 or 851234567V"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Role / Classification</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as EmployeeRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Official Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Resident Engineer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StaffStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Project <span className="text-cyan-400 font-normal">(Project Directory)</span>
                </label>
                <select
                  value={assignedProjectCode}
                  onChange={(e) => setAssignedProjectCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="HEAD_OFFICE">HEAD_OFFICE - Corporate Head Office - Colombo</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.PROJECT_CODE}>
                      {p.PROJECT_CODE} - {p.PROJECT_NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Supervisor <span className="text-cyan-400 font-normal">(Active Staff Directory Supervisors)</span>
                </label>
                <select
                  value={reportsToId}
                  onChange={(e) => setReportsToId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="">Directly to Management / Board</option>
                  {staffMembers
                    .filter(
                      (m) =>
                        (m.role === 'SUPERVISOR' || m.isSupervisor === true || m.designation?.toLowerCase().includes('supervisor')) &&
                        m.status === 'Active' &&
                        (!staffToEdit || m.id !== staffToEdit.id)
                    )
                    .map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.employeeCode} - {sup.fullName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Date Joined</label>
                <input
                  type="date"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Residential */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 pb-1 border-b border-slate-800">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>2. Contact Information & Emergency Contact</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Corporate / Personal Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@emaconstruction.lk"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="No. 12, Lake View Road, Colombo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Contact Name"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Relationship</label>
                <input
                  type="text"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="Spouse / Parent / Sibling"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Emergency Phone Number</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+94 77 999 8888"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Remuneration & Bank Routing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-100 flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>3. Compensation & Statutory Banking Details (LKR)</span>
              </div>
              {!canEditSalary && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                  <Lock className="w-3 h-3" />
                  RESTRICTED ACCESS
                </span>
              )}
            </h4>

            {canEditSalary ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Basic Salary (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Site Allowance</label>
                    <input
                      type="number"
                      min="0"
                      value={siteAllowance}
                      onChange={(e) => setSiteAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Transport / Fuel</label>
                    <input
                      type="number"
                      min="0"
                      value={transportAllowance}
                      onChange={(e) => setTransportAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Phone Allowance</label>
                    <input
                      type="number"
                      min="0"
                      value={phoneAllowance}
                      onChange={(e) => setPhoneAllowance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Budgetary Relief</label>
                    <input
                      type="number"
                      min="0"
                      value={budgetaryRelief}
                      onChange={(e) => setBudgetaryRelief(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Bank details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Bank Name</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {SRI_LANKA_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Bank Branch</label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Kandy City"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Bank Account No."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">EPF Registration No.</label>
                    <input
                      type="text"
                      value={epfRegNo}
                      onChange={(e) => setEpfRegNo(e.target.value)}
                      placeholder="e.g. EMA/EPF/042"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">Confidential Compensation & Payroll Structure</p>
                    <p className="text-[11px] text-slate-500">
                      Salary structure and banking parameters are restricted to Executive (Admin/Owner) and Finance authorized roles.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500 font-bold">
                  CONFIDENTIAL
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Qualifications & Remarks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2 pb-1 border-b border-slate-800">
              <FileBadge className="w-4 h-4 text-amber-400" />
              <span>4. Qualifications & Notes</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Qualifications (comma separated)
                </label>
                <input
                  type="text"
                  value={qualificationsText}
                  onChange={(e) => setQualificationsText(e.target.value)}
                  placeholder="e.g. B.Sc. Civil Eng (Hons), PMP, C.Eng IESL"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Administrative Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes or remarks"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{staffToEdit ? 'Save Changes' : 'Register Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
