import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FolderLock,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  Building2,
  Briefcase,
  Layers,
  ChevronDown,
  Plus,
  Clock,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePettyCash } from '../../context/PettyCashContext';
import { AuthUser, Role, UserStatus, UserProjectAccess, ProjectAccessLevel } from '../../types/authTypes';

export const UserManagementView: React.FC = () => {
  const {
    allUsers,
    allRoles,
    allDepartments,
    allPositions,
    createUser,
    updateUser,
    toggleUserStatus,
    updateUserProjects,
    resetPassword,
    deleteUser,
    deleteMultipleUsers,
    purgeUserDirectory,
    hasPermission,
    currentUser: currentAuthUser
  } = useAuth();

  const { projects: masterProjects } = usePettyCash();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [assigningProjectsUser, setAssigningProjectsUser] = useState<AuthUser | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<AuthUser | null>(null);

  // Deletion States (Single User)
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Deletion States
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkAdminPassword, setBulkAdminPassword] = useState('');
  const [showBulkPassword, setShowBulkPassword] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Purge / Reset Directory States
  const [isPurgeDirectoryModalOpen, setIsPurgeDirectoryModalOpen] = useState(false);
  const [purgeMode, setPurgeMode] = useState<'RESET_DEFAULTS' | 'PURGE_ALL_EXCEPT_CURRENT'>('RESET_DEFAULTS');
  const [purgeAdminPassword, setPurgeAdminPassword] = useState('');
  const [showPurgePassword, setShowPurgePassword] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Welcome@2026!');
  const [newPosition, setNewPosition] = useState('Site Engineer');
  const [newDepartment, setNewDepartment] = useState('Civil Engineering');
  const [newRoleCode, setNewRoleCode] = useState('SITE_ENGINEER');
  const [newHasAllProjectAccess, setNewHasAllProjectAccess] = useState(false);
  const [newProjectAssignments, setNewProjectAssignments] = useState<UserProjectAccess[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Assignments Editing State
  const [tempProjects, setTempProjects] = useState<UserProjectAccess[]>([]);
  const [tempAllAccess, setTempAllAccess] = useState(false);

  // Password reset state
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<{ success?: boolean; text?: string } | null>(null);

  // Filtered Users
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.roleCode === roleFilter || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAddUser = () => {
    const nextNum = allUsers.length + 1;
    const suggestedEmpId = `EMP-${String(nextNum).padStart(3, '0')}`;
    setNewFullName('');
    setNewEmployeeId(suggestedEmpId);
    setNewUsername(`user${nextNum}`);
    setNewEmail(`user${nextNum}@ema.lk`);
    setNewPassword('Welcome@2026!');
    setNewPosition(allPositions[0]?.name || 'Site Engineer');
    setNewDepartment(allDepartments[0]?.name || 'Civil Engineering');
    setNewRoleCode(allRoles[0]?.code || 'SITE_ENGINEER');
    setNewHasAllProjectAccess(false);
    setNewProjectAssignments(
      masterProjects.map(p => ({
        projectId: p.id,
        projectCode: p.PROJECT_CODE,
        projectName: p.PROJECT_NAME,
        accessLevel: 'VIEW'
      }))
    );
    setFormError(null);
    setFormSuccess(null);
    setIsAddUserModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newFullName.trim() || !newEmployeeId.trim() || !newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setFormError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    const res = await createUser({
      employeeId: newEmployeeId.trim().toUpperCase(),
      fullName: newFullName.trim(),
      username: newUsername.trim().toLowerCase(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword,
      position: newPosition,
      department: newDepartment,
      roleCode: newRoleCode,
      status: 'ACTIVE',
      hasAllProjectAccess: newHasAllProjectAccess,
      assignedProjects: newHasAllProjectAccess ? [] : newProjectAssignments.filter(p => p.accessLevel !== 'NO_ACCESS')
    });
    setIsSubmitting(false);

    if (res.success) {
      setFormSuccess(`User ${newFullName} created successfully!`);
      setTimeout(() => {
        setIsAddUserModalOpen(false);
      }, 1200);
    } else {
      setFormError(res.error || 'Failed to create user.');
    }
  };

  const handleOpenProjectAssignments = (user: AuthUser) => {
    setAssigningProjectsUser(user);
    setTempAllAccess(user.hasAllProjectAccess);

    // Populate all master projects with existing user access level or NO_ACCESS
    const mapped = masterProjects.map(mp => {
      const existing = (user.assignedProjects || []).find(
        p => p.projectId === mp.id || p.projectCode === mp.PROJECT_CODE
      );
      return {
        projectId: mp.id,
        projectCode: mp.PROJECT_CODE,
        projectName: mp.PROJECT_NAME,
        accessLevel: existing ? existing.accessLevel : ('NO_ACCESS' as ProjectAccessLevel)
      };
    });
    setTempProjects(mapped);
  };

  const handleSaveProjectAssignments = async () => {
    if (!assigningProjectsUser) return;
    setIsSubmitting(true);

    const activeAssignments = tempProjects.filter(p => p.accessLevel !== 'NO_ACCESS');
    const res = await updateUserProjects(assigningProjectsUser.id, activeAssignments);
    setIsSubmitting(false);

    if (res.success) {
      setAssigningProjectsUser(null);
    } else {
      alert(res.error || 'Failed to update project assignments.');
    }
  };

  const handleToggleStatus = async (user: AuthUser, newStatus: UserStatus) => {
    if (user.id === currentAuthUser?.id && newStatus !== 'ACTIVE') {
      alert('You cannot deactivate or suspend your own active logged-in account.');
      return;
    }

    if (confirm(`Are you sure you want to change ${user.fullName}'s status to ${newStatus}?`)) {
      await toggleUserStatus(user.id, newStatus);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser || !newResetPassword.trim()) return;

    if (newResetPassword.length < 6) {
      setResetMessage({ success: false, text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(passwordResetUser.username, newResetPassword);
    setIsSubmitting(false);

    if (res.success) {
      setResetMessage({ success: true, text: `Password for ${passwordResetUser.fullName} has been updated!` });
      setTimeout(() => {
        setPasswordResetUser(null);
        setNewResetPassword('');
        setResetMessage(null);
      }, 1500);
    } else {
      setResetMessage({ success: false, text: res.error || 'Failed to reset password.' });
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            <CheckCircle2 className="w-3 h-3" /> ACTIVE
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
            <XCircle className="w-3 h-3" /> SUSPENDED
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30 font-mono">
            <Lock className="w-3 h-3" /> INACTIVE
          </span>
        );
    }
  };

  // Eligible users for batch operations (excluding root EMP-001 and current user)
  const eligibleUsers = filteredUsers.filter(
    u => u.employeeId !== 'EMP-001' && u.id !== currentAuthUser?.id
  );

  const isAllEligibleSelected =
    eligibleUsers.length > 0 && eligibleUsers.every(u => selectedUserIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (isAllEligibleSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(eligibleUsers.map(u => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDeleteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDelete) return;
    if (!deleteAdminPassword.trim()) {
      setDeleteError('Administrator password is required to authorize deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(null);

    const res = await deleteUser(userToDelete.id, deleteAdminPassword);
    setIsDeleting(false);

    if (res.success) {
      setDeleteSuccess(`User account ${userToDelete.fullName} (${userToDelete.employeeId}) has been permanently deleted.`);
      setSelectedUserIds(prev => prev.filter(id => id !== userToDelete.id));
      setTimeout(() => {
        setUserToDelete(null);
        setDeleteAdminPassword('');
        setDeleteSuccess(null);
      }, 1200);
    } else {
      setDeleteError(res.error || 'Failed to delete user. Please verify administrator password.');
    }
  };

  const handleBulkDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    if (!bulkAdminPassword.trim()) {
      setBulkDeleteError('Administrator password is required to authorize batch deletion.');
      return;
    }

    setIsBulkDeleting(true);
    setBulkDeleteError(null);
    setBulkDeleteSuccess(null);

    const res = await deleteMultipleUsers(selectedUserIds, bulkAdminPassword);
    setIsBulkDeleting(false);

    if (res.success) {
      setBulkDeleteSuccess(`Successfully deleted ${res.count || selectedUserIds.length} user accounts from directory.`);
      setSelectedUserIds([]);
      setTimeout(() => {
        setIsBulkDeleteModalOpen(false);
        setBulkAdminPassword('');
        setBulkDeleteSuccess(null);
      }, 1200);
    } else {
      setBulkDeleteError(res.error || 'Failed to delete selected users. Please verify administrator password.');
    }
  };

  const handlePurgeDirectorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purgeAdminPassword.trim()) {
      setPurgeError('Administrator password is required to authorize directory purge.');
      return;
    }

    if (purgeConfirmText.trim().toUpperCase() !== 'CONFIRM') {
      setPurgeError('Please type CONFIRM in uppercase to authorize this operation.');
      return;
    }

    setIsPurging(true);
    setPurgeError(null);
    setPurgeSuccess(null);

    const res = await purgeUserDirectory(purgeAdminPassword, purgeMode);
    setIsPurging(false);

    if (res.success) {
      setPurgeSuccess(
        purgeMode === 'RESET_DEFAULTS'
          ? 'Corporate user directory successfully reset to 10 standard system accounts.'
          : 'User directory purged successfully. Only primary administrator retained.'
      );
      setSelectedUserIds([]);
      setTimeout(() => {
        setIsPurgeDirectoryModalOpen(false);
        setPurgeAdminPassword('');
        setPurgeConfirmText('');
        setPurgeSuccess(null);
      }, 1500);
    } else {
      setPurgeError(res.error || 'Failed to purge user directory. Please verify administrator password.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Corporate Employee & User Directory</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              {allUsers.length} Registered Users
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage employee access, positions, role authorizations, and assign project-level security scopes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setIsPurgeDirectoryModalOpen(true);
              setPurgeAdminPassword('');
              setShowPurgePassword(false);
              setPurgeConfirmText('');
              setPurgeError(null);
              setPurgeSuccess(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-all shadow-sm"
            title="Purge or Reset User Directory (Requires Admin Password)"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset / Purge Directory</span>
          </button>

          {hasPermission('users.create') && (
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Employee Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, EMP ID, email, position, or department..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Roles ({allRoles.length})</option>
            {allRoles.map(r => (
              <option key={r.code} value={r.code}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE Only</option>
            <option value="SUSPENDED">SUSPENDED Only</option>
            <option value="INACTIVE">INACTIVE Only</option>
          </select>
        </div>
      </div>

      {/* Batch Selection Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">
              <span className="font-bold text-rose-300 font-mono">{selectedUserIds.length}</span> user accounts selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors border border-slate-700"
            >
              Deselect All
            </button>
            <button
              onClick={() => {
                setIsBulkDeleteModalOpen(true);
                setBulkAdminPassword('');
                setShowBulkPassword(false);
                setBulkDeleteError(null);
                setBulkDeleteSuccess(null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected (Admin Password)</span>
            </button>
          </div>
        </div>
      )}

      {/* User Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllEligibleSelected}
                    onChange={handleToggleSelectAll}
                    disabled={eligibleUsers.length === 0}
                    className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 cursor-pointer disabled:opacity-30"
                    title="Select all eligible users"
                  />
                </th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Position & Department</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Project Scope</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No employee accounts found matching the current search and filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const roleObj = allRoles.find(r => r.code === user.roleCode);
                  const isCurrent = user.id === currentAuthUser?.id;
                  const isProtectedRoot = user.employeeId === 'EMP-001';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-3 px-3 text-center">
                        {!isProtectedRoot && !isCurrent ? (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleToggleSelectUser(user.id)}
                            className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono" title="Root administrator or active user is protected from deletion">—</span>
                        )}
                      </td>

                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">
                            {user.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100">{user.fullName}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                                  YOU
                                </span>
                              )}
                              {isProtectedRoot && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700">
                                  ROOT
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                              <span>{user.employeeId}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{user.position}</div>
                        <div className="text-[10px] text-slate-400">{user.department}</div>
                      </td>

                      {/* Assigned Role */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px] font-bold">
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span>{roleObj ? roleObj.name : user.role}</span>
                        </span>
                      </td>

                      {/* Project Scope */}
                      <td className="py-3 px-3">
                        {user.hasAllProjectAccess || user.roleCode === 'SUPER_ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            All Projects (Corporate)
                          </span>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1 text-slate-300 font-semibold">
                              <FolderLock className="w-3.5 h-3.5 text-purple-400" />
                              <span>{user.assignedProjects?.length || 0} Projects Assigned</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                              {(user.assignedProjects || []).slice(0, 3).map(p => (
                                <span
                                  key={p.projectId}
                                  className="text-[9px] px-1 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300 font-mono"
                                >
                                  {p.projectCode} ({p.accessLevel})
                                </span>
                              ))}
                              {(user.assignedProjects?.length || 0) > 3 && (
                                <span className="text-[9px] text-slate-400">
                                  +{(user.assignedProjects?.length || 0) - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">{getStatusBadge(user.status)}</td>

                      {/* Last Login */}
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPermission('users.edit') && (
                            <button
                              onClick={() => handleOpenProjectAssignments(user)}
                              title="Configure Assigned Projects"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors border border-slate-700"
                            >
                              <FolderLock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {hasPermission('users.edit') && (
                            <button
                              onClick={() => {
                                setPasswordResetUser(user);
                                setNewResetPassword('');
                                setResetMessage(null);
                              }}
                              title="Reset Password"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors border border-slate-700"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {hasPermission('users.disable') && !isCurrent && (
                            <>
                              {user.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleToggleStatus(user, 'SUSPENDED')}
                                  title="Suspend User Account"
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition-colors border border-rose-800/60"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(user, 'ACTIVE')}
                                  title="Reactivate User Account"
                                  className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 transition-colors border border-emerald-800/60"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}

                          {/* Delete User (Admin Password verification required) */}
                          {!isCurrent && !isProtectedRoot && (
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteAdminPassword('');
                                setShowDeletePassword(false);
                                setDeleteError(null);
                                setDeleteSuccess(null);
                              }}
                              title={`Permanently delete ${user.fullName} (Requires Admin Password)`}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/70 text-rose-400 transition-colors border border-rose-800/60 hover:border-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create Employee Account */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Create New Employee ERP Account</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Full Employee Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="e.g. Kasun Fernando"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Employee ID (Code) *</label>
                  <input
                    type="text"
                    required
                    value={newEmployeeId}
                    onChange={e => setNewEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-011"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. kasun"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="e.g. kasun@ema.lk"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">System Security Role *</label>
                  <select
                    value={newRoleCode}
                    onChange={e => setNewRoleCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  >
                    {allRoles.map(r => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Position</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={e => setNewPosition(e.target.value)}
                    placeholder="e.g. Site Engineer"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    placeholder="e.g. Civil Engineering"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Project Scope Assignment */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FolderLock className="w-4 h-4 text-purple-400" />
                    <span>Project Level Access Authorization</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-emerald-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHasAllProjectAccess}
                      onChange={e => setNewHasAllProjectAccess(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                    />
                    <span>Grant Access to ALL Corporate Projects</span>
                  </label>
                </div>

                {!newHasAllProjectAccess && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {newProjectAssignments.map(p => (
                      <div
                        key={p.projectId}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-200">{p.projectName}</span>
                          <span className="text-[10px] text-slate-500 font-mono ml-2">({p.projectCode})</span>
                        </div>
                        <select
                          value={p.accessLevel}
                          onChange={e => {
                            const val = e.target.value as ProjectAccessLevel;
                            setNewProjectAssignments(prev =>
                              prev.map(item => (item.projectId === p.projectId ? { ...item, accessLevel: val } : item))
                            );
                          }}
                          className={`px-2 py-1 rounded bg-slate-900 border text-[11px] font-mono font-semibold ${
                            p.accessLevel === 'FULL'
                              ? 'border-emerald-700 text-emerald-300'
                              : p.accessLevel === 'EDIT'
                              ? 'border-blue-700 text-blue-300'
                              : p.accessLevel === 'VIEW'
                              ? 'border-amber-700 text-amber-300'
                              : 'border-slate-800 text-slate-500'
                          }`}
                        >
                          <option value="NO_ACCESS">NO ACCESS (Restricted)</option>
                          <option value="VIEW">VIEW (Read-only)</option>
                          <option value="EDIT">EDIT (Create/Update)</option>
                          <option value="FULL">FULL (Manage All)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Projects to User */}
      {assigningProjectsUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Project Access Security: {assigningProjectsUser.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {assigningProjectsUser.employeeId} • Role: {assigningProjectsUser.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningProjectsUser(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Universal Project Access</div>
                  <div className="text-[11px] text-slate-400">
                    Allow access to all road projects without explicit project assignment
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempAllAccess}
                    onChange={e => setTempAllAccess(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {!tempAllAccess && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300">Project Specific Authorization Levels:</div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {tempProjects.map(p => (
                      <div
                        key={p.projectId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{p.projectName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.projectCode}</div>
                        </div>

                        <select
                          value={p.accessLevel}
                          onChange={e => {
                            const val = e.target.value as ProjectAccessLevel;
                            setTempProjects(prev =>
                              prev.map(item => (item.projectId === p.projectId ? { ...item, accessLevel: val } : item))
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg bg-slate-900 border text-xs font-mono font-semibold ${
                            p.accessLevel === 'FULL'
                              ? 'border-emerald-700 text-emerald-300'
                              : p.accessLevel === 'EDIT'
                              ? 'border-blue-700 text-blue-300'
                              : p.accessLevel === 'VIEW'
                              ? 'border-amber-700 text-amber-300'
                              : 'border-slate-800 text-slate-500'
                          }`}
                        >
                          <option value="NO_ACCESS">NO ACCESS (Locked)</option>
                          <option value="VIEW">VIEW (Read-Only)</option>
                          <option value="EDIT">EDIT (Submit / Modify)</option>
                          <option value="FULL">FULL (Manage & Approve)</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningProjectsUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProjectAssignments}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Admin Reset Password */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Reset Employee Password</h3>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Resetting credentials for <strong className="text-slate-200">{passwordResetUser.fullName}</strong> (
              <span className="font-mono text-amber-400">{passwordResetUser.employeeId}</span>).
            </div>

            {resetMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  resetMessage.success
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                {resetMessage.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{resetMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Enter New Password</label>
                <input
                  type="text"
                  required
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Single User Account (Admin Password Required) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Delete User Account</h3>
                  <p className="text-[10px] text-rose-400 font-semibold">Administrator Password Verification Required</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteAdminPassword('');
                  setDeleteError(null);
                  setDeleteSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Account Summary Card */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{userToDelete.fullName}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                  {userToDelete.employeeId}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                <span><strong>Role:</strong> {userToDelete.role}</span>
                <span><strong>Dept:</strong> {userToDelete.department}</span>
                <span><strong>Position:</strong> {userToDelete.position}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{userToDelete.email}</div>
            </div>

            {/* Warning Callout */}
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                Permanently deletes this employee record and revokes all login credentials. Active sessions will be terminated immediately. This action cannot be undone.
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {deleteSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{deleteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDeleteUserSubmit} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Administrator Password to Authorize</span>
                  <span className="text-[10px] text-slate-500 font-normal">Security verification</span>
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={deleteAdminPassword}
                    onChange={e => setDeleteAdminPassword(e.target.value)}
                    placeholder="Enter your administrator password..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Default root administrator password: <span className="text-amber-400 font-bold">Admin@2026!</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(null);
                    setDeleteAdminPassword('');
                    setDeleteError(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deleteAdminPassword}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting User...' : 'Permanently Delete User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Bulk Delete Selected Users (Admin Password Required) */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Batch Delete Selected Users</h3>
                  <p className="text-[10px] text-rose-400 font-semibold">
                    {selectedUserIds.length} user accounts will be permanently removed
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBulkDeleteModalOpen(false);
                  setBulkAdminPassword('');
                  setBulkDeleteError(null);
                  setBulkDeleteSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Selected Users List */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Selected User Accounts:</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 max-h-36 overflow-y-auto space-y-1">
                {selectedUserIds.map(id => {
                  const u = allUsers.find(x => x.id === id);
                  if (!u) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800/80"
                    >
                      <span className="font-semibold text-slate-200">{u.fullName}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{u.employeeId}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                This will permanently delete all {selectedUserIds.length} accounts from the corporate database. Sessions will be closed and permissions deleted.
              </div>
            </div>

            {bulkDeleteError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{bulkDeleteError}</span>
              </div>
            )}

            {bulkDeleteSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{bulkDeleteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBulkDeleteSubmit} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Administrator Password to Authorize Batch Deletion</span>
                  <span className="text-[10px] text-slate-500 font-normal">Security verification</span>
                </label>
                <div className="relative">
                  <input
                    type={showBulkPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={bulkAdminPassword}
                    onChange={e => setBulkAdminPassword(e.target.value)}
                    placeholder="Enter administrator password..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBulkPassword(!showBulkPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    {showBulkPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Default root administrator password: <span className="text-amber-400 font-bold">Admin@2026!</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkDeleteModalOpen(false);
                    setBulkAdminPassword('');
                    setBulkDeleteError(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkDeleting || !bulkAdminPassword}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleting ? 'Deleting Users...' : `Delete ${selectedUserIds.length} Users`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Purge / Reset User Directory (Admin Password Required) */}
      {isPurgeDirectoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Purge or Reset User Directory</h3>
                  <p className="text-[10px] text-rose-400 font-semibold">High-Security Directory Management Action</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPurgeDirectoryModalOpen(false);
                  setPurgeAdminPassword('');
                  setPurgeConfirmText('');
                  setPurgeError(null);
                  setPurgeSuccess(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Select Maintenance Mode:</label>
              
              <div
                onClick={() => setPurgeMode('RESET_DEFAULTS')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  purgeMode === 'RESET_DEFAULTS'
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">Reset to Standard 10 Company Users</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Restores the standard corporate staff roster (MD, Project Manager, Planning, QS, Site Eng, Accounts, Stores, Fleet). Overwrites custom test accounts.
                </p>
              </div>

              <div
                onClick={() => setPurgeMode('PURGE_ALL_EXCEPT_CURRENT')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  purgeMode === 'PURGE_ALL_EXCEPT_CURRENT'
                    ? 'bg-rose-500/10 border-rose-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">Purge All Secondary Users</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                    Maximum Purge
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Removes all user accounts from the directory, retaining ONLY the root System Administrator (<code className="text-amber-400">EMP-001</code>) and your current session.
                </p>
              </div>
            </div>

            {/* Safety Confirmation Text */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Type <strong className="text-rose-400 font-mono">CONFIRM</strong> to authorize:</span>
              </label>
              <input
                type="text"
                required
                value={purgeConfirmText}
                onChange={e => setPurgeConfirmText(e.target.value)}
                placeholder="Type CONFIRM here..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono uppercase"
              />
            </div>

            {/* Password Input */}
            <form onSubmit={handlePurgeDirectorySubmit} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Administrator Password</span>
                  <span className="text-[10px] text-slate-500 font-normal">Security verification</span>
                </label>
                <div className="relative">
                  <input
                    type={showPurgePassword ? 'text' : 'password'}
                    required
                    value={purgeAdminPassword}
                    onChange={e => setPurgeAdminPassword(e.target.value)}
                    placeholder="Enter administrator password..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPurgePassword(!showPurgePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    {showPurgePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Default root administrator password: <span className="text-amber-400 font-bold">Admin@2026!</span>
                </p>
              </div>

              {purgeError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{purgeError}</span>
                </div>
              )}

              {purgeSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{purgeSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPurgeDirectoryModalOpen(false);
                    setPurgeAdminPassword('');
                    setPurgeConfirmText('');
                    setPurgeError(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPurging || !purgeAdminPassword || purgeConfirmText.trim().toUpperCase() !== 'CONFIRM'}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isPurging ? 'Executing Purge...' : 'Authorize Directory Purge / Reset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
