# strategy_architect.py
"""Strategy Architect: builds step-by-step execution plan (bridge + deposit)."""

from typing import Any, Dict, List

from .base_agent import DeFiGhostAgent, AgentConfig


class StrategyArchitectAgent(DeFiGhostAgent):
    async def on_execute_strategy(self, payload: Dict[str, Any]):
        task_id = payload.get("task_id")
        opportunity = payload.get("opportunity", {})
        if isinstance(opportunity, list):
            opportunity = opportunity[0] if opportunity else {}

        steps: List[Dict[str, Any]] = []
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
