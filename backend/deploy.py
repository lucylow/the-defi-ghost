# deploy.py
"""
Deploy DeFi Ghost agents. Uses in-process message bus for local runs.
For production, wire to OpenClaw TeamClient and spawn agents remotely.
"""
import asyncio
import json
import sys
import os

# Run from backend directory so imports resolve
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from base_agent import AgentConfig
from agents.supervisor import SupervisorAgent
from agents.market_analyst import MarketAnalystAgent
from agents.opportunity_scout import OpportunityScoutAgent
from agents.gas_analyst import GasAnalystAgent
from agents.risk_governor import RiskGovernorAgent
from agents.strategy_architect import StrategyArchitectAgent
from agents.transaction_builder import TransactionBuilderAgent
from agents.custody_manager import CustodyManagerAgent
from agents.memory_curator import MemoryCuratorAgent


TEAM_ID = settings.OPENCLAW_TEAM_ID or "defi_ghost_team"


def agent_config(agent_id: str, role: str, persona: dict, **kwargs) -> AgentConfig:
    return AgentConfig(
        agent_id=agent_id,
        team_id=TEAM_ID,
        role=role,
        persona=persona,
        restore_existing=True,
        **kwargs,
    )


AGENTS = [
    {
        "agent_id": "supervisor_001",
        "role": "supervisor",
        "persona": {
            "traits": ["friendly", "efficient", "clear"],
            "system_prompt": "You are the Supervisor of a DeFi agent team. You coordinate others and communicate with users.",
        },
        "cls": SupervisorAgent,
        "kwargs": {},
    },
    {
        "agent_id": "market_analyst_bull_001",
        "role": "market_analyst_bull",
        "persona": {
            "traits": ["optimistic", "trend-follower"],
            "system_prompt": "You are a bullish market analyst. Always highlight positive trends and opportunities.",
        },
        "cls": MarketAnalystAgent,
        "kwargs": {"bias": "bull"},
    },
    {
        "agent_id": "market_analyst_bear_001",
        "role": "market_analyst_bear",
        "persona": {
            "traits": ["cautious", "skeptical"],
            "system_prompt": "You are a bearish market analyst. Focus on risks and downsides.",
        },
        "cls": MarketAnalystAgent,
        "kwargs": {"bias": "bear"},
    },
    {
        "agent_id": "opportunity_scout_001",
        "role": "opportunity_scout",
        "persona": {
            "traits": ["curious", "data-driven"],
            "system_prompt": "You scan all protocols for yield opportunities.",
        },
        "cls": OpportunityScoutAgent,
        "kwargs": {},
    },
    {
        "agent_id": "gas_analyst_001",
        "role": "gas_analyst",
        "persona": {
            "traits": ["precise", "cost-conscious"],
            "system_prompt": "You monitor gas and MEV to optimize execution.",
        },
        "cls": GasAnalystAgent,
        "kwargs": {},
    },
    {
        "agent_id": "risk_governor_001",
        "role": "risk_governor",
        "persona": {
            "traits": ["protective", "authoritative"],
            "system_prompt": "You are the risk guardian. You veto unsafe moves.",
        },
        "cls": RiskGovernorAgent,
        "kwargs": {},
    },
    {
        "agent_id": "strategy_architect_001",
        "role": "strategy_architect",
        "persona": {
            "traits": ["methodical", "structured"],
            "system_prompt": "You design multi-step DeFi strategies.",
        },
        "cls": StrategyArchitectAgent,
        "kwargs": {},
    },
    {
        "agent_id": "transaction_builder_001",
        "role": "transaction_builder",
        "persona": {
            "traits": ["precise", "technical"],
            "system_prompt": "You build transaction calldata.",
        },
        "cls": TransactionBuilderAgent,
        "kwargs": {},
    },
    {
        "agent_id": "custody_manager_001",
        "role": "custody_manager",
        "persona": {
            "traits": ["secure", "reliable"],
            "system_prompt": "You handle transaction signing and execution.",
        },
        "cls": CustodyManagerAgent,
        "kwargs": {},
    },
    {
        "agent_id": "memory_curator_001",
        "role": "memory_curator",
        "persona": {
            "traits": ["retentive", "wise"],
            "system_prompt": "You store and recall memories for all agents.",
        },
        "cls": MemoryCuratorAgent,
        "kwargs": {},
    },
]


async def run_all_agents():
    """Run all agents in the same process; they communicate via in-memory mailbox."""
    tasks = []
    for spec in AGENTS:
        config = agent_config(
            spec["agent_id"],
            spec["role"],
            spec["persona"],
            **spec.get("kwargs", {}),
        )
        agent = spec["cls"](config)
        tasks.append(asyncio.create_task(agent.run()))
        print(f"Spawned {spec['agent_id']}")
    print("All agents running. Press Ctrl+C to stop.")
    await asyncio.gather(*tasks)


async def deploy_agents():
    """Print deployment summary and optionally run agents."""
    print("DeFi Ghost agent definitions:")
    for a in AGENTS:
        print(f"  - {a['agent_id']} ({a['role']})")
    print("\nTo run agents in-process (local dev):")
    print("  python run_agents.py")
    print("\nTo use OpenClaw TeamClient (when available), call client.spawn_agent(...) for each.")


if __name__ == "__main__":
    asyncio.run(deploy_agents())
