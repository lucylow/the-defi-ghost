import { useState, useRef } from "react";
import AgentActivityFeed from "./demo/AgentActivityFeed";
import MemoryTicker from "./demo/MemoryTicker";
import { PRESET_QUERIES, DEMO_FLOWS, initialAgents } from "./demo/demoScenarios";
import { AgentActivity, Message } from "./demo/types";

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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const runQuery = (query: string) => {
    if (isRunning) return;
    setIsRunning(true);
    setShowApprove(false);
    setApproved(false);
    clearTimeouts();

    const flow = DEMO_FLOWS[query] ?? DEMO_FLOWS["Find me the best yield for 5,000 USDC"];
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", text: query, timestamp: now }]);
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

    setAgents((prev) =>
      prev.map((a, i) =>
        i === 0
          ? { ...a, status: "active", message: "Planning bridge + deposit..." }
          : a
      )
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

  return (
    <section className="py-24 px-6" id="demo">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-4">
            <span className="glow-text">Talk to</span> the Ghost
          </h2>
          <p className="text-lg" style={{ color: "hsl(var(--muted-foreground))" }}>
            Experience the multi-agent system in action. Try a query below.
          </p>
        </div>

        <div className="ghost-card rounded-2xl overflow-hidden" style={{ minHeight: "600px" }}>
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-b"
            style={{ borderColor: "hsl(var(--ghost-border))", background: "hsl(var(--ghost-card))" }}
          >
            <div className="text-2xl">👻</div>
            <div>
              <div className="font-bold">Ghost Supervisor</div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <span className="status-dot" />
                <span>9 agents active</span>
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(0 84% 60%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(40 100% 60%)" }} />
              <div className="w-3 h-3 rounded-full" style={{ background: "hsl(145 70% 50%)" }} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 divide-x" style={{ borderColor: "hsl(var(--ghost-border))" }}>
            {/* Chat panel */}
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

              {/* Preset queries */}
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

            {/* Agent feed */}
            <div className="flex flex-col" style={{ height: "520px" }}>
              <div className="px-5 py-3 border-b" style={{ borderColor: "hsl(var(--ghost-border))" }}>
                <span className="text-sm font-bold">Agent Activity Feed</span>
              </div>
              <AgentActivityFeed agents={agents} />
              <MemoryTicker />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
