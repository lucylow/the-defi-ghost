# memory_curator.py
"""Memory Curator: central store/recall for agent memories via Ethoswarm; audit and reputation."""

import uuid as _uuid
from datetime import datetime
from typing import Any, Dict

from base_agent import DeFiGhostAgent, AgentConfig
from openclaw_agent_context import Message


class MemoryCuratorAgent(DeFiGhostAgent):
    """Handles store, recall, agent audit logging, and reputation updates."""

    async def handle_message(self, message: Message) -> None:
        handler = getattr(self, f"on_{message.type}", None)
        if handler:
            await handler(message.payload)
        else:
            self.logger.warning(f"No handler for {message.type}")

    async def on_store_memory(self, payload: Dict[str, Any]):
        key = payload.get("key")
        value = payload.get("value")
        metadata = payload.get("metadata", {})
        await self.store_memory(key, value, metadata)

    async def on_recall_memory(self, payload: Dict[str, Any]):
        query = payload.get("query")
        top_k = payload.get("top_k", 5)
        requester = payload.get("requester")
        request_id = payload.get("request_id")
        results = await self.recall_memory(query, top_k=top_k)
        await self.send_message(requester, "memory_recall_result", {
            "request_id": request_id,
            "results": results,
        })

    async def on_log_agent_action(self, payload: Dict[str, Any]) -> None:
        """Log an agent action for audit and accountability (identity spec)."""
        agent_id = payload.get("agent_id")
        action_type = payload.get("action_type")
        details = payload.get("details", {})
        if not agent_id or not action_type:
            return
        await self.store_memory(
            key=f"audit_{agent_id}_{_uuid.uuid4()}",
            value={
                "agent_id": agent_id,
                "action_type": action_type,
                "details": details,
                "timestamp": datetime.utcnow().isoformat(),
            },
            metadata={"type": "agent_audit", "agent": agent_id},
        )

    async def on_update_reputation(self, payload: Dict[str, Any]) -> None:
        """Update an agent's reputation based on outcome (identity spec)."""
        agent_id = payload.get("agent_id")
        outcome = payload.get("outcome")  # e.g. "success" | "failure" or score delta
        if not agent_id:
            return
        # Stub: in production, fetch recent performance and compute new score
        await self.store_memory(
            key=f"agent_{agent_id}_reputation",
            value={
                "score": 0.85 if outcome == "success" else 0.5,
                "last_updated": datetime.utcnow().isoformat(),
                "outcome": outcome,
            },
            metadata={"type": "reputation", "agent": agent_id},
        )
