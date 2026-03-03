# base_agent.py
import asyncio
import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from openclaw_agent_context import AgentContext, Message, append_activity
from ethoswarm_sdk import MemoryClient, IdentityClient
from ethoswarm_sdk.identity import Persona
import redis.asyncio as redis

try:
    from sentence_transformers import SentenceTransformer
    _embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    _embedder = None

from config import settings

# Memory types for long-term storage (Ethoswarm metadata)
MEMORY_TYPE_EPISODIC = "episodic"
MEMORY_TYPE_SEMANTIC = "semantic"
MEMORY_TYPE_PROCEDURAL = "procedural"
MEMORY_TYPE_USER = "user_specific"


class AgentConfig(BaseModel):
    agent_id: str
    team_id: str
    role: str
    persona: Optional[Dict[str, Any]] = None
    restore_existing: bool = True


class DeFiGhostAgent(ABC):
    """Base class for all DeFi Ghost agents."""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.agent_id = config.agent_id
        self.role = config.role

        # OpenClaw-style context for messaging and team coordination
        self.context = AgentContext(
            agent_id=self.agent_id,
            team_id=config.team_id,
            api_key=settings.OPENCLAW_API_KEY,
        )

        # Ethoswarm clients (Animoca Minds identity)
        self.identity = IdentityClient(
            api_key=settings.ETHOSWARM_API_KEY,
            agent_id=self.agent_id,
            role=self.role,
        )
        self.memory = MemoryClient(
            api_key=settings.ETHOSWARM_API_KEY,
            store_id=settings.ETHOSWARM_MEMORY_STORE_ID,
        )

        # Load or create agent persona
        if config.restore_existing:
            self.persona = asyncio.run(self.identity.load_persona())
        else:
            self.persona = asyncio.run(
                self.identity.create_persona(
                    role=self.role,
                    personality_traits=(config.persona or {}).get("traits", []),
                    system_prompt=(config.persona or {}).get("system_prompt", ""),
                )
            )

        # Dedicated vector namespace for this agent's long-term memories (Ethoswarm)
        self.memory_namespace = f"agent_{self.agent_id}_memories"
        # User context (set by Supervisor via set_user_context for specialist agents)
        self.current_user_id: Optional[str] = None
        self.user_profile: Optional[Dict[str, Any]] = None
        self.user_context_memories: List[Dict[str, Any]] = []
        # Redis for short-term working memory (optional: catch if Redis not running)
        try:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception:
            self.redis = None  # in-memory fallback in methods

        # Embedding model for local RAG (optional)
        self.embedder = _embedder

        # Logger
        self.logger = self.context.get_logger(f"{self.role}_{self.agent_id}")

    # -------------------- Communication --------------------

    async def send_message(self, recipient: str, message_type: str, payload: Dict[str, Any]) -> None:
        """Send a direct message to another agent (header carries identity for recipient)."""
        persona = getattr(self, "persona", None)
        msg = Message(
            sender=self.agent_id,
            recipient=recipient,
            type=message_type,
            payload=payload,
            header={
                "sender_id": self.agent_id,
                "sender_role": self.role,
                "sender_persona": getattr(persona, "name", None) or getattr(persona, "role", self.role),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )
        await self.context.mailbox.send(msg)
        await self._log_activity(f"Sent {message_type} to {recipient}")

    async def broadcast(
        self,
        message_type: str,
        payload: Dict[str, Any],
        exclude: Optional[List[str]] = None,
    ) -> None:
        """Broadcast to all agents in the team."""
        await self.context.mailbox.broadcast(
            message_type=message_type,
            payload=payload,
            exclude=exclude or [],
        )
        await self._log_activity(f"Broadcast {message_type}")

    async def send_to_user(self, user_id: str, text: str, channel: str = "telegram") -> None:
        """Send a message to a user via OpenClaw channel."""
        await self.context.channel.send(
            channel_type=channel,
            recipient=user_id,
            message={"text": text, "timestamp": datetime.utcnow().isoformat()},
        )

    # -------------------- Memory Operations --------------------

    async def store_memory(
        self,
        key: str,
        value: Any,
        metadata: Optional[Dict] = None,
        namespace: Optional[str] = None,
        memory_type: Optional[str] = None,
    ) -> None:
        """Store a memory in Ethoswarm with embedding.
        memory_type: episodic | semantic | procedural | user_specific (for RAG filtering).
        """
        if namespace is None:
            namespace = self.memory_namespace

        # Generate embedding for semantic search
        text_value = json.dumps(value) if not isinstance(value, str) else value
        embedding = self.embedder.encode(text_value).tolist() if self.embedder else []

        full_key = f"{namespace}:{key}:{uuid.uuid4()}"
        meta = {
            "agent_id": self.agent_id,
            "role": self.role,
            "timestamp": datetime.utcnow().isoformat(),
            "namespace": namespace,
            **(metadata or {}),
        }
        if memory_type:
            meta["memory_type"] = memory_type
        await self.memory.store(
            key=full_key,
            value=value,
            embedding=embedding,
            metadata=meta,
        )

    async def recall_memory(
        self,
        query: str,
        top_k: int = 5,
        namespace: Optional[str] = None,
        metadata_filter: Optional[Dict] = None,
        include_other_agents: bool = False,
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant memories. If include_other_agents, search across all agent namespaces (cross-agent)."""
        query_embedding = self.embedder.encode(query).tolist() if self.embedder else []
        if include_other_agents:
            results = await self.memory.search_cross_agent(
                query_embedding=query_embedding,
                top_k=top_k,
                metadata_filter=metadata_filter,
            )
        else:
            if namespace is None:
                namespace = self.memory_namespace
            results = await self.memory.search(
                query_embedding=query_embedding,
                top_k=top_k,
                namespace=namespace,
                metadata_filter=metadata_filter,
            )
        return results

    async def on_set_user_context(self, payload: Dict[str, Any]) -> None:
        """Set current user context (called when Supervisor broadcasts set_user_context)."""
        self.current_user_id = payload.get("user_id")
        self.user_profile = payload.get("profile") or {}
        self.user_context_memories = []
        if self.current_user_id:
            self.user_context_memories = await self.recall_memory(
                query=f"user_{self.current_user_id}_interactions",
                top_k=10,
            )

    async def recall_relevant_memories(
        self,
        query: str,
        top_k: int = 5,
        namespace: Optional[str] = None,
        metadata_filter: Optional[Dict] = None,
    ) -> str:
        """Retrieve relevant memories and format as text for RAG injection into prompts."""
        results = await self.recall_memory(
            query=query,
            top_k=top_k,
            namespace=namespace,
            metadata_filter=metadata_filter,
        )
        lines = []
        for r in results:
            ts = (r.get("metadata") or {}).get("timestamp", "")
            val = r.get("value")
            if isinstance(val, dict):
                val = json.dumps(val)
            elif not isinstance(val, str):
                val = str(val)
            lines.append(f"- [{ts}] {val}")
        return "\n".join(lines) if lines else "(no relevant memories)"

    async def consolidate_memories(
        self,
        namespace: Optional[str] = None,
        days: int = 30,
        store_summary: bool = True,
        delete_old: bool = False,
    ) -> None:
        """Summarize recent memories and optionally archive/delete old raw memories."""
        if namespace is None:
            namespace = self.memory_namespace
        recent = await self.memory.list_recent(namespace=namespace, days=days)
        if not recent:
            return
        summary_text = json.dumps([r.get("value") for r in recent[:50]])
        if store_summary and self.embedder:
            summary = await self.llm_generate(
                f"Summarize these agent memories into a short consolidation (patterns, outcomes):\n{summary_text[:8000]}",
                temperature=0.3,
            )
            await self.store_memory(
                f"consolidation_{namespace}_{datetime.utcnow().strftime('%Y%m')}",
                summary,
                metadata={"memory_type": MEMORY_TYPE_SEMANTIC, "consolidation": True},
                namespace=namespace,
            )
        if delete_old:
            await self.memory.delete_older_than(namespace=namespace, days=days)

    async def get_working_memory(self, key: str) -> Optional[str]:
        """Retrieve short-term data from Redis."""
        if self.redis is None:
            return None
        return await self.redis.get(f"{self.agent_id}:{key}")

    async def set_working_memory(self, key: str, value: str, ttl: int = 3600) -> None:
        """Store short-term data in Redis with TTL."""
        if self.redis is None:
            return
        await self.redis.setex(f"{self.agent_id}:{key}", ttl, value)

    # -------------------- Cognition (LLM) --------------------

    async def llm_generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
    ) -> str:
        """Call LLM (OpenAI or Venice.ai) with prompt."""
        sys = system_prompt or getattr(self.persona, "system_prompt", "You are a helpful agent.")

        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            messages = [{"role": "system", "content": sys}, {"role": "user", "content": prompt}]
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content or ""

        if settings.LLM_PROVIDER == "venice" and settings.VENICE_API_KEY:
            import httpx

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{settings.VENICE_API_BASE}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.VENICE_API_KEY}"},
                    json={
                        "model": settings.VENICE_MODEL,
                        "messages": [
                            {"role": "system", "content": sys},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": temperature,
                    },
                )
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "")

        # Fallback when no API key
        return f"[LLM not configured] Response to: {prompt[:100]}..."

    async def llm_generate_structured(
        self,
        prompt: str,
        output_schema: Dict[str, Any],
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate structured JSON output using function calling or JSON mode."""
        sys = system_prompt or getattr(self.persona, "system_prompt", "You are a helpful agent.")

        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            messages = [{"role": "system", "content": sys}, {"role": "user", "content": prompt}]
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": "output",
                            "description": "Structured output",
                            "parameters": output_schema,
                        },
                    }
                ],
                tool_choice={"type": "function", "function": {"name": "output"}},
            )
            msg = response.choices[0].message
            if msg.tool_calls and len(msg.tool_calls) > 0:
                args = msg.tool_calls[0].function.arguments
                return json.loads(args)
            return {}

        # Fallback: ask for JSON in text
        text = await self.llm_generate(prompt + "\nRespond in JSON format only.", system_prompt=sys)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"action": "yield_query", "parameters": {}, "confidence": 0.5}

    # -------------------- Activity Logging --------------------

    async def _log_activity(self, message: str) -> None:
        """Log agent activity for monitoring (in-memory log + optional Redis)."""
        activity = {
            "agent_id": self.agent_id,
            "role": self.role,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        append_activity(activity)
        if self.redis:
            await self.redis.lpush("agent_activity", json.dumps(activity))
            await self.redis.ltrim("agent_activity", 0, 99)
        self.logger.info(message)

    # -------------------- Main Loop --------------------

    @abstractmethod
    async def handle_message(self, message: Message) -> None:
        """Handle incoming messages. Must be implemented by subclass."""
        pass

    async def run(self) -> None:
        """Main agent loop: listen for messages and process."""
        self.logger.info(f"Agent {self.agent_id} starting...")
        async for message in self.context.mailbox.listen():
            await self.handle_message(message)
