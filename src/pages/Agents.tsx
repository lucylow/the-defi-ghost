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
      </div>
    </div>
    <GhostFooter />
  </div>
);

export default Agents;
