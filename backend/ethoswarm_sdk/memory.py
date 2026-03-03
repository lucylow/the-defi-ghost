"""In-memory / Redis-backed stub for Ethoswarm MemoryClient."""

from typing import Any, Dict, List, Optional
import json
import uuid as _uuid
from datetime import datetime, timedelta


class MemoryClient:
    """Stub MemoryClient: store/search by embedding. Uses in-memory list + optional Redis."""

    def __init__(self, api_key: str, store_id: str):
        self._api_key = api_key
        self._store_id = store_id
        self._memories: List[Dict[str, Any]] = []

    async def store(
        self,
        key: str,
        value: Any,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        self._memories.append({
            "key": key,
            "value": value,
            "embedding": embedding or [],
            "metadata": metadata or {},
        })

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        namespace: Optional[str] = None,
        metadata_filter: Optional[Dict] = None,
    ) -> List[Dict[str, Any]]:
        # Simple filter by namespace/metadata; no real vector similarity in stub
        filtered = self._memories
        if namespace:
            filtered = [m for m in filtered if m.get("metadata", {}).get("namespace") == namespace]
        if metadata_filter:
            for k, v in metadata_filter.items():
                filtered = [m for m in filtered if m.get("metadata", {}).get(k) == v]
        # Return last N as "results" (stub)
        return [{"key": m["key"], "value": m["value"], "metadata": m["metadata"]} for m in filtered[-top_k:]]

    async def search_cross_agent(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        metadata_filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Search across all agent namespaces (cross-agent memory). Requires cross-agent permissions."""
        filtered = self._memories
        if metadata_filter:
            for k, v in metadata_filter.items():
                filtered = [m for m in filtered if m.get("metadata", {}).get(k) == v]
        return [{"key": m["key"], "value": m["value"], "metadata": m["metadata"]} for m in filtered[-top_k:]]

    async def list_recent(
        self,
        namespace: Optional[str] = None,
        days: int = 30,
    ) -> List[Dict[str, Any]]:
        """Return memories from the last N days (for consolidation)."""
        since = datetime.utcnow() - timedelta(days=days)
        filtered = self._memories
        if namespace:
            filtered = [m for m in filtered if m.get("metadata", {}).get("namespace") == namespace]
        out = []
        for m in filtered:
            ts_str = m.get("metadata", {}).get("timestamp")
            if not ts_str:
                out.append(m)
                continue
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if ts.replace(tzinfo=None) >= since:
                    out.append(m)
            except Exception:
                out.append(m)
        return [{"key": x["key"], "value": x["value"], "metadata": x["metadata"]} for x in out]

    async def delete_older_than(
        self,
        namespace: Optional[str] = None,
        days: int = 30,
    ) -> None:
        """Remove memories older than N days (after consolidation)."""
        since = datetime.utcnow() - timedelta(days=days)
        to_keep = []
        for m in self._memories:
            if namespace and m.get("metadata", {}).get("namespace") != namespace:
                to_keep.append(m)
                continue
            ts_str = m.get("metadata", {}).get("timestamp")
            if not ts_str:
                to_keep.append(m)
                continue
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if ts.replace(tzinfo=None) >= since:
                    to_keep.append(m)
            except Exception:
                to_keep.append(m)
        self._memories[:] = to_keep
