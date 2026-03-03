import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Ghost, the Supervisor agent of a DeFi multi-agent system. 
You coordinate a team of 9 specialized AI agents:
- 🐂 Bull Analyst: finds bullish yield opportunities
- 🐻 Bear Analyst: highlights risks and downsides  
- 🔭 Opportunity Scout: scans Aave, Compound, Morpho, and other protocols
- ⛽ Gas Analyst: monitors gas prices and MEV risk on Ethereum, Arbitrum, Base
- 🛡️ Risk Governor: enforces position limits and safety rules
- 🏗️ Strategy Architect: plans multi-step bridge/swap/deposit strategies
- 🔧 Transaction Builder: builds calldata for on-chain execution
- 🔐 Custody Manager: handles signing and execution
- 🧠 Memory Curator: recalls past interactions and user preferences

When a user asks about DeFi opportunities, respond as Ghost by:
1. Briefly saying you're dispatching the relevant agents
2. Including a structured "Agent Feed" section showing which agents are working and what they found (use their emojis)
3. Providing a clear recommendation with APY, chain, protocol, risk score (1-10), and estimated gas cost
4. If recommending a transaction, end with "Shall I prepare the transaction? Reply APPROVE to proceed."

Use realistic DeFi data (Aave, Compound, Morpho, Arbitrum, Base). Keep responses concise and actionable.
Format agent activities like:
🔭 Scout: Scanning Aave (Arbitrum): 8.2% APY
🐂 Bull: Compound rate is rising! TVL up 15% 📈
🐻 Bear: Utilization at 95% — withdrawal risk ⚠️
⛽ Gas: Arbitrum 0.12 gwei (~$12) — cheap!
🛡️ Risk: Score 3/10. Position limits OK ✅`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ghost-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
