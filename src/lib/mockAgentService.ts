// mockAgentService.ts – DeFi Ghost demo simulation engine

export type AgentRole =
  | 'supervisor'
  | 'market-analyst-bull'
  | 'market-analyst-bear'
  | 'opportunity-scout'
  | 'gas-analyst'
  | 'risk-governor'
  | 'strategy-architect'
  | 'transaction-builder'
  | 'custody-manager'
  | 'memory-curator';

export interface AgentActivity {
  agentId: AgentRole;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export interface Opportunity {
  id: string;
  protocol: string;
  chain: 'ethereum' | 'arbitrum' | 'base';
  asset: string;
  apy: number;
  tvl: number;
  riskScore?: number;
  gasEstimate?: number;
  amount?: number;
}

export interface SupervisorResponse {
  message: string;
  opportunities?: Opportunity[];
  requiresApproval: boolean;
  bestOpportunity?: Opportunity;
}

export interface MemorySnippet {
  text: string;
  type: 'user' | 'trade' | 'market' | 'system';
}

// ── Generators ──────────────────────────────────────────────────────────────

const PROTOCOLS = [
  { name: 'Aave v3',      chains: ['arbitrum', 'base', 'ethereum'] as const, baseApy: [2, 8]  },
  { name: 'Compound v3',  chains: ['arbitrum', 'base']             as const, baseApy: [3, 12] },
  { name: 'Morpho Blue',  chains: ['base', 'ethereum']             as const, baseApy: [4, 10] },
  { name: 'Curve',        chains: ['ethereum', 'arbitrum']         as const, baseApy: [1, 6]  },
  { name: 'Uniswap V3',   chains: ['arbitrum', 'base']             as const, baseApy: [5, 15] },
];

const rand    = (min: number, max: number) => Math.random() * (max - min) + min;
const roundTo = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

const generateOpportunity = (): Opportunity => {
  const p     = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
  const chain = p.chains[Math.floor(Math.random() * p.chains.length)];
  const asset = ['USDC', 'USDT', 'DAI', 'ETH'][Math.floor(Math.random() * 4)];
  const apy   = roundTo(rand(p.baseApy[0], p.baseApy[1]), 1);
  const tvl   = Math.round(rand(10_000_000, 500_000_000) / 1_000_000) * 1_000_000;
  const gas   = roundTo(chain === 'ethereum' ? rand(20, 50) : rand(2, 15), 2);
  return {
    id:          `${p.name}-${chain}-${asset}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    protocol:    p.name,
    chain,
    asset,
    apy,
    tvl,
    gasEstimate: gas,
  };
};

const assessRisk = (
  opps: Opportunity[],
  profile: { maxRisk: number; preferredChains: string[]; blacklist: string[] }
) => {
  const approved: Opportunity[] = [];
  const vetoed:   Opportunity[] = [];
  const scores:   Record<string, number> = {};

  opps.forEach((o) => {
    let risk = rand(1, 8);
    if (o.tvl  > 200_000_000)         risk -= 1.5;
    if (o.chain === 'ethereum')        risk -= 1;
    if (o.chain === 'arbitrum')        risk -= 0.5;
    if (o.protocol.includes('Uniswap')) risk += 2;
    risk = Math.max(1, Math.min(10, roundTo(risk, 1)));
    scores[o.id] = risk;
    const ok = profile.preferredChains.includes(o.chain)
      && !profile.blacklist.includes(o.protocol)
      && risk <= profile.maxRisk;
    (ok ? approved : vetoed).push({ ...o, riskScore: risk });
  });

  approved.sort((a, b) => (b.apy / scores[b.id]) - (a.apy / scores[a.id]));
  return { approved, vetoed, scores };
};

// ── Memory snippets ──────────────────────────────────────────────────────────

export const memorySnippets: MemorySnippet[] = [
  { text: "User prefers conservative strategies (max risk 5/10).",            type: 'user'   },
  { text: "Last week a similar Compound trade earned +4.2% after gas.",       type: 'trade'  },
  { text: "Aave v3 on Arbitrum historically stable: 6–9% APY.",              type: 'market' },
  { text: "User rejected a high-gas Ethereum trade last month.",              type: 'user'   },
  { text: "Bull analyst correct 78% of the time in the last 30 days.",       type: 'system' },
  { text: "Gas prices on Base are currently at a monthly low.",               type: 'market' },
  { text: "Morpho Blue TVL grew 42% in the past quarter.",                   type: 'market' },
  { text: "User approved 4 out of 5 opportunities on Arbitrum.",             type: 'user'   },
];

let memIdx = 0;
export const getNextMemorySnippet = (): MemorySnippet => memorySnippets[memIdx++ % memorySnippets.length];

// ── Async generator helpers ──────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const STEP = 850;

// ── Scenario: yield query ────────────────────────────────────────────────────

export async function* simulateYieldQuery(
  query: string,
  profile = { maxRisk: 5, preferredChains: ['arbitrum', 'base'] as string[], blacklist: [] as string[] }
): AsyncGenerator<AgentActivity[], SupervisorResponse> {

  yield [{ agentId: 'supervisor', message: `🔍 Searching for "${query}"…`, type: 'info', timestamp: new Date() }];
  await delay(STEP);

  const raw = Array.from({ length: 4 }, generateOpportunity);
  yield raw.map((o) => ({
    agentId: 'opportunity-scout' as AgentRole,
    message: `Found ${o.apy}% APY on ${o.protocol} (${o.chain}) for ${o.asset}`,
    type: 'info' as const,
    timestamp: new Date(),
  }));
  await delay(STEP * 1.5);

  yield [
    { agentId: 'market-analyst-bull', message: `${raw[0].protocol} (${raw[0].chain}) looks strong — TVL growing 📈`,       type: 'info',    timestamp: new Date() },
    { agentId: 'market-analyst-bear', message: `Watch ${raw[1].protocol} utilisation — withdrawal risk ⚠️`,                type: 'warning', timestamp: new Date() },
  ];
  await delay(STEP);

  const avgGas = roundTo(raw.reduce((s, o) => s + (o.gasEstimate ?? 10), 0) / raw.length, 2);
  yield [{ agentId: 'gas-analyst', message: `Avg gas estimate: $${avgGas}. MEV risk low ✅`, type: 'success', timestamp: new Date() }];
  await delay(STEP);

  const { approved, scores } = assessRisk(raw, profile);
  const riskMsg = approved.length > 0
    ? `✅ Approved ${approved.length} opportunit${approved.length > 1 ? 'ies' : 'y'}. Best: ${approved[0].apy}% APY`
    : `❌ No opportunities within risk profile. Try adjusting settings.`;
  yield [{ agentId: 'risk-governor', message: riskMsg, type: approved.length > 0 ? 'success' : 'warning', timestamp: new Date() }];
  await delay(STEP);

  if (approved.length > 0) {
    const best = approved[0];
    return {
      message: `**Top opportunity:** ${best.apy}% APY on **${best.protocol}** (${best.chain}) for ${best.asset}. Risk score ${scores[best.id]}/10. Estimated gas $${best.gasEstimate}.\n\nShall I prepare the transaction?`,
      opportunities: approved,
      bestOpportunity: best,
      requiresApproval: true,
    };
  }
  return {
    message: `No suitable opportunities found this time. Try a different asset or adjust your risk tolerance.`,
    requiresApproval: false,
  };
}

// ── Scenario: execution ──────────────────────────────────────────────────────

export async function* simulateExecution(opp: Opportunity): AsyncGenerator<AgentActivity[], SupervisorResponse> {
  yield [{ agentId: 'strategy-architect',  message: `Planning bridge + deposit for ${opp.asset} on ${opp.chain}…`, type: 'info',    timestamp: new Date() }];
  await delay(STEP);

  yield [{ agentId: 'transaction-builder', message: `Building calldata for ${opp.protocol} deposit().`,            type: 'info',    timestamp: new Date() }];
  await delay(STEP);

  yield [{ agentId: 'gas-analyst',         message: `Gas optimised for next block on ${opp.chain} ⛽`,             type: 'success', timestamp: new Date() }];
  await delay(STEP);

  yield [{ agentId: 'custody-manager',     message: `Transaction signed. Broadcasting to ${opp.chain}…`,          type: 'info',    timestamp: new Date() }];
  await delay(STEP * 2);

  const txHash = `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
  yield [{ agentId: 'custody-manager',     message: `✅ Confirmed! Hash: ${txHash}`,                               type: 'success', timestamp: new Date() }];

  return {
    message: `🎉 Funds deployed on **${opp.chain}**! Transaction: \`${txHash}\`\n\nYour position is now earning **${opp.apy}% APY** on ${opp.protocol}.`,
    requiresApproval: false,
  };
}

// ── Scenario: risk-only ──────────────────────────────────────────────────────

export async function* simulateRiskCheck(): AsyncGenerator<AgentActivity[], SupervisorResponse> {
  yield [{ agentId: 'memory-curator',      message: `Recalling past Aave interactions…`,                          type: 'info',    timestamp: new Date() }];
  await delay(STEP);

  yield [{ agentId: 'market-analyst-bear', message: `Checking historical liquidation events on Aave…`,            type: 'info',    timestamp: new Date() }];
  await delay(STEP);

  yield [{ agentId: 'market-analyst-bear', message: `Bear case: oracle risk manageable. Utilisation 78% ✅`,      type: 'success', timestamp: new Date() }];
  await delay(STEP);

  yield [{ agentId: 'risk-governor',       message: `Final risk score: 4/10 — Low-Medium. Suitable for conservative profiles.`, type: 'success', timestamp: new Date() }];

  return {
    message: `**Aave Risk Assessment:**\n\n🛡️ Overall Risk: **4/10** (Low-Medium)\n✅ Smart Contract: Audited 5×, battle-tested\n⚠️ Liquidation Risk: Low at current market conditions\n📊 Utilisation: 78% (healthy)\n\nAave is one of the safest DeFi protocols.`,
    requiresApproval: false,
  };
}

// ── Demo scenario registry ───────────────────────────────────────────────────

export const demoScenarios = [
  {
    id:    'yield-arb',
    label: 'Find best yield for 5,000 USDC',
    query: 'best yield for 5000 USDC on Arbitrum',
    run:   () => simulateYieldQuery('best yield for 5000 USDC on Arbitrum'),
  },
  {
    id:    'risk-check',
    label: "What's the risk on Aave?",
    query: 'risk on Aave',
    run:   () => simulateRiskCheck(),
  },
  {
    id:    'execute-top',
    label: 'Execute the top opportunity',
    query: 'execute the top opportunity',
    run:   async function* () {
      const opp = generateOpportunity();
      opp.apy = roundTo(rand(11, 13.5), 1);
      yield* simulateExecution(opp);
    },
  },
  {
    id:    'stablecoins',
    label: 'Show me low-risk stablecoins',
    query: 'low risk stablecoin options',
    run:   () => simulateYieldQuery('low risk stablecoins', { maxRisk: 3, preferredChains: ['arbitrum', 'base', 'ethereum'], blacklist: ['Uniswap V3'] }),
  },
];
