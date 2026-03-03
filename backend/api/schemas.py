"""Shared API request/response schemas for DeFi Ghost dashboard."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    """POST /api/chat body."""

    text: str = Field(..., min_length=1, description="User message to the Ghost")
    user_id: Optional[str] = Field(None, description="Session/user id; generated if omitted")


class SendMessageResponse(BaseModel):
    """Response after submitting a message."""

    session_id: str = Field(..., description="Use for polling GET /api/session/{session_id}/messages")
    accepted: bool = Field(True, description="Whether the message was accepted")


class ChatMessage(BaseModel):
    """Single message in the session (agent or user)."""

    text: str
    role: str = Field(..., pattern="^(user|agent)$")
    timestamp: Optional[str] = None


class SessionMessagesResponse(BaseModel):
    """GET /api/session/{user_id}/messages response."""

    session_id: str
    messages: List[ChatMessage] = Field(default_factory=list)


class AgentActivityItem(BaseModel):
    """Single agent activity entry for the feed."""

    agent_id: str
    role: str
    message: str
    timestamp: str


class ActivityResponse(BaseModel):
    """GET /api/activity response."""

    activities: List[AgentActivityItem] = Field(default_factory=list)


class MemoryItem(BaseModel):
    """Single memory entry for the memory map."""

    key: str
    value: Any
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MemoryResponse(BaseModel):
    """GET /api/memory response."""

    items: List[MemoryItem] = Field(default_factory=list)
