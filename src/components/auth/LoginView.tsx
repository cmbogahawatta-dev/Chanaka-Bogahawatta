import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  KeyRound,
  Users,
  Briefcase,
  Layers,
  FolderLock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DemoAccount {
  label: string;
  roleName: string;
  position: string;
  email: string;
  password: string;
  badgeColor: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Super Admin',
    roleName: 'SUPER_ADMIN',
    position: 'System Administrator',
    email: 'admin@ema.lk',
    password: 'Admin@2026!',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Full unconstrained system control & user admin'
  },
  {
    label: 'Managing Director',
    roleName: 'MANAGING_DIRECTOR',
    position: 'Managing Director',
    email: 'md@ema.lk',
    password: 'Director@2026!',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Executive oversight, Owner PRV approvals & banking'
  },
  {
    label: 'Project Manager',
    roleName: 'PROJECT_MANAGER',
    position: 'Project Manager',
    email: 'pm@ema.lk',
    password: 'Manager@2026!',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Assigned site projects (PIDB 26, PIDM 2, PIDM 26)'
  },
  {
    label: 'Planning Engineer',
    roleName: 'PLANNING_ENGINEER',
    position: 'Planning Engineer',
    email: 'planning@ema.lk',
    password: 'Planning@2026!',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Schedules, EOT claims, progress curves'
  },
  {
    label: 'Quantity Surveyor',
    roleName: 'QUANTITY_SURVEYOR',
    position: 'Quantity Surveyor',
    email: 'qs@ema.lk',
    password: 'Quantity@2026!',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'IPCs, BoQ measurements, billing & client invoices'
  },
  {
    label: 'Site Engineer',
    roleName: 'SITE_ENGINEER',
    position: 'Site Engineer',
    email: 'site@ema.lk',
    password: 'Engineer@2026!',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Daily site records (DSR), plant logs & petty cash'
  },
  {
    label: 'Accountant',
    roleName: 'ACCOUNTANT',
    position: 'Accountant',
    email: 'accounts@ema.lk',
    password: 'Accounts@2026!',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'PRV Accounts L1 & L2 sign-offs, vouchers & banking'
  },
  {
    label: 'Procurement Officer',
    roleName: 'PROCUREMENT_OFFICER',
    position: 'Procurement Officer',
    email: 'procurement@ema.lk',
    password: 'Procure@2026!',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    description: 'Material purchase orders, quotes & vendor orders'
  },
  {
    label: 'HR / Admin',
    roleName: 'HR_ADMIN',
    position: 'HR / Admin',
    email: 'hr@ema.lk',
    password: 'HumanRes@2026!',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Staff directory, leaves & organizational records'
  },
  {
    label: 'Viewer',
    roleName: 'VIEWER',
    position: 'Viewer',
    email: 'viewer@ema.lk',
    password: 'Viewer@2026!',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    description: 'Read-only access to assigned projects'
  }
];

export const LoginView: React.FC = () => {
  const { login, resetPassword } = useAuth();

  const [identifier, setIdentifier] = useState('admin@ema.lk');
  const [password, setPassword] = useState('Admin@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your employee email or username, and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleSelectDemoAccount = (demo: DemoAccount) => {
    setIdentifier(demo.email);
    setPassword(demo.password);
    setErrorMessage(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);

    if (!resetIdentifier.trim() || !newPassword.trim()) {
      setResetStatus({ success: false, message: 'Please provide your email/username and new password.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setResetStatus({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }

    const res = await resetPassword(resetIdentifier.trim(), newPassword);
    if (res.success) {
      setResetStatus({ success: true, message: 'Password successfully reset! You can now log in.' });
      setTimeout(() => {
        setIsResetModalOpen(false);
        setIdentifier(resetIdentifier);
        setPassword(newPassword);
        setResetStatus(null);
      }, 1500);
    } else {
      setResetStatus({ success: false, message: res.error || 'Password reset failed.' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top corporate bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
            <Building2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black tracking-wider text-amber-400">
                EMA CORPORATE ERP
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold uppercase tracking-wider">
                Multi-User Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Integrated Construction Project Management & Financial Control System
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Server Active</span>
          </div>
          <span className="text-slate-700">•</span>
          <span>Version 3.4.0 (Production)</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Overview */}
          <div className="lg:col-span-6 space-y-6 hidden lg:block">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Enterprise Identity & Project-Level Security</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Secure Access for Every Project Professional.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Log in with your designated employee credentials to access assigned construction packages,
                manage schedules, submit payment requests (PRV), and verify multi-tier operational workflows.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Users className="w-4 h-4" />
                  <span>Role-Based (RBAC)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Fine-grained permissions for Planning, QS, Finance, Site & Management.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <FolderLock className="w-4 h-4" />
                  <span>Project Isolation</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Backend enforcement: Users only see projects and data authorized for their profile.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>Server-Side Sign-Off</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Accounts L1/L2 and Owner PRV payment release cryptographically verified.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Immutable Audit Trail</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Full tracking of user IDs, timestamps, approvals, and IP addresses.
                </p>
              </div>
            </div>

            {/* Credential Helper Box */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Role-Based Testing Personas
                </span>
                <span className="text-[10px] text-slate-500 font-mono">10 Pre-Configured Users</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click any role in the quick-switcher panel below the login box to instantly populate test credentials
                and experience the ERP from that specific position&apos;s perspective!
              </p>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-6">
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span>Employee Login</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Enter your assigned corporate ERP credentials to enter the workspace.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Corporate Email or Username</span>
                    <span className="text-[10px] text-slate-500 font-mono">e.g. admin@ema.lk</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-identifier"
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="name@ema.lk or username"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(true)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                    <span>Remember this session</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">SSL 256-bit Encrypted</span>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to ERP System</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Persona Selector for Testing */}
              <div className="pt-4 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    One-Click Persona Switcher
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Instant Test Credentials</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {DEMO_ACCOUNTS.map(demo => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => handleSelectDemoAccount(demo)}
                      className={`p-2 rounded-lg text-left transition-all border ${
                        identifier === demo.email
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold truncate">{demo.label}</span>
                        {identifier === demo.email && (
                          <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">{demo.position}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 EMA Construction (Pvt) Ltd. All Rights Reserved. Enterprise Resource Planning.</span>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Security Protocol: RBAC 3.0</span>
          <span>•</span>
          <span>Server Authorization: Enforced</span>
        </div>
      </footer>

      {/* Self-service Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Reset Employee Password</h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            {resetStatus && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  resetStatus.success
                    ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border border-rose-800 text-rose-300'
                }`}
              >
                {resetStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{resetStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Email or Username</label>
                <input
                  type="text"
                  required
                  value={resetIdentifier}
                  onChange={e => setResetIdentifier(e.target.value)}
                  placeholder="e.g. pm@ema.lk"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
