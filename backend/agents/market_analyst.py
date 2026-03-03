# market_analyst.py
"""Market Analyst (Bull/Bear/Neutral). Identity-driven analysis with persona and user context."""

import json
import random
from typing import Any, Dict

from base_agent import DeFiGhostAgent, AgentConfig
from openclaw_agent_context import Message


class MarketAnalystAgent(DeFiGhostAgent):
    def __init__(self, config: AgentConfig, bias: str = "neutral"):
        super().__init__(config)
        self.bias = bias  # "bull", "bear", "neutral"

    async def handle_message(self, message: Message) -> None:
        handler = getattr(self, f"on_{message.type}", None)
        if handler:
            await handler(message.payload)
        else:
            self.logger.warning(f"No handler for {message.type}")

    async def on_analyze_yield(self, payload: Dict[str, Any]):
        task_id = payload.get("task_id")
        query = payload.get("query", "")
        user_id = payload.get("user_id", "")

        market_data = await self.fetch_market_data()
        analysis = await self.generate_analysis(market_data, query)

        await self.store_memory(
            key=f"task_{task_id}_analysis",
            value={"task_id": task_id, "analysis": analysis, "bias": self.bias},
            metadata={"task_id": task_id, "user_id": user_id},
        )
        await self.send_message("supervisor_001", "market_analysis", {
            "task_id": task_id,
            "bias": self.bias,
            "analysis": analysis,
            "confidence": random.uniform(0.6, 0.95),
        })

    async def generate_analysis(self, market_data: Dict[str, Any], query: str) -> str:
        """Generate analysis blending agent persona and user context (identity spec)."""
        persona = getattr(self, "persona", None)
        profile = getattr(self, "user_profile", None) or {}
        memories = getattr(self, "user_context_memories", [])
        risk = profile.get("risk_tolerance", profile.get("max_risk", 5))
        preferred = profile.get("preferred_protocols", [])
        blacklisted = profile.get("blacklisted_protocols", [])

        memory_lines = []
        for m in memories[:10]:
            v = m.get("value")
            if isinstance(v, dict):
                memory_lines.append(json.dumps(v)[:200])
            else:
                memory_lines.append(str(v)[:200])

        prompt = f"""
You are {getattr(persona, 'name', self.role)} a {getattr(persona, 'role', self.role)}.
Your personality: {getattr(persona, 'traits', [self.bias])}

You are currently serving a user with:
- Risk tolerance: {risk}/10
- Preferred protocols: {preferred or 'any'}
- Blacklisted protocols: {blacklisted or 'none'}

Based on your past experiences (memories), you recall:
{chr(10).join(memory_lines) or '(no relevant memories)'}

Current market data:
{json.dumps(market_data)}

Query: {query}

Provide a market analysis tailored to this user (respect risk and protocol preferences).
"""
        if getattr(self, "embedder", None) and getattr(self, "llm_generate", None):
            return await self.llm_generate(
                prompt,
                system_prompt=getattr(persona, "system_prompt", None),
                temperature=0.5,
            )
        return self.analyze_with_bias(market_data, query)

    async def fetch_market_data(self) -> Dict[str, Any]:
        """In real implementation: DeFi Llama, Coingecko, etc."""
        return {
            "total_value_locked": "50B",
            "eth_price": 3500,
        }

    def analyze_with_bias(self, data: Dict[str, Any], query: str) -> str:
        """Placeholder when LLM not configured."""
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
        persona={"traits": [bias], "system_prompt": f"You are a {bias} market analyst."},
        restore_existing=True,
    )
    agent = MarketAnalystAgent(config, bias=bias)
    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
