# market_analyst.py
"""Market Analyst (Bull/Bear/Neutral). Analyzes market data with configurable bias."""

import random
from typing import Any, Dict

from .base_agent import DeFiGhostAgent, AgentConfig


class MarketAnalystAgent(DeFiGhostAgent):
    def __init__(self, config: AgentConfig, bias: str = "neutral"):
        super().__init__(config)
        self.bias = bias  # "bull", "bear", "neutral"

    async def on_analyze_yield(self, payload: Dict[str, Any]):
        task_id = payload.get("task_id")
        query = payload.get("query", "")

        market_data = await self.fetch_market_data()
        analysis = self.analyze_with_bias(market_data, query)

        await self.send_message("supervisor_001", "market_analysis", {
            "task_id": task_id,
            "bias": self.bias,
            "analysis": analysis,
            "confidence": random.uniform(0.6, 0.95),
        })

    async def fetch_market_data(self) -> Dict[str, Any]:
        """In real implementation: DeFi Llama, Coingecko, etc."""
        return {
            "total_value_locked": "50B",
            "eth_price": 3500,
        }

    def analyze_with_bias(self, data: Dict[str, Any], query: str) -> str:
        """Placeholder for LLM call with bias instruction."""
        if self.bias == "bull":
            return (
                "Market looks strong. ETH dominance increasing. "
                "Opportunities in lending protocols."
            )
        elif self.bias == "bear":
            return (
                "Caution advised. Volatility high. "
                "Focus on stablecoin yields only."
            )
        else:
            return "Market neutral. Scanning all opportunities."


def main():
    import os
    import asyncio
    try:
        from config import settings
    except ImportError:
        from backend.config import settings
    bias = os.getenv("BIAS", "neutral")
    config = AgentConfig(
        agent_id=os.getenv("AGENT_ID", "market_analyst"),
        team_id=settings.OPENCLAW_TEAM_ID,
        role="market_analyst",
        memory_store_id=settings.ETHOSWARM_MEMORY_STORE_ID,
    )
    agent = MarketAnalystAgent(config, bias=bias)
    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
