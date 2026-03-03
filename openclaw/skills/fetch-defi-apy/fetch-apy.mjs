#!/usr/bin/env node
/**
 * fetch-defi-apy – DeFi Ghost OpenClaw skill
 * Reads JSON from stdin: { protocol, chain, asset? }
 * Writes JSON to stdout: { apy, tvl, protocol, chain, asset }
 * Uses mock data aligned with backend/agents/opportunity_scout.py when no API key.
 */

const DEFAULT_ASSET = 'USDC';

// Base APYs (protocol, chain) – aligned with opportunity_scout.py; add slight variance
const BASE_APY = {
  aave: { arbitrum: 8.2, ethereum: 3.5, base: 6.0 },
  compound: { arbitrum: 12.5, ethereum: 4.0, base: 7.5 },
  morpho: { arbitrum: 9.0, ethereum: 4.5, base: 9.1 },
};

function randomVariance() {
  return (Math.random() * 2 - 1);
}

async function fetchFromStdin() {
  return new Promise((resolve, reject) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (ch) => { buf += ch; });
    process.stdin.on('end', () => {
      try {
        resolve(buf.trim() ? JSON.parse(buf) : {});
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.on('error', reject);
  });
}

async function getApyTvl(protocol, chain, asset) {
  const p = (protocol || '').toLowerCase().replace(/[^a-z]/g, '');
  const c = (chain || '').toLowerCase().replace(/[^a-z]/g, '');
  const normalized = { aave: 'aave', compound: 'compound', morpho: 'morpho' }[p] || p;
  const chainMap = { ethereum: 'ethereum', arbitrum: 'arbitrum', base: 'base' };
  const chainKey = chainMap[c] || 'arbitrum';

  const base = BASE_APY[normalized]?.[chainKey];
  const apy = base != null
    ? Math.round((base + randomVariance()) * 100) / 100
    : Math.round((5 + Math.random() * 10) * 100) / 100;
  const tvl = 500_000_000;

  return { apy, tvl, protocol: normalized || protocol, chain: chainKey || chain, asset: asset || DEFAULT_ASSET };
}

async function main() {
  try {
    const input = await fetchFromStdin();
    const protocol = input.protocol || 'compound';
    const chain = input.chain || 'arbitrum';
    const asset = input.asset || DEFAULT_ASSET;

    const result = await getApyTvl(protocol, chain, asset);
    process.stdout.write(JSON.stringify(result) + '\n');
  } catch (err) {
    const message = err.message || String(err);
    process.stderr.write(message + '\n');
    process.stdout.write(JSON.stringify({
      apy: 0,
      tvl: 0,
      error: message,
      protocol: 'unknown',
      chain: 'unknown',
      asset: DEFAULT_ASSET,
    }) + '\n');
    process.exit(1);
  }
}

main();
