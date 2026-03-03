# DeFi Ghost Specialized AI Agents

Multi-agent system for **DeFi Ghost** using:

- **OpenClaw** – agent teams, mailbox messaging, orchestration
- **Ethoswarm (Animoca Minds)** – persistent vector memory and identity

For which **AI models** power each agent (GPT-4/Venice.ai, XGBoost, BERT, Ethoswarm embeddings, etc.), see **[AI_MODELS.md](../AI_MODELS.md)** in the backend root.

## Layout

| Agent | Role |
|-------|------|
| **Supervisor** | User-facing; parses commands, spawns tasks, coordinates team |
| **Market Analyst (Bull/Bear)** | Market view with bias; sends `market_analysis` |
| **Opportunity Scout** | Scans protocols/chains for APY; sends `opportunities_found` |
| **Gas & MEV Analyst** | Gas and MEV risk per chain; sends `gas_analysis` |
| **Risk Governor** | Validates opportunities vs user profile; sends `risk_validation` |
| **Position Limiter** | Position limits; can veto |
| **Strategy Architect** | Builds steps (bridge + deposit); sends `build_tx` to Transaction Builder |
| **Transaction Builder** | Builds calldata; sends `optimize_gas` to Gas Optimizer |
| **Gas Optimizer** | Gas/timing; sends `execute_txs` to Custody Manager |
| **Custody Manager** | Signs and sends txs; sends `execution_result` to Supervisor |
| **Memory Curator** | Central store/recall for Ethoswarm |
| **Governance Arbiter** | Resolves conflicts (e.g. Bull vs Bear) |

## Flow (high level)

1. User message → **Supervisor** (`on_user_message`).
2. Yield request → Supervisor broadcasts `analyze_yield` → Research (Market Analyst, Scout, Gas) respond.
3. Scout sends `opportunities_found` → Supervisor stores and broadcasts `validate_opportunity` → **Risk Governor**.
4. Risk Governor sends `risk_validation` → Supervisor formats and asks user to approve.
5. User approval → Supervisor broadcasts `execute_strategy` → **Strategy Architect** → **Transaction Builder** → **Gas Optimizer** → **Custody Manager** → Supervisor gets `execution_result`.

## Run

From repo root, with `.env` in `backend/`:

```bash
cd backend
pip install -r requirements.txt
python deploy_team.py
```

Or run the supervisor only (for local testing without OpenClaw):

```bash
cd backend
python -m agents.supervisor_agent
```

## Env (see `backend/.env.example`)

- `OPENCLAW_API_KEY`, `OPENCLAW_TEAM_ID`
- `ETHOSWARM_API_KEY`, `ETHOSWARM_MEMORY_STORE_ID`
- `ETH_RPC_URL`, `ARBITRUM_RPC_URL`, `BASE_RPC_URL` (for execution)
