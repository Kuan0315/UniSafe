import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface SOSAlertItem {
  _id: string;
  message: string;
  severity: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  user?: { name?: string; email?: string; phone?: string };
  location?: { type: string; coordinates: number[]; address?: string };
}

export interface PaginatedSOSResponse {
  success: boolean;
  alerts: SOSAlertItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ReportItem {
  id: string;
  category: string;
  description: string;
  userName: string;
  attachments: { url: string; mimetype: string; filename: string; size: number }[];
  createdAt: string;
}

export interface ReportsListResponse { ok: boolean; items: ReportItem[] }

async function authFetch(url: string, options: RequestInit = {}) {
  // Placeholder token retrieval; integrate with real auth storage
  const token = '';
  const headers: Record<string,string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

export async function fetchStaffSOS(page = 1, limit = 20): Promise<PaginatedSOSResponse> {
  return authFetch(`${API_BASE}/sos/all-alerts?page=${page}&limit=${limit}`);
}

export async function fetchReports(): Promise<ReportsListResponse> {
  return authFetch(`${API_BASE}/reports`);
}

export async function resolveSOS(alertId: string, notes = ''): Promise<any> {
  return authFetch(`${API_BASE}/sos/alerts/${alertId}/resolve`, { method: 'PATCH', body: JSON.stringify({ notes }) });
}
