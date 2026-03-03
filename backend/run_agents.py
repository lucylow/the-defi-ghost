# run_agents.py
"""Run all DeFi Ghost agents in-process (local dev)."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from deploy import AGENTS, TEAM_ID, agent_config


async def main():
    tasks = []
    for spec in AGENTS:
        config = agent_config(
            spec["agent_id"],
            spec["role"],
            spec["persona"],
            **spec.get("kwargs", {}),
        )
        agent = spec["cls"](config, **spec.get("kwargs", {}))
        tasks.append(asyncio.create_task(agent.run()))
        print(f"Started {spec['agent_id']}")
    print("All agents running. Use test_client.py to send a user message. Ctrl+C to stop.")
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
