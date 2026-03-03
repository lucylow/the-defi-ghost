# memory_curator.py
"""Memory Curator: central store/recall for agent memories via Ethoswarm."""

from typing import Any, Dict

from .base_agent import DeFiGhostAgent, AgentConfig


class MemoryCuratorAgent(DeFiGhostAgent):
    """Handles store and recall requests from other agents."""

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
