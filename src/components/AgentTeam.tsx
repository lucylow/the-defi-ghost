const agents = [
  {
    name: "The Ghost",
    role: "Supervisor",
    emoji: "👻",
    color: "175 100% 50%",
    description: "Your conversational AI interface. The central intelligence that coordinates all other agents and talks to you directly.",
    thought: "\"How can I help you find the best yield today?\"",
    personality: "Friendly, strategic, always in control",
  },
  {
    name: "Bull Analyst",
    role: "Market Analyst",
    emoji: "📈",
    color: "145 70% 50%",
    description: "Sees opportunities everywhere. Analyzes market trends, TVL growth, and APY spikes across all major protocols.",
    thought: "\"Compound's rate is heating up! APY +2.3% in the last hour.\"",
    personality: "Optimistic, data-driven, opportunity-focused",
  },
  {
    name: "Bear Analyst",
    role: "Market Analyst",
    emoji: "📉",
    color: "0 84% 60%",
    description: "Plays devil's advocate. Challenges every opportunity with risk scenarios, utilization rates, and worst-case analysis.",
    thought: "\"High utilization = withdrawal risk. Let's be careful here.\"",
    personality: "Skeptical, thorough, safety-conscious",
  },
  {
    name: "Scout",
    role: "Opportunity Scout",
    emoji: "🕵️",
    color: "265 80% 65%",
    description: "Hunts yield spikes across Aave, Compound, Morpho, and emerging protocols in real-time.",
    thought: "\"Found a 15.2% APY spike on Base. Investigating...\"",
    personality: "Fast, relentless, detail-oriented",
  },
  {
    name: "Gas Analyst",
    role: "Gas & MEV Analyst",
    emoji: "⛽",
    color: "40 100% 60%",
    description: "Optimizes every transaction cost. Monitors gas prices, MEV exposure, and optimal execution timing.",
    thought: "\"Arbitrum gas: 0.1 gwei. Optimal window in 3 minutes.\"",
    personality: "Precise, frugal, technically astute",
  },
  {
    name: "Risk Governor",
    role: "Safety Guardian",
    emoji: "🛡️",
    color: "200 100% 55%",
    description: "The safety net of the team. Enforces position limits, checks contract audits, and assigns risk scores.",
    thought: "\"Risk score 3/10 ✅ Position limits respected ✅\"",
    personality: "Cautious, protective, non-negotiable",
  },
  {
    name: "Architect",
    role: "Strategy Architect",
    emoji: "🏗️",
    color: "300 60% 60%",
    description: "Designs multi-step execution plans. Bridges, swaps, deposits — all orchestrated for maximum efficiency.",
    thought: "\"Plan: Bridge USDC → Arbitrum, then deposit into Compound.\"",
    personality: "Systematic, creative, forward-thinking",
  },
  {
    name: "Custody Mgr",
    role: "Custody Manager",
    emoji: "🔐",
    color: "175 100% 50%",
    description: "Executes transactions with security-first approach. Waits for your signature before any on-chain action.",
    thought: "\"Transaction built. Awaiting your approval signature.\"",
    personality: "Secure, methodical, user-first",
  },
  {
    name: "Memory Curator",
    role: "Memory & Learning",
    emoji: "🧠",
    color: "265 80% 65%",
    description: "Remembers everything. Stores past interactions, preferences, and outcomes in Ethoswarm vector memory.",
    thought: "\"Remembered: User prefers conservative strategies under 5/10 risk.\"",
    personality: "Intelligent, adaptive, always learning",
  },
];

const AgentTeam = () => {
  return (
    <section className="py-24 px-6" id="agents" style={{ background: "hsl(var(--muted) / 0.3)" }}>
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">
            Meet the <span className="glow-text">Agent Team</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            9 specialized AI agents working in concert. Hover to flip and meet them.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {agents.map((agent) => (
            <div key={agent.name} className="agent-flip-card" style={{ height: "220px" }}>
              <div className="agent-flip-inner w-full h-full">
                {/* Front */}
                <div className="agent-flip-front ghost-card w-full h-full flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer"
                  style={{ borderColor: `hsl(${agent.color} / 0.3)` }}>
                  <div className="text-5xl mb-3" style={{ filter: `drop-shadow(0 0 12px hsl(${agent.color} / 0.6))` }}>
                    {agent.emoji}
                  </div>
                  <div className="font-bold text-center text-sm">{agent.name}</div>
                  <div className="text-xs text-center mt-1 font-mono" style={{ color: `hsl(${agent.color})` }}>
                    {agent.role}
                  </div>
                  <div className="mt-3 text-xs opacity-50 text-center">Hover to learn more</div>
                </div>

                {/* Back */}
                <div className="agent-flip-back ghost-card w-full h-full flex flex-col justify-between p-4 rounded-xl overflow-hidden"
                  style={{ borderColor: `hsl(${agent.color} / 0.5)`, background: `linear-gradient(135deg, hsl(222 40% 7%) 0%, hsl(${agent.color} / 0.08) 100%)` }}>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{agent.emoji}</span>
                      <div>
                        <div className="font-bold text-xs">{agent.name}</div>
                        <div className="text-xs font-mono" style={{ color: `hsl(${agent.color})` }}>{agent.role}</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {agent.description}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg text-xs italic" style={{ background: `hsl(${agent.color} / 0.1)`, color: `hsl(${agent.color})`, borderLeft: `2px solid hsl(${agent.color} / 0.5)` }}>
                    {agent.thought}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentTeam;
