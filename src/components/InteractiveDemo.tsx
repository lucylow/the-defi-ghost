import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgentActivityFeed from "./demo/AgentActivityFeed";
import MemoryTicker from "./demo/MemoryTicker";
import { PRESET_QUERIES, DEMO_FLOWS, initialAgents } from "./demo/demoScenarios";
import { AgentActivity, Message } from "./demo/types";
import { useBackendAvailable, useSendMessage, useSessionMessages, useActivity, useMemory } from "@/hooks/use-defi-ghost-api";
import type { AgentActivityItem as ApiActivity } from "@/lib/api-types";
import { useToast } from "@/hooks/use-toast";
import { useMockAgent } from "@/hooks/useMockAgent";
import { demoScenarios as mockScenarios } from "@/lib/mockAgentService";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

async function streamGhostChat(
  messages: { role: string; content: string }[],
  onDelta: (chunk: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  let resp: Response;
  try {
    resp = await fetch(`${SUPABASE_URL}/functions/v1/ghost-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });
  } catch {
    onError("Could not reach Ghost. Check your connection.");
    return;
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    if (resp.status === 429) onError("Rate limit reached. Please wait a moment.");
    else if (resp.status === 402) onError("AI credits exhausted. Add credits in workspace settings.");
    else onError(err.error ?? "Ghost is unavailable right now.");
    return;
  }

  if (!resp.body) { onError("Empty response"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }
  onDone();
}

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
  const { toast } = useToast();
  const mock = useMockAgent();
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
  const [inputValue, setInputValue] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: string; content: string }[]>([]);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
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

  const sendAiMessage = async (text: string) => {
    if (isAiStreaming || !text.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text, timestamp: now }]);
    const newHistory = [...aiHistory, { role: "user", content: text }];
    setAiHistory(newHistory);
    setIsAiStreaming(true);
    setShowApprove(false);
    setApproved(false);
    scrollToBottom();

    // Animate agents as "thinking"
    setAgents(initialAgents.map((a) => ({ ...a, status: "waiting" as const })));
    setTimeout(() => {
      setAgents((prev) => prev.map((a, i) => i === 0 ? { ...a, status: "active" as const, message: "Coordinating agents..." } : a));
    }, 300);
    setTimeout(() => {
      setAgents((prev) => prev.map((a, i) => i === 3 ? { ...a, status: "active" as const, message: "Scanning protocols..." } : a));
    }, 800);
    setTimeout(() => {
      setAgents((prev) => prev.map((a, i) => [1, 2].includes(i) ? { ...a, status: "active" as const, message: "Analyzing market data..." } : a));
    }, 1200);

    // Add a placeholder for streaming
    const streamTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "agent", text: "▋", timestamp: streamTs }]);
    scrollToBottom();

    let accumulated = "";
    await streamGhostChat(
      newHistory,
      (chunk) => {
        accumulated += chunk;
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx]?.role === "agent") {
            next[lastIdx] = { ...next[lastIdx], text: accumulated + "▋" };
          }
          return next;
        });
        scrollToBottom();
      },
      () => {
        // Finalize
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx]?.role === "agent") {
            next[lastIdx] = { ...next[lastIdx], text: accumulated };
          }
          return next;
        });
        const updatedHistory = [...newHistory, { role: "assistant", content: accumulated }];
        setAiHistory(updatedHistory);
        setIsAiStreaming(false);
        if (accumulated.toLowerCase().includes("shall i prepare") || accumulated.toLowerCase().includes("approve")) {
          setShowApprove(true);
        }
        setAgents(initialAgents.map((a, i) => ({
          ...a,
          status: i === 0 ? "done" as const : "waiting" as const,
          message: i === 0 ? "Analysis complete ✅" : a.message,
        })));
        scrollToBottom();
      },
      (errMsg) => {
        setIsAiStreaming(false);
        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (next[lastIdx]?.role === "agent" && next[lastIdx].text === "▋") {
            next.splice(lastIdx, 1);
          }
          return next;
        });
        toast({ title: "Ghost Error", description: errMsg, variant: "destructive" });
        setAgents(initialAgents);
      }
    );
  };

  // Sync mock supervisor messages into chat
  useEffect(() => {
    if (!mock.supervisorMsg) return;
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "agent", text: mock.supervisorMsg, timestamp: ts }]);
    if (mock.requiresApproval) setShowApprove(true);
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock.supervisorMsg]);

  const runQuery = (query: string) => {
    // Real AI path (Supabase connected)
    if (SUPABASE_URL) {
      sendAiMessage(query);
      return;
    }

    if (isRunning || mock.isRunning) return;

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
          onSuccess: (data) => { setSessionId(data.session_id); },
          onSettled: () => { setTimeout(() => setIsRunning(false), 30000); },
        }
      );
      return;
    }

    // Mock agent service path — match query to scenario by label or default to first
    setShowApprove(false);
    setApproved(false);
    const scenario = mockScenarios.find((s) => s.label === query || s.query === query) ?? mockScenarios[0];
    mock.runScenario(scenario.id);
  };

  const handleApprove = () => {
    setShowApprove(false);
    setApproved(true);
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: "Approve ✅", timestamp: ts }]);

    if (SUPABASE_URL) {
      sendAiMessage("APPROVE — prepare and describe the transaction steps.");
      return;
    }

    if (isLiveMode) {
      runQuery("Approve");
      setAgents((prev) => prev.map((a, i) => (i === 0 ? { ...a, status: "active", message: "Planning bridge + deposit..." } : a)));
      setTimeout(() => {
        setAgents((prev) => prev.map((a, i) => (i === 0 ? { ...a, status: "done", message: "Strategy plan complete ✅" } : a)));
      }, 2500);
      return;
    }

    // Mock execution
    mock.sendApproval(true);
  };

  // Sync mock activities → agent panel (when not in AI/live mode)
  useEffect(() => {
    if (SUPABASE_URL || isLiveMode || !mock.activities.length) return;
    const roleToSlot: Record<string, number> = {
      supervisor: 0, 'market-analyst-bull': 1, 'market-analyst-bear': 2,
      'opportunity-scout': 3, 'gas-analyst': 4, 'risk-governor': 5,
    };
    setAgents(initialAgents.map((base, i) => {
      const last = [...mock.activities].reverse().find((a) => roleToSlot[a.agentId] === i);
      if (last) return { ...base, status: "active" as const, message: last.message };
      return { ...base, status: "waiting" as const };
    }));
  }, [mock.activities, isLiveMode]);

  const memoryItemsForTicker = isLiveMode && memoryData?.items?.length
    ? memoryData.items.map((m) => {
        const v = typeof m.value === "string" ? m.value : JSON.stringify(m.value);
        return v.length > 60 ? v.slice(0, 57) + "..." : v;
      })
    : mock.memoryItems;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        runQuery(inputValue.trim());
        setInputValue("");
      }
    }
  };

  return (
    <section className="py-24 px-6" id="demo">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-4">
            <span className="glow-text">Talk to</span> the Ghost
          </h2>
          <p className="text-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
            {SUPABASE_URL
              ? "Powered by real AI. Type anything or try a preset query — Ghost will coordinate all 9 agents."
              : isLiveMode
              ? "Connected to the multi-agent backend. Ask about yields, risk, or strategies."
              : "Experience the multi-agent system in action. Try a query below."}
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
                <span className={`status-dot ${SUPABASE_URL || isLiveMode ? "done" : ""}`} />
                <span>{SUPABASE_URL ? "AI-powered — 9 agents ready" : isLiveMode ? "Live — 9 agents active" : "9 agents active"}</span>
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

              <div className="p-4 border-t space-y-3" style={{ borderColor: "hsl(var(--ghost-border))" }}>
                {/* Text input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Ask Ghost anything about DeFi..."
                    disabled={isAiStreaming || isRunning}
                    className="flex-1 px-3 py-2 rounded-xl text-sm bg-transparent outline-none disabled:opacity-50"
                    style={{
                      background: "hsl(var(--secondary))",
                      border: "1px solid hsl(var(--ghost-border))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <button
                    onClick={() => { if (inputValue.trim()) { runQuery(inputValue.trim()); setInputValue(""); } }}
                    disabled={isAiStreaming || isRunning || mock.isRunning || !inputValue.trim()}
                    className="btn-ghost-primary px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                  >
                    {isAiStreaming ? "..." : "Send"}
                  </button>
                </div>

                <p className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Quick queries:
                </p>
                <div className="flex flex-wrap gap-2">
                  {mockScenarios.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { runQuery(s.label); }}
                      disabled={isAiStreaming || isRunning || mock.isRunning}
                      className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                      style={{
                        background: "hsl(var(--ghost-cyan) / 0.1)",
                        border: "1px solid hsl(var(--ghost-cyan) / 0.25)",
                        color: "hsl(var(--ghost-cyan))",
                      }}
                    >
                      {s.label}
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
