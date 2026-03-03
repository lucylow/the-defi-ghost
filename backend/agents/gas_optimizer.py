# gas_optimizer.py
"""Gas Optimizer: suggests optimal gas price and timing for tx sequence."""

from typing import Any, Dict, List

from .base_agent import DeFiGhostAgent, AgentConfig


class GasOptimizerAgent(DeFiGhostAgent):
    async def on_optimize_gas(self, payload: Dict[str, Any]):
        tx_sequence = payload.get("tx_sequence", [])
        task_id = payload.get("task_id")

        optimal_gas = await self.suggest_gas(tx_sequence)
        for tx in tx_sequence:
            tx["gasPrice"] = optimal_gas

        await self.send_message("custody_manager", "execute_txs", {
            "task_id": task_id,
            "tx_sequence": tx_sequence,
        })

    async def suggest_gas(self, tx_sequence: List[Dict[str, Any]]) -> int:
        """Placeholder: use gas oracle or recent blocks."""
        return 20
