import { createTRPCClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/backend/trpc/app-router";
import { Report } from '@/types/report';

const getBaseUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log('[API] EXPO_PUBLIC_RORK_API_BASE_URL =', url ?? 'NOT SET');
  if (!url) {
    console.warn('[API] URL is not set - backend will not work');
    return '';
  }
  return url;
};

let vanillaClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

function getClient() {
  const base = getBaseUrl();
  if (!base) {
    console.error('[API] Cannot create client - no URL');
    throw new Error('Backend URL not configured');
  }
  if (!vanillaClient) {
    const fullUrl = `${base}/trpc`;
    console.log('[API] Creating tRPC client with URL:', fullUrl);
    vanillaClient = createTRPCClient<AppRouter>({
      links: [
        httpLink({
          url: fullUrl,
          transformer: superjson,
        }),
      ],
    });
  }
  return vanillaClient;
}

export async function fetchAllReports(): Promise<Report[]> {
  console.log('[API] fetchAllReports called');
  const client = getClient();
  const reports = await client.reports.getAll.query();
  console.log('[API] fetchAllReports result:', reports.length, 'reports');
  return reports as Report[];
}

export async function addReportToBackend(report: Report): Promise<void> {
  console.log('[API] addReportToBackend called, id:', report.id);
  const client = getClient();
  await client.reports.add.mutate(report as any);
  console.log('[API] addReportToBackend SUCCESS, id:', report.id);
}

export async function deleteReportFromBackend(reportId: string): Promise<void> {
  console.log('[API] deleteReportFromBackend called, id:', reportId);
  const client = getClient();
  await client.reports.delete.mutate({ id: reportId });
  console.log('[API] deleteReportFromBackend SUCCESS, id:', reportId);
}

export function isBackendConfigured(): boolean {
  const configured = !!process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log('[API] isBackendConfigured:', configured);
  return configured;
}

export function getBackendUrl(): string {
  return process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? 'NOT SET';
}

export async function testBackendConnection(): Promise<{ ok: boolean; message: string; reportCount?: number }> {
  const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  console.log('[API] testBackendConnection - URL:', base ?? 'NOT SET');

  if (!base) {
    return { ok: false, message: 'EXPO_PUBLIC_RORK_API_BASE_URL not set' };
  }

  try {
    console.log('[API] Testing fetch to:', `${base}/`);
    const response = await fetch(`${base}/`, { method: 'GET' });
    console.log('[API] Fetch response status:', response.status);

    if (!response.ok) {
      return { ok: false, message: `Server error: ${response.status}` };
    }

    const reports = await fetchAllReports();
    return {
      ok: true,
      message: `Connected! Found ${reports.length} reports`,
      reportCount: reports.length
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[API] testBackendConnection ERROR:', msg);
    return { ok: false, message: `Connection error: ${msg}` };
  }
}
