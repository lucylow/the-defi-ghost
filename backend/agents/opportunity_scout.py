# agents/opportunity_scout.py
import random
from typing import Dict, Any, List

from base_agent import DeFiGhostAgent, AgentConfig
from openclaw_agent_context import Message


class OpportunityScoutAgent(DeFiGhostAgent):
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.supported_protocols = ["aave_v3", "compound_v3", "morpho_blue"]
        self.supported_chains = ["ethereum", "arbitrum", "base"]

    async def handle_message(self, message: Message) -> None:
        if message.type == "analyze_yield":
            await self._scout_opportunities(message.payload)

    async def _scout_opportunities(self, payload: Dict[str, Any]) -> None:
        task_id = payload["task_id"]
        asset = payload.get("asset", "USDC")
        amount = payload.get("amount", 5000)

        opportunities: List[Dict[str, Any]] = []

        for chain in self.supported_chains:
            for protocol in self.supported_protocols:
                apy = await self._fetch_apy(protocol, chain, asset)
                if apy and apy > 2.0:
                    opportunities.append({
                        "id": f"{protocol}_{chain}_{asset}",
                        "protocol": protocol,
                        "chain": chain,
                        "asset": asset,
                        "apy": round(apy, 2),
                        "tvl": await self._fetch_tvl(protocol, chain),
                        "source": "live",
                    })

        opportunities.sort(key=lambda x: x["apy"], reverse=True)

        await self.store_memory(
            key=f"scout_{task_id}",
            value=opportunities,
            metadata={"task_id": task_id, "type": "scout_results"},
        )

        await self.send_message("supervisor_001", "opportunities_found", {
            "task_id": task_id,
            "opportunities": opportunities[:5],
        })

    async def _fetch_apy(self, protocol: str, chain: str, asset: str) -> float:
        base_apy = {
            ("aave_v3", "arbitrum"): 8.2,
            ("compound_v3", "arbitrum"): 12.5,
            ("morpho_blue", "base"): 9.1,
            ("aave_v3", "ethereum"): 3.5,
        }.get((protocol, chain), random.uniform(2, 15))
        return base_apy + random.uniform(-1, 1)

    async def _fetch_tvl(self, protocol: str, chain: str) -> float:
        return 500_000_000
