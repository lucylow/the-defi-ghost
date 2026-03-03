/**
 * API types aligned with DeFi Ghost backend (backend/api/schemas.py).
 */

export interface SendMessageRequest {
  text: string;
  user_id?: string;
}

export interface SendMessageResponse {
  session_id: string;
  accepted: boolean;
}

export interface ChatMessage {
  text: string;
  role: "user" | "agent";
  timestamp?: string | null;
}

export interface SessionMessagesResponse {
  session_id: string;
  messages: ChatMessage[];
}

export interface AgentActivityItem {
  agent_id: string;
  role: string;
  message: string;
  timestamp: string;
}

export interface ActivityResponse {
  activities: AgentActivityItem[];
}

export interface MemoryItem {
  key: string;
  value: unknown;
  metadata: Record<string, unknown>;
}

export interface MemoryResponse {
  items: MemoryItem[];
}
