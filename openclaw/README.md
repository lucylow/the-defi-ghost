# OpenClaw Gateway Integration for DeFi Ghost

This folder contains everything needed to run **DeFi Ghost** with [OpenClaw](https://docs.openclaw.ai/) as the **gateway and control plane**: Telegram (or other channels), session management, built-in agent-to-agent tools (`sessions_send`, `sessions_list`, `sessions_history`), and the custom **fetch-defi-apy** skill.

OpenClaw handles all channel I/O and inter-agent messaging so you can focus on agent logic and DeFi intelligence.

---

## 1. Install OpenClaw and start the gateway

```bash
# Install OpenClaw globally
npm install -g openclaw@latest

# Run the onboarding wizard (auth, gateway as background service, channel setup)
openclaw onboard --install-daemon

# Confirm the gateway is running
openclaw gateway status

# Optional: open the Control UI in the browser
openclaw dashboard
# Usually at http://127.0.0.1:18789/
```

After onboarding you’ll have a running gateway (default: `ws://127.0.0.1:18789`).

---

## 2. Configure channels and models

Copy the example config and add your secrets:

```bash
# Copy to OpenClaw’s config location (path shown after onboarding)
cp openclaw/config.example.json5 ~/.openclaw/openclaw.json

# Edit and set:
# - channels.telegram.botToken (or use TELEGRAM_BOT_TOKEN in env)
# - Ensure models are set (agents.defaults.model.primary, e.g. openai/gpt-4-turbo-preview)
# - Add OPENAI_API_KEY (or other provider keys) in ~/.openclaw/.env or env
```

**Important:** Use `dmPolicy: "pairing"` for Telegram so unknown users cannot message the bot until you approve them:

```bash
openclaw pairing approve telegram <code>
```

Optional: allow specific users without pairing by adding them to `channels.telegram.allowFrom` (e.g. `["tg:123456789"]`).

---

## 3. Agent sessions (system prompts)

OpenClaw creates sessions per channel/peer. Each **agent** in `agents.list` has its own workspace and (optionally) system prompt.

- **defighost-supervisor** (default): receives user messages from Telegram; orchestrates the flow.
- **defighost-scout**, **defighost-analyst-bull**, **defighost-analyst-bear**, **defighost-risk**, **defighost-executor**: backend agents with no direct channel access; they are invoked only via `sessions_send` from the supervisor.

Copy the system prompts from `sessions/` into each agent’s workspace or set them via the Control UI:

| Agent ID                 | System prompt file                    |
|--------------------------|----------------------------------------|
| defighost-supervisor     | `sessions/defighost-supervisor.md`    |
| defighost-scout          | `sessions/defighost-scout.md`         |
| defighost-analyst-bull   | `sessions/defighost-analyst-bull.md`  |
| defighost-analyst-bear   | `sessions/defighost-analyst-bear.md`  |
| defighost-risk           | `sessions/defighost-risk.md`          |
| defighost-executor        | `sessions/defighost-executor.md`      |

In OpenClaw, system prompt content often lives in the workspace (e.g. `SOUL.md` or bootstrap files). Create each agent’s workspace and paste the matching markdown there, or use the Config tab in the Control UI if your version supports per-agent system prompts.

---

## 4. Custom skill: fetch-defi-apy

The **defighost-scout** agent needs current APY (and TVL) for protocols/chains. The custom skill `fetch-defi-apy` does that.

**Install the skill** so the gateway (and scout agent) can use it:

```bash
# Copy the skill into OpenClaw’s managed skills (shared by all agents)
mkdir -p ~/.openclaw/skills
cp -r openclaw/skills/fetch-defi-apy ~/.openclaw/skills/

# Or install into the scout agent’s workspace (per-agent)
mkdir -p ~/.openclaw/workspace-defighost-scout/skills
cp -r openclaw/skills/fetch-defi-apy ~/.openclaw/workspace-defighost-scout/skills/
```

The scout agent must be allowed to run the skill. In `config.example.json5`, **defighost-scout** has `tools.allow: ["fetch-defi-apy", "group:sessions"]`. If your OpenClaw build exposes skills as tools by name, this is enough. Otherwise, allow `exec` for the scout and ensure the agent runs:

```bash
echo '{"protocol":"compound","chain":"arbitrum","asset":"USDC"}' | node /path/to/fetch-apy.mjs
```

The script reads JSON from stdin and prints `{ apy, tvl, protocol, chain, asset }`. It uses mock data by default; for production, point it at DefiLlama Pro or your backend’s APY API.

---

## 5. End-to-end flow (conceptual)

1. **User** (Telegram): “DeFi Ghost, check Arbitrum yields for USDC.”
2. **Gateway** routes the message to the **defighost-supervisor** session.
3. **Supervisor** (with `sessions_send`) asks **defighost-scout**: “Analyze USDC yields on Arbitrum.”
4. **Scout** uses the **fetch-defi-apy** skill (or exec) for each protocol (e.g. aave, compound, morpho) and replies with top opportunities.
5. **Supervisor** sends the same opportunity set to **defighost-analyst-bull** and **defighost-analyst-bear**, then to **defighost-risk**.
6. **Supervisor** synthesizes results and sends the user a formatted opportunity (APY, risk score, next steps) and asks for approval.
7. On **user approval**, the supervisor uses **sessions_send** to trigger **defighost-executor** to run (or simulate) the execution plan.

---

## 6. Security and remote access

- **DM pairing:** Keep `dmPolicy: "pairing"` for Telegram so only approved users can talk to the bot.
- **Local gateway:** Default `gateway.bind: "loopback"` keeps the gateway on localhost only.
- **Tailscale (optional):** To run the gateway on a server but manage it from your machine:
  - In config: `gateway: { bind: "loopback", tailscale: { mode: "serve" } }` so only your tailnet can reach it.
- **Tool permissions:** Tools run with the gateway process’s permissions; validate all inputs and keep secrets in env or SecretRef, not in prompts.

---

## 7. Relation to the Python backend

DeFi Ghost’s **Python backend** (`backend/`) implements the same roles (Supervisor, Scout, Risk Governor, etc.) with an in-process message bus and optional **OpenClaw SDK** (`deploy_team.py`) for spawning agents remotely. You can:

- **Option A – Gateway-only:** Use only the OpenClaw gateway and the session prompts/skills in this folder (LLM-only agents, no Python).
- **Option B – Hybrid:** Use the gateway for channels and the supervisor, and have the **defighost-executor** (or a dedicated tool) call your Python backend (e.g. HTTP or queue) for strategy building, transaction building, and custody.

The session prompts in `sessions/` are aligned with the Python agents’ behavior so you can switch or combine either side as needed.
