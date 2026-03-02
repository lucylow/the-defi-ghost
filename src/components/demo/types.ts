export type AgentRole =
  | 'supervisor'
  | 'market-analyst-bull'
  | 'market-analyst-bear'
  | 'opportunity-scout'
  | 'gas-analyst'
  | 'risk-governor'
  | 'strategy-architect'
  | 'custody-manager'
  | 'memory-curator';

export interface AgentActivity {
  name: string;
  emoji: string;
  message: string;
  status: 'waiting' | 'active' | 'done';
  color: string;
}

export interface Activity {
  agentId: AgentRole;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Message {
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface DemoFlow {
  messages: { delay: number; text: string; role: 'user' | 'agent' }[];
  agents: { delay: number; index: number; status: AgentActivity['status']; message: string }[];
}
