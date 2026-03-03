import GhostNav from "@/components/GhostNav";
import GhostFooter from "@/components/GhostFooter";
import InteractiveDemo from "@/components/InteractiveDemo";

const stats = [
  { label: "Active Agents", value: "9", icon: "🤖", delta: "+0" },
  { label: "Protocols Monitored", value: "12", icon: "🔭", delta: "Aave · Compound · Morpho" },
  { label: "Best APY Found", value: "12.5%", icon: "📈", delta: "Compound Arbitrum" },
  { label: "Risk Score", value: "3/10", icon: "🛡️", delta: "Low risk" },
];

const agentRows = [
  { icon: "👻", name: "Supervisor", id: "supervisor_001", status: "active", last: "Coordinating team" },
  { icon: "🐂", name: "Bull Analyst", id: "market_analyst_bull", status: "active", last: "Compound rate rising 📈" },
  { icon: "🐻", name: "Bear Analyst", id: "market_analyst_bear", status: "idle", last: "Monitoring utilisation" },
  { icon: "🔭", name: "Scout", id: "opportunity_scout", status: "active", last: "Scanning Base + Arbitrum" },
  { icon: "⛽", name: "Gas Analyst", id: "gas_analyst", status: "idle", last: "Gas: 0.12 gwei" },
  { icon: "🛡️", name: "Risk Governor", id: "risk_governor", status: "active", last: "Position limits OK ✅" },
  { icon: "🏗️", name: "Strategist", id: "strategy_architect", status: "idle", last: "Awaiting approval" },
  { icon: "🔐", name: "Custody Mgr", id: "custody_manager", status: "idle", last: "Ready to sign" },
  { icon: "🧠", name: "Memory", id: "memory_curator", status: "idle", last: "Recalled 3 past trades" },
];

const StatusDot = ({ status }: { status: string }) => (
  <span
    className="inline-block w-2 h-2 rounded-full"
    style={{ background: status === "active" ? "hsl(145 70% 50%)" : "hsl(var(--muted-foreground))" }}
  />
);

const Dashboard = () => (
  <div className="min-h-screen bg-background">
    <GhostNav />
    <div className="pt-24 pb-16 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold glow-text mb-1">Dashboard</h1>
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Real-time overview of your Ghost agent team</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className="ghost-card rounded-xl p-5"
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold mb-1" style={{ color: "hsl(var(--ghost-cyan))" }}>{s.value}</div>
              <div className="text-sm font-medium mb-1">{s.label}</div>
              <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Agent Status Table */}
        <div className="ghost-card rounded-2xl overflow-hidden mb-10">
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--ghost-border))" }}>
            <h2 className="font-bold text-lg">Agent Team Status</h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(var(--ghost-cyan) / 0.15)", color: "hsl(var(--ghost-cyan))" }}>
              Live
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "hsl(var(--ghost-border))" }}>
            {agentRows.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-3 hover:bg-secondary/30 transition-colors">
                <span className="text-xl w-8">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs font-mono truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{a.id}</div>
                </div>
                <div className="hidden sm:block flex-1 text-sm truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{a.last}</div>
                <div className="flex items-center gap-2 text-xs">
                  <StatusDot status={a.status} />
                  <span className="capitalize" style={{ color: a.status === "active" ? "hsl(145 70% 50%)" : "hsl(var(--muted-foreground))" }}>{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo embedded */}
        <InteractiveDemo />
      </div>
    </div>
    <GhostFooter />
  </div>
);

export default Dashboard;
