/**
 * DeFi Ghost API client. Uses VITE_API_BASE (or relative /api in dev with proxy).
 */

import type {
  SendMessageRequest,
  SendMessageResponse,
  SessionMessagesResponse,
  ActivityResponse,
  MemoryResponse,
} from "./api-types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function sendMessage(body: SendMessageRequest): Promise<SendMessageResponse> {
  return fetchJson<SendMessageResponse>(apiUrl("/api/chat"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSessionMessages(sessionId: string): Promise<SessionMessagesResponse> {
  return fetchJson<SessionMessagesResponse>(apiUrl(`/api/session/${encodeURIComponent(sessionId)}/messages`));
}

export async function getActivity(): Promise<ActivityResponse> {
  return fetchJson<ActivityResponse>(apiUrl("/api/activity"));
}

export async function getMemory(): Promise<MemoryResponse> {
  return fetchJson<MemoryResponse>(apiUrl("/api/memory"));
}

export async function healthCheck(): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(apiUrl("/health"));
}

/** Check if the backend is reachable (for demo vs live mode). */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
}
