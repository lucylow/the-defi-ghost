# agents/gas_analyst.py
from typing import Dict, Any

from base_agent import DeFiGhostAgent, AgentConfig
from openclaw_agent_context import Message


class GasAnalystAgent(DeFiGhostAgent):
    async def handle_message(self, message: Message) -> None:
        if message.type == "analyze_yield":
            await self._analyze_gas(message.payload)
        elif message.type == "optimize_gas":
            await self._optimize_gas(message.payload)

    async def _analyze_gas(self, payload: Dict[str, Any]) -> None:
        task_id = payload["task_id"]
        gas_data: Dict[str, Dict[str, Any]] = {}
        for chain in ["ethereum", "arbitrum", "base"]:
            gas_price = await self._get_gas_price(chain)
            mev_risk = await self._assess_mev_risk(chain)
            gas_data[chain] = {
                "gas_price_gwei": gas_price,
                "estimated_cost_usd": gas_price * 21000 * 1e-9 * 3500,
                "mev_risk": mev_risk,
            }

        await self.send_message("supervisor_001", "gas_analysis", {
            "task_id": task_id,
            "gas_data": gas_data,
        })

    async def _get_gas_price(self, chain: str) -> float:
        prices = {"ethereum": 15, "arbitrum": 0.12, "base": 0.08}
        return prices.get(chain, 10)

    async def _assess_mev_risk(self, chain: str) -> str:
        risks = {"ethereum": "medium", "arbitrum": "low", "base": "low"}
        return risks.get(chain, "low")

    async def _optimize_gas(self, payload: Dict[str, Any]) -> None:
        task_id = payload["task_id"]
        tx_sequence = payload["tx_sequence"]
        user_id = payload.get("user_id")

        for tx in tx_sequence:
            chain = tx.get("chain", "ethereum")
            base_gas = await self._get_gas_price(chain)
            tx["gas_price"] = base_gas * 1.1

        await self.send_message("custody_manager_001", "execute_txs", {
            "task_id": task_id,
            "tx_sequence": tx_sequence,
            "user_id": user_id,
        })
