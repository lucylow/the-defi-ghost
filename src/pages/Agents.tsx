import GhostNav from "@/components/GhostNav";
import GhostFooter from "@/components/GhostFooter";

const agents = [
  {
    icon: "👻",
    name: 'Supervisor "The Ghost"',
    id: "supervisor_001",
    role: "Orchestrator",
    description: "Your conversational interface. Receives your queries, assembles the relevant sub-agents, synthesises their outputs, and replies with a clear recommendation.",
    personality: "Friendly, concise, authoritative. Always keeps you in control.",
    inputs: ["User messages", "Sub-agent reports"],
    outputs: ["Final recommendations", "Transaction summaries"],
    tech: ["Gemini Flash", "OpenClaw"],
    color: "hsl(190 100% 60%)",
  },
  {
    icon: "🐂",
    name: "Market Analyst Bull",
    id: "market_analyst_bull",
    role: "Research",
    description: "Scans DeFi markets with an optimistic lens — identifies rising APYs, growing TVLs, and bullish momentum across protocols and chains.",
    personality: "Enthusiastic, trend-following, risk-tolerant.",
    inputs: ["Market data feeds", "Protocol TVL"],
    outputs: ["Bullish opportunity reports"],
    tech: ["Venice.ai", "Web3.py"],
    color: "hsl(40 100% 60%)",
  },
  {
    icon: "🐻",
    name: "Market Analyst Bear",
    id: "market_analyst_bear",
    role: "Research",
    description: "Plays devil's advocate. Flags high utilisation, liquidity risks, smart contract concerns, and macro headwinds before any move is made.",
    personality: "Cautious, sceptical, detail-oriented.",
    inputs: ["Market data feeds", "Risk signals"],
    outputs: ["Risk warnings", "Bearish counter-analysis"],
    tech: ["Venice.ai", "Web3.py"],
    color: "hsl(0 70% 55%)",
  },
  {
    icon: "🔭",
    name: "Opportunity Scout",
    id: "opportunity_scout",
    role: "Research",
    description: "Continuously polls Aave, Compound, Morpho, Yearn and more across Ethereum, Arbitrum, and Base to surface the highest real yield.",
    personality: "Curious, fast, data-driven.",
    inputs: ["On-chain APY data", "Protocol APIs"],
    outputs: ["Ranked opportunity list"],
    tech: ["Web3.py", "fetch-defi-apy skill"],
    color: "hsl(260 70% 65%)",
  },
  {
    icon: "⛽",
    name: "Gas & MEV Analyst",
    id: "gas_analyst",
    role: "Execution",
    description: "Monitors gas prices in real-time, estimates transaction costs, and checks for MEV exposure so your strategy is always cost-efficient.",
    personality: "Precise, cost-conscious, vigilant.",
    inputs: ["Gas oracle", "Mempool data"],
    outputs: ["Gas cost estimates", "MEV risk score"],
    tech: ["Ethereum RPC", "Arbitrum RPC"],
    color: "hsl(50 100% 55%)",
  },
  {
    icon: "🛡️",
    name: "Risk Governor",
    id: "risk_governor",
    role: "Risk",
    description: "The safety guardian of the team. Enforces position limits, checks historical success rates, and can veto any proposed strategy that breaches your risk tolerance.",
    personality: "Protective, rule-abiding, authoritative.",
    inputs: ["Proposed strategies", "User risk profile"],
    outputs: ["Risk score (1–10)", "Approval / Veto"],
    tech: ["Ethoswarm memory", "Pydantic rules"],
    color: "hsl(145 70% 50%)",
  },
  {
    icon: "🏗️",
    name: "Strategy Architect",
    id: "strategy_architect",
    role: "Execution",
    description: "Plans multi-step execution paths — including bridging, swapping, and depositing — to move funds from your current position to the target yield.",
    personality: "Methodical, visionary, structured.",
    inputs: ["Risk-approved opportunity", "User wallet state"],
    outputs: ["Step-by-step execution plan"],
    tech: ["OpenClaw", "Web3.py"],
    color: "hsl(210 80% 60%)",
  },
  {
    icon: "🔐",
    name: "Custody Manager",
    id: "custody_manager",
    role: "Execution",
    description: "Handles the final transaction assembly, gas optimisation, and waits for your wallet signature before broadcasting anything on-chain.",
    personality: "Secure, reliable, silent.",
    inputs: ["Execution plan", "User signature"],
    outputs: ["Signed transaction", "On-chain receipt"],
    tech: ["eth-account", "Web3.py"],
    color: "hsl(280 60% 60%)",
  },
  {
    icon: "🧠",
    name: "Memory Curator",
    id: "memory_curator",
    role: "Cognition",
    description: "Stores every interaction, outcome, and preference in Ethoswarm's vector memory. Surfaces relevant context so the team gets smarter with every trade.",
    personality: "Retentive, wise, contextual.",
    inputs: ["All agent outputs", "User feedback"],
    outputs: ["Memory recalls", "Context injections"],
    tech: ["Ethoswarm SDK", "Sentence Transformers"],
    color: "hsl(320 60% 60%)",
  },
];

const roleBadgeColors: Record<string, string> = {
  Orchestrator: "hsl(190 100% 60%)",
  Research: "hsl(40 100% 60%)",
  Risk: "hsl(145 70% 50%)",
  Execution: "hsl(210 80% 60%)",
  Cognition: "hsl(320 60% 60%)",
};

const Agents = () => (
  <div className="min-h-screen bg-background">
    <GhostNav />
    <div className="pt-24 pb-16 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold mb-3">
            <span className="glow-text">Meet the</span> Agent Team
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            9 specialised AI agents working in parallel — each with a distinct role, personality, and set of tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((a) => (
            <div
              key={a.id}
              className="ghost-card rounded-2xl p-6 flex flex-col gap-3 hover:scale-[1.01] transition-transform"
              style={{ borderTop: `2px solid ${a.color}` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <div className="font-bold text-sm">{a.name}</div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${roleBadgeColors[a.role]}22`, color: roleBadgeColors[a.role] }}
                  >
                    {a.role}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {a.description}
              </p>

              <div className="text-xs italic" style={{ color: a.color }}>
                "{a.personality}"
              </div>

              <div className="mt-auto pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: "hsl(var(--ghost-border))" }}>
                {a.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Human-in-the-Loop Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              <span className="glow-text">Human-in-the-Loop</span> Framework
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
              Full autonomy without human oversight is dangerous in finance. DeFi Ghost keeps you in control at every critical juncture.
            </p>
          </div>

          {/* Progressive Autonomy */}
          <div className="ghost-card rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>🎚️</span> Progressive Autonomy Model
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { label: "New User", desc: "Maximum oversight — every action requires explicit approval.", icon: "🔒", color: "hsl(0 70% 55%)" },
                { label: "Trusted User", desc: "Configurable autonomy — auto-approve trades under your set limit.", icon: "⚖️", color: "hsl(40 100% 60%)" },
                { label: "Power User", desc: "Granular permissions — trust specific protocols and chains fully.", icon: "🚀", color: "hsl(145 70% 50%)" },
              ].map((tier) => (
                <div key={tier.label} className="rounded-xl p-5" style={{ background: `${tier.color}11`, border: `1px solid ${tier.color}33` }}>
                  <div className="text-2xl mb-2">{tier.icon}</div>
                  <div className="font-bold mb-1" style={{ color: tier.color }}>{tier.label}</div>
                  <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Points */}
          <div className="ghost-card rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>🛑</span> Critical Intervention Points
            </h3>
            <div className="space-y-4">
              {[
                { step: "01", title: "Configuration Phase", desc: "Before any agent acts, you set your risk profile, maximum allocation per protocol, blacklisted protocols, and auto-approval thresholds.", icon: "⚙️" },
                { step: "02", title: "Pre-Execution Approval", desc: "For every significant transaction the Supervisor pauses and sends you the full opportunity brief — protocol, APY, gas estimate, and risk score — before proceeding.", icon: "✋" },
                { step: "03", title: "Parameter Modification", desc: 'You\'re not limited to approve/reject. Reply "MODIFY amount to 2000 USDC" and the system updates the plan and confirms before executing.', icon: "✏️" },
                { step: "04", title: "Emergency Stop", desc: 'Type "STOP ALL" at any time to instantly cancel all pending tasks, revoke temporary session keys, and put the Ghost into idle mode.', icon: "🛑" },
              ].map((point) => (
                <div key={point.step} className="flex gap-4 p-4 rounded-xl" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                  <div className="text-2xl flex-shrink-0">{point.icon}</div>
                  <div>
                    <div className="font-semibold mb-1">{point.title} <span className="text-xs font-mono ml-2" style={{ color: "hsl(var(--muted-foreground))" }}>Step {point.step}</span></div>
                    <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{point.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="ghost-card rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>📊</span> How DeFi Ghost Compares
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid hsl(var(--ghost-border))" }}>
                    <th className="text-left py-3 pr-6 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold" style={{ color: "hsl(var(--ghost-cyan))" }}>DeFi Ghost</th>
                    <th className="text-center py-3 px-4 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Yield Bots</th>
                    <th className="text-center py-3 px-4 font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>Manual</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["24/7 Monitoring", "✅", "✅", "❌"],
                    ["Execution", "After approval", "Automatic", "Manual"],
                    ["Risk Assessment", "Multi-agent validation", "Basic or none", "User's own"],
                    ["Learning", "Learns from decisions", "Static rules", "User learns"],
                    ["Emergency Stop", "Instant via message", "Often none", "N/A"],
                    ["Transparency", "Full audit trail", "Black box", "User knows own"],
                  ].map(([feature, ghost, bots, manual]) => (
                    <tr key={feature} style={{ borderBottom: "1px solid hsl(var(--ghost-border) / 0.4)" }}>
                      <td className="py-3 pr-6 font-medium">{feature}</td>
                      <td className="text-center py-3 px-4" style={{ color: "hsl(var(--ghost-cyan))" }}>{ghost}</td>
                      <td className="text-center py-3 px-4" style={{ color: "hsl(var(--muted-foreground))" }}>{bots}</td>
                      <td className="text-center py-3 px-4" style={{ color: "hsl(var(--muted-foreground))" }}>{manual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="ghost-card rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📋</span> Full Audit Trail & Explainability
            </h3>
            <p className="text-sm mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
              Every decision is logged with complete context — which agents recommended what, why, and what the outcome was. Nothing is a black box.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "🐂", label: "Bull Analysis", desc: "Bullish case with trend data and APY projections" },
                { icon: "🐻", label: "Bear Analysis", desc: "Risk flags, utilisation warnings, downside scenarios" },
                { icon: "🛡️", label: "Risk Governor", desc: "Final risk score and approval rationale" },
                { icon: "🧠", label: "Memory Context", desc: "Recalled past trades and user preference patterns" },
              ].map((item) => (
                <div key={item.label} className="flex gap-3 p-3 rounded-lg" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    <GhostFooter />
  </div>
);

export default Agents;
