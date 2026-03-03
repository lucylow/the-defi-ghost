# position_limiter.py
"""Position Limiter: enforces position limits; can broadcast veto to Risk Governor."""

from typing import Any, Dict

from .base_agent import DeFiGhostAgent, AgentConfig


class PositionLimiterAgent(DeFiGhostAgent):
    """Called by Risk Governor or runs independently and broadcasts veto."""

    async def on_validate_opportunity(self, payload: Dict[str, Any]):
        # Optional: run independent checks and send veto to risk_governor if limit exceeded
        pass
