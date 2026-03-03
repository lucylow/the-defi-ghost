---
name: fetch-defi-apy
description: Fetches current APY and TVL for a given protocol, chain, and asset (e.g. USDC on Aave/Compound/Morpho).
metadata:
  {"openclaw":{"requires":{"bins":["node"]},"primaryEnv":""}}
---

# fetch-defi-apy

Use this skill when you need **current DeFi yield (APY) and TVL** for a specific protocol and chain.

## When to use

- User or Supervisor asks for "yields on Arbitrum", "USDC APY", "best rates for Compound on Base", etc.
- You need to compare protocols (aave, compound, morpho) on a chain (ethereum, arbitrum, base) for an asset (default USDC).

## Input

Pass a single JSON object (e.g. via exec stdin or as structured args):

- **protocol** (required): `aave` | `compound` | `morpho`
- **chain** (required): `ethereum` | `arbitrum` | `base`
- **asset** (optional): default `USDC`

## Output

The script prints a single JSON object to stdout:

- `apy`: number (e.g. 12.5)
- `tvl`: number (e.g. 500000000)
- `protocol`, `chain`, `asset`: echoed back

## Example (run via exec)

From the agent workspace or from `~/.openclaw/skills/fetch-defi-apy`:

```bash
echo '{"protocol":"compound","chain":"arbitrum","asset":"USDC"}' | node fetch-apy.mjs
```

Result: `{"apy":12.5,"tvl":500000000,"protocol":"compound","chain":"arbitrum","asset":"USDC"}`

## Notes

- The script uses mock/static data when no external API key is configured; for production, wire it to DefiLlama Pro or your backend's APY endpoint.
- Timeout: run with a 30s timeout for external calls.
