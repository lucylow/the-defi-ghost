# strategy_architect.py
"""Strategy Architect: builds step-by-step execution plan (bridge + deposit)."""

import json
from typing import Any, Dict, List

from .base_agent import DeFiGhostAgent, AgentConfig


class StrategyArchitectAgent(DeFiGhostAgent):
    async def create_plan(self, goal: str, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Decompose goal into a structured plan (action, protocol, chain, amount per step)."""
        prompt = f"""
Goal: {goal}
Current context: {json.dumps(context, default=str)}

Create a step-by-step plan to achieve this goal. Each step must include:
- action: one of bridge, swap, deposit, approve
- protocol: protocol name if applicable
- chain: chain id or name
- amount: numeric amount if applicable

Output valid JSON only: {{ "steps": [ {{ "action": "...", "protocol": "...", "chain": "...", "amount": ... }} ] }}
"""
        try:
            llm_structured = getattr(self, "llm_generate_structured", None)
            llm_gen = getattr(self, "llm_generate", None)
            if llm_structured and callable(llm_structured):
                schema = {
                    "type": "object",
                    "properties": {"steps": {"type": "array", "items": {"type": "object"}}},
                    "required": ["steps"],
                }
                out = await llm_structured(prompt, schema)
                return out.get("steps", [])
            if llm_gen and callable(llm_gen):
                text = await llm_gen(prompt + "\nRespond with JSON only.", temperature=0.3)
                if text and "steps" in text:
                    start = text.find("{")
                    end = text.rfind("}") + 1
                    if start >= 0 and end > start:
                        return json.loads(text[start:end]).get("steps", [])
        except Exception:
            pass
        return []

    async def on_execute_strategy(self, payload: Dict[str, Any]):
        task_id = payload.get("task_id")
        opportunity = payload.get("opportunity", {})
        if isinstance(opportunity, list):
            opportunity = opportunity[0] if opportunity else {}

        goal = (
            f"Deploy {opportunity.get('amount', 5000)} {opportunity.get('asset', 'USDC')} "
            f"on {opportunity.get('protocol', '')} on {opportunity.get('chain', 'ethereum')}."
        )
        context = {"task_id": task_id, "opportunity": opportunity}
        steps = await self.create_plan(goal, context)

        if not steps:
            # Fallback: deterministic bridge + deposit
            steps = []
            current_chain = "ethereum"
            target_chain = opportunity.get("chain", "ethereum")
            target_protocol = opportunity.get("protocol", "")
            amount = opportunity.get("amount", 5000)
            if current_chain != target_chain:
                steps.append({
                    "action": "bridge",
                    "from_chain": current_chain,
                    "to_chain": target_chain,
                    "asset": "USDC",
                    "amount": amount,
                    "bridge": "avail-nexus",
                })
            steps.append({
                "action": "deposit",
                "protocol": target_protocol,
                "chain": target_chain,
                "asset": "USDC",
                "amount": amount,
            })

        await self.send_message("transaction_builder", "build_tx", {
            "task_id": task_id,
            "steps": steps,
        })
