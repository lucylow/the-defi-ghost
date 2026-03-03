# Routing Orchestration in DeFi Ghost: How Agents Communicate and Coordinate

The DeFi Ghost multi-agent system relies on a robust **routing and orchestration layer** built on **OpenClaw Agent Teams**. This layer ensures that messages flow efficiently between specialized agents, tasks are decomposed and delegated correctly, and the system remains responsive and safe. Below, we detail the core components and mechanisms that power this orchestration.

## 1. OpenClaw Agent Teams as the Foundation

OpenClaw provides the infrastructure for creating, managing, and connecting agents. In DeFi Ghost, each agent is an instance within a shared **team**. The team context includes:

- **A shared mailbox system** for inter-agent messaging.
- **Agent lifecycle management** (spawning, heartbeats, restarts).
- **Channels** for external communication (Telegram, dashboard).
- **Tool execution** for blockchain interactions.

When the system starts, the `deploy_team.py` script spawns all agents, registering them with OpenClaw. Each agent receives a unique `agent_id` and belongs to the same `team_id`. This allows them to discover each other and communicate securely.

For local/in-process runs, `deploy.py` uses the same mailbox interface via `openclaw_agent_context.py`, so the same message patterns apply whether agents run in one process or as separate OpenClaw instances.

## 2. Message Routing: Mailbox and Direct Addressing

All communication between agents is handled via **asynchronous message passing** through OpenClaw's mailbox. Messages are structured with a defined schema (see `Message` in `openclaw_agent_context.py`):

```json
{
  "type": "analyze_yield",
  "sender": "supervisor_001",
  "recipient": "market_analyst_bull_001",
  "payload": { "task_id": "...", "user_id": "...", ... }
}
```

### Two primary routing modes

- **Broadcast**: The Supervisor sends a message via `broadcast(message_type, payload)` to all agents in the team (optionally excluding some). This is used for parallel tasks like yield analysis, where multiple Research Team agents work simultaneously.
- **Direct**: Agents reply to a specific agent using `send_message(recipient_id, message_type, payload)`. For example, the Opportunity Scout sends its findings directly back to the Supervisor.

The in-process mailbox guarantees delivery to the recipient's queue. Agents listen for messages in a loop (`async for message in self.context.mailbox.listen()`), ensuring they process every task.

## 3. Hierarchical Orchestration: The Supervisor as Router

The **Supervisor Agent** (`supervisor.py`) acts as the central router and task decomposer. Its orchestration logic follows a **hierarchical workflow**:

1. **Intent Recognition**: Receives a user message via `on_user_message` (e.g., "find me the best yield").
2. **Task Decomposition**: Parses intent with `_parse_intent` and breaks it into subtasks: yield query → market analysis, risk assessment, execution planning.
3. **Routing**: Broadcasts appropriate messages to the relevant agent teams (e.g., `analyze_yield` to Research Team).
4. **Result Aggregation**: Handles responses via typed handlers (`on_opportunities_found`, `on_risk_assessment`, `on_execution_result`), collates data, and can involve the Governance Arbiter for conflicts.
5. **User Communication**: Synthesizes a final response and sends it back via `send_to_user`.

This hierarchical pattern ensures that the Supervisor maintains a global view of the task state, while specialist agents focus on their narrow domains.

## 4. Inter-Agent Communication Patterns

Agents communicate using a set of predefined **message types**, each handled by a method named `on_<message_type>` on the recipient. This event-driven architecture keeps the system modular.

### Example: Yield Analysis Flow

1. **Supervisor** broadcasts `analyze_yield` to the team (Research agents listen).
2. **Market Analyst (Bull)**, **Market Analyst (Bear)**, **Opportunity Scout**, and **Gas Analyst** each receive the message and process it in parallel.
3. Each sends a direct response to the Supervisor: `market_analysis`, `opportunities_found`, `gas_analysis`.
4. **Supervisor** correlates responses by `task_id` and, when ready, sends `validate_opportunities` to the **Risk Governor**.
5. **Risk Governor** may internally coordinate with sub-agents (e.g., Position Limiter, oracle checks) and replies with `risk_assessment` (approved list and risk scores).
6. **Supervisor** picks the best opportunity, stores it in the task, and presents it to the user for approval.
7. On user approval, Supervisor sends `execute_opportunity` to the **Strategy Architect**, which triggers the execution pipeline (Transaction Builder → Gas Optimizer → Custody Manager).
8. **Custody Manager** sends `execution_result` back to the Supervisor, which then notifies the user.

## 5. State Management and Task Tracking

To track complex, multi-step processes, the Supervisor maintains an in-memory dictionary of active tasks (`self.active_tasks`). Each task has a unique `task_id` (UUID), which is included in all related messages. This allows agents to correlate responses with the original request and supports multiple concurrent user sessions.

When a task spans multiple rounds (e.g., user approval), the Supervisor stores intermediate results in Ethoswarm memory (via the base agent's `store_memory` / `recall_memory`) and in working memory (Redis or in-memory fallback) so they can be retrieved when the user replies.

## 6. Fault Tolerance and Timeouts

In a real-world deployment, agents may fail or become slow. OpenClaw can provide health checks and automatic restarts. The Supervisor can implement **timeouts** per subtask: for example, after broadcasting `analyze_yield`, it can proceed with the responses received within a time window and log missing ones. The codebase is structured to support this pattern; adding explicit timeouts in the Supervisor's aggregation logic would further ensure responsiveness under partial failures.

## 7. Integration with Ethoswarm for Memory Routing

The **Memory Curator** agent can act as a dedicated router for memory operations. Any agent needing to store or retrieve memories can send a direct message to the Memory Curator with `store_memory` or `recall_memory` type. The Memory Curator handles the vector database operations and returns results. In the current codebase, agents also use the base class Ethoswarm client directly; centralizing through the Memory Curator is an option for a single point of memory policy and caching.

## 8. Security and Permissions in Routing

Agents have different levels of privilege (e.g., the Custody Manager signs and sends transactions; others cannot). The routing layer ensures that only authorized agents receive sensitive commands. For example, the Supervisor requests execution, but only the Custody Manager actually signs and sends the transaction after receiving a properly formatted `execute_txs` message from the Gas Optimizer. Role-based access can be enforced at the tool-execution layer when using OpenClaw in production.

## 9. Visualizing the Orchestration

Sequence diagram for a typical yield analysis and execution flow:

```
User -> Supervisor: "Find best yield for 5k USDC"
Supervisor -> Research Team (broadcast): analyze_yield
Research Team (parallel) --> Supervisor: market_analysis, opportunities_found, gas_analysis
Supervisor -> Risk Governor: validate_opportunities
Risk Governor -> PositionLimiter: (internal) check_limits
PositionLimiter --> Risk Governor: ok
Risk Governor -> OracleValidator: (internal) check_prices
OracleValidator --> Risk Governor: prices fresh
Risk Governor --> Supervisor: risk_assessment (approved)
Supervisor -> User: "Top opportunity: 12% on Compound (Base). Approve?"
User -> Supervisor: "Approve"
Supervisor -> StrategyArchitect: execute_opportunity
StrategyArchitect -> TransactionBuilder: build_tx
TransactionBuilder -> GasOptimizer: optimize_gas
GasOptimizer -> CustodyManager: execute_txs
CustodyManager -> Blockchain: send transaction
CustodyManager --> Supervisor: execution_result
Supervisor -> User: "Done! Tx: 0xabc..."
```

## 10. Agent IDs and Deployment

- **In-process (`deploy.py`)**: All agents use a consistent `_001` suffix (e.g., `supervisor_001`, `risk_governor_001`, `custody_manager_001`). Message recipients in the code match these IDs.
- **OpenClaw (`deploy_team.py`)**: Spawned agent IDs currently mix styles (e.g., `supervisor_001` vs `risk_governor`). For messages to be delivered correctly in OpenClaw mode, spawned `agent_id`s should match the recipient IDs used in `send_message` (e.g., `risk_governor_001`, `custody_manager_001`).

## 11. Conclusion

The routing orchestration in DeFi Ghost leverages **OpenClaw-style mailbox semantics** (in-process or remote) for reliable, asynchronous messaging and a **hierarchical Supervisor pattern** for task decomposition and coordination. By combining broadcast for parallel work and direct messaging for targeted responses, the system achieves both efficiency and clarity. This design allows the multi-agent team to function as a cohesive unit, safely managing user intents and delivering intelligent DeFi strategies.
