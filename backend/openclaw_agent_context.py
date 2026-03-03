"""
OpenClaw-style AgentContext, Message, Mailbox for DeFi Ghost.
Provides the interface used in the spec; can be wired to real OpenClaw when available.
Uses an in-process message bus for local multi-agent runs.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, AsyncIterator

# In-process bus: agent_id -> queue of Message
_agent_queues: Dict[str, asyncio.Queue] = {}
_broadcast_queues: List[asyncio.Queue] = []
_team_agents: Dict[str, List[str]] = {}  # team_id -> [agent_id, ...]

# In-memory activity log for dashboard (last 100 entries); also written to Redis when available
_activity_log: List[Dict[str, Any]] = []
_ACTIVITY_LOG_MAX = 100


class ChannelType:
    telegram = "telegram"
    discord = "discord"


@dataclass
class Message:
    sender: str
    recipient: str
    type: str
    payload: Dict[str, Any]
    header: Optional[Dict[str, Any]] = None  # identity: sender_id, sender_role, sender_persona, timestamp


class Mailbox:
    """Per-agent mailbox: send, broadcast, listen."""

    def __init__(self, agent_id: str, team_id: str):
        self._agent_id = agent_id
        self._team_id = team_id
        if agent_id not in _agent_queues:
            _agent_queues[agent_id] = asyncio.Queue()
        if team_id not in _team_agents:
            _team_agents[team_id] = []
        if agent_id not in _team_agents[team_id]:
            _team_agents[team_id].append(agent_id)

    async def send(self, msg: Message) -> None:
        if msg.recipient in _agent_queues:
            await _agent_queues[msg.recipient].put(msg)

    async def broadcast(
        self,
        message_type: str,
        payload: Dict[str, Any],
        exclude: Optional[List[str]] = None,
    ) -> None:
        exclude = exclude or []
        for aid in _team_agents.get(self._team_id, []):
            if aid == self._agent_id or aid in exclude:
                continue
            if aid in _agent_queues:
                await _agent_queues[aid].put(
                    Message(
                        sender=self._agent_id,
                        recipient=aid,
                        type=message_type,
                        payload=payload,
                        header=None,
                    )
                )

    async def listen(self) -> AsyncIterator[Message]:
        q = _agent_queues.get(self._agent_id)
        if not q:
            return
        while True:
            msg = await q.get()
            yield msg


def append_activity(activity: Dict[str, Any]) -> None:
    """Append to global activity log for dashboard API (thread-safe enough for single process)."""
    global _activity_log
    _activity_log = ([activity] + _activity_log)[:_ACTIVITY_LOG_MAX]


class Channel:
    """User-facing channel (e.g. Telegram, dashboard). Stub: stores messages per user for testing/API."""

    _outbox: Dict[str, List[Dict]] = {}  # key = f"{channel_type}:{recipient}" -> [messages]

    async def send(
        self,
        channel_type: str,
        recipient: str,
        message: Dict[str, Any],
    ) -> None:
        key = f"{channel_type}:{recipient}"
        if key not in Channel._outbox:
            Channel._outbox[key] = []
        Channel._outbox[key].append(message)

    @classmethod
    def get_outbox(cls, channel_type: str, recipient: str) -> List[Dict]:
        return cls._outbox.get(f"{channel_type}:{recipient}", [])


class AgentContext:
    """Context for an agent: mailbox, channel, logger."""

    def __init__(self, agent_id: str, team_id: str, api_key: str = ""):
        self.agent_id = agent_id
        self.team_id = team_id
        self.mailbox = Mailbox(agent_id, team_id)
        self.channel = Channel()

    def get_logger(self, name: str) -> logging.Logger:
        return logging.getLogger(name)
