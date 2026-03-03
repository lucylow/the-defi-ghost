# agents/supervisor.py
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from base_agent import (
    DeFiGhostAgent,
    AgentConfig,
    MEMORY_TYPE_EPISODIC,
    MEMORY_TYPE_USER,
)
from openclaw_agent_context import Message

# Sliding window size for conversation history (short-term working memory)
CONVERSATION_HISTORY_MAX = 50


class SupervisorAgent(DeFiGhostAgent):
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.active_tasks: Dict[str, Dict[str, Any]] = {}
        self.user_sessions: Dict[str, Any] = {}
        self.conversation_history: List[Dict[str, Any]] = []

    async def add_to_history(self, user_id: str, message: str) -> None:
        """Add a message to short-term conversation history; keep last N only."""
        self.conversation_history.append({
            "user": user_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        })
        if len(self.conversation_history) > CONVERSATION_HISTORY_MAX:
            self.conversation_history.pop(0)

    async def handle_message(self, message: Message) -> None:
        """Route messages based on type."""
        handler = getattr(self, f"on_{message.type}", None)
        if handler:
            await handler(message.payload)
        else:
            self.logger.warning(f"No handler for {message.type}")

    async def on_user_message(self, payload: Dict[str, Any]) -> None:
        """Handle incoming user message from channel."""
        user_id = payload["user_id"]
        text = payload["text"]
        channel = payload.get("channel", "telegram")

        await self._log_activity(f"Received from user {user_id}: {text}")
        await self.add_to_history(user_id, text)

        await self.set_working_memory(f"user_{user_id}_last_msg", text, ttl=300)

        intent = await self._parse_intent(text, user_id)

        if intent.get("action") == "yield_query":
            await self._handle_yield_query(user_id, intent, channel)
        elif intent.get("action") == "approve":
            await self._handle_approval(user_id, intent)
        elif intent.get("action") == "reject":
            await self._handle_rejection(user_id, intent)
        elif intent.get("action") == "status":
            await self._send_status(user_id, channel)
        else:
            await self.send_to_user(
                user_id,
                "I'm not sure how to help with that. Try asking about yields.",
                channel,
            )

    async def _parse_intent(self, text: str, user_id: str) -> Dict[str, Any]:
        """Use LLM to parse user intent (RAG: inject relevant memories)."""
        profile = await self.recall_memory(
            query=f"user profile {user_id}",
            namespace="user_profiles",
            top_k=1,
        )
        profile_text = profile[0]["value"] if profile else "No profile yet"
        memory_context = await self.recall_relevant_memories(
            query=f"recent interactions and preferences for user {user_id}",
            namespace=f"agent_{self.agent_id}",
            top_k=5,
        )

        prompt = f"""
        User message: "{text}"
        User profile: {profile_text}

        Relevant memory context:
        {memory_context}

        Determine the user's intent. Possible actions:
        - yield_query: user wants to find yield opportunities
        - approve: user approves a previously presented opportunity
        - reject: user rejects
        - status: user wants current portfolio/agent status
        - modify: user wants to modify parameters (amount, protocol, etc.)

        Return JSON with:
        - action: string
        - parameters: dict (amount, protocol, chain, etc. if applicable)
        - confidence: float 0-1
        """

        schema = {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["yield_query", "approve", "reject", "status", "modify"],
                },
                "parameters": {"type": "object"},
                "confidence": {"type": "number"},
            },
            "required": ["action", "confidence"],
        }

        result = await self.llm_generate_structured(prompt, schema)
        return result

    async def _handle_yield_query(self, user_id: str, intent: Dict[str, Any], channel: str) -> None:
        """Initiate yield analysis workflow."""
        task_id = str(uuid.uuid4())
        self.active_tasks[task_id] = {
            "task_id": task_id,
            "user_id": user_id,
            "status": "initiated",
            "intent": intent,
            "channel": channel,
            "created_at": datetime.utcnow().isoformat(),
        }

        await self.set_working_memory(f"task_{task_id}", json.dumps(self.active_tasks[task_id]), ttl=3600)

        await self.send_to_user(
            user_id,
            "DeFi Ghost is analyzing yields. I'll gather the team...",
            channel,
        )

        await self.broadcast(
            "analyze_yield",
            {
                "task_id": task_id,
                "user_id": user_id,
                "query": intent.get("parameters", {}).get("query", ""),
                "amount": intent.get("parameters", {}).get("amount", 5000),
                "asset": intent.get("parameters", {}).get("asset", "USDC"),
            },
        )

    async def _handle_rejection(self, user_id: str, intent: Dict[str, Any]) -> None:
        task = next(
            (
                t
                for t in self.active_tasks.values()
                if t["user_id"] == user_id and t.get("status") == "awaiting_approval"
            ),
            None,
        )
        if task:
            task["status"] = "rejected"
            await self.send_to_user(user_id, "Opportunity rejected.", task["channel"])

    async def _send_status(self, user_id: str, channel: str) -> None:
        await self.send_to_user(
            user_id,
            f"Active tasks: {len([t for t in self.active_tasks.values() if t.get('status') != 'rejected'])}.",
            channel,
        )

    async def on_opportunities_found(self, payload: Dict[str, Any]) -> None:
        """Receive opportunities from Opportunity Scout."""
        task_id = payload["task_id"]
        opportunities = payload["opportunities"]

        task = self.active_tasks.get(task_id)
        if not task:
            return

        task["opportunities"] = opportunities
        task["status"] = "opportunities_received"

        await self.store_memory(
            key=f"task_{task_id}_opportunities",
            value=opportunities,
            metadata={"task_id": task_id, "user_id": task["user_id"]},
        )

        await self.send_message("risk_governor_001", "validate_opportunities", {
            "task_id": task_id,
            "user_id": task["user_id"],
            "opportunities": opportunities,
        })

    async def on_risk_assessment(self, payload: Dict[str, Any]) -> None:
        """Receive risk assessment and prepare for user."""
        task_id = payload["task_id"]
        approved_opportunities = payload["approved"]
        risk_scores = payload.get("risk_scores", {})

        task = self.active_tasks.get(task_id)
        if not task:
            return

        if not approved_opportunities:
            await self.send_to_user(
                task["user_id"],
                "No opportunities passed risk checks within your profile. Try adjusting your risk tolerance?",
                task["channel"],
            )
            return

        profile = await self.get_user_profile(task["user_id"])
        best = await self.decide_best_opportunity(approved_opportunities, risk_scores, profile)
        task["pending_opportunity"] = best
        task["status"] = "awaiting_approval"

        msg = f"""
*DeFi Ghost Opportunity*

*Protocol*: {best.get('protocol')} on {best.get('chain')}
*Asset*: {best.get('asset')}
*Expected APY*: {best.get('apy')}%
*Estimated Gas*: ${best.get('gas_estimate', 'N/A')}
*Risk Score*: {risk_scores.get(best.get('id'), 'N/A')}/10

*Analysis*: {best.get('analysis', '')}

Reply with *APPROVE* to execute, *MODIFY* to change parameters, or *REJECT*.
        """
        await self.send_to_user(task["user_id"], msg, task["channel"])

    async def get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Retrieve user preferences and risk profile from long-term memory."""
        results = await self.recall_memory(
            query=f"user profile preferences risk {user_id}",
            namespace="user_profiles",
            top_k=1,
        )
        if results:
            val = results[0].get("value")
            if isinstance(val, dict):
                return val
        return {
            "max_risk": 5,
            "preferred_protocols": [],
            "blacklisted_protocols": [],
            "preferred_chains": ["arbitrum", "base"],
        }

    async def decide_best_opportunity(
        self,
        opportunities: List[Dict[str, Any]],
        risk_scores: Dict[str, float],
        profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Choose best opportunity using expected value, risk, and user preferences."""
        scored: List[tuple] = []
        for opp in opportunities:
            opp_id = opp.get("id", "")
            risk = risk_scores.get(opp_id, 5.0)
            apy = float(opp.get("apy", 0) or 0)
            score = apy * (1 - risk / 10.0)
            if opp.get("protocol") in profile.get("preferred_protocols", []):
                score *= 1.2
            if opp.get("protocol") in profile.get("blacklisted_protocols", []):
                score = 0.0
            scored.append((score, opp))
        scored.sort(key=lambda x: -x[0])
        return scored[0][1] if scored else opportunities[0]

    async def _handle_approval(self, user_id: str, intent: Dict[str, Any]) -> None:
        """User approved an opportunity."""
        task = next(
            (
                t
                for t in self.active_tasks.values()
                if t["user_id"] == user_id and t.get("status") == "awaiting_approval"
            ),
            None,
        )
        if not task:
            await self.send_to_user(user_id, "No pending opportunity to approve.")
            return

        opportunity = task["pending_opportunity"]
        task_id = task["task_id"]
        await self.send_message("strategy_architect_001", "execute_opportunity", {
            "task_id": task_id,
            "opportunity": opportunity,
            "user_id": user_id,
        })
        await self.send_to_user(user_id, "Approval received. Preparing transaction...", task["channel"])
        task["status"] = "executing"

    async def on_execution_result(self, payload: Dict[str, Any]) -> None:
        """Receive execution result from Custody Manager."""
        task_id = payload["task_id"]
        success = payload["success"]
        tx_hash = payload.get("tx_hash")
        error = payload.get("error")

        task = self.active_tasks.get(task_id)
        if not task:
            return

        if success:
            tx_preview = (tx_hash[:10] + "...") if tx_hash else "N/A"
            await self.send_to_user(
                task["user_id"],
                f"Funds deployed! Transaction: {tx_preview}",
                task["channel"],
            )
        else:
            await self.send_to_user(
                task["user_id"],
                f"Execution failed: {error}",
                task["channel"],
            )

        outcome = {"success": success, "tx_hash": tx_hash, "error": error}
        await self.store_memory(
            key=f"task_{task_id}_outcome",
            value=outcome,
            metadata={"task_id": task_id, "user_id": task["user_id"]},
            memory_type=MEMORY_TYPE_EPISODIC,
        )
        await self.learn_from_outcome(task_id, outcome, task)

        if task_id in self.active_tasks:
            del self.active_tasks[task_id]
