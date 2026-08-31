import React, { useState } from 'react';
import {
  FileText,
  Users,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Download,
  Calendar,
  Layers,
  Sparkles,
  CloudSun,
  Award
} from 'lucide-react';
import { DailySiteRecord } from '../../types/siteRecordTypes';
import { useSiteRecords } from '../../context/SiteRecordContext';
import { AdminClearHistoryButton } from '../common/AdminClearHistoryButton';
import { DSRRegistryTab } from './tabs/DSRRegistryTab';
import { ManpowerAnalyticsTab } from './tabs/ManpowerAnalyticsTab';
import { PlantMachineryTab } from './tabs/PlantMachineryTab';
import { WorkProgressTab } from './tabs/WorkProgressTab';
import { SafetyHSEQualityTab } from './tabs/SafetyHSEQualityTab';
import { SiteRecordDetailModal } from './SiteRecordDetailModal';
import { CreateDSRModal } from './CreateDSRModal';

type DSRTab = 'registry' | 'manpower' | 'equipment' | 'progress' | 'safety';

export const SiteRecordsView: React.FC = () => {
  const { records, stats, downloadAllExcel, clearAllRecords } = useSiteRecords();

  const [activeTab, setActiveTab] = useState<DSRTab>('registry');
  const [selectedRecord, setSelectedRecord] = useState<DailySiteRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [recordToEdit, setRecordToEdit] = useState<DailySiteRecord | null>(null);

  const handleOpenDetail = (record: DailySiteRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (record: DailySiteRecord) => {
    setRecordToEdit(record);
    setIsCreateModalOpen(true);
  };

  const handleOpenNew = () => {
    setRecordToEdit(null);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Hero Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                EMA Site Operations & Quality System
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ISO 9001 / ISO 45001 Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Construction Daily Site Records (DSR)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Site journal and official daily reporting log for manpower, heavy machinery, material tickets, work milestone outputs, weather disruptions, and HSE safety sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <AdminClearHistoryButton
              id="btn-admin-clear-site-records-main"
              moduleName="Daily Site Records (DSR)"
              itemCount={records.length}
              itemDescription="daily construction site logs, manpower records, equipment logs, and HSE sign-offs"
              preservedItemsDescription="Core projects, vehicle fleet entries, and employee directories will remain intact."
              onClear={clearAllRecords}
              label="Clear History"
            />
            <button
              onClick={downloadAllExcel}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Full Project Excel Export</span>
            </button>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Today's Log</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Total DSR Logs</span>
            <p className="text-xl font-black text-purple-400">{stats.totalRecordsCount}</p>
            <span className="text-[10px] text-emerald-400">{stats.approvedCount} Approved & Verified</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Today's Manpower</span>
            <p className="text-xl font-black text-blue-400">{stats.totalSiteManpowerToday} <span className="text-xs font-normal text-slate-400">Personnel</span></p>
            <span className="text-[10px] text-slate-400">{stats.totalManHoursToday} man-hours deployed</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Active Heavy Machinery</span>
            <p className="text-xl font-black text-amber-400">{stats.totalActiveMachineryToday} <span className="text-xs font-normal text-slate-400">Machines</span></p>
            <span className="text-[10px] text-slate-400">Earthmoving & Cranes active</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Safety & HSE Record</span>
            <p className="text-xl font-black text-emerald-400">0 LTI</p>
            <span className="text-[10px] text-emerald-400">{stats.zeroLtiDaysCount} Safe Days Recorded</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Header */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none shadow-sm">
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'registry'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daily Journal (DSRs)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950/80 text-purple-200">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('manpower')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'manpower'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manpower & Labour Force</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'equipment'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Plant & Machinery</span>
        </button>

        <button
          onClick={() => setActiveTab('progress')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'progress'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Work Progress & Delays</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'safety'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>HSE Safety & Quality QC</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'registry' && (
          <DSRRegistryTab
            onOpenCreateModal={handleOpenNew}
            onOpenDetailModal={handleOpenDetail}
            onEditRecord={handleEdit}
          />
        )}

        {activeTab === 'manpower' && <ManpowerAnalyticsTab />}
        {activeTab === 'equipment' && <PlantMachineryTab />}
        {activeTab === 'progress' && <WorkProgressTab />}
        {activeTab === 'safety' && <SafetyHSEQualityTab />}
      </div>

      {/* Detail Modal */}
      <SiteRecordDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEdit}
      />

      {/* Create / Edit Modal */}
      <CreateDSRModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialRecord={recordToEdit}
      />
    </div>
  );
};
