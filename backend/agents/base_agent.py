# base_agent.py
"""Base class for all DeFi Ghost agents. Provides OpenClaw messaging and Ethoswarm memory."""

from abc import ABC, abstractmethod
from pathlib import Path
import sys

# Ensure backend root is on path when agents run as scripts
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from typing import Any, Dict, Optional
from pydantic import BaseModel

try:
    from config import settings
except ImportError:
    from backend.config import settings

# Optional SDK imports (stub if not installed)
try:
    from openclaw_sdk import AgentContext, Message
except ImportError:
    AgentContext = None
    Message = None

try:
    from ethoswarm_sdk import MemoryClient
except ImportError:
    MemoryClient = None


class AgentConfig(BaseModel):
    """Configuration for a DeFi Ghost agent."""

    agent_id: str
    team_id: str
    role: str
    memory_store_id: str


class DeFiGhostAgent(ABC):
    """Base class for all DeFi Ghost agents."""

    def __init__(self, config: AgentConfig):
        self.config = config
        self._context = None
        self._memory = None
        self._logger = None

        if AgentContext is not None and settings.OPENCLAW_API_KEY:
            self._context = AgentContext(
                agent_id=config.agent_id,
                team_id=config.team_id,
                api_key=settings.OPENCLAW_API_KEY,
            )
            self._logger = getattr(self._context, "get_logger", lambda: _FallbackLogger())()

        if MemoryClient is not None and settings.ETHOSWARM_API_KEY:
            self._memory = MemoryClient(
                api_key=settings.ETHOSWARM_API_KEY,
                store_id=config.memory_store_id,
            )

    @property
    def context(self):
        return self._context

    @property
    def memory(self):
        return self._memory

    @property
    def logger(self):
        return self._logger or _FallbackLogger()

    async def send_message(
        self, recipient: str, message_type: str, payload: Dict[str, Any]
    ):
        """Send a message to another agent via OpenClaw mailbox."""
        if self._context is None:
            self.logger.warning("OpenClaw not configured; message not sent")
            return
        msg = Message(
            sender=self.config.agent_id,
            recipient=recipient,
            type=message_type,
            payload=payload,
        )
        await self._context.mailbox.send(msg)

    async def broadcast(self, message_type: str, payload: Dict[str, Any]):
        """Broadcast to all agents (or a subset)."""
        if self._context is None:
            self.logger.warning("OpenClaw not configured; broadcast not sent")
            return
        await self._context.mailbox.broadcast(
            message_type=message_type,
            payload=payload,
            exclude=[self.config.agent_id],
        )

    async def store_memory(
        self, key: str, value: Any, metadata: Optional[Dict] = None
    ):
        """Store a memory vector in Ethoswarm."""
        if self._memory is None:
            return
        import json

        await self._memory.store(
            key=key,
            value=json.dumps(value) if not isinstance(value, str) else value,
            metadata=metadata or {},
        )

    async def recall_memory(self, query: str, top_k: int = 5) -> list:
        """Retrieve relevant memories using semantic search."""
        if self._memory is None:
            return []
        return await self._memory.search(query, top_k=top_k)

    @abstractmethod
    async def run(self):
        """Main agent loop – listens for messages and acts."""
        pass

    async def handle_message(self, message: "Message"):
        """Route incoming messages to appropriate handlers."""
        msg_type = getattr(message, "type", None) or message.get("type")
        handler = getattr(self, f"on_{msg_type}", None)
        if handler and callable(handler):
            payload = getattr(message, "payload", None) or message.get("payload", {})
            await handler(payload)
        else:
            self.logger.warning(f"No handler for message type: {msg_type}")


class _FallbackLogger:
    """Minimal logger when OpenClaw context is not available."""

    def info(self, msg: str, *args, **kwargs):
        print(f"[INFO] {msg}", *args, **kwargs)

    def warning(self, msg: str, *args, **kwargs):
        print(f"[WARN] {msg}", *args, **kwargs)

    def error(self, msg: str, *args, **kwargs):
        print(f"[ERROR] {msg}", *args, **kwargs)
