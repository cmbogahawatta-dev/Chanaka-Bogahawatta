import React, { useState } from 'react';
import {
  X,
  Building2,
  Users,
  Plus,
  KeyRound,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
  Share2,
  Sparkles,
  Send,
  UserCheck,
  UserX,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Shield,
  Briefcase,
  LogIn,
  Lock,
  Truck,
  UserPlus
} from 'lucide-react';
import { useFleet } from '../../context/FleetContext';
import { UserRole } from '../../types';

interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'current' | 'login' | 'create' | 'join' | 'members';
}

export const EnterpriseModal: React.FC<EnterpriseModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'current'
}) => {
  const {
    currentEnterprise,
    loginToEnterpriseByCode,
    createEnterprise,
    joinEnterpriseByCode,
    currentEnterpriseUsers,
    currentUser,
    approveEnterpriseUser,
    rejectEnterpriseUser,
    updateUserRole,
    removeUserFromEnterprise,
    createInvitation,
    isAdmin,
    setCurrentUserById,
    vehicles,
    drivers,
    userAppointedVehicles
  } = useFleet();

  const [activeSubTab, setActiveSubTab] = useState<'current' | 'login' | 'create' | 'join' | 'members'>(
    initialTab === 'members' ? 'current' : initialTab
  );

  // Login to enterprise form
  const [loginEnterpriseCode, setLoginEnterpriseCode] = useState('');
  const [loginCredential, setLoginCredential] = useState('');
  const [loginFeedback, setLoginFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Member / Invite directly (Admin inside Enterprise)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('driver');
  const [newMemberDepartment, setNewMemberDepartment] = useState('Fleet Operations');
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);

  // Create Enterprise form state
  const [newName, setNewName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Logistics & Cargo Distribution');
  const [newAdminName, setNewAdminName] = useState(currentUser.name || 'Fleet Administrator');
  const [newAdminEmail, setNewAdminEmail] = useState(currentUser.email || 'admin@mycompany.com');
  const [newAdminPin, setNewAdminPin] = useState('1234');
  const [newPlan, setNewPlan] = useState<'Enterprise Fleet' | 'Professional Fleet' | 'Standard Logistics'>('Enterprise Fleet');
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('Sri Lanka');
  const [createSuccess, setCreateSuccess] = useState('');

  // Join Enterprise form state
  const [joinCode, setJoinCode] = useState('');
  const [joinUserName, setJoinUserName] = useState('');
  const [joinUserEmail, setJoinUserEmail] = useState('');
  const [joinUserPhone, setJoinUserPhone] = useState('+94 7');
  const [joinRole, setJoinRole] = useState<UserRole>('driver');
  const [joinDepartment, setJoinDepartment] = useState('Operations & Field Fleet');
  const [joinStatusMsg, setJoinStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('driver');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleEnterpriseLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEnterpriseCode.trim()) {
      setLoginFeedback({ type: 'error', text: 'Please enter a valid Enterprise Code.' });
      return;
    }

    const res = loginToEnterpriseByCode(loginEnterpriseCode.trim(), loginCredential.trim());
    if (res.success) {
      setLoginFeedback({ type: 'success', text: res.message });
      setTimeout(() => {
        setLoginFeedback(null);
        setActiveSubTab('current');
        setLoginEnterpriseCode('');
        setLoginCredential('');
      }, 1200);
    } else {
      setLoginFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDirectAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    // Join directly with active status
    joinEnterpriseByCode(currentEnterprise.code, {
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      phone: newMemberPhone.trim(),
      role: newMemberRole,
      department: newMemberDepartment.trim()
    });

    setAddMemberSuccess(`Member "${newMemberName}" added to ${currentEnterprise.name}!`);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setShowAddMemberForm(false);
    setTimeout(() => setAddMemberSuccess(null), 3000);
  };

  const handleCreateEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created = createEnterprise({
      name: newName,
      industry: newIndustry,
      adminName: newAdminName,
      adminEmail: newAdminEmail,
      adminPin: newAdminPin,
      plan: newPlan,
      city: newCity,
      country: newCountry
    });

    setCreateSuccess(`Enterprise "${created.name}" established successfully! Enterprise Code: ${created.code}`);
    setTimeout(() => {
      setCreateSuccess('');
      setActiveSubTab('current');
    }, 1800);
  };

  const handleJoinEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinUserName.trim() || !joinUserEmail.trim()) {
      setJoinStatusMsg({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    const res = joinEnterpriseByCode(joinCode, {
      name: joinUserName,
      email: joinUserEmail,
      role: joinRole,
      phone: joinUserPhone,
      department: joinDepartment
    });

    if (res.success) {
      setJoinStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setJoinStatusMsg(null);
        onClose();
      }, 1800);
    } else {
      setJoinStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    createInvitation(inviteEmail, inviteRole);
    setInviteEmail('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentEnterprise.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Enterprise Management</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Isolated Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in: <span className="text-white font-medium">{currentEnterprise.name}</span> ({currentEnterprise.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('current')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'current'
                ? 'text-blue-400 border-blue-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Active Enterprise Details
          </button>
          <button
            onClick={() => setActiveSubTab('login')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'login'
                ? 'text-blue-400 border-blue-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Switch / Log In to Enterprise
          </button>
          <button
            onClick={() => setActiveSubTab('join')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'join'
                ? 'text-blue-400 border-blue-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Join with Code
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'create'
                ? 'text-blue-400 border-blue-500 bg-slate-900'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New Enterprise
          </button>
        </div>

        {/* Tab 1: Current Logged In Enterprise Details & Members */}
        {activeSubTab === 'current' && (
          <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {addMemberSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {addMemberSuccess}
              </div>
            )}

            {/* Enterprise Overview Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shrink-0">
                    {currentEnterprise.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base sm:text-lg">
                      {currentEnterprise.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                      <span>Industry: <strong className="text-slate-200">{currentEnterprise.industry}</strong></span>
                      <span>•</span>
                      <span>Plan: <strong className="text-blue-400">{currentEnterprise.plan}</strong></span>
                      {currentEnterprise.city && (
                        <>
                          <span>•</span>
                          <span>HQ: <strong className="text-slate-200">{currentEnterprise.city}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Join Code:</span>
                    <code className="text-blue-400 font-mono font-bold text-sm">{currentEnterprise.code}</code>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 hover:text-white text-slate-400 transition-colors"
                      title="Copy Enterprise Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-center">
                <div className="p-2 rounded-lg bg-slate-900/50">
                  <span className="block text-lg font-bold text-white">{vehicles.length}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Enterprise Units</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50">
                  <span className="block text-lg font-bold text-emerald-400">{drivers.length}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Appointed Drivers</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/50">
                  <span className="block text-lg font-bold text-blue-400">{currentEnterpriseUsers.length}</span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Registered Users</span>
                </div>
              </div>
            </div>

            {/* Admin Add User to Unique Enterprise */}
            {isAdmin && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Enterprise User Management
                  </span>
                  <button
                    onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {showAddMemberForm ? 'Cancel' : 'Add User to Enterprise'}
                  </button>
                </div>

                {showAddMemberForm && (
                  <form onSubmit={handleDirectAddMember} className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/40 space-y-3">
                    <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" /> Add User to {currentEnterprise.name}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kasun Silva"
                          value={newMemberName}
                          onChange={e => setNewMemberName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Work Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="kasun@enterprise.com"
                          value={newMemberEmail}
                          onChange={e => setNewMemberEmail(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Role *</label>
                        <select
                          value={newMemberRole}
                          onChange={e => setNewMemberRole(e.target.value as UserRole)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="driver">Driver (Appointed Vehicles)</option>
                          <option value="dispatcher">Dispatcher</option>
                          <option value="admin">Administrator</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phone</label>
                        <input
                          type="text"
                          placeholder="+94 77 123 4567"
                          value={newMemberPhone}
                          onChange={e => setNewMemberPhone(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Department</label>
                        <input
                          type="text"
                          value={newMemberDepartment}
                          onChange={e => setNewMemberDepartment(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Confirm and Register User
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Pending Approvals Section (Admin only) */}
            {currentEnterpriseUsers.filter(u => u.status === 'pending-approval').length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Pending Join Approvals ({currentEnterpriseUsers.filter(u => u.status === 'pending-approval').length})
                  </span>
                </div>

                <div className="space-y-2">
                  {currentEnterpriseUsers
                    .filter(u => u.status === 'pending-approval')
                    .map(user => (
                      <div
                        key={user.id}
                        className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">{user.name}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{user.email} • {user.department || 'Operations'}</p>
                        </div>

                        {isAdmin ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => approveEnterpriseUser(user.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => rejectEnterpriseUser(user.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 flex items-center gap-1"
                            >
                              <UserX className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-400 italic">Awaiting Admin review</span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Active Members in Current Enterprise Only */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {currentEnterprise.name} Team Members ({currentEnterpriseUsers.filter(u => u.status === 'active').length})
              </span>

              <div className="space-y-2">
                {currentEnterpriseUsers
                  .filter(u => u.status === 'active')
                  .map(user => {
                    const isSelf = user.id === currentUser.id;
                    return (
                      <div
                        key={user.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isSelf
                            ? 'bg-blue-950/20 border-blue-500/40'
                            : 'bg-slate-800/40 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">{user.name}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{user.email} • {user.department || 'Operations'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAdmin && !isSelf ? (
                            <select
                              value={user.role}
                              onChange={e => updateUserRole(user.id, e.target.value as UserRole)}
                              className="px-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white"
                            >
                              <option value="admin">Admin</option>
                              <option value="dispatcher">Dispatcher</option>
                              <option value="driver">Driver</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 capitalize">
                              {user.role}
                            </span>
                          )}

                          {!isSelf && (
                            <button
                              onClick={() => setCurrentUserById(user.id)}
                              className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded transition-colors"
                              title="Switch active user profile"
                            >
                              Switch
                            </button>
                          )}

                          {isAdmin && !isSelf && (
                            <button
                              onClick={() => removeUserFromEnterprise(user.id)}
                              className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                              title="Remove from Enterprise"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Log in to an Enterprise Workspace by Code */}
        {activeSubTab === 'login' && (
          <form onSubmit={handleEnterpriseLogin} className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <LogIn className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                To access another enterprise workspace, provide the unique <strong>Enterprise Code</strong> (and optional Admin PIN or registered email). No other enterprise data will be exposed.
              </span>
            </div>

            {loginFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  loginFeedback.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-950/40 text-red-300 border border-red-500/30'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loginFeedback.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enterprise Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APEX-8842 or CEY-LOG-01"
                value={loginEnterpriseCode}
                onChange={e => setLoginEnterpriseCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-base uppercase tracking-wider focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Master PIN or Member Email (Optional for direct role authentication)
              </label>
              <input
                type="password"
                placeholder="Admin PIN (e.g. 1234) or your member email"
                value={loginCredential}
                onChange={e => setLoginCredential(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave blank to connect directly, or enter Admin PIN to unlock full administration rights.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              Log In to Enterprise
            </button>
          </form>
        )}

        {/* Tab 3: Join Enterprise by Code */}
        {activeSubTab === 'join' && (
          <form onSubmit={handleJoinEnterpriseSubmit} className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Enter your company's Enterprise Join Code provided by your Fleet Administrator to link your profile to their unique workspace.
              </span>
            </div>

            {joinStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  joinStatusMsg.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-950/40 text-red-300 border border-red-500/30'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {joinStatusMsg.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enterprise Join Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APEX-8842"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm uppercase tracking-wider focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nuwan Jayasinghe"
                  value={joinUserName}
                  onChange={e => setJoinUserName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Work Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nuwan@example.com"
                  value={joinUserEmail}
                  onChange={e => setJoinUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Requested Role
                </label>
                <select
                  value={joinRole}
                  onChange={e => setJoinRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="driver">Fleet Driver / Operator</option>
                  <option value="dispatcher">Fleet Dispatcher</option>
                  <option value="admin">Administrator</option>
                  <option value="viewer">Staff Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={joinUserPhone}
                  onChange={e => setJoinUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={joinDepartment}
                  onChange={e => setJoinDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              <KeyRound className="w-4 h-4" />
              Request to Join Enterprise
            </button>
          </form>
        )}

        {/* Tab 4: Create New Enterprise */}
        {activeSubTab === 'create' && (
          <form onSubmit={handleCreateEnterpriseSubmit} className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {createSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {createSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company / Enterprise Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Swift Cargo Transporters Pvt Ltd"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={newIndustry}
                  onChange={e => setNewIndustry(e.target.value)}
                  placeholder="e.g. Supply Chain Logistics"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={newPlan}
                  onChange={e => setNewPlan(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Enterprise Fleet">Enterprise Fleet (Unlimited)</option>
                  <option value="Professional Fleet">Professional Fleet (Up to 50 assets)</option>
                  <option value="Standard Logistics">Standard Logistics (Up to 15 assets)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Master PIN (4-Digits) <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newAdminPin}
                  onChange={e => setNewAdminPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City / Headquarters
                </label>
                <input
                  type="text"
                  placeholder="e.g. Colombo"
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" />
              Create Enterprise Workspace
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
