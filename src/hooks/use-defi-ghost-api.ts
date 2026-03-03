/**
 * React Query hooks for DeFi Ghost API: chat, session messages, activity, memory.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendMessage,
  getSessionMessages,
  getActivity,
  getMemory,
  isBackendAvailable,
} from "@/lib/api-client";
import type { SendMessageRequest, ChatMessage } from "@/lib/api-types";

const API_KEYS = {
  backendAvailable: ["defi-ghost", "backend-available"] as const,
  session: (sessionId: string) => ["defi-ghost", "session", sessionId] as const,
  activity: ["defi-ghost", "activity"] as const,
  memory: ["defi-ghost", "memory"] as const,
};

/** Check once on mount if backend is reachable. */
export function useBackendAvailable() {
  return useQuery({
    queryKey: API_KEYS.backendAvailable,
    queryFn: isBackendAvailable,
    staleTime: 60_000,
    retry: false,
  });
}

/** Poll session messages (agent replies). Use after sendMessage to show live replies. */
export function useSessionMessages(sessionId: string | null, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: API_KEYS.session(sessionId ?? ""),
    queryFn: () => getSessionMessages(sessionId!),
    enabled: Boolean(sessionId) && (options?.enabled ?? true),
    refetchInterval: sessionId ? (options?.refetchInterval ?? 2000) : false,
  });
}

/** Recent agent activity for the live feed. Pass 0 or false to disable polling. */
export function useActivity(refetchInterval: number | false = 3000) {
  return useQuery({
    queryKey: API_KEYS.activity,
    queryFn: getActivity,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
  });
}

/** Memory map items from the Supervisor. */
export function useMemory(refetchInterval = 10_000) {
  return useQuery({
    queryKey: API_KEYS.memory,
    queryFn: getMemory,
    refetchInterval,
  });
}

/** Send a message to the Ghost and get session_id for polling. */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendMessageRequest) => sendMessage(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: API_KEYS.session(data.session_id) });
    },
  });
}

export type { ChatMessage };
