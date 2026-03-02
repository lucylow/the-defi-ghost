import { AgentActivity } from './types';

interface AgentActivityFeedProps {
  agents: AgentActivity[];
}

const AgentActivityFeed = ({ agents }: AgentActivityFeedProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {agents.map((agent) => (
        <div
          key={agent.name}
          className="flex items-start gap-3 p-3 rounded-xl transition-all duration-500"
          style={{
            background: agent.status !== "waiting" ? `hsl(${agent.color} / 0.07)` : "transparent",
            border: agent.status !== "waiting" ? `1px solid hsl(${agent.color} / 0.25)` : "1px solid transparent",
          }}
        >
          <span className="text-xl">{agent.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{agent.name}</span>
              <span
                className={`status-dot ${agent.status === "waiting" ? "waiting" : agent.status === "done" ? "done" : ""}`}
              />
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
              {agent.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentActivityFeed;
