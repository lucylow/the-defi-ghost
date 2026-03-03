# transaction_builder.py
"""Transaction Builder: generates calldata for each step (deposit, bridge)."""

from typing import Any, Dict, List

from .base_agent import DeFiGhostAgent, AgentConfig


class TransactionBuilderAgent(DeFiGhostAgent):
    async def on_build_tx(self, payload: Dict[str, Any]):
        steps = payload.get("steps", [])
        task_id = payload.get("task_id")
        tx_sequence: List[Dict[str, Any]] = []

        for step in steps:
            if step.get("action") == "deposit":
                tx = await self.build_deposit_tx(step)
                tx_sequence.append(tx)
            elif step.get("action") == "bridge":
                tx = await self.build_bridge_tx(step)
                tx_sequence.append(tx)

        await self.send_message("gas_optimizer", "optimize_gas", {
            "task_id": task_id,
            "tx_sequence": tx_sequence,
        })

    async def build_deposit_tx(self, step: Dict[str, Any]) -> Dict[str, Any]:
        # Use protocol router (e.g. Aave pool) from config in real impl
        router = "0x0000000000000000000000000000000000000000"
        data = "0x"
        return {
            "to": router,
            "data": data,
            "value": 0,
            "chain": step.get("chain", "ethereum"),
        }

    async def build_bridge_tx(self, step: Dict[str, Any]) -> Dict[str, Any]:
        bridge = step.get("bridge", "avail-nexus")
        return {
            "to": "0x0000000000000000000000000000000000000000",
            "data": "0x",
            "value": 0,
            "chain": step.get("from_chain", "ethereum"),
        }
