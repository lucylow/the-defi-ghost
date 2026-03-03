# Identity for the AI Agents: The Soul of DeFi Ghost

In the DeFi Ghost ecosystem, **identity** is not merely a label—it is the foundational layer that enables persistent memory, personalized behavior, trust, and accountability. Each agent is a unique "Mind" within the **Animoca Minds** framework, powered by **Ethoswarm**. This identity gives every agent a consistent persona, a history of interactions, and the ability to learn and adapt over time.

## 1. What Constitutes an Agent's Identity?

| Component | Description |
|-----------|-------------|
| **Unique ID** | A globally unique identifier (UUID) assigned at spawn time. |
| **Role** | The agent's function (e.g., "Market Analyst Bull", "Risk Governor"). |
| **Persona** | A natural language description of the agent's personality, biases, and communication style. |
| **Memory Store** | A dedicated vector namespace within Ethoswarm where the agent stores its long-term memories. |
| **Cryptographic Key** | (Optional) A keypair for signing messages or transactions, linking on-chain actions to the agent. |
| **Reputation Score** | A metric derived from past performance (e.g., accuracy of predictions, successful trades). |
| **User Context** | For agents that serve specific users, the identity includes references to the user's profile and preferences. |

All these components are managed by **Ethoswarm** and exposed to agents via the `ethoswarm_sdk`.

## 2. Creating an Agent Identity: The Spawn Process

When an agent is spawned via OpenClaw, it registers itself with Ethoswarm to obtain or restore its identity. The process uses `IdentityClient` with `agent_id` and `role`; either `load_persona()` (restore) or `create_persona(role, personality_traits, system_prompt)` (new). Each agent gets its own vector store namespace: `agent_{agent_id}_memories`.

## 3. How Identity Enables Persistent Memory

Each agent's identity is linked to its **memory namespace**. When storing a memory, the key is prefixed with the agent's namespace and metadata includes `agent_id`, `role`, and `timestamp`. Recall can be scoped to the agent's own namespace or, with permission, `include_other_agents` for cross-agent search via `search_cross_agent`.

## 4. Personalization: Identity Meets User Context

The Supervisor injects **user context** by broadcasting `set_user_context` with `user_id` and `profile` before specialist tasks. Specialist agents implement `on_set_user_context` to set `current_user_id`, `user_profile`, and optionally load user-specific memories. When generating responses (e.g. market analysis), the agent blends its **persona** with the user's risk tolerance, preferred/blacklisted protocols, and recalled user memories.

## 5. Trust and Accountability through Identity

Every decision, message, and transaction is logged with the agent's ID. The **Memory Curator** (or base layer) supports `log_agent_action(agent_id, action_type, details)` for audit trails and `update_reputation(agent_id, outcome)` so that reputation scores can be derived from past performance and exposed to users.

## 6. On-Chain Identity: Bridging AI and Web3

Agents can have **cryptographic identities** (e.g. a smart contract wallet per agent–user pair) for signing messages, executing delegated transactions, and on-chain attestation. The Custody Manager can initialize an on-chain identity (e.g. Safe) for a user–agent pair so that actions are attributable on-chain.

## 7. Agent Identity in the OpenClaw Orchestration Layer

OpenClaw message headers include `sender_id`, `sender_role`, `sender_persona`, and `timestamp` so that recipients know who sent each message and can prioritize (e.g. Risk Governor) or tailor responses accordingly.

## 8. Example: Full Lifecycle of an Agent's Identity

1. **Spawn**: OpenClaw spawns with `role` and optional `bias`/persona.
2. **Initialization**: Ethoswarm identity client; create or load persona; set `memory_namespace`.
3. **Memory loading**: Load previous memories from the agent's namespace.
4. **User assignment**: Supervisor sends `set_user_context`; agent loads user-related memories.
5. **Task execution**: Agent uses persona + user context to generate analyses or decisions.
6. **Memory storage**: Store results in the agent's namespace with task/user metadata.
7. **Reputation update**: After outcomes are known, system calls `update_reputation`.
8. **Shutdown**: Identity and memories persist in Ethoswarm for the next spawn.

## 9. Benefits of Strong Agent Identity

- **Continuity**: Agents remember past interactions and improve over time.
- **Personalization**: Each user gets a customized experience.
- **Trust**: Users can audit agent actions and see which agent made which decision.
- **Collaboration**: Agents understand each other's roles and biases.
- **Compliance**: Full history of an agent's decisions can be requested.
- **Monetization**: Successful agents could be published with reputation as a market signal.

## 10. Technical Implementation: Ethoswarm Identity Schema

Ethoswarm represents an agent's identity with a schema (simplified) including: `agent_id`, `role`, `persona` (name, traits, system_prompt, few_shot_examples), `memory_namespace`, optional `public_key`, `reputation` (overall, accuracy, timeliness), `created_at`, `last_active`. This is stored in Ethoswarm's vector database and can be queried by agents or the OpenClaw orchestrator.

## 11. Implementation References

| Concern | Location |
|---------|----------|
| Base agent identity & memory namespace | `backend/base_agent.py` |
| Persona create/load | `backend/ethoswarm_sdk/identity.py` |
| Memory store & cross-agent search | `backend/ethoswarm_sdk/memory.py` |
| User context broadcast | `backend/agents/supervisor.py` |
| set_user_context handler & personalized analysis | `backend/agents/market_analyst.py` |
| Audit & reputation | `backend/agents/memory_curator.py` |
| On-chain identity (Custody) | `backend/agents/custody_manager.py` |
| Message header (sender identity) | `backend/openclaw_agent_context.py` |
