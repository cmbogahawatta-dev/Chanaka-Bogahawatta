import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Calendar,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  Upload,
  Camera,
  CheckCircle2,
  Loader2,
  FileCheck,
  Eye
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { Driver } from '../../types';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverToEdit?: Driver | null;
}

export const DriverModal: React.FC<DriverModalProps> = ({
  isOpen,
  onClose,
  driverToEdit
}) => {
  const { vehicles, addDriver, updateDriver } = useFleet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [licenseClasses, setLicenseClasses] = useState<string>('Class B (Dual Purpose & Cars)');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<string>('2028-06-30');
  const [department, setDepartment] = useState<string>('Logistics & Operations');
  const [status, setStatus] = useState<'active' | 'on-leave' | 'inactive'>('active');
  const [emergencyContact, setEmergencyContact] = useState<string>('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [assignedVehicleId, setAssignedVehicleId] = useState<string>('');
  const [licenseDocUrl, setLicenseDocUrl] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (driverToEdit) {
      setName(driverToEdit.name);
      setEmployeeId(driverToEdit.employeeId);
      setPhone(driverToEdit.phone);
      setEmail(driverToEdit.email);
      setLicenseNumber(driverToEdit.licenseNumber);
      setLicenseClasses(driverToEdit.licenseClasses);
      setLicenseExpiryDate(driverToEdit.licenseExpiryDate);
      setDepartment(driverToEdit.department);
      setStatus(driverToEdit.status);
      setEmergencyContact(driverToEdit.emergencyContact);
      setBloodGroup(driverToEdit.bloodGroup || 'O+');
      setAssignedVehicleId(driverToEdit.assignedVehicleId || '');
      setLicenseDocUrl(driverToEdit.licenseDocumentUrl || '');
      setDateOfBirth(driverToEdit.dateOfBirth || '');
      setAddress(driverToEdit.address || '');
    } else {
      setName('');
      setEmployeeId(`EMP-0${Math.floor(100 + Math.random() * 900)}`);
      setPhone('+94 7');
      setEmail('');
      setLicenseNumber('B-');
      setLicenseClasses('Class B (Cars / Vans), Light Commercial');
      setLicenseExpiryDate('2028-12-31');
      setDepartment('Logistics & Operations');
      setStatus('active');
      setEmergencyContact('');
      setBloodGroup('O+');
      setAssignedVehicleId('');
      setLicenseDocUrl('');
      setDateOfBirth('');
      setAddress('');
    }
    setScanSuccessMsg('');
    setErrorMsg('');
  }, [isOpen, driverToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setLicenseDocUrl(base64Data);
      setIsScanning(true);
      setErrorMsg('');
      setScanSuccessMsg('');

      try {
        const response = await fetch('/api/ai/scan-driver-license', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            mimeType: file.type || 'image/jpeg'
          })
        });

        const data = await response.json();
        if (response.ok && data.success && data.data) {
          const doc = data.data;
          if (doc.name) setName(doc.name);
          if (doc.licenseNumber) setLicenseNumber(doc.licenseNumber);
          if (doc.licenseClasses) setLicenseClasses(doc.licenseClasses);
          if (doc.licenseExpiryDate) setLicenseExpiryDate(doc.licenseExpiryDate);
          if (doc.bloodGroup) setBloodGroup(doc.bloodGroup);
          if (doc.dateOfBirth) setDateOfBirth(doc.dateOfBirth);
          if (doc.address) setAddress(doc.address);
          if (doc.emergencyContact && !emergencyContact) setEmergencyContact(doc.emergencyContact);

          setScanSuccessMsg('License credentials extracted and autofilled with Gemini AI!');
        } else {
          setErrorMsg(data.error || 'Could not parse document. Please verify image quality.');
        }
      } catch (err: any) {
        console.error('Scan error:', err);
        setErrorMsg('Network error scanning document. You can still enter details manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter driver name.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMsg('Please enter employee ID.');
      return;
    }
    if (!licenseNumber.trim()) {
      setErrorMsg('Please enter driving license number.');
      return;
    }
    if (!licenseExpiryDate) {
      setErrorMsg('Please specify license expiry date.');
      return;
    }

    if (driverToEdit) {
      updateDriver(driverToEdit.id, {
        name,
        employeeId,
        phone,
        email,
        licenseNumber,
        licenseClasses,
        licenseExpiryDate,
        department,
        status,
        emergencyContact,
        bloodGroup,
        assignedVehicleId: assignedVehicleId || undefined,
        licenseDocumentUrl: licenseDocUrl || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined
      });
    } else {
      addDriver({
        name,
        employeeId,
        phone,
        email,
        licenseNumber,
        licenseClasses,
        licenseExpiryDate,
        department,
        status,
        emergencyContact,
        bloodGroup,
        assignedVehicleId: assignedVehicleId || undefined,
        joinedDate: new Date().toISOString().split('T')[0],
        licenseDocumentUrl: licenseDocUrl || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {driverToEdit ? 'Edit Driver Profile' : 'Register New Driver'}
              </h2>
              <p className="text-[11px] text-slate-400">Driver identity & scanned license credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* AI License Document Upload & Autofill Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 border border-blue-500/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <span className="font-semibold text-white text-xs">AI Smart License Autofill</span>
                  <p className="text-[11px] text-slate-400">
                    Upload a photo of the Driver's License to extract details instantly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    {licenseDocUrl ? 'Rescan License' : 'Upload License'}
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Scanning Indicator or Result */}
            {isScanning && (
              <div className="mt-3 p-2.5 rounded-lg bg-blue-900/30 border border-blue-500/30 flex items-center gap-2 text-blue-200 text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Gemini AI is analyzing driving license credentials & classes...</span>
              </div>
            )}

            {scanSuccessMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{scanSuccessMsg}</span>
              </div>
            )}

            {licenseDocUrl && !isScanning && (
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="truncate flex-1">Scanned License Document Attached</span>
                <span className="text-emerald-400 font-medium">Ready</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Name and Employee ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sunil Perera"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Employee ID / Code <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP-0412"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="+94 77 123 4567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Company Email</label>
              <input
                type="email"
                placeholder="driver.name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Driving License & Expiry Credentials */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-semibold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Driving License Credentials
              </span>
              {licenseNumber && (
                <span className="text-[10px] text-slate-400 font-mono">
                  No: {licenseNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  License Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-84920194"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  License Expiry Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={licenseExpiryDate}
                  onChange={e => setLicenseExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Authorized License Classes</label>
              <input
                type="text"
                placeholder="e.g. Class B (Dual Purpose & Cars), Class C1 (Heavy)"
                value={licenseClasses}
                onChange={e => setLicenseClasses(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. No 45, Temple Road, Colombo"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Department, Status, Blood Group */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                placeholder="Logistics"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          {/* Assigned Vehicle & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assigned Vehicle</label>
              <select
                value={assignedVehicleId}
                onChange={e => setAssignedVehicleId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- No Vehicle Assigned / Pool Driver --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} ({v.make} {v.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Emergency Contact Info</label>
              <input
                type="text"
                placeholder="e.g. Spouse / Next of kin & Phone #"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {driverToEdit ? 'Save Driver Details' : 'Register Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
