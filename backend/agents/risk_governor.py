# agents/risk_governor.py
import json
import re
import random
from typing import Dict, Any, List, Optional

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

            risk_score = await self.assess_risk(opp, profile)
            opp_id = opp.get("id") or str(id(opp))
            risk_scores[opp_id] = risk_score
            opp["id"] = opp.get("id") or opp_id

            if risk_score <= profile.get("max_risk", 5):
                approved.append(opp)

        approved.sort(key=lambda x: risk_scores.get(x.get("id"), 10))

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

    async def assess_risk(self, opportunity: Dict[str, Any], profile: Optional[Dict] = None) -> float:
        """Assess risk using similar past trades (memory) and LLM synthesis. Returns score 1-10."""
        profile = profile or await self._get_user_profile(opportunity.get("user_id"))
        similar_trades = await self.recall_memory(
            query=f"trades on {opportunity.get('protocol', '')} with APY yield outcome",
            top_k=5,
            metadata_filter={"memory_type": "episodic"} if hasattr(self, "memory") else None,
        )
        similar_trades = similar_trades or []
        historical_text = json.dumps([r.get("value") for r in similar_trades]) if similar_trades else "No similar past trades."

        prompt = f"""
You are the Risk Governor. Assess the risk of this opportunity:
{json.dumps(opportunity, default=str)}

Historical context (similar past trades/outcomes):
{historical_text}

User risk profile: max_risk={profile.get('max_risk', 5)}, preferred_chains={profile.get('preferred_chains', [])}.

Provide a risk score from 1 (low) to 10 (high) and a short rationale.
Reply with exactly: RISK_SCORE=<number> RATIONALE=<one sentence>
"""
        try:
            response = await self.llm_generate(prompt, temperature=0.3)
            match = re.search(r"RISK_SCORE\s*=\s*([\d.]+)", response, re.I)
            if match:
                score = float(match.group(1))
                return round(min(max(score, 1.0), 10.0), 1)  # one decimal place
        except Exception:
            pass
        # Fallback: heuristic
        base = random.uniform(2, 7)
        if opportunity.get("chain") not in profile.get("preferred_chains", []):
            base += 2
        return round(min(base, 10), 1)

    async def _compute_risk_score(self, opp: Dict, profile: Dict) -> float:
        """Legacy heuristic fallback."""
        base = random.uniform(1, 8)
        if opp.get("chain") not in profile.get("preferred_chains", []):
            base += 2
        return round(min(base, 10), 1)
