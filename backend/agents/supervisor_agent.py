# supervisor_agent.py
"""Supervisor: user-facing agent. Interprets commands, spawns tasks, coordinates the team."""

from datetime import datetime
from typing import Any, Dict, List
import uuid

from .base_agent import DeFiGhostAgent, AgentConfig


class SupervisorAgent(DeFiGhostAgent):
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.user_context: Dict[str, Any] = {}

    async def on_user_message(self, payload: Dict[str, Any]):
        """Handle incoming user command from Telegram/Dashboard."""
        user_id = payload.get("user_id")
        message = payload.get("text", "")

        await self.store_memory(f"user_{user_id}_last_input", message)

        if "yield" in message.lower() or "opportunity" in message.lower():
            await self.handle_yield_request(user_id, message)
        elif "status" in message.lower():
            await self.report_status(user_id)
        elif "stop" in message.lower():
            await self.cancel_tasks(user_id)
        else:
            await self.send_user_reply(
                user_id,
                "I'm your DeFi Ghost. Ask me about yield opportunities or portfolio status.",
            )

    async def handle_yield_request(self, user_id: str, raw_message: str):
        """Initiate a yield analysis workflow."""
        task_id = str(uuid.uuid4())
        self.active_tasks[task_id] = {
            "user_id": user_id,
            "status": "initiated",
            "query": raw_message,
            "created_at": datetime.utcnow().isoformat(),
        }

        await self.store_memory(f"task_{task_id}", self.active_tasks[task_id])

        await self.broadcast("analyze_yield", {
            "task_id": task_id,
            "user_id": user_id,
            "query": raw_message,
        })

        await self.send_user_reply(
            user_id,
            f"Ghost is analyzing yields. I'll get back to you soon. (Task {task_id[:8]})",
        )

    async def report_status(self, user_id: str):
        """Report portfolio/status to user (placeholder)."""
        await self.send_user_reply(
            user_id,
            "Portfolio status: (connect your wallet and positions for live data)",
        )

    async def cancel_tasks(self, user_id: str):
        """Cancel active tasks for user."""
        to_remove = [t for t, d in self.active_tasks.items() if d.get("user_id") == user_id]
        for task_id in to_remove:
            del self.active_tasks[task_id]
        await self.send_user_reply(user_id, "Tasks cancelled.")

    async def on_analysis_complete(self, payload: Dict[str, Any]):
        """Receive results from Research Team."""
        task_id = payload["task_id"]
        opportunities = payload.get("opportunities", [])

        await self.store_memory(f"task_{task_id}_opportunities", opportunities)

        task = self.active_tasks.get(task_id, {})
        await self.broadcast("validate_opportunity", {
            "task_id": task_id,
            "user_id": task.get("user_id"),
            "opportunities": opportunities,
        })

    async def on_opportunities_found(self, payload: Dict[str, Any]):
        """Research team sent opportunities; treat as analysis complete for flow."""
        await self.on_analysis_complete(payload)

    async def on_risk_validation(self, payload: Dict[str, Any]):
        """Receive risk assessment and prepare for user approval."""
        task_id = payload["task_id"]
        approved = payload.get("approved", False)
        risk_score = payload.get("risk_score", 0)
        details = payload.get("details", {})

        task = self.active_tasks.get(task_id)
        if not task:
            return
        user_id = task["user_id"]

        if not approved:
            await self.send_user_reply(
                user_id,
                f"No safe opportunities found. Reason: {details.get('reason', 'Risk tolerance exceeded')}",
            )
            return

        opportunities = payload.get("opportunities")
        if not opportunities:
            # Try to recall from memory
            recalled = await self.recall_memory(f"task_{task_id}_opportunities", top_k=1)
            opportunities = recalled[0] if recalled else []

        if isinstance(opportunities, list) and opportunities:
            opp_list = opportunities
        else:
            opp_list = [opportunities] if opportunities else []

        msg = self._format_opportunities(opp_list, risk_score)
        await self.send_user_reply(user_id, msg)

        self.active_tasks[task_id]["awaiting_approval"] = True
        self.active_tasks[task_id]["risk_score"] = risk_score

    async def on_user_approval(self, payload: Dict[str, Any]):
        """User approved an opportunity."""
        task_id = payload["task_id"]
        selected = payload.get("selected_opportunity")

        await self.broadcast("execute_strategy", {
            "task_id": task_id,
            "opportunity": selected,
        })

    async def on_execution_result(self, payload: Dict[str, Any]):
        """Receive final execution result."""
        task_id = payload.get("task_id")
        success = payload.get("success", False)
        tx_hash = payload.get("tx_hash")
        error = payload.get("error")

        task = self.active_tasks.get(task_id) if task_id else None
        user_id = task["user_id"] if task else None
        if not user_id:
            return

        if success:
            await self.send_user_reply(
                user_id, f"Funds deployed! Transaction: {tx_hash[:10] if tx_hash else 'N/A'}..."
            )
        else:
            await self.send_user_reply(user_id, f"Execution failed: {error or 'Unknown error'}")

    async def send_user_reply(self, user_id: str, text: str):
        """Send message back to user via OpenClaw channel."""
        if self.context is None:
            self.logger.info(f"[Reply to {user_id}] {text}")
            return
        await self.context.channel.send(
            channel_type="telegram",
            recipient=user_id,
            message={"text": text},
        )

    def _format_opportunities(self, opps: List[Dict], risk_score: float) -> str:
        if not opps:
            return "No opportunities to display."
        first = opps[0] if isinstance(opps[0], dict) else {}
        protocol = first.get("protocol", "N/A")
        apy = first.get("apy", "N/A")
        chain = first.get("chain", "")
        return (
            f"**Top Opportunity**\n"
            f"Protocol: {protocol}\n"
            f"Chain: {chain}\n"
            f"APY: {apy}%\n"
            f"Risk Score: {risk_score}/10\n\n"
            f"Reply 'approve' to execute."
        )

    async def run(self):
        """Main loop: listen for messages."""
        if self.context is None:
            self.logger.warning("Supervisor has no OpenClaw context; run loop idle")
            return
        async for message in self.context.mailbox.listen():
            await self.handle_message(message)


def main():
    import os
    import asyncio
    try:
        from config import settings
    except ImportError:
        from backend.config import settings
    config = AgentConfig(
        agent_id=os.getenv("AGENT_ID", "supervisor_001"),
        team_id=settings.OPENCLAW_TEAM_ID,
        role="supervisor",
        memory_store_id=settings.ETHOSWARM_MEMORY_STORE_ID,
    )
    agent = SupervisorAgent(config)
    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
