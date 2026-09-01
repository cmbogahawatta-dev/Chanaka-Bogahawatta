import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DailySiteRecord,
  SiteRecordFilter,
  SiteRecordStats,
  DSRStatus
} from '../types/siteRecordTypes';
import { initialDailySiteRecords } from '../data/mockSiteRecords';
import { exportSiteRecordToPDF, exportSiteRecordsToExcel } from '../services/export/siteRecordExporter';

const SITE_RECORDS_STORAGE_KEY = 'ema_construction_daily_site_records_v1';

interface SiteRecordContextType {
  records: DailySiteRecord[];
  activeRecord: DailySiteRecord | null;
  setActiveRecord: (record: DailySiteRecord | null) => void;
  selectedRecordForDetail: DailySiteRecord | null;
  setSelectedRecordForDetail: (record: DailySiteRecord | null) => void;
  
  // CRUD operations
  addRecord: (newRecord: Omit<DailySiteRecord, 'id' | 'dsrNumber' | 'createdAt' | 'updatedAt'>) => DailySiteRecord;
  updateRecord: (id: string, updates: Partial<DailySiteRecord>) => void;
  deleteRecord: (id: string) => void;
  cloneRecordForTomorrow: (sourceRecordId: string) => DailySiteRecord;
  verifyAndApproveRecord: (id: string, verifierName: string, verifierRole: string, clientRemarks?: string) => void;
  
  // Filtering & Search
  filter: SiteRecordFilter;
  setFilter: React.Dispatch<React.SetStateAction<SiteRecordFilter>>;
  filteredRecords: DailySiteRecord[];
  
  // Metrics & Stats
  stats: SiteRecordStats;

  // Exports
  downloadRecordPDF: (recordOrId: DailySiteRecord | string) => void;
  downloadAllExcel: () => void;

  // Reset & Clear
  resetToDefaultRecords: () => void;
  clearAllRecords: () => void;
  bulkImportSiteRecords: (imported: Partial<DailySiteRecord>[]) => { count: number; batchId: string };
}

const defaultFilter: SiteRecordFilter = {
  projectCode: 'ALL',
  dateRange: 'ALL',
  status: 'ALL',
  searchTerm: '',
  weatherImpact: 'ALL'
};

const SiteRecordContext = createContext<SiteRecordContextType | undefined>(undefined);

export const SiteRecordProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<DailySiteRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SITE_RECORDS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading site records from storage', e);
    }
    return initialDailySiteRecords;
  });

  const [activeRecord, setActiveRecord] = useState<DailySiteRecord | null>(null);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<DailySiteRecord | null>(null);
  const [filter, setFilter] = useState<SiteRecordFilter>(defaultFilter);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(SITE_RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving site records', e);
    }
  }, [records]);

  // Generate next DSR Number
  const generateDsrNumber = (): string => {
    const today = new Date();
    const yearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = records.length + 1;
    return `DSR-${yearMonth}-${String(count).padStart(3, '0')}`;
  };

  const addRecord = (newRecordData: Omit<DailySiteRecord, 'id' | 'dsrNumber' | 'createdAt' | 'updatedAt'>): DailySiteRecord => {
    const nowIso = new Date().toISOString();
    const id = `dsr-${Date.now()}`;
    const dsrNumber = generateDsrNumber();

    const createdRecord: DailySiteRecord = {
      ...newRecordData,
      id,
      dsrNumber,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setRecords(prev => [createdRecord, ...prev]);
    return createdRecord;
  };

  const updateRecord = (id: string, updates: Partial<DailySiteRecord>) => {
    setRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
    if (selectedRecordForDetail?.id === id) {
      setSelectedRecordForDetail(prev => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null));
    }
  };

  const deleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (selectedRecordForDetail?.id === id) {
      setSelectedRecordForDetail(null);
    }
  };

  // Duplicate yesterday's log to save hours of entry time for site supervisors
  const cloneRecordForTomorrow = (sourceRecordId: string): DailySiteRecord => {
    const source = records.find(r => r.id === sourceRecordId);
    if (!source) throw new Error('Source record not found');

    const todayDate = new Date().toISOString().split('T')[0];
    const newId = `dsr-${Date.now()}`;
    const newDsrNumber = generateDsrNumber();
    const nowIso = new Date().toISOString();

    const clonedRecord: DailySiteRecord = {
      ...source,
      id: newId,
      dsrNumber: newDsrNumber,
      date: todayDate,
      signOff: {
        ...source.signOff,
        status: 'Draft',
        preparedDate: `${todayDate} 08:00`,
        verifiedByName: undefined,
        verifiedByRole: undefined,
        verifiedDate: undefined,
        digitalSignatureHash: undefined
      },
      // Reset daily progress actuals and material deliveries for fresh day tracking
      materials: [],
      delays: [],
      visitors: [],
      photos: [],
      progress: source.progress.map(p => ({
        ...p,
        id: `prg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        actualQuantity: 0,
        percentageComplete: 0,
        status: 'In Progress',
        remarks: ''
      })),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setRecords(prev => [clonedRecord, ...prev]);
    return clonedRecord;
  };

  const verifyAndApproveRecord = (
    id: string,
    verifierName: string,
    verifierRole: string,
    clientRemarks?: string
  ) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const hash = `EMA-DSR-SEC-${Math.floor(1000 + Math.random() * 9000)}-VERIFIED`;

    updateRecord(id, {
      signOff: {
        preparedByName: verifierName,
        preparedByRole: verifierRole,
        preparedDate: formattedDate,
        verifiedByName: verifierName,
        verifiedByRole: verifierRole,
        verifiedDate: formattedDate,
        clientRemarks: clientRemarks || 'Certified satisfactory as per project specifications.',
        status: 'Verified & Approved',
        digitalSignatureHash: hash
      }
    });
  };

  // Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Project Code
      if (filter.projectCode !== 'ALL' && r.projectCode !== filter.projectCode) {
        return false;
      }

      // 2. Status
      if (filter.status !== 'ALL' && r.signOff.status !== filter.status) {
        return false;
      }

      // 3. Weather Impact
      if (filter.weatherImpact === 'AFFECTED_ONLY' && r.weatherImpact === 'No Impact / Normal Work') {
        return false;
      }

      // 4. Date Range
      const todayStr = new Date().toISOString().split('T')[0];
      if (filter.dateRange === 'TODAY' && r.date !== todayStr) {
        return false;
      }

      // 5. Search text
      if (filter.searchTerm.trim() !== '') {
        const query = filter.searchTerm.toLowerCase();
        const matchesNumber = r.dsrNumber.toLowerCase().includes(query);
        const matchesProject = r.projectCode.toLowerCase().includes(query) || r.projectName.toLowerCase().includes(query);
        const matchesLocation = r.siteLocation.toLowerCase().includes(query);
        const matchesSummary = r.executiveSummary.toLowerCase().includes(query);
        const matchesPreparer = r.signOff.preparedByName.toLowerCase().includes(query);

        if (!matchesNumber && !matchesProject && !matchesLocation && !matchesSummary && !matchesPreparer) {
          return false;
        }
      }

      return true;
    });
  }, [records, filter]);

  // Statistics calculation
  const stats: SiteRecordStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === todayStr);

    const totalRecordsCount = records.length;
    const todayRecordsCount = todayRecords.length;
    const approvedCount = records.filter(r => r.signOff.status === 'Verified & Approved').length;
    const pendingReviewCount = records.filter(
      r => r.signOff.status === 'Submitted for Review' || r.signOff.status === 'Draft'
    ).length;

    // Site Manpower today
    let totalSiteManpowerToday = 0;
    let totalManHoursToday = 0;
    todayRecords.forEach(r => {
      r.manpower.forEach(m => {
        const count = m.headCount || 0;
        const hours = (m.regularHours || 0) + (m.overtimeHours || 0);
        totalSiteManpowerToday += count;
        totalManHoursToday += count * hours;
      });
    });

    // Fallback if no records today yet: take latest record
    if (totalSiteManpowerToday === 0 && records.length > 0) {
      const latest = records[0];
      latest.manpower.forEach(m => {
        const count = m.headCount || 0;
        const hours = (m.regularHours || 0) + (m.overtimeHours || 0);
        totalSiteManpowerToday += count;
        totalManHoursToday += count * hours;
      });
    }

    // Equipment
    let totalWorkingEquip = 0;
    let totalEquip = 0;
    records.forEach(r => {
      r.equipment.forEach(e => {
        totalEquip++;
        if (e.status === 'Working') totalWorkingEquip++;
      });
    });
    const equipmentUtilizationRate = totalEquip > 0 ? Math.round((totalWorkingEquip / totalEquip) * 100) : 85;

    // Total weather downtime
    const weatherDowntimeHoursTotal = records.reduce((sum, r) => sum + (r.workingHoursLostWeather || 0), 0);

    return {
      totalRecordsCount,
      todayRecordsCount,
      approvedCount,
      pendingReviewCount,
      totalSiteManpowerToday,
      totalManHoursToday,
      totalActiveMachineryToday: totalWorkingEquip,
      equipmentUtilizationRate,
      zeroLtiDaysCount: 142, // Safety milestone count
      weatherDowntimeHoursTotal
    };
  }, [records]);

  const downloadRecordPDF = (recordOrId: DailySiteRecord | string) => {
    let target: DailySiteRecord | undefined;
    if (typeof recordOrId === 'string') {
      target = records.find(r => r.id === recordOrId);
    } else {
      target = recordOrId;
    }
    if (target) {
      exportSiteRecordToPDF(target);
    }
  };

  const downloadAllExcel = () => {
    exportSiteRecordsToExcel(filteredRecords);
  };

  const resetToDefaultRecords = () => {
    setRecords(initialDailySiteRecords);
    localStorage.setItem(SITE_RECORDS_STORAGE_KEY, JSON.stringify(initialDailySiteRecords));
  };

  const clearAllRecords = () => {
    setRecords([]);
    localStorage.removeItem(SITE_RECORDS_STORAGE_KEY);
  };

  const bulkImportSiteRecords = (imported: Partial<DailySiteRecord>[]): { count: number; batchId: string } => {
    const batchId = `BATCH-DSR-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const newItems: DailySiteRecord[] = imported.map((r, i) => ({
      id: r.id || `dsr-imp-${Date.now()}-${i}`,
      dsrNumber: r.dsrNumber || `DSR-${(r.projectCode || 'PIDM 26').replace(/\s+/g, '')}-${(r.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '')}-${String(i + 1).padStart(2, '0')}`,
      projectCode: r.projectCode || 'PIDM 26',
      projectName: r.projectName || 'Site Project',
      date: r.date || new Date().toISOString().slice(0, 10),
      weather: r.weather || {
        condition: 'Sunny',
        morningCondition: 'Sunny',
        afternoonCondition: 'Clear',
        rainfallMm: 0,
        temperatureC: 30,
        humidityPercent: 70,
        workDisrupted: false,
        hoursLost: 0,
        impactSummary: 'Normal working conditions'
      },
      workShifts: r.workShifts || [{
        id: `shift-${Date.now()}-${i}`,
        shiftType: 'Day',
        startTime: '08:00',
        endTime: '17:00',
        activeSupervisorsCount: 1,
        totalHeadcount: 10
      }],
      manpower: r.manpower || {
        directLabour: [],
        subcontractorLabour: [],
        agencyLabour: [],
        totalDirectWorkers: 8,
        totalSubcontractorWorkers: 2,
        totalSiteStrength: 10,
        totalManHours: 80
      },
      plantEquipment: r.plantEquipment || [],
      materialDeliveries: r.materialDeliveries || [],
      progressActivities: r.progressActivities || [{
        id: `act-${Date.now()}-${i}`,
        locationSection: 'Section 1',
        activityDescription: 'General site structural & masonry work',
        tradesInvolved: ['Civil'],
        outputQuantity: 100,
        unit: '%',
        percentCompletedToday: 5,
        cumulativePercent: 50,
        delayFlag: false
      }],
      safetyEvents: r.safetyEvents || [],
      qualityInspections: r.qualityInspections || [],
      siteVisitors: r.siteVisitors || [],
      dailyNotes: r.dailyNotes || `Bulk imported site log via batch ${batchId}`,
      signOff: r.signOff || {
        preparedByName: 'Site Supervisor',
        preparedByRole: 'Site Supervisor',
        preparedDate: `${r.date || new Date().toISOString().slice(0, 10)} 17:00`,
        status: 'Verified'
      },
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    setRecords(prev => {
      const merged = [...newItems, ...prev];
      localStorage.setItem(SITE_RECORDS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });

    return { count: newItems.length, batchId };
  };

  return (
    <SiteRecordContext.Provider
      value={{
        records,
        activeRecord,
        setActiveRecord,
        selectedRecordForDetail,
        setSelectedRecordForDetail,
        addRecord,
        updateRecord,
        deleteRecord,
        cloneRecordForTomorrow,
        verifyAndApproveRecord,
        filter,
        setFilter,
        filteredRecords,
        stats,
        downloadRecordPDF,
        downloadAllExcel,
        resetToDefaultRecords,
        clearAllRecords,
        bulkImportSiteRecords
      }}
    >
      {children}
    </SiteRecordContext.Provider>
  );
};

export const useSiteRecords = (): SiteRecordContextType => {
  const context = useContext(SiteRecordContext);
  if (!context) {
    throw new Error('useSiteRecords must be used within a SiteRecordProvider');
  }
  return context;
};
