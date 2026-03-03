# deploy_team.py
"""OpenClaw orchestration: spawn the full DeFi Ghost agent team."""

import asyncio
import os
import sys
from pathlib import Path

# Run from backend directory
BACKEND_ROOT = Path(__file__).resolve().parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from config import settings


async def spawn_agents():
    try:
        from openclaw_sdk import TeamClient
    except ImportError:
        print("openclaw_sdk not installed. Run: pip install openclaw-sdk")
        return

    api_key = getattr(settings, "OPENCLAW_API_KEY", None) or os.getenv("OPENCLAW_API_KEY")
    team_id = getattr(settings, "OPENCLAW_TEAM_ID", None) or os.getenv("OPENCLAW_TEAM_ID")
    if not api_key or not team_id:
        print("Set OPENCLAW_API_KEY and OPENCLAW_TEAM_ID in .env")
        return

    client = TeamClient(api_key=api_key, team_id=team_id)
    agents_dir = BACKEND_ROOT / "agents"

    # 1. Supervisor
    await client.spawn_agent(
        agent_id="supervisor_001",
        script_path=str(agents_dir / "supervisor_agent.py"),
        env_vars={"ROLE": "supervisor"},
    )

    # 2. Research Team
    await client.spawn_agent(
        "market_analyst_bull",
        str(agents_dir / "market_analyst.py"),
        env={"BIAS": "bull"},
    )
    await client.spawn_agent(
        "market_analyst_bear",
        str(agents_dir / "market_analyst.py"),
        env={"BIAS": "bear"},
    )
    await client.spawn_agent(
        "opportunity_scout",
        str(agents_dir / "opportunity_scout.py"),
    )
    await client.spawn_agent(
        "gas_analyst",
        str(agents_dir / "gas_analyst.py"),
    )

    # 3. Risk Team
    await client.spawn_agent(
        "risk_governor",
        str(agents_dir / "risk_governor.py"),
    )
    await client.spawn_agent(
        "position_limiter",
        str(agents_dir / "position_limiter.py"),
    )

    # 4. Execution Team
    await client.spawn_agent(
        "strategy_architect",
        str(agents_dir / "strategy_architect.py"),
    )
    await client.spawn_agent(
        "transaction_builder",
        str(agents_dir / "transaction_builder.py"),
    )
    await client.spawn_agent(
        "gas_optimizer",
        str(agents_dir / "gas_optimizer.py"),
    )
    await client.spawn_agent(
        "custody_manager",
        str(agents_dir / "custody_manager.py"),
    )

    # 5. Memory & Governance
    await client.spawn_agent(
        "memory_curator",
        str(agents_dir / "memory_curator.py"),
    )
    await client.spawn_agent(
        "governance_arbiter",
        str(agents_dir / "governance_arbiter.py"),
    )

    print("All agents spawned successfully.")


if __name__ == "__main__":
    asyncio.run(spawn_agents())
