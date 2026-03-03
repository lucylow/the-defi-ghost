# agents/risk_governor.py
import random
from typing import Dict, Any, List

from base_agent import DeFiGhostAgent, AgentConfig
from openclaw_agent_context import Message


class RiskGovernorAgent(DeFiGhostAgent):
    async def handle_message(self, message: Message) -> None:
        if message.type == "validate_opportunities":
            await self._validate(message.payload)

    async def _validate(self, payload: Dict[str, Any]) -> None:
        task_id = payload["task_id"]
        opportunities = payload["opportunities"]
        user_id = payload.get("user_id")

        profile = await self._get_user_profile(user_id)

        approved: List[Dict[str, Any]] = []
        risk_scores: Dict[str, float] = {}

        for opp in opportunities:
            if not await self._check_position_limit(opp, profile):
                continue
            if not await self._check_oracle_safety(opp):
                continue
            if not await self._check_protocol_blacklist(opp, profile):
                continue

            risk_score = await self._compute_risk_score(opp, profile)
            risk_scores[opp["id"]] = risk_score

            if risk_score <= profile.get("max_risk", 5):
                approved.append(opp)

        approved.sort(key=lambda x: risk_scores[x["id"]])

        await self.send_message("supervisor_001", "risk_assessment", {
            "task_id": task_id,
            "approved": approved,
            "risk_scores": risk_scores,
        })

    async def _get_user_profile(self, user_id: Optional[str]) -> Dict[str, Any]:
        memories = await self.recall_memory(
            query=f"user profile {user_id or 'default'}",
            namespace="user_profiles",
            top_k=1,
        )
        if memories:
            return memories[0].get("value", self._default_profile())
        return self._default_profile()

    def _default_profile(self) -> Dict[str, Any]:
        return {
            "max_risk": 5,
            "max_allocation_per_protocol": 0.3,
            "blacklisted_protocols": [],
            "preferred_chains": ["arbitrum", "base"],
        }

    async def _check_position_limit(self, opp: Dict, profile: Dict) -> bool:
        return True

    async def _check_oracle_safety(self, opp: Dict) -> bool:
        return True

    async def _check_protocol_blacklist(self, opp: Dict, profile: Dict) -> bool:
        return opp["protocol"] not in profile.get("blacklisted_protocols", [])

    async def _compute_risk_score(self, opp: Dict, profile: Dict) -> float:
        base = random.uniform(1, 8)
        if opp.get("chain") not in profile.get("preferred_chains", []):
            base += 2
        return round(min(base, 10), 1)
