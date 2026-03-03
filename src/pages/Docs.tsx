import { useState } from "react";
import GhostNav from "@/components/GhostNav";
import GhostFooter from "@/components/GhostFooter";

const sections = [
  {
    id: "overview",
    title: "Overview",
    icon: "👻",
    content: `## What is DeFi Ghost?

DeFi Ghost is an autonomous, multi-agent yield coordinator. A team of 9 specialised AI agents works 24/7 to monitor DeFi markets, analyse opportunities, assess risk, and prepare transactions — while you retain final approval over every move.

### Key principles

- **Human-in-the-loop**: Every transaction requires your explicit approval before execution.
- **Multi-agent debate**: Bull and Bear analysts debate every opportunity before it reaches you.
- **Persistent memory**: The system remembers your preferences and past outcomes via Ethoswarm.
- **Chain-agnostic**: Supports Ethereum, Arbitrum, and Base with more chains planned.`,
  },
  {
    id: "architecture",
    title: "Architecture",
    icon: "🏗️",
    content: `## System Architecture

\`\`\`
User  ──►  Supervisor (Ghost)
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
  Scout    Bull/Bear   Gas
  (APY)   (Debate)  (Cost)
    │         │         │
    └────►  Risk  ◄─────┘
           Governor
              │
         Strategist
              │
        Custody Mgr  ◄──  User Approval
              │
         On-chain TX
\`\`\`

### Agent communication

Agents communicate via the **OpenClaw message bus** — an async queue-based system. Each agent has its own mailbox and processes messages independently, enabling true parallel reasoning.

### Memory layer

**Ethoswarm** provides vector-based persistent memory. The Memory Curator embeds every significant event and retrieves relevant context for future decisions.`,
  },
  {
    id: "quickstart",
    title: "Quick Start",
    icon: "🚀",
    content: `## Running Locally

### 1. Clone and install

\`\`\`bash
git clone https://github.com/your-org/defi-ghost
cd defi-ghost/backend
pip install -r requirements.txt
\`\`\`

### 2. Configure environment

\`\`\`bash
cp .env.example .env
# Edit .env with your keys:
# OPENAI_API_KEY, OPENCLAW_API_KEY, ETHOSWARM_API_KEY
\`\`\`

### 3. Start the backend

\`\`\`bash
uvicorn api.server:app --reload --host 0.0.0.0 --port 8000
\`\`\`

### 4. Start the frontend

\`\`\`bash
cd ..
npm install && npm run dev
\`\`\`

Visit \`http://localhost:8080\` — the demo will connect to your local backend automatically.`,
  },
  {
    id: "api",
    title: "API Reference",
    icon: "🔌",
    content: `## REST API

All endpoints are served by the FastAPI backend on port 8000.

### POST /api/chat

Send a user message to the Supervisor.

\`\`\`json
{
  "text": "Find me the best yield for 5000 USDC",
  "user_id": "optional-session-id"
}
\`\`\`

**Response:**
\`\`\`json
{
  "session_id": "uuid",
  "accepted": true
}
\`\`\`

### GET /api/session/{user_id}/messages

Poll for agent replies after sending a message.

### GET /api/activity

Recent agent activity for the live feed.

### GET /api/memory

Recent memory items from the Supervisor's Ethoswarm store.

### GET /health

Liveness check — returns \`{ "status": "ok" }\`.`,
  },
  {
    id: "agents-ref",
    title: "Agent Reference",
    icon: "🤖",
    content: `## Agent Configuration

Each agent is defined in \`backend/deploy.py\` with an \`agent_id\`, \`role\`, \`persona\`, and optional kwargs.

### Supervisor

- **ID**: \`supervisor_001\`
- **File**: \`agents/supervisor.py\`
- Receives all user messages, routes to sub-agents, synthesises output.

### Market Analysts (Bull & Bear)

- **IDs**: \`market_analyst_bull\`, \`market_analyst_bear\`
- **File**: \`agents/market_analyst.py\`
- Instantiated with \`bias="bull"\` or \`bias="bear"\`.

### Opportunity Scout

- **ID**: \`opportunity_scout\`
- Uses the \`fetch-defi-apy\` skill to poll on-chain APY data.

### Gas Analyst

- Reads gas oracles on Ethereum, Arbitrum, and Base RPCs.

### Risk Governor

- Enforces hard limits from user profile and vetoes strategies above the configured risk threshold.

### Strategy Architect → Transaction Builder → Gas Optimizer → Custody Manager

- Sequential execution pipeline that activates only after Risk Governor approval and user consent.

### Memory Curator

- Listens to all agent outputs and stores relevant embeddings in Ethoswarm.`,
  },
  {
    id: "tech-stack",
    title: "Tech Stack",
    icon: "⚙️",
    content: `## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| Tailwind CSS | Styling |
| TanStack Query | Data fetching & polling |
| Lovable AI | Real AI chat via edge function |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API server |
| OpenClaw SDK | Agent orchestration & messaging |
| Ethoswarm SDK | Persistent vector memory |
| OpenAI / Venice.ai | LLM reasoning |
| Web3.py | On-chain interactions |
| Redis | Short-term agent state |

### Infrastructure
| Technology | Purpose |
|---|---|
| Supabase / Lovable Cloud | Database, auth, edge functions |
| Arbitrum | Primary chain (low gas) |
| Base | Secondary chain |
| Ethereum | Mainnet settlement |`,
  },
];

const Docs = () => {
  const [active, setActive] = useState("overview");
  const current = sections.find((s) => s.id === active)!;

  const renderContent = (md: string) =>
    md.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-5 mb-2" style={{ color: "hsl(var(--ghost-cyan))" }}>{line.slice(4)}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="ml-4 mb-1 text-sm list-disc" style={{ color: "hsl(var(--muted-foreground))" }}>{line.slice(2)}</li>;
      if (line.startsWith("```")) return <div key={i} className={`${line === "```" ? "rounded-b-lg mb-4" : "font-mono text-xs rounded-t-lg mt-4 px-4 pt-3"}`} style={line === "```" ? {} : { background: "hsl(var(--secondary))" }}></div>;
      if (line.startsWith("|")) {
        const cells = line.split("|").filter(Boolean).map(c => c.trim());
        const isHeader = line.includes("---");
        if (isHeader) return null;
        return (
          <div key={i} className="grid grid-cols-2 gap-2 border-b py-2 text-sm" style={{ borderColor: "hsl(var(--ghost-border))" }}>
            {cells.map((c, j) => <span key={j} className={j === 0 ? "font-mono font-medium" : ""} style={j === 1 ? { color: "hsl(var(--muted-foreground))" } : {}}>{c}</span>)}
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-sm leading-relaxed mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
          {line.replace(/\*\*(.*?)\*\*/g, "**$1**").split(/(\*\*.*?\*\*)/).map((part, j) =>
            part.startsWith("**") ? <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong> : part
          )}
        </p>
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <GhostNav />
      <div className="pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10">
            <h1 className="text-4xl font-bold mb-2"><span className="glow-text">Documentation</span></h1>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>Everything you need to understand and run DeFi Ghost.</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="ghost-card rounded-xl overflow-hidden sticky top-24">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
                    style={{
                      background: active === s.id ? "hsl(var(--ghost-cyan) / 0.1)" : "transparent",
                      color: active === s.id ? "hsl(var(--ghost-cyan))" : "hsl(var(--muted-foreground))",
                      borderLeft: active === s.id ? "2px solid hsl(var(--ghost-cyan))" : "2px solid transparent",
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 ghost-card rounded-2xl p-8 min-h-[500px]">
              <div className="prose prose-invert max-w-none">
                {renderContent(current.content)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <GhostFooter />
    </div>
  );
};

export default Docs;
