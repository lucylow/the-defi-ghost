"""
DeFi Ghost HTTP API: chat, session messages, agent activity, memory.
Run with: uvicorn backend.api.server:app --reload --host 0.0.0.0 --port 8000
From backend dir: uvicorn api.server:app --reload --host 0.0.0.0 --port 8000
"""

import asyncio
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Backend root in path so deploy, config, agents resolve
import sys
import os

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from openclaw_agent_context import (
    Message,
    Channel,
    _agent_queues,
    _activity_log,
)
from api.schemas import (
    SendMessageRequest,
    SendMessageResponse,
    ChatMessage,
    SessionMessagesResponse,
    AgentActivityItem,
    ActivityResponse,
    MemoryItem,
    MemoryResponse,
)

# Agent lifecycle: we create and run them in lifespan
SUPERVISOR_AGENT_ID = "supervisor_001"
_agent_tasks: List[asyncio.Task] = []
_supervisor_instance: Any = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start all DeFi Ghost agents in background; hold ref to Supervisor for memory."""
    global _agent_tasks, _supervisor_instance
    from deploy import AGENTS, agent_config

    _agent_tasks = []
    for spec in AGENTS:
        config = agent_config(
            spec["agent_id"],
            spec["role"],
            spec["persona"],
            **spec.get("kwargs", {}),
        )
        agent = spec["cls"](config, **spec.get("kwargs", {}))
        if spec["agent_id"] == SUPERVISOR_AGENT_ID:
            _supervisor_instance = agent
        _agent_tasks.append(asyncio.create_task(agent.run()))
    app.state.supervisor = _supervisor_instance
    app.state.agent_tasks = _agent_tasks
    yield
    for t in _agent_tasks:
        t.cancel()
        try:
            await t
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="DeFi Ghost API",
    description="Multi-agent yield coordinator: chat, activity, memory",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _outbox_to_chat_messages(outbox: List[Dict[str, Any]], user_id: str) -> List[ChatMessage]:
    """Convert channel outbox entries to ChatMessage list (agent replies only)."""
    result = []
    for m in outbox:
        text = m.get("text", "")
        ts = m.get("timestamp")
        result.append(ChatMessage(text=text, role="agent", timestamp=ts))
    return result


@app.post("/api/chat", response_model=SendMessageResponse)
async def post_chat(body: SendMessageRequest) -> SendMessageResponse:
    """Send a user message to the Ghost. Use returned session_id to poll for replies."""
    session_id = body.user_id or str(uuid.uuid4())
    payload = {
        "user_id": session_id,
        "text": body.text,
        "channel": "dashboard",
    }
    msg = Message(
        sender="channel",
        recipient=SUPERVISOR_AGENT_ID,
        type="user_message",
        payload=payload,
    )
    if SUPERVISOR_AGENT_ID not in _agent_queues:
        raise HTTPException(status_code=503, detail="Agents not ready; supervisor queue missing.")
    await _agent_queues[SUPERVISOR_AGENT_ID].put(msg)
    return SendMessageResponse(session_id=session_id, accepted=True)


@app.get("/api/session/{user_id}/messages", response_model=SessionMessagesResponse)
async def get_session_messages(user_id: str) -> SessionMessagesResponse:
    """Get all messages (agent replies) for a session. Poll after POST /api/chat."""
    outbox = Channel.get_outbox("dashboard", user_id)
    messages = _outbox_to_chat_messages(outbox, user_id)
    return SessionMessagesResponse(session_id=user_id, messages=messages)


@app.get("/api/activity", response_model=ActivityResponse)
async def get_activity() -> ActivityResponse:
    """Get recent agent activity for the live feed."""
    activities = [
        AgentActivityItem(
            agent_id=a.get("agent_id", ""),
            role=a.get("role", ""),
            message=a.get("message", ""),
            timestamp=a.get("timestamp", ""),
        )
        for a in _activity_log
    ]
    return ActivityResponse(activities=activities)


@app.get("/api/memory", response_model=MemoryResponse)
async def get_memory() -> MemoryResponse:
    """Get recent memory items from the Supervisor's memory (memory map)."""
    supervisor = getattr(app.state, "supervisor", None)
    if not supervisor or not getattr(supervisor, "memory", None):
        return MemoryResponse(items=[])
    try:
        recent = await supervisor.memory.list_recent(namespace=None, days=7)
        items = [
            MemoryItem(
                key=r.get("key", ""),
                value=r.get("value"),
                metadata=r.get("metadata", {}),
            )
            for r in recent[:30]
        ]
        return MemoryResponse(items=items)
    except Exception:
        return MemoryResponse(items=[])


@app.get("/health")
async def health():
    """Liveness check."""
    return {"status": "ok", "agents": "running"}
