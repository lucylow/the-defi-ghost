# agents/custody_manager.py
"""Custody Manager: signs and sends transactions."""
import asyncio
import time
from typing import Dict, Any, Optional

from base_agent import DeFiGhostAgent, AgentConfig
from openclaw_agent_context import Message
from config import settings

try:
    from web3 import Web3
    from eth_account import Account
except ImportError:
    Web3 = None
    Account = None


class CustodyManagerAgent(DeFiGhostAgent):
    def __init__(self, config: AgentConfig):
        super().__init__(config)
        self.user_keys: Dict[str, str] = {}

    async def handle_message(self, message: Message) -> None:
        if message.type == "execute_txs":
            await self._execute(message.payload)

    async def _execute(self, payload: Dict[str, Any]) -> None:
        task_id = payload["task_id"]
        tx_sequence = payload["tx_sequence"]
        user_id = payload.get("user_id")

        private_key = await self._get_user_key(user_id)
        if not private_key:
            await self.send_message("supervisor_001", "execution_result", {
                "task_id": task_id,
                "success": False,
                "error": "No signing key available",
            })
            return

        if not Web3 or not Account:
            await self.send_message("supervisor_001", "execution_result", {
                "task_id": task_id,
                "success": False,
                "error": "web3/eth_account not installed",
            })
            return

        receipts = []
        for tx in tx_sequence:
            try:
                chain = tx.get("chain", "ethereum")
                rpc_url = settings.RPC_URLS.get(chain)
                if not rpc_url:
                    raise ValueError(f"No RPC URL for chain {chain}")

                w3 = Web3(Web3.HTTPProvider(rpc_url))
                account = Account.from_key(private_key)

                tx_params = {
                    "from": account.address,
                    "to": Web3.to_checksum_address(tx["to"]) if tx.get("to") else None,
                    "data": tx.get("data", "0x"),
                    "value": tx.get("value", 0),
                    "gas": tx.get("gas_limit", 300000),
                }
                if tx.get("gas_price"):
                    tx_params["gasPrice"] = int(tx["gas_price"] * 1e9)

                nonce = w3.eth.get_transaction_count(account.address)
                tx_params["nonce"] = nonce

                signed = account.sign_transaction(tx_params)
                tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

                receipt = await self._wait_for_receipt(w3, tx_hash.hex())
                receipts.append(receipt)

            except Exception as e:
                await self.send_message("supervisor_001", "execution_result", {
                    "task_id": task_id,
                    "success": False,
                    "error": str(e),
                })
                return

        last_hash = receipts[-1].get("transactionHash") if receipts else None
        tx_hex = last_hash.hex() if hasattr(last_hash, "hex") and last_hash else (str(last_hash) if last_hash else None)
        await self.send_message("supervisor_001", "execution_result", {
            "task_id": task_id,
            "success": True,
            "tx_hash": tx_hex,
        })

    async def _get_user_key(self, user_id: Optional[str]) -> Optional[str]:
        # In production: retrieve from secure vault
        return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

    async def _wait_for_receipt(self, w3: Web3, tx_hash: str, timeout: int = 120) -> Dict[str, Any]:
        start = time.time()
        while time.time() - start < timeout:
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            if receipt:
                return dict(receipt)
            await asyncio.sleep(2)
        raise TimeoutError("Transaction not confirmed")
