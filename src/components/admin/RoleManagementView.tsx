import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Edit2,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
  Search,
  Filter,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role, Permission } from '../../types/authTypes';

export const RoleManagementView: React.FC = () => {
  const { allRoles, allPermissions, updateRolePermissions, hasPermission } = useAuth();

  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(allRoles[0]?.code || 'PROJECT_MANAGER');
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedRole = allRoles.find(r => r.code === selectedRoleCode) || allRoles[0];

  // Sync active permissions when selected role changes
  React.useEffect(() => {
    if (selectedRole) {
      setActivePermissions(selectedRole.permissions || []);
      setSaveSuccess(false);
    }
  }, [selectedRoleCode, allRoles]);

  // Group permissions by category/module
  const categories = Array.from(new Set(allPermissions.map(p => p.category || p.module)));

  const filteredPermissions = allPermissions.filter(p => {
    const permName = p.name || p.code;
    const permCat = p.category || p.module;
    const matchesSearch =
      permName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || permCat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTogglePermission = (permCode: string) => {
    if (selectedRole?.code === 'SUPER_ADMIN') {
      alert('Super Admin role has immutable full system authority.');
      return;
    }

    setActivePermissions(prev =>
      prev.includes(permCode) ? prev.filter(c => c !== permCode) : [...prev, permCode]
    );
    setSaveSuccess(false);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole || selectedRole.code === 'SUPER_ADMIN') return;

    setIsSaving(true);
    const res = await updateRolePermissions(selectedRole.code, activePermissions);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert(res.error || 'Failed to update permissions.');
    }
  };

  const handleGrantAll = () => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;
    setActivePermissions(allPermissions.map(p => p.code));
    setSaveSuccess(false);
  };

  const handleRevokeAll = () => {
    if (selectedRole?.code === 'SUPER_ADMIN') return;
    setActivePermissions(['overview.view']);
    setSaveSuccess(false);
  };

  const isSuperAdmin = selectedRole?.code === 'SUPER_ADMIN';

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">Role-Based Access Control (RBAC) Matrix</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              {allRoles.length} Roles • {allPermissions.length} Granular Permissions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure system privileges and operational constraints mapped to each designated corporate role.
          </p>
        </div>

        {hasPermission('roles.edit') && !isSuperAdmin && (
          <button
            onClick={handleSavePermissions}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Role Permissions</span>
              </>
            )}
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Role permissions successfully updated and synchronized across all active employee sessions!</span>
        </div>
      )}

      {/* Main Grid: Left Roles List, Right Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Roles List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Designated Roles
          </div>

          <div className="space-y-1.5">
            {allRoles.map(role => {
              const isSelected = role.code === selectedRoleCode;
              const permCount = role.code === 'SUPER_ADMIN' ? allPermissions.length : (role.permissions || []).length;

              return (
                <button
                  key={role.code}
                  onClick={() => setSelectedRoleCode(role.code)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-100 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                      {role.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {permCount} perms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>
                  <div className="text-[9px] font-mono text-slate-500 mt-2">
                    Code: {role.code}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          {/* Active Role Banner */}
          {selectedRole && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{selectedRole.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                    {selectedRole.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedRole.description}</p>
              </div>

              {isSuperAdmin ? (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Unrestricted System Privilege</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGrantAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleRevokeAll}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                  >
                    Clear Non-Core
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search permission by name or code..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Permission Checklist */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredPermissions.map(perm => {
              const isEnabled = isSuperAdmin || activePermissions.includes(perm.code);

              return (
                <div
                  key={perm.code}
                  onClick={() => !isSuperAdmin && handleTogglePermission(perm.code)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none ${
                    isEnabled
                      ? 'bg-amber-500/5 border-amber-500/30 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  } ${isSuperAdmin ? 'cursor-default' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isEnabled ? 'text-amber-300' : 'text-slate-300'}`}>
                        {perm.name || perm.code}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {perm.category || perm.module}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{perm.description}</p>
                    <code className="text-[9px] font-mono text-slate-500 mt-1 block">{perm.code}</code>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isEnabled
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-600 border border-slate-700'
                      }`}
                    >
                      {isEnabled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
