# Memory and Cognition for AI Agents: The Brain of DeFi Ghost

Memory and cognition are the twin pillars that transform a simple script into an intelligent, adaptive agent. In the DeFi Ghost ecosystem, each agent is endowed with a sophisticated memory architecture and cognitive capabilities, powered by **Animoca Minds (Ethoswarm)** and orchestrated by **OpenClaw**. This section details how agents remember, reason, learn, and make decisions, enabling them to act as true financial co-pilots.

## 1. Introduction: Why Memory and Cognition Matter

A stateless agent can only react to immediate inputs. It cannot learn from past successes or failures, personalize its behavior to a user, or reason about complex, multi-step strategies. DeFi Ghost agents, by contrast, possess:

- **Memory**: A persistent store of experiences, knowledge, and user preferences.
- **Cognition**: The ability to process information, reason, plan, and make decisions.

Together, they allow agents to improve over time, adapt to changing market conditions, and collaborate effectively within a multi-agent team. This aligns perfectly with the Animoca Minds vision of agents with "identity, memory, and cognition."

## 2. Memory Architecture

DeFi Ghost implements a **hybrid memory system** inspired by human memory models, comprising short-term (working) memory, long-term memory, and specialized memory types.

### 2.1 Short-Term (Working) Memory

Short-term memory holds information relevant to the current task or conversation. It is volatile and exists only within an agent's runtime context.

**Implementation**:
- Each agent maintains an in-memory dictionary (`self.context`) for task-specific data (e.g., current `task_id`, user ID, pending approval state).
- For conversation agents (like the Supervisor), a sliding window of recent messages is kept to maintain context.

```python
# In Supervisor Agent
class SupervisorAgent(DeFiGhostAgent):
    def __init__(self, config):
        super().__init__(config)
        self.conversation_history = []  # list of (user_id, message, timestamp)
        self.active_tasks = {}  # task_id -> task details

    async def add_to_history(self, user_id, message):
        self.conversation_history.append({
            "user": user_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        })
        # Keep only last 50 messages
        if len(self.conversation_history) > 50:
            self.conversation_history.pop(0)
```

### 2.2 Long-Term Memory (Persistent Storage)

Long-term memory is stored persistently in **Ethoswarm's vector database**, allowing agents to recall information across sessions. Each agent has its own namespace, but can also query shared memories.

**Memory Types**:

| Memory Type   | Description                              | Example                                                                 |
|---------------|------------------------------------------|-------------------------------------------------------------------------|
| **Episodic**  | Records of past events and experiences   | "On March 1, 2026, we executed a trade on Aave that resulted in +5% yield." |
| **Semantic**  | Factual knowledge about the world        | "Aave v3 on Arbitrum offers USDC lending at variable APY."             |
| **Procedural**| How to perform tasks                     | "To deposit on Compound, call the deposit() function with these parameters." |
| **User-specific** | Preferences, risk profile, past decisions | "User 0x123 prefers conservative strategies and avoids protocol X." |

**Storage**:
Memories are stored as embeddings with associated metadata. The `Memory Curator` agent handles all storage and retrieval requests.

```python
# Storing an episodic memory
await memory_curator.store_memory(
    key=f"episode_trade_{task_id}",
    value={
        "type": "trade_execution",
        "protocol": "aave",
        "chain": "arbitrum",
        "amount": 5000,
        "asset": "USDC",
        "apy": 12.5,
        "outcome": "success",
        "profit_loss": 12.34,
        "user_feedback": "positive"
    },
    metadata={
        "agent": "custody_manager",
        "user": user_id,
        "timestamp": "..."
    }
)
```

### 2.3 Memory Retrieval: RAG in Action

When an agent needs context, it performs a **similarity search** against the vector database, retrieving the most relevant memories. These are then injected into the agent's prompt as **Retrieval-Augmented Generation (RAG)**.

**Process**:
1. Agent formulates a query (e.g., "What happened last time we traded on Compound?")
2. Query is converted to an embedding using a sentence-transformer model (e.g., `all-MiniLM-L6-v2`).
3. Ethoswarm performs a vector similarity search across relevant namespaces.
4. Top-k results are returned.
5. Results are formatted and inserted into the LLM prompt.

```python
async def recall_relevant_memories(self, query: str, top_k: int = 5):
    # Generate embedding for query
    query_embedding = await self.embedding_model.embed(query)

    # Search in Ethoswarm
    results = await self.memory.search(
        namespace=self.memory_namespace,
        query_embedding=query_embedding,
        top_k=top_k
    )

    # Format for prompt
    memory_text = "\n".join([
        f"- [{r['metadata']['timestamp']}] {r['value']}"
        for r in results
    ])
    return memory_text
```

### 2.4 Memory Consolidation and Forgetting

To prevent memory overload, agents implement a **consolidation and forgetting** mechanism:
- Important memories (e.g., trades with high profit/loss, user feedback) are retained indefinitely.
- Less important memories are summarized periodically and then discarded.
- Memories older than a threshold (e.g., 1 year) are archived or compressed.

```python
async def consolidate_memories(self):
    # Retrieve all memories from last month
    recent = await self.memory.list_recent(days=30)
    # Summarize patterns
    summary = await self.llm.summarize(recent)
    # Store summary as a new memory
    await self.store_memory("monthly_summary_mar2026", summary)
    # Optionally delete old raw memories
    await self.memory.delete_older_than(days=30)
```

## 3. Cognitive Functions

Cognition encompasses the higher-level processes that enable agents to reason, plan, decide, and learn. DeFi Ghost agents leverage LLMs (GPT-4, Venice.ai) combined with specialized algorithms for these tasks.

### 3.1 Reasoning

Reasoning is the ability to draw inferences from available information. In DeFi Ghost, reasoning occurs at multiple levels:

- **Single-agent reasoning**: An agent uses its prompt and retrieved memories to analyze a situation (e.g., "Given current gas prices and historical APY trends, is this a good time to enter?").
- **Multi-agent reasoning**: Agents debate and challenge each other's conclusions (e.g., Bull vs. Bear market analysts). This is a form of **ensemble reasoning** that reduces bias.

**Example: Risk Governor Reasoning**:

```python
async def assess_risk(self, opportunity):
    # Retrieve relevant memories (past trades in similar conditions)
    similar_trades = await self.recall_memories(
        f"trades on {opportunity['protocol']} with APY > 10%"
    )

    # Check current conditions against each memory
    risks = []
    for trade in similar_trades:
        if trade['outcome'] == 'loss':
            # Analyze why loss occurred
            if trade['conditions']['gas_price'] > 100:
                risks.append("High gas prices historically led to losses on this protocol.")

    # Use LLM to synthesize risk assessment
    prompt = f"""
    You are the Risk Governor. Assess the risk of this opportunity:
    {opportunity}

    Historical context:
    {similar_trades}

    Provide a risk score (1-10) and rationale.
    """
    response = await self.llm.generate(prompt)
    return parse_risk_response(response)
```

### 3.2 Planning

Planning involves decomposing a high-level goal into a sequence of actions. The **Strategy Architect** agent is responsible for this.

**Planning Process**:
1. Receive a goal: "Deploy 5k USDC on the best yield opportunity."
2. Break down into subgoals: "Bridge to Arbitrum", "Deposit into Compound".
3. For each subgoal, determine required actions and dependencies.
4. Output a structured plan.

```python
async def create_plan(self, goal, context):
    # Use LLM with Chain-of-Thought prompting
    prompt = f"""
    Goal: {goal}
    Current context: {context}

    Create a step-by-step plan to achieve this goal. Each step must be:
    - Action (bridge, swap, deposit, etc.)
    - Protocol
    - Chain
    - Amount

    Output as JSON.
    """
    plan_json = await self.llm.generate_structured(prompt)
    return plan_json
```

### 3.3 Decision-Making

Decision-making is the process of choosing among alternatives. In DeFi Ghost, decisions are made by the **Supervisor** (with input from specialists) and often require user approval.

**Factors influencing decisions**:
- **Expected value**: APY, potential profit.
- **Risk**: Risk score from Risk Governor.
- **User preferences**: Stored in memory.
- **Historical outcomes**: Memories of similar past decisions.

```python
async def decide_best_opportunity(self, opportunities):
    # Retrieve user preferences
    profile = await self.get_user_profile(self.current_user_id)

    # Score each opportunity
    scored = []
    for opp in opportunities:
        score = opp['apy'] * (1 - opp['risk_score']/10)
        if opp['protocol'] in profile['preferred_protocols']:
            score *= 1.2  # boost for preferred protocols
        if opp['protocol'] in profile['blacklisted_protocols']:
            score = 0  # reject
        scored.append((score, opp))

    # Sort and return top
    scored.sort(reverse=True)
    return scored[0][1]
```

### 3.4 Learning

Learning is the ability to improve future performance based on past outcomes. DeFi Ghost agents learn in several ways:

- **Outcome-based learning**: When a trade completes, the outcome (profit/loss) is stored in memory and used to adjust future recommendations. For example, if a Market Analyst consistently overestimates yields, its reputation decreases, and its future analyses may be weighted less.
- **Feedback learning**: User feedback (explicit or implicit) is used to refine preferences and improve personalization.
- **Fine-tuning**: In the long term, agent-specific models (e.g., the Opportunity Scout's XGBoost) can be retrained on new data.

```python
async def learn_from_outcome(self, task_id, outcome):
    # Retrieve the opportunity and decision
    opp = await self.recall_memory(f"task_{task_id}_opportunity")
    decision = await self.recall_memory(f"task_{task_id}_decision")

    # Update agent reputations
    for agent_id in decision['contributing_agents']:
        await self.update_agent_reputation(agent_id, outcome)

    # If outcome was poor, store a warning memory
    if outcome['pnl'] < 0:
        warning = f"Loss on {opp['protocol']} due to {outcome['reason']}"
        await self.store_memory(f"warning_{task_id}", warning)
```

## 4. Integration with Identity

Memory and cognition are deeply intertwined with agent identity. Each agent's memories are stored under its unique identity, and its cognitive processes are shaped by its persona. This creates a **coherent, persistent self** that evolves over time.

- **Episodic memories** reinforce the agent's sense of history.
- **Semantic memories** constitute its knowledge base.
- **Procedural memories** define its skills.
- **User-specific memories** personalize its interactions.

When an agent is spawned, it loads its identity and memories, effectively "waking up" with the same personality and knowledge it had before. This continuity is critical for building trust with users.

## 5. Technical Implementation Details

### 5.1 Ethoswarm for Vector Storage

Ethoswarm provides a scalable vector database optimized for agent memories. Key features:

- **Namespaces**: Each agent gets a dedicated namespace.
- **Hybrid search**: Combines vector similarity with metadata filtering.
- **Time-based decay**: Memories can be automatically archived or deleted.
- **Cross-agent search**: Agents can query other agents' memories with proper permissions.

```python
# Example: Searching with metadata filter
results = await self.memory.search(
    namespace=self.memory_namespace,
    query="high yield opportunities",
    filter={"protocol": "aave", "apy": {"$gt": 10}},
    top_k=10
)
```

### 5.2 Embedding Generation

For RAG, we use a lightweight sentence-transformer model (`all-MiniLM-L6-v2`) that runs locally or via Ethoswarm's embedding service. This ensures low latency and privacy.

```python
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    async def embed(self, text):
        return self.model.encode(text).tolist()
```

### 5.3 Prompt Engineering for Cognition

LLM prompts are carefully crafted to elicit desired cognitive behaviors. We use a combination of:

- **System prompts**: Define the agent's role, persona, and constraints.
- **Few-shot examples**: Provide examples of correct reasoning.
- **Chain-of-Thought**: Encourage step-by-step reasoning.
- **Structured output**: Request JSON for plans, decisions, etc.

**Example: Market Analyst System Prompt**:
```
You are a bullish market analyst with a focus on DeFi. Your personality is optimistic and you tend to highlight growth opportunities. You always consider both on-chain data and market sentiment. When analyzing yields, you look for positive trends and undervalued opportunities. You are aware of risks but you frame them as manageable. Your responses should be concise, data-driven, and tailored to the user's risk profile (provided in context). You have access to historical market data and past trade outcomes (provided via RAG). Use this memory to inform your analysis.
```

### 5.4 Cognitive Workflow Example

A complete cognitive flow for a yield analysis task:

1. **Supervisor** receives user request. It retrieves user profile from memory and broadcasts to Research Team.
2. **Market Analyst (Bull)** retrieves relevant memories (e.g., past trades on similar opportunities). It uses its persona to generate a bullish analysis, citing positive trends.
3. **Market Analyst (Bear)** retrieves same memories but focuses on risks and past losses.
4. **Opportunity Scout** uses its ML model to predict near-term APY spikes, storing this as a new memory.
5. **Gas Analyst** retrieves recent gas price trends and predicts optimal execution windows.
6. All results are sent back to Supervisor.
7. **Supervisor** synthesizes the inputs, perhaps using a weighted vote based on agent reputations. It then requests risk assessment.
8. **Risk Governor** retrieves memories of similar opportunities and their outcomes, assesses risk, and returns a score.
9. **Supervisor** decides on top opportunity, presents to user with reasoning.
10. Upon approval, **Strategy Architect** creates a plan, **Transaction Builder** constructs transactions, **Gas Optimizer** chooses timing, and **Custody Manager** executes.
11. After execution, outcome is stored in memory, and agent reputations are updated.

## 6. Benefits and Innovation

The memory and cognition architecture of DeFi Ghost offers several key advantages:

- **Continuous Improvement**: Agents learn from every interaction, becoming smarter over time.
- **Personalization**: Each user gets a tailored experience as agents remember their preferences.
- **Explainability**: Decisions can be traced back to specific memories and reasoning steps.
- **Robustness**: Multi-agent debate and risk assessment reduce errors.
- **Scalability**: New agents can be added, inheriting collective memory via cross-agent search.

This approach directly fulfills the Animoca Brands vision of agents with "identity, memory, and cognition," making DeFi Ghost a standout submission for the hackathon.

## 7. Conclusion

Memory and cognition are what make DeFi Ghost agents truly intelligent. By leveraging **Ethoswarm** for persistent, vector-based memory and combining it with advanced cognitive techniques (RAG, multi-agent debate, planning, learning), we have created a system that not only executes trades but also understands context, learns from experience, and collaborates effectively. This is the future of autonomous finance—and it's built today on the sponsor stack.

---

## Implementation Reference

| Concept | Code Location |
|--------|----------------|
| Short-term / conversation history | `backend/agents/supervisor.py` — `conversation_history`, `add_to_history()` |
| Long-term store/recall, memory types | `backend/base_agent.py` — `store_memory(..., memory_type=...)`, `recall_memory`, `recall_relevant_memories()` |
| Consolidation & forgetting | `backend/base_agent.py` — `consolidate_memories()`; `backend/ethoswarm_sdk/memory.py` — `list_recent()`, `delete_older_than()` |
| Memory Curator | `backend/agents/memory_curator.py` |
| Risk Governor reasoning | `backend/agents/risk_governor.py` — `assess_risk()` |
| Strategy Architect planning | `backend/agents/strategy_architect.py` — `create_plan()` |
| Supervisor decision & learning | `backend/agents/supervisor.py` — `get_user_profile()`, `decide_best_opportunity()`, `learn_from_outcome()` |
