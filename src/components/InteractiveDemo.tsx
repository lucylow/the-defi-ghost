import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "agent";
  text: string;
  timestamp: string;
}

interface AgentActivity {
  name: string;
  emoji: string;
  message: string;
  status: "waiting" | "active" | "done";
  color: string;
}

const PRESET_QUERIES = [
  "Find me the best yield for 5,000 USDC",
  "What's the risk of lending on Aave?",
  "Compare Arbitrum vs Base yields",
  "Show me low-risk stablecoin options",
];

const DEMO_FLOWS: Record<string, { messages: { delay: number; text: string; role: "user" | "agent" }[]; agents: { delay: number; index: number; status: AgentActivity["status"]; message: string }[] }> = {
  "Find me the best yield for 5,000 USDC": {
    messages: [
      { delay: 500, text: "I'm on it! Let me assemble the team. 🔍", role: "agent" },
      { delay: 6000, text: "Analysis complete! Here's what we found:\n\n🏆 **Top Opportunity**: 12.5% APY on Compound (Arbitrum)\n📊 Risk Score: 3/10 ✅\n⛽ Estimated Gas: ~$12\n🔒 Utilization: 82% (healthy)\n\nShall I prepare the transaction for you?", role: "agent" },
    ],
    agents: [
      { delay: 800, index: 3, status: "active", message: "Scanning Aave (Arbitrum): 8.2% APY..." },
      { delay: 1200, index: 3, status: "active", message: "Scanning Compound (Arbitrum): 12.5% APY 🔥" },
      { delay: 1600, index: 3, status: "done", message: "Scanning Morpho (Base): 9.1% APY ✅" },
      { delay: 2000, index: 1, status: "active", message: "Compound's rate is highest! TVL growing 📈" },
      { delay: 2500, index: 2, status: "active", message: "Checking utilization: 82% — moderate risk" },
      { delay: 3000, index: 4, status: "active", message: "Arbitrum gas: 0.1 gwei — perfect timing ⛽" },
      { delay: 3500, index: 5, status: "active", message: "Checking position limits..." },
      { delay: 4200, index: 5, status: "done", message: "Risk score: 3/10 ✅ All checks passed" },
      { delay: 4800, index: 1, status: "done", message: "Recommendation: Compound Arbitrum confirmed 🎯" },
    ],
  },
  "What's the risk of lending on Aave?": {
    messages: [
      { delay: 500, text: "Running a full risk assessment on Aave. Consulting the Risk Governor and Bear Analyst... 🛡️", role: "agent" },
      { delay: 5500, text: "**Aave Risk Assessment**:\n\n🛡️ Overall Risk: **4/10** (Low-Medium)\n✅ Smart Contract: Audited 5x, battle-tested\n⚠️ Liquidation Risk: Low at current market conditions\n📊 Utilization: 78% (healthy range)\n\nAave is considered one of the safest DeFi protocols. Suitable for conservative strategies.", role: "agent" },
    ],
    agents: [
      { delay: 800, index: 5, status: "active", message: "Analyzing Aave smart contract audits..." },
      { delay: 1500, index: 2, status: "active", message: "Checking historical liquidation events..." },
      { delay: 2200, index: 2, status: "done", message: "Bear case: Oracle risk is manageable ✅" },
      { delay: 3000, index: 5, status: "active", message: "Calculating overall risk score..." },
      { delay: 4000, index: 5, status: "done", message: "Final risk score: 4/10 — Low-Medium ✅" },
    ],
  },
};

const initialAgents: AgentActivity[] = [
  { name: "The Ghost", emoji: "👻", message: "Ready to assist", status: "waiting", color: "175 100% 50%" },
  { name: "Bull Analyst", emoji: "📈", message: "Monitoring markets", status: "waiting", color: "145 70% 50%" },
  { name: "Bear Analyst", emoji: "📉", message: "On standby", status: "waiting", color: "0 84% 60%" },
  { name: "Scout", emoji: "🕵️", message: "Scanning protocols", status: "waiting", color: "265 80% 65%" },
  { name: "Gas Analyst", emoji: "⛽", message: "Watching gas prices", status: "waiting", color: "40 100% 60%" },
  { name: "Risk Governor", emoji: "🛡️", message: "Checking limits", status: "waiting", color: "200 100% 55%" },
];

const memoryItems = [
  "Remembered: User prefers conservative strategies",
  "Stored: Last query was for USDC yield",
  "Learned: User rejected high-gas transactions",
  "Cached: Compound Arbitrum — previously approved",
  "Noted: Risk tolerance set to moderate",
];

const InteractiveDemo = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "👻 Hi! I'm Ghost, your AI DeFi co-pilot. Ask me anything about yield opportunities, risks, or strategies. My team of 9 agents is ready!", timestamp: "Just now" },
  ]);
  const [agents, setAgents] = useState<AgentActivity[]>(initialAgents);
  const [isRunning, setIsRunning] = useState(false);
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [approved, setApproved] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryIndex((i) => (i + 1) % memoryItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const runQuery = (query: string) => {
    if (isRunning) return;
    setIsRunning(true);
    setShowApprove(false);
    setApproved(false);
    clearTimeouts();

    const flow = DEMO_FLOWS[query] || DEMO_FLOWS["Find me the best yield for 5,000 USDC"];
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", text: query, timestamp: now }]);
    setAgents(initialAgents.map((a) => ({ ...a, status: "waiting" })));

    // Schedule agent updates
    flow.agents.forEach(({ delay, index, status, message }) => {
      const t = setTimeout(() => {
        setAgents((prev) =>
          prev.map((a, i) => (i === index ? { ...a, status, message } : a))
        );
      }, delay);
      timeoutsRef.current.push(t);
    });

    // Schedule messages
    flow.messages.forEach(({ delay, text, role }) => {
      const t = setTimeout(() => {
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [...prev, { role, text, timestamp: ts }]);
        if (role === "agent" && text.includes("Shall I prepare")) {
          setShowApprove(true);
        }
      }, delay);
      timeoutsRef.current.push(t);
    });

    const lastDelay = Math.max(...flow.messages.map((m) => m.delay)) + 500;
    const t = setTimeout(() => setIsRunning(false), lastDelay);
    timeoutsRef.current.push(t);
  };

  const handleApprove = () => {
    setShowApprove(false);
    setApproved(true);
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text: "Approve ✅", timestamp: ts }]);

    setAgents((prev) =>
      prev.map((a, i) =>
        i === 6 ? { ...a, status: "active", message: "Planning bridge + deposit..." }
          : i === 7 ? { ...a, status: "active", message: "Waiting for your signature..." }
          : a
      )
    );

    setTimeout(() => {
      const ts2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "🔐 Transaction prepared and secured. **Please sign with your wallet to execute.** (Simulated — no real transaction)", timestamp: ts2 },
      ]);
      setAgents((prev) =>
        prev.map((a, i) =>
          i === 6 ? { ...a, status: "done", message: "Strategy plan complete ✅" }
            : i === 7 ? { ...a, status: "done", message: "Awaiting wallet signature 🔐" }
            : a
        )
      );
    }, 2500);
  };

  const formatMessage = (text: string) => {
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} className={line.startsWith("🏆") || line.startsWith("📊") ? "mb-1" : ""} />;
    });
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

        {/* Demo interface */}
        <div className="ghost-card rounded-2xl overflow-hidden" style={{ minHeight: "600px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "hsl(var(--ghost-border))", background: "hsl(var(--ghost-card))" }}>
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
                          ? { background: "hsl(var(--ghost-cyan) / 0.2)", border: "1px solid hsl(var(--ghost-cyan) / 0.3)", color: "hsl(var(--foreground))", borderRadius: "18px 18px 4px 18px" }
                          : { background: "hsl(var(--secondary))", border: "1px solid hsl(var(--ghost-border))", color: "hsl(var(--foreground))", borderRadius: "18px 18px 18px 4px" }
                      }
                    >
                      {formatMessage(msg.text)}
                      <div className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                {showApprove && !approved && (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleApprove}
                      className="btn-ghost-primary px-4 py-2 rounded-xl text-sm"
                    >
                      ✅ Approve
                    </button>
                    <button className="btn-ghost-outline px-4 py-2 rounded-xl text-sm">
                      ❌ Decline
                    </button>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Preset queries */}
              <div className="p-4 border-t" style={{ borderColor: "hsl(var(--ghost-border))" }}>
                <p className="text-xs mb-3 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>Try a query:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => runQuery(q)}
                      disabled={isRunning}
                      className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                      style={{ background: "hsl(var(--ghost-cyan) / 0.1)", border: "1px solid hsl(var(--ghost-cyan) / 0.25)", color: "hsl(var(--ghost-cyan))" }}
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
                        <span className={`status-dot ${agent.status === "waiting" ? "waiting" : agent.status === "done" ? "done" : ""}`} />
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {agent.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Memory ticker */}
              <div className="p-3 border-t" style={{ borderColor: "hsl(var(--ghost-border))", background: "hsl(265 80% 65% / 0.05)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold" style={{ color: "hsl(var(--ghost-purple))" }}>🧠 MEMORY</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs truncate animate-pulse font-mono" style={{ color: "hsl(265 80% 65% / 0.8)" }}>
                      {memoryItems[memoryIndex]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
