import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Report, ReportFormData } from '@/types/report';
import { fetchAllReports, addReportToBackend, deleteReportFromBackend, isBackendConfigured } from '@/lib/api';

const LOCAL_CACHE_KEY = 'field_reports_cache_v2';
const DELETED_IDS_KEY = 'field_reports_deleted_ids_v1';
const SYNC_INTERVAL_MS = 20000;

function generateId(): string {
  return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
}

function sortByDate(reports: Report[]): Report[] {
  return [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function formToReport(formData: ReportFormData & { username: string }): Report {
  const report: Report = {
    id: generateId(),
    created_at: new Date().toISOString(),
    username: formData.username,
    technician_name: formData.technician_name,
    report_type: formData.report_type,
    street: formData.street,
    city: formData.city,
    map_number: formData.map_number,
    note: formData.note,
    images: formData.images,
  };

  if (formData.report_type === 'work') {
    report.work_type = formData.work_type || undefined;
    if (formData.work_type === 'cabinet') {
      report.cabinet_number = formData.cabinet_number;
      report.cabinet_location = formData.cabinet_location;
      report.cabinet_splitters = formData.cabinet_splitters.length > 0 ? formData.cabinet_splitters : undefined;
    }
    if (formData.work_type === 'closure') {
      report.closure_size = formData.closure_size || undefined;
      report.closure_cables = formData.closure_cables.length > 0 ? formData.closure_cables : undefined;
      report.closure_welds = parseInt(formData.closure_welds, 10) || undefined;
      report.closure_splitters = formData.closure_splitters.length > 0 ? formData.closure_splitters : undefined;
    }
    if (formData.work_type === 'addition') {
      report.addition_action = formData.addition_action || undefined;
      report.addition_target = formData.addition_target || undefined;
      report.addition_number = formData.addition_number;
      report.addition_for_cabinet = formData.addition_for_cabinet;
      report.addition_welds = parseInt(formData.addition_welds, 10) || undefined;
      report.addition_cable_type = formData.addition_cable_type || undefined;
    }
  }

  if (formData.report_type === 'fault') {
    report.ticket = formData.ticket;
    report.arrival_time = formData.arrival_time;
    report.fault_type = formData.fault_type || undefined;
    if (formData.fault_type === 'cabinet_damage') {
      report.cabinet_damage_sub = formData.cabinet_damage_sub || undefined;
      if (formData.cabinet_damage_sub === 'broken_splitter') {
        report.fault_splitters = formData.fault_splitters.length > 0 ? formData.fault_splitters : undefined;
      }
      if (formData.cabinet_damage_sub === 'cable_pulled') {
        report.fault_welds = parseInt(formData.fault_welds, 10) || undefined;
      }
    }
    if (formData.fault_type === 'broken_fiber') {
      report.fiber_openings = parseInt(formData.fiber_openings, 10) || undefined;
      report.fiber_welds = parseInt(formData.fiber_welds, 10) || undefined;
      report.fiber_otdr = formData.fiber_otdr || undefined;
    }
    if (formData.fault_type === 'cable_replace') {
      report.cable_openings = parseInt(formData.cable_openings, 10) || undefined;
      report.cable_welds = parseInt(formData.cable_welds, 10) || undefined;
      report.cable_otdr = formData.cable_otdr || undefined;
      report.cable_type = formData.cable_type || undefined;
      report.cable_length = formData.cable_length || undefined;
      report.cable_from = formData.cable_from || undefined;
      report.cable_to = formData.cable_to || undefined;
    }
    if (formData.fault_type === 'infrastructure_fix') {
      report.infra_openings = parseInt(formData.infra_openings, 10) || undefined;
      report.infra_welds = parseInt(formData.infra_welds, 10) || undefined;
      report.infra_cable_opening = formData.infra_cable_opening || undefined;
      report.infra_cable_type = formData.infra_cable_type || undefined;
    }
  }

  return report;
}

async function saveCache(reports: Report[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(reports));
    console.log('[Reports] Cache saved:', reports.length, 'reports');
  } catch (e) {
    console.warn('[Reports] Cache save failed:', e);
  }
}

async function loadCache(): Promise<Report[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Report[];
      console.log('[Reports] Cache loaded:', parsed.length, 'reports');
      return parsed;
    }
  } catch (e) {
    console.warn('[Reports] Cache load failed:', e);
  }
  return [];
}

async function loadDeletedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      console.log('[Reports] Deleted IDs loaded:', arr.length);
      return new Set(arr);
    }
  } catch (e) {
    console.warn('[Reports] Deleted IDs load failed:', e);
  }
  return new Set();
}

async function saveDeletedIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(DELETED_IDS_KEY, JSON.stringify([...ids]));
  } catch (e) {
    console.warn('[Reports] Deleted IDs save failed:', e);
  }
}

export const [ReportsProvider, useReports] = createContextHook(() => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reportsRef = useRef<Report[]>([]);
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const isSyncingRef = useRef<boolean>(false);

  const backendConfigured = isBackendConfigured();

  const setReportsAndRef = useCallback((r: Report[]) => {
    reportsRef.current = r;
    setReports(r);
  }, []);

  const fetchFromBackend = useCallback(async (): Promise<Report[] | null> => {
    if (!backendConfigured) return null;
    try {
      const remote = await fetchAllReports();
      console.log('[Reports] Fetched', remote.length, 'from backend');
      return remote;
    } catch (e) {
      console.warn('[Reports] Backend fetch failed:', e);
      return null;
    }
  }, [backendConfigured]);

  const doSync = useCallback(async (showSyncing = false) => {
    if (!isMountedRef.current) return;
    if (isSyncingRef.current) {
      console.log('[Reports] Sync already in progress, skipping');
      return;
    }

    isSyncingRef.current = true;
    if (showSyncing) setIsSyncing(true);

    try {
      const remote = await fetchFromBackend();

      if (!isMountedRef.current) return;

      if (remote !== null) {
        setBackendAvailable(true);

        const remoteIds = new Set(remote.map((r) => r.id));
        const deletedIds = deletedIdsRef.current;

        const localReports = reportsRef.current;
        const localOnlyReports = localReports.filter(
          (r) => !remoteIds.has(r.id) && !deletedIds.has(r.id)
        );

        console.log('[Reports] Local-only reports to push:', localOnlyReports.length);

        for (const r of localOnlyReports) {
          try {
            await addReportToBackend(r);
            console.log('[Reports] Re-pushed local report to backend:', r.id);
          } catch (e) {
            console.warn('[Reports] Failed to push local report:', r.id, e);
          }
        }

        const remoteFiltered = remote.filter((r) => !deletedIds.has(r.id));

        const mergedMap = new Map<string, Report>();
        for (const r of remoteFiltered) mergedMap.set(r.id, r);
        for (const r of localOnlyReports) mergedMap.set(r.id, r);

        if (!isMountedRef.current) return;

        const sorted = sortByDate([...mergedMap.values()]);
        setReportsAndRef(sorted);
        await saveCache(sorted);
        console.log('[Reports] Sync complete. Total reports:', sorted.length);
      } else {
        setBackendAvailable(false);
        console.log('[Reports] Backend unavailable, keeping local state');
      }
    } finally {
      isSyncingRef.current = false;
      if (isMountedRef.current && showSyncing) setIsSyncing(false);
    }
  }, [fetchFromBackend, setReportsAndRef]);

  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      const [cached, deletedIds] = await Promise.all([loadCache(), loadDeletedIds()]);
      deletedIdsRef.current = deletedIds;

      if (isMountedRef.current) {
        const filtered = cached.filter((r) => !deletedIds.has(r.id));
        setReportsAndRef(sortByDate(filtered));
        setIsLoading(false);
      }

      await doSync(false);
    };

    init();

    if (backendConfigured) {
      syncTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          console.log('[Reports] Auto-sync tick');
          doSync(false);
        }
      }, SYNC_INTERVAL_MS);
    }

    return () => {
      isMountedRef.current = false;
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, []);

  const addReport = useCallback(
    async (formData: ReportFormData & { username: string }): Promise<Report> => {
      const newReport = formToReport(formData);
      console.log('[Reports] Adding report:', newReport.id);
      setIsAdding(true);

      const current = reportsRef.current;
      const updated = sortByDate([newReport, ...current]);
      setReportsAndRef(updated);
      await saveCache(updated);

      if (backendConfigured) {
        try {
          await addReportToBackend(newReport);
          console.log('[Reports] Report pushed to backend:', newReport.id);
          setBackendAvailable(true);
        } catch (e) {
          console.warn('[Reports] Backend push failed, will retry on next sync:', e);
          setBackendAvailable(false);
        }
      }

      setIsAdding(false);
      return newReport;
    },
    [backendConfigured, setReportsAndRef]
  );

  const deleteReport = useCallback(
    async (reportId: string): Promise<string> => {
      console.log('[Reports] Deleting report:', reportId);

      deletedIdsRef.current = new Set([...deletedIdsRef.current, reportId]);
      await saveDeletedIds(deletedIdsRef.current);

      const updated = sortByDate(reportsRef.current.filter((r) => r.id !== reportId));
      setReportsAndRef(updated);
      await saveCache(updated);

      if (backendConfigured) {
        try {
          await deleteReportFromBackend(reportId);
          console.log('[Reports] Delete synced to backend:', reportId);
        } catch (e) {
          console.warn('[Reports] Backend delete failed:', e);
        }
      }

      return reportId;
    },
    [backendConfigured, setReportsAndRef]
  );

  const getReportById = useCallback(
    (id: string) => reportsRef.current.find((r) => r.id === id) ?? null,
    []
  );

  const refetch = useCallback(async () => {
    console.log('[Reports] Manual refresh');
    await doSync(true);
  }, [doSync]);

  return {
    reports,
    isLoading,
    addReport,
    isAdding,
    deleteReport,
    getReportById,
    backendAvailable,
    isSyncing,
    refetch,
  };
});

export function useFilteredReports(username: string, isAdmin: boolean, searchQuery: string) {
  const { reports } = useReports();
  return useMemo(() => {
    let filtered = isAdmin ? reports : reports.filter((r) => r.username === username);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.street.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          (r.ticket ?? '').toLowerCase().includes(q) ||
          r.technician_name.toLowerCase().includes(q) ||
          (r.cabinet_number ?? '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [reports, username, isAdmin, searchQuery]);
}
