const sponsors = [
  {
    name: "Animoca Minds",
    emoji: "🧠",
    description: "Identity, memory, and cognition for every agent in the system.",
    color: "175 100% 50%",
    url: "#",
  },
  {
    name: "OpenClaw",
    emoji: "🦀",
    description: "Agent orchestration and real-time inter-agent communication.",
    color: "265 80% 65%",
    url: "#",
  },
  {
    name: "Ethoswarm",
    emoji: "🐝",
    description: "Persistent vector memory storage for long-term agent learning.",
    color: "40 100% 60%",
    url: "#",
  },
  {
    name: "OpenAI / Venice.ai",
    emoji: "🤖",
    description: "Advanced language models powering agent reasoning and analysis.",
    color: "145 70% 50%",
    url: "#",
  },
  {
    name: "Ethereum",
    emoji: "⟠",
    description: "The foundational blockchain layer for trust and security.",
    color: "200 100% 55%",
    url: "#",
  },
  {
    name: "Arbitrum & Base",
    emoji: "🔵",
    description: "L2 networks enabling fast, cost-efficient DeFi execution.",
    color: "220 80% 60%",
    url: "#",
  },
];

const PoweredBy = () => {
  return (
    <section className="py-24 px-6" id="powered-by" style={{ background: "hsl(var(--muted) / 0.2)" }}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">
            <span className="glow-text">Powered By</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            Built on world-class Web3 and AI infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.name}
              href={sponsor.url}
              className="ghost-card p-6 space-y-3 block group"
              style={{ borderColor: `hsl(${sponsor.color} / 0.2)` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-3xl"
                  style={{ filter: `drop-shadow(0 0 8px hsl(${sponsor.color} / 0.6))` }}
                >
                  {sponsor.emoji}
                </span>
                <span
                  className="font-bold text-sm"
                  style={{ color: `hsl(${sponsor.color})` }}
                >
                  {sponsor.name}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                {sponsor.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PoweredBy;
