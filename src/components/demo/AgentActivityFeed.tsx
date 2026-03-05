import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentActivity } from './types';

interface AgentActivityFeedProps {
  agents: AgentActivity[];
}

const AgentActivityFeed = ({ agents }: AgentActivityFeedProps) => {
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agents]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
      <AnimatePresence initial={false}>
        {agents.map((agent) => (
          <motion.div
            key={agent.name}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-start gap-3 p-3 rounded-xl transition-all duration-500"
            style={{
              background: agent.status !== "waiting" ? `hsl(${agent.color} / 0.07)` : "hsl(var(--muted) / 0.3)",
              border: agent.status !== "waiting"
                ? `1px solid hsl(${agent.color} / 0.3)`
                : "1px solid hsl(var(--ghost-border) / 0.5)",
            }}
          >
            <span className="text-lg leading-none mt-0.5">{agent.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wide" style={{ color: agent.status !== "waiting" ? `hsl(${agent.color})` : "hsl(var(--muted-foreground))" }}>
                  {agent.name}
                </span>
                <span
                  className={`status-dot ${agent.status === "waiting" ? "waiting" : agent.status === "done" ? "done" : ""}`}
                />
              </div>
              <p
                className="text-xs mt-0.5 truncate font-mono"
                style={{ color: agent.status !== "waiting" ? "hsl(var(--foreground) / 0.8)" : "hsl(var(--muted-foreground))" }}
              >
                {agent.message}
              </p>
            </div>
            {agent.status === "active" && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: `hsl(${agent.color})` }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={feedEndRef} />
    </div>
  );
};

export default AgentActivityFeed;
