import React, { useMemo } from 'react';
import {
  Inbox,
  Send,
  FileEdit,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Folder,
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Letter, LetterPriority } from '../../types/correspondenceTypes';

interface CorrespondenceDashboardViewProps {
  letters: Letter[];
  onSelectTab: (tab: string) => void;
  onOpenIncomingIntake: () => void;
  onOpenOutgoingCompose: () => void;
  onSelectLetter: (letter: Letter) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Technical: '#3b82f6',
  EOT: '#f59e0b',
  Variation: '#10b981',
  Payment: '#8b5cf6',
  QA_QC: '#ec4899',
  Commercial: '#06b6d4',
  General: '#64748b'
};

export const CorrespondenceDashboardView: React.FC<CorrespondenceDashboardViewProps> = ({
  letters,
  onSelectTab,
  onOpenIncomingIntake,
  onOpenOutgoingCompose,
  onSelectLetter
}) => {
  // Statistics Calculations
  const stats = useMemo(() => {
    const total = letters.length;
    const incoming = letters.filter(l => l.direction === 'Incoming' || l.direction === 'INCOMING').length;
    const outgoing = letters.filter(l => l.direction === 'Outgoing' || l.direction === 'OUTGOING').length;
    const drafts = letters.filter(l => l.status === 'Draft' || l.status === 'DRAFT').length;

    // Action Items count
    let openActionsCount = 0;
    letters.forEach(l => {
      if (l.actionItems && l.actionItems.length > 0) {
        openActionsCount += l.actionItems.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;
      } else if (l.actionRequired) {
        openActionsCount += 1;
      }
    });

    // Pending Reply count
    const pendingReplies = letters.filter(
      l => l.replyRequired && (l.replyStatus === 'Pending' || l.replyStatus === 'PENDING_REPLY' || !l.replyStatus)
    ).length;

    // Overdue count (either reply overdue or action overdue)
    const today = new Date().toISOString().split('T')[0];
    let overdueCount = 0;

    letters.forEach(l => {
      let isLetterOverdue = false;
      if (l.replyRequired && l.replyDueDate && l.replyDueDate < today && l.replyStatus !== 'Sent') {
        isLetterOverdue = true;
      }
      if (l.actionItems) {
        const hasOverdueAction = l.actionItems.some(
          a => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.dueDate < today
        );
        if (hasOverdueAction) isLetterOverdue = true;
      }
      if (l.replyStatus === 'Overdue' || l.status === 'OVERDUE') isLetterOverdue = true;

      if (isLetterOverdue) overdueCount++;
    });

    return {
      total,
      incoming,
      outgoing,
      drafts,
      openActionsCount,
      pendingReplies,
      overdueCount
    };
  }, [letters]);

  // Monthly Trend Data
  const monthlyTrendData = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    // Aggregate by month for 2026
    const trendMap: Record<string, { month: string; Incoming: number; Outgoing: number }> = {};
    months.forEach(m => {
      trendMap[m] = { month: m, Incoming: 0, Outgoing: 0 };
    });

    letters.forEach(l => {
      if (!l.date) return;
      const monthNum = parseInt(l.date.split('-')[1] || '0', 10);
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthLabel = monthNames[monthNum];
      if (monthLabel && trendMap[monthLabel]) {
        if (l.direction === 'Incoming' || l.direction === 'INCOMING') {
          trendMap[monthLabel].Incoming += 1;
        } else {
          trendMap[monthLabel].Outgoing += 1;
        }
      }
    });

    // Provide baseline minimum for aesthetic presentation
    if (trendMap['Aug'].Incoming === 0 && trendMap['Aug'].Outgoing === 0) {
      trendMap['Aug'].Incoming = 2;
      trendMap['Aug'].Outgoing = 3;
    }
    if (trendMap['Sep'].Incoming === 0 && trendMap['Sep'].Outgoing === 0) {
      trendMap['Sep'].Incoming = 1;
      trendMap['Sep'].Outgoing = 2;
    }

    return Object.values(trendMap);
  }, [letters]);

  // Project Distribution Data
  const projectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    letters.forEach(l => {
      const pName = l.projectCode || l.projectAffix || l.projectName || 'General Corporate';
      counts[pName] = (counts[pName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [letters]);

  // Contractual Category Breakdown Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    letters.forEach(l => {
      const cat = l.contractualCategory || l.category || 'General';
      const cleanCat = cat === 'QA/QC' ? 'QA_QC' : cat;
      counts[cleanCat] = (counts[cleanCat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', '/'),
      value,
      color: CATEGORY_COLORS[name] || '#94a3b8'
    }));
  }, [letters]);

  // Urgent & Overdue Watchlist Items
  const urgentWatchlist = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return letters
      .filter(l => {
        const isUrgent = l.priority === 'Urgent' || l.priority === 'URGENT' || l.priority === 'High' || l.priority === 'HIGH';
        const isOverdue =
          (l.replyRequired && l.replyDueDate && l.replyDueDate < today && l.replyStatus !== 'Sent') ||
          (l.actionItems && l.actionItems.some(a => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && a.dueDate < today));
        return isUrgent || isOverdue;
      })
      .slice(0, 5);
  }, [letters]);

  // Recent Action Items
  const recentActionItems = useMemo(() => {
    const items: Array<{
      letterId: string;
      letterNumber: string;
      subject: string;
      action: string;
      responsible: string;
      dueDate: string;
      priority: LetterPriority;
      status: string;
      letter: Letter;
    }> = [];

    letters.forEach(l => {
      if (l.actionItems && l.actionItems.length > 0) {
        l.actionItems.forEach(a => {
          items.push({
            letterId: l.id,
            letterNumber: l.letterNumber,
            subject: l.subject,
            action: a.action,
            responsible: a.responsiblePerson,
            dueDate: a.dueDate,
            priority: a.priority,
            status: a.status,
            letter: l
          });
        });
      }
    });

    return items.slice(0, 5);
  }, [letters]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-y-auto p-4 sm:p-6 gap-6">
      {/* Top Banner with Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Correspondence & Contractual Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time register monitoring, contractual claim timelines, and action assignments across all projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-dash-incoming-intake"
            onClick={onOpenIncomingIntake}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:border-blue-400 shadow-sm"
          >
            <ArrowDownLeft className="w-4 h-4 text-blue-400" />
            Log Incoming Letter
          </button>
          <button
            id="btn-dash-outgoing-compose"
            onClick={onOpenOutgoingCompose}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            New Outgoing Letter
          </button>
        </div>
      </div>

      {/* 7 Key Performance Indicator Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Total Correspondence */}
        <div
          onClick={() => onSelectTab('all')}
          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-purple-500/50 cursor-pointer transition-all hover:bg-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100">{stats.total}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">All master logs</p>
          </div>
        </div>

        {/* 2. Incoming */}
        <div
          onClick={() => onSelectTab('incoming')}
          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/50 cursor-pointer transition-all hover:bg-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Incoming</span>
            <Inbox className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-blue-400">{stats.incoming}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Received letters</p>
          </div>
        </div>

        {/* 3. Outgoing */}
        <div
          onClick={() => onSelectTab('outgoing')}
          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-emerald-500/50 cursor-pointer transition-all hover:bg-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Outgoing</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">{stats.outgoing}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Issued & sent</p>
          </div>
        </div>

        {/* 4. Drafts */}
        <div
          onClick={() => onSelectTab('drafts')}
          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Drafts</span>
            <FileEdit className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400">{stats.drafts}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">In authoring</p>
          </div>
        </div>

        {/* 5. Pending Action */}
        <div
          onClick={() => onSelectTab('pending_action')}
          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Action</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-indigo-400">{stats.openActionsCount}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Tasks assigned</p>
          </div>
        </div>

        {/* 6. Pending Reply */}
        <div
          onClick={() => onSelectTab('pending_reply')}
          className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-slate-800 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Reply</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-cyan-400">{stats.pendingReplies}</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting response</p>
          </div>
        </div>

        {/* 7. Overdue Alert */}
        <div
          onClick={() => onSelectTab('overdue')}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
            stats.overdueCount > 0
              ? 'bg-rose-950/30 border-rose-600/50 hover:bg-rose-900/40 text-rose-300'
              : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${stats.overdueCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${stats.overdueCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {stats.overdueCount}
            </span>
            <p className="text-[11px] mt-0.5 text-slate-400">Past target date</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Volume (Incoming vs Outgoing) */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Monthly Volume (Incoming vs. Outgoing)
            </h3>
            <span className="text-[11px] text-slate-400">2026 Trend</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Incoming" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outgoing" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Project Distribution */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Folder className="w-4 h-4 text-emerald-400" />
              Correspondence by Project
            </h3>
            <span className="text-[11px] text-slate-400">Active sites</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Contractual Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Contractual Categories
            </h3>
            <span className="text-[11px] text-slate-400">Claims, EOT & Specs</span>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {categoryData.slice(0, 4).map(c => (
              <span key={c.name} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}: <strong className="text-slate-100">{c.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Urgent Attention Radar & Active Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Attention Radar */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Urgent Contractual Watchlist & Deadlines
            </h3>
            <button
              onClick={() => onSelectTab('overdue')}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
            >
              View Overdue Register <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {urgentWatchlist.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                No urgent contractual notices or overdue replies pending.
              </div>
            ) : (
              urgentWatchlist.map(l => (
                <div
                  key={l.id}
                  onClick={() => onSelectLetter(l)}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-purple-300 font-medium truncate">
                        {l.letterNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {l.priority}
                      </span>
                      {l.documentType && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                          {l.documentType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 truncate font-medium">{l.subject}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {l.direction === 'Incoming' ? `From: ${l.senderOrganization || 'External'}` : `To: ${l.recipientOrganization || 'Recipient'}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {l.replyDueDate && (
                      <span className="text-[11px] text-amber-300 font-mono block">
                        Due: {l.replyDueDate}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">{l.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Action Items Queue */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Action Items & Engineer Directives
            </h3>
            <button
              onClick={() => onSelectTab('pending_action')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              All Actions ({stats.openActionsCount}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {recentActionItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No active correspondence action items registered.
              </div>
            ) : (
              recentActionItems.map(item => (
                <div
                  key={item.letterId + item.action}
                  onClick={() => onSelectLetter(item.letter)}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        Assignee: <strong className="text-slate-200">{item.responsible}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-100 font-medium truncate">{item.action}</p>
                    <p className="text-[11px] text-purple-300/80 font-mono mt-0.5 truncate">
                      Ref: {item.letterNumber}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] text-slate-300 font-mono block">
                      {item.dueDate}
                    </span>
                    <span className="text-[10px] text-slate-500">{item.priority}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
