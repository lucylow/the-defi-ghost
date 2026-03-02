import { DemoFlow } from './types';

export const PRESET_QUERIES = [
  "Find me the best yield for 5,000 USDC",
  "What's the risk of lending on Aave?",
  "Compare Arbitrum vs Base yields",
  "Show me low-risk stablecoin options",
];

export const DEMO_FLOWS: Record<string, DemoFlow> = {
  "Find me the best yield for 5,000 USDC": {
    messages: [
      { delay: 500, text: "I'm on it! Let me assemble the team. 🔍", role: "agent" },
      { delay: 6000, text: "Analysis complete! Here's what we found:\n\n🏆 **Top Opportunity**: 12.5% APY on Compound (Arbitrum)\n📊 Risk Score: 3/10 ✅\n⛽ Estimated Gas: ~$12\n🔒 Utilization: 82% (healthy)\n\nShall I prepare the transaction for you?", role: "agent" },
    ],
    agents: [
      { delay: 800, index: 3, status: "active", message: "Scanning Aave (Arbitrum): 8.2% APY..." },
      { delay: 1200, index: 3, status: "active", message: "Scanning Compound (Arbitrum): 12.5% APY 🔥" },
      { delay: 1600, index: 3, status: "done", message: "Scanning Morpho (Base): 9.1% APY ✅" },
      { delay: 2000, index: 1, status: "active", message: "Compound's rate is highest! TVL growing 📈" },
      { delay: 2500, index: 2, status: "active", message: "Checking utilization: 82% — moderate risk" },
      { delay: 3000, index: 4, status: "active", message: "Arbitrum gas: 0.1 gwei — perfect timing ⛽" },
      { delay: 3500, index: 5, status: "active", message: "Checking position limits..." },
      { delay: 4200, index: 5, status: "done", message: "Risk score: 3/10 ✅ All checks passed" },
      { delay: 4800, index: 1, status: "done", message: "Recommendation: Compound Arbitrum confirmed 🎯" },
    ],
  },
  "What's the risk of lending on Aave?": {
    messages: [
      { delay: 500, text: "Running a full risk assessment on Aave. Consulting the Risk Governor and Bear Analyst... 🛡️", role: "agent" },
      { delay: 5500, text: "**Aave Risk Assessment**:\n\n🛡️ Overall Risk: **4/10** (Low-Medium)\n✅ Smart Contract: Audited 5x, battle-tested\n⚠️ Liquidation Risk: Low at current market conditions\n📊 Utilization: 78% (healthy range)\n\nAave is considered one of the safest DeFi protocols. Suitable for conservative strategies.", role: "agent" },
    ],
    agents: [
      { delay: 800, index: 5, status: "active", message: "Analyzing Aave smart contract audits..." },
      { delay: 1500, index: 2, status: "active", message: "Checking historical liquidation events..." },
      { delay: 2200, index: 2, status: "done", message: "Bear case: Oracle risk is manageable ✅" },
      { delay: 3000, index: 5, status: "active", message: "Calculating overall risk score..." },
      { delay: 4000, index: 5, status: "done", message: "Final risk score: 4/10 — Low-Medium ✅" },
    ],
  },
  "Compare Arbitrum vs Base yields": {
    messages: [
      { delay: 500, text: "Launching cross-chain comparison. Scout is on the move! 🌐", role: "agent" },
      { delay: 6000, text: "**Chain Comparison**:\n\n🔵 **Arbitrum**: Avg 10.8% APY | Gas ~$0.12 | 12 protocols\n🟣 **Base**: Avg 8.3% APY | Gas ~$0.04 | 7 protocols\n\n🏆 Arbitrum wins on yield, Base wins on gas. For $5k+, Arbitrum is better net.", role: "agent" },
    ],
    agents: [
      { delay: 800, index: 3, status: "active", message: "Scanning all Arbitrum protocols..." },
      { delay: 1400, index: 3, status: "active", message: "Scanning all Base protocols..." },
      { delay: 2000, index: 4, status: "active", message: "Comparing gas costs across chains..." },
      { delay: 2800, index: 1, status: "active", message: "Arbitrum has higher yield concentration 📈" },
      { delay: 3500, index: 4, status: "done", message: "Base gas 70% cheaper, but yields lag ⛽" },
      { delay: 4200, index: 3, status: "done", message: "Comparison complete ✅" },
    ],
  },
  "Show me low-risk stablecoin options": {
    messages: [
      { delay: 500, text: "Filtering for stablecoin vaults with risk score ≤ 3/10... 🔒", role: "agent" },
      { delay: 5500, text: "**Low-Risk Stablecoin Options**:\n\n🥇 Aave USDC (Arbitrum): 6.1% APY | Risk 2/10\n🥈 Compound USDT (Mainnet): 5.8% APY | Risk 2/10\n🥉 Morpho USDC (Base): 7.2% APY | Risk 3/10\n\nAll options battle-tested with 12+ months of audits.", role: "agent" },
    ],
    agents: [
      { delay: 600, index: 3, status: "active", message: "Filtering stablecoin vaults only..." },
      { delay: 1200, index: 5, status: "active", message: "Screening for audited contracts only..." },
      { delay: 2000, index: 2, status: "active", message: "Bear check: depeg risk on all assets..." },
      { delay: 2800, index: 2, status: "done", message: "Depeg risk negligible for USDC/USDT ✅" },
      { delay: 3400, index: 5, status: "done", message: "Risk ≤3/10 confirmed for all 3 options ✅" },
    ],
  },
};

export const initialAgents = [
  { name: "The Ghost", emoji: "👻", message: "Ready to assist", status: "waiting" as const, color: "175 100% 50%" },
  { name: "Bull Analyst", emoji: "📈", message: "Monitoring markets", status: "waiting" as const, color: "145 70% 50%" },
  { name: "Bear Analyst", emoji: "📉", message: "On standby", status: "waiting" as const, color: "0 84% 60%" },
  { name: "Scout", emoji: "🕵️", message: "Scanning protocols", status: "waiting" as const, color: "265 80% 65%" },
  { name: "Gas Analyst", emoji: "⛽", message: "Watching gas prices", status: "waiting" as const, color: "40 100% 60%" },
  { name: "Risk Governor", emoji: "🛡️", message: "Checking limits", status: "waiting" as const, color: "200 100% 55%" },
];

export const memoryItems = [
  "Remembered: User prefers conservative strategies",
  "Stored: Last query was for USDC yield",
  "Learned: User rejected high-gas transactions",
  "Cached: Compound Arbitrum — previously approved",
  "Noted: Risk tolerance set to moderate",
  "Memory: Bull analyst correct 78% of the time",
];
