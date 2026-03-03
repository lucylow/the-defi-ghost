# test_client.py
"""
Simulate a user message to the Supervisor. In local mode, injects the message
into the Supervisor's mailbox and triggers on_user_message.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings
from base_agent import AgentConfig
from openclaw_agent_context import Message, _agent_queues
from agents.supervisor import SupervisorAgent


TEAM_ID = settings.OPENCLAW_TEAM_ID or "defi_ghost_team"


async def send_test_message(user_id: str = "test_user_123", text: str = "Find best yield for 5000 USDC"):
    """Create a supervisor, inject a user message, and process it."""
    config = AgentConfig(
        agent_id="supervisor_001",
        team_id=TEAM_ID,
        role="supervisor",
        persona={
            "traits": ["friendly", "efficient"],
            "system_prompt": "You are the Supervisor of a DeFi agent team.",
        },
    )
    supervisor = SupervisorAgent(config)

    # Inject user message as if from channel
    payload = {
        "user_id": user_id,
        "text": text,
        "channel": "telegram",
    }
    msg = Message(sender="channel", recipient="supervisor_001", type="user_message", payload=payload)
    await supervisor.handle_message(msg)

    # Check outbox for reply
    from openclaw_agent_context import Channel
    outbox = Channel.get_outbox("telegram", user_id)
    print("Replies to user:", outbox)


if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else "Find best yield for 5000 USDC"
    asyncio.run(send_test_message(text=text))
