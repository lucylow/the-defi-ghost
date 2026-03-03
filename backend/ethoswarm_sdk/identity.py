"""Stub for Ethoswarm IdentityClient (persona management)."""

from datetime import datetime
from typing import Any, Dict, List, Optional


class Persona:
    """Agent persona: name, role, traits, system prompt, few-shot examples."""

    def __init__(
        self,
        role: str = "",
        name: str = "",
        system_prompt: str = "",
        personality_traits: Optional[List[str]] = None,
        few_shot_examples: Optional[List[Dict[str, str]]] = None,
    ):
        self.role = role
        self.name = name or role.replace("_", " ").title()
        self.system_prompt = system_prompt or f"You are an agent with role: {role}."
        self.personality_traits = personality_traits or []
        self.few_shot_examples = few_shot_examples or []

    @property
    def traits(self) -> List[str]:
        """Alias for personality_traits (spec uses 'traits')."""
        return self.personality_traits


class IdentityClient:
    """Stub IdentityClient: create/load persona for an agent (Ethoswarm Animoca Minds)."""

    def __init__(self, api_key: str, agent_id: str, role: str = ""):
        self._api_key = api_key
        self._agent_id = agent_id
        self._role = role
        self._personas: Dict[str, Persona] = {}
        self._created_at: Dict[str, str] = {}
        self._last_active: Dict[str, str] = {}
        self._reputation: Dict[str, Dict[str, float]] = {}

    async def load_persona(self) -> Persona:
        if self._agent_id in self._personas:
            self._last_active[self._agent_id] = datetime.utcnow().isoformat() + "Z"
            return self._personas[self._agent_id]
        return Persona(role=self._role or "agent", system_prompt="You are a helpful agent.")

    async def create_persona(
        self,
        role: str,
        personality_traits: Optional[List[str]] = None,
        system_prompt: str = "",
        few_shot_examples: Optional[List[Dict[str, str]]] = None,
    ) -> Persona:
        p = Persona(
            role=role,
            system_prompt=system_prompt or f"You are an agent with role: {role}.",
            personality_traits=personality_traits or [],
            few_shot_examples=few_shot_examples or [],
        )
        self._personas[self._agent_id] = p
        self._created_at[self._agent_id] = datetime.utcnow().isoformat() + "Z"
        self._last_active[self._agent_id] = datetime.utcnow().isoformat() + "Z"
        return p

    def to_identity_schema(
        self,
        memory_namespace: str,
        public_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return Ethoswarm identity JSON schema (for storage/query)."""
        p = self._personas.get(self._agent_id)
        return {
            "agent_id": self._agent_id,
            "role": self._role or (p.role if p else ""),
            "persona": {
                "name": p.name if p else self._role.replace("_", " ").title(),
                "traits": p.traits if p else [],
                "system_prompt": p.system_prompt if p else "",
                "few_shot_examples": p.few_shot_examples if p else [],
            }
            if p
            else {},
            "memory_namespace": memory_namespace,
            "public_key": public_key,
            "reputation": self._reputation.get(
                self._agent_id,
                {"overall": 0.0, "accuracy": 0.0, "timeliness": 0.0},
            ),
            "created_at": self._created_at.get(self._agent_id, datetime.utcnow().isoformat() + "Z"),
            "last_active": self._last_active.get(self._agent_id, datetime.utcnow().isoformat() + "Z"),
        }
