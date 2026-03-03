import { useState, useRef, useEffect } from "react";
import AgentActivityFeed from "./demo/AgentActivityFeed";
import MemoryTicker from "./demo/MemoryTicker";
import { PRESET_QUERIES, DEMO_FLOWS, initialAgents } from "./demo/demoScenarios";
import { AgentActivity, Message } from "./demo/types";
import { useBackendAvailable, useSendMessage, useSessionMessages, useActivity, useMemory } from "@/hooks/use-defi-ghost-api";
import type { AgentActivityItem as ApiActivity } from "@/lib/api-types";

const formatMessage = (text: string) =>
  text.split("\n").map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return (
      <p
        key={i}
        dangerouslySetInnerHTML={{ __html: bold }}
        className={line.startsWith("🏆") || line.startsWith("📊") ? "mb-1" : ""}
      />
    );
  });

/** Map backend role/agent_id to display slot index (0–5) and status. */
function activitiesToAgentFeed(activities: ApiActivity[]): AgentActivity[] {
  const roleToSlot: Record<string, number> = {
    supervisor: 0,
    market_analyst_bull: 1,
    market_analyst_bear: 2,
    opportunity_scout: 3,
    gas_analyst: 4,
    risk_governor: 5,
  };
  const slotToLatest: Record<number, { message: string }> = {};
  for (const a of activities.slice(0, 50)) {
    const role = (a.role || a.agent_id || "").replace(/_001$/, "").toLowerCase();
    const slot = roleToSlot[role];
    if (slot !== undefined && !slotToLatest[slot]) {
      slotToLatest[slot] = { message: a.message };
    }
  }
  return initialAgents.map((base, i) => {
    const latest = slotToLatest[i];
    if (latest) {
      return { ...base, status: "active" as const, message: latest.message };
    }
    return { ...base, status: "waiting" as const, message: base.message };
  });
}

const InteractiveDemo = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      text: "👻 Hi! I'm Ghost, your AI DeFi co-pilot. Ask me anything about yield opportunities, risks, or strategies. My team of 9 agents is ready!",
      timestamp: "Just now",
    },
  ]);
  const [agents, setAgents] = useState<AgentActivity[]>(initialAgents);
  const [isRunning, setIsRunning] = useState(false);
  const [approved, setApproved] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { data: backendAvailable } = useBackendAvailable();
  const sendMessageMutation = useSendMessage();
  const { data: sessionData } = useSessionMessages(sessionId, {
    enabled: Boolean(sessionId) && backendAvailable === true,
    refetchInterval: 2000,
  });
  const { data: activityData } = useActivity(backendAvailable ? 2000 : 0);
  const { data: memoryData } = useMemory(backendAvailable ? 10_000 : 0);

  const isLiveMode = backendAvailable === true;

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Merge agent replies from API into messages (agent role only; user messages stay local)
  useEffect(() => {
    if (!sessionId || !sessionData?.messages?.length) return;
    const hasApprovePrompt = sessionData.messages.some(
      (m) => m.text.includes("Shall I prepare") || m.text.includes("APPROVE")
    );
    if (hasApprovePrompt) setShowApprove(true);
    setMessages((prev) => {
      const agentTexts = new Set(prev.filter((m) => m.role === "agent").map((m) => m.text));
      const newAgentMessages = sessionData.messages.filter((m) => !agentTexts.has(m.text));
      if (newAgentMessages.length === 0) return prev;
      const next = [...prev];
      for (const m of newAgentMessages) {
        const ts = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
        next.push({ role: "agent" as const, text: m.text, timestamp: ts || "Just now" });
      }
      return next;
    });
    scrollToBottom();
  }, [sessionId, sessionData?.messages]);

  // Live agent activity feed from API
  useEffect(() => {
    if (!isLiveMode || !activityData?.activities?.length) return;
    setAgents(activitiesToAgentFeed(activityData.activities));
  }, [isLiveMode, activityData?.activities]);

  const runQuery = (query: string) => {
    if (isRunning) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: query, timestamp: now }]);
    scrollToBottom();

    if (isLiveMode) {
      setIsRunning(true);
      setShowApprove(false);
      setApproved(false);
      setAgents(initialAgents.map((a) => ({ ...a, status: "waiting" as const, message: a.message })));
      sendMessageMutation.mutate(
        { text: query },
        {
          onSuccess: (data) => {
            setSessionId(data.session_id);
          },
          onSettled: () => {
            setTimeout(() => setIsRunning(false), 30000);
          },
        }
      );
      return;
    }

    // Demo mode: simulated flow
    setIsRunning(true);
    setShowApprove(false);
    setApproved(false);
    clearTimeouts();

    const flow = DEMO_FLOWS[query] ?? DEMO_FLOWS["Find me the best yield for 5,000 USDC"];
    setAgents(initialAgents.map((a) => ({ ...a, status: "waiting" })));

    flow.agents.forEach(({ delay, index, status, message }) => {
      const t = setTimeout(() => {
        setAgents((prev) => prev.map((a, i) => (i === index ? { ...a, status, message } : a)));
      }, delay);
      timeoutsRef.current.push(t);
    });

    flow.messages.forEach(({ delay, text, role }) => {
      const t = setTimeout(() => {
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [...prev, { role, text, timestamp: ts }]);
        if (role === "agent" && text.includes("Shall I prepare")) setShowApprove(true);
        scrollToBottom();
      }, delay);
      timeoutsRef.current.push(t);
    });

    const lastDelay = Math.max(...flow.messages.map((m) => m.delay)) + 500;
    timeoutsRef.current.push(setTimeout(() => setIsRunning(false), lastDelay));
  };

  const handleApprove = () => {
    setShowApprove(false);
    setApproved(true);
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: "Approve ✅", timestamp: ts }]);

    if (isLiveMode) {
      runQuery("Approve");
      setAgents((prev) =>
        prev.map((a, i) => (i === 0 ? { ...a, status: "active", message: "Planning bridge + deposit..." } : a))
      );
      setTimeout(() => {
        setAgents((prev) =>
          prev.map((a, i) => (i === 0 ? { ...a, status: "done", message: "Strategy plan complete ✅" } : a))
        );
      }, 2500);
      return;
    }

    setAgents((prev) =>
      prev.map((a, i) => (i === 0 ? { ...a, status: "active", message: "Planning bridge + deposit..." } : a))
    );
    setTimeout(() => {
      const ts2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "🔐 Transaction prepared and secured. **Please sign with your wallet to execute.** (Simulated — no real transaction)",
          timestamp: ts2,
        },
      ]);
      setAgents((prev) =>
        prev.map((a, i) => (i === 0 ? { ...a, status: "done", message: "Strategy plan complete ✅" } : a))
      );
      scrollToBottom();
    }, 2500);
  };

  const memoryItemsForTicker = isLiveMode && memoryData?.items?.length
    ? memoryData.items.map((m) => {
        const v = typeof m.value === "string" ? m.value : JSON.stringify(m.value);
        return v.length > 60 ? v.slice(0, 57) + "..." : v;
      })
    : undefined;

  return (
    <section className="py-24 px-6" id="demo">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-4">
            <span className="glow-text">Talk to</span> the Ghost
          </h2>
          <p className="text-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isLiveMode
              ? "Connected to the multi-agent backend. Ask about yields, risk, or strategies."
              : "Experience the multi-agent system in action. Try a query below. (Start the API for live mode.)"}
          </p>
        </div>

        <div className="ghost-card rounded-2xl overflow-hidden" style={{ minHeight: "600px" }}>
          <div
            className="flex items-center gap-3 px-6 py-4 border-b"
            style={{ borderColor: "hsl(var(--ghost-border))", background: "hsl(var(--ghost-card))" }}
          >
            <div className="text-2xl">👻</div>
            <div>
              <div className="font-bold">Ghost Supervisor</div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className={`status-dot ${isLiveMode ? "done" : ""}`} />
                <span>{isLiveMode ? "Live — 9 agents active" : "9 agents active"}</span>
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 84% 60%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(40 100% 60%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(145 70% 50%)" }} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 divide-x" style={{ borderColor: "hsl(var(--ghost-border))" }}>
            <div className="flex flex-col" style={{ height: "520px" }}>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1"
                      style={
                        msg.role === "user"
                          ? {
                              background: "hsl(var(--ghost-cyan) / 0.2)",
                              border: "1px solid hsl(var(--ghost-cyan) / 0.3)",
                              color: "hsl(var(--foreground))",
                              borderRadius: "18px 18px 4px 18px",
                            }
                          : {
                              background: "hsl(var(--secondary))",
                              border: "1px solid hsl(var(--ghost-border))",
                              color: "hsl(var(--foreground))",
                              borderRadius: "18px 18px 18px 4px",
                            }
                      }
                    >
                      {formatMessage(msg.text)}
                      <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                {showApprove && !approved && (
                  <div className="flex justify-end gap-3">
                    <button onClick={handleApprove} className="btn-ghost-primary px-4 py-2 rounded-xl text-sm">
                      ✅ Approve
                    </button>
                    <button className="btn-ghost-outline px-4 py-2 rounded-xl text-sm">❌ Decline</button>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t" style={{ borderColor: "hsl(var(--ghost-border))" }}>
                <p className="text-xs mb-3 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Try a query:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => runQuery(q)}
                      disabled={isRunning}
                      className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                      style={{
                        background: "hsl(var(--ghost-cyan) / 0.1)",
                        border: "1px solid hsl(var(--ghost-cyan) / 0.25)",
                        color: "hsl(var(--ghost-cyan))",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col" style={{ height: "520px" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "hsl(var(--ghost-border))" }}>
                <span className="text-sm font-bold">Agent Activity Feed</span>
              </div>
              <AgentActivityFeed agents={agents} />
              <MemoryTicker memoryItems={memoryItemsForTicker} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
