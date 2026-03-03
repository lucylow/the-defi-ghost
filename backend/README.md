# DeFi Ghost Backend

Multi-agent backend for DeFi Ghost: yield discovery, risk assessment, and execution with OpenClaw-style orchestration and Ethoswarm-style memory.

## Architecture

- **Supervisor**: Routes user messages, coordinates Research/Risk/Execution teams.
- **Research**: Market Analysts (bull/bear), Opportunity Scout, Gas Analyst.
- **Risk**: Risk Governor validates opportunities against user profile.
- **Execution**: Strategy Architect → Transaction Builder → Gas Analyst → Custody Manager.

Memory and identity use local stubs compatible with Ethoswarm (Animoca Minds); swap in real SDK when available. For which **AI models** power each agent (GPT-4/Venice.ai, XGBoost, BERT, RAG), see **[AI_MODELS.md](AI_MODELS.md)**.

## Setup

1. **Python 3.10+**

2. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Environment**
   ```bash
   cp .env.example .env
   # Edit .env: OPENAI_API_KEY (or VENICE), optional REDIS_URL, OPENCLAW_*, ETHOSWARM_*
   ```

4. **Redis** (optional for activity log / working memory)
   ```bash
   redis-server
   ```

## Run

- **List agent definitions**
  ```bash
  python deploy.py
  ```

- **Run all agents in one process** (in-process message bus)
  ```bash
  python run_agents.py
  ```

- **Send a test user message** (with agents running, or single supervisor run)
  ```bash
  python test_client.py "Find best yield for 5000 USDC"
  ```

## OpenClaw Gateway (alternative)

To run DeFi Ghost with the **OpenClaw Gateway** (Telegram, sessions, agent-to-agent tools like `sessions_send`), use the config and session definitions in the repo’s **openclaw/** folder. See **[../openclaw/README.md](../openclaw/README.md)** for:

- Installing OpenClaw and starting the gateway
- Configuring Telegram (with pairing for security) and models
- Setting up the DeFi Ghost agents (supervisor, scout, analysts, risk, executor) and the **fetch-defi-apy** skill
- End-to-end flow and security (Tailscale, tool permissions)

You can use the gateway as the only front-end (LLM-only agents) or combine it with this Python backend (e.g. executor calling the backend for strategy/execution).

## Project layout

```
backend/
  config.py              # Settings (env)
  base_agent.py           # Base agent + LLM/memory/mailbox
  openclaw_agent_context.py  # Mailbox/Message/Channel (in-process)
  ethoswarm_sdk/          # Stub for Ethoswarm memory/identity
  agents/
    supervisor.py
    market_analyst.py
    opportunity_scout.py
    gas_analyst.py
    risk_governor.py
    strategy_architect.py
    transaction_builder.py
    custody_manager.py
    memory_curator.py
  deploy.py
  run_agents.py
  test_client.py
  .env.example
```

## Message flow (yield query)

1. User → Supervisor: "Find best yield for 5k USDC"
2. Supervisor → Broadcast: `analyze_yield` (task_id, user_id, amount, asset)
3. Opportunity Scout → Supervisor: `opportunities_found`
4. Supervisor → Risk Governor: `validate_opportunities`
5. Risk Governor → Supervisor: `risk_assessment` (approved list + scores)
6. Supervisor → User: formatted opportunity; "Approve?"
7. User → Supervisor: "Approve"
8. Supervisor → Strategy Architect: `execute_opportunity`
9. Strategy Architect → Transaction Builder: `build_transactions`
10. Transaction Builder → Gas Analyst: `optimize_gas`
11. Gas Analyst → Custody Manager: `execute_txs`
12. Custody Manager → Supervisor: `execution_result`
13. Supervisor → User: "Done! Tx: ..."
