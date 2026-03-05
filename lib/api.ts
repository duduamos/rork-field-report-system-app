import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/backend/trpc/app-router";
import { Report } from '@/types/report';

const getBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) {
    console.warn('[API] EXPO_PUBLIC_RORK_API_BASE_URL is not set');
    return '';
  }
  return url;
};

let vanillaClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getClient() {
  const base = getBaseUrl();
  if (!base) {
    throw new Error('Backend URL not configured');
  }

  if (!vanillaClient) {
    vanillaClient = createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: `${base}/api/trpc`,
          transformer: superjson,
        }),
      ],
    });
    console.log('[API] Created vanilla tRPC client with superjson, url:', `${base}/api/trpc`);
  }

  return vanillaClient;
}

export async function fetchAllReports(): Promise<Report[]> {
  console.log('[API] Fetching all reports via tRPC client...');
  const client = getClient();
  const reports = await client.reports.getAll.query();
  console.log('[API] Fetched', reports.length, 'reports');
  return reports as Report[];
}

export async function addReportToBackend(report: Report): Promise<void> {
  console.log('[API] Adding report via tRPC client:', report.id);
  const client = getClient();
  await client.reports.add.mutate(report as any);
  console.log('[API] Report added successfully:', report.id);
}

export async function deleteReportFromBackend(reportId: string): Promise<void> {
  console.log('[API] Deleting report via tRPC client:', reportId);
  const client = getClient();
  await client.reports.delete.mutate({ id: reportId });
  console.log('[API] Report deleted successfully:', reportId);
}

export function isBackendConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
}

export function getBackendUrl(): string {
  return process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? 'לא מוגדר';
}

export async function testBackendConnection(): Promise<{ ok: boolean; message: string; reportCount?: number }> {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!base) {
    return { ok: false, message: 'EXPO_PUBLIC_RORK_API_BASE_URL לא מוגדר - הבאקאנד לא מחובר' };
  }
  try {
    const response = await fetch(`${base}/api/`, { method: 'GET' });
    if (!response.ok) {
      return { ok: false, message: `שרת החזיר שגיאה: ${response.status}` };
    }
    const reports = await fetchAllReports();
    return { ok: true, message: `מחובר! נמצאו ${reports.length} דיווחים בבסיס הנתונים`, reportCount: reports.length };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: `שגיאת חיבור: ${msg}` };
  }
}
