const steps = [
  {
    number: "01",
    icon: "⚙️",
    title: "You Set the Rules",
    description: "Connect wallet, set risk limits, choose preferred protocols. Ghost learns your preferences.",
    color: "175 100% 50%",
  },
  {
    number: "02",
    icon: "🤖",
    title: "Agents Go to Work",
    description: "They monitor markets 24/7, debate strategies, and remember past outcomes to improve over time.",
    color: "265 80% 65%",
  },
  {
    number: "03",
    icon: "✅",
    title: "You Stay in Control",
    description: "Approve every move via Telegram or dashboard. No transaction executes without your signature.",
    color: "145 70% 50%",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-6" id="how-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">
            How It <span className="glow-text">Works</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            Three simple steps to autonomous DeFi yield optimization.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting lines */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5" style={{ background: "linear-gradient(90deg, hsl(175 100% 50% / 0.5), hsl(265 80% 65% / 0.5))" }} />

          {steps.map((step) => (
            <div key={step.number} className="ghost-card p-8 text-center space-y-4 relative" style={{ borderColor: `hsl(${step.color} / 0.3)` }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto"
                style={{ background: `hsl(${step.color} / 0.15)`, border: `2px solid hsl(${step.color} / 0.4)`, boxShadow: `0 0 20px hsl(${step.color} / 0.2)` }}
              >
                {step.icon}
              </div>
              <div
                className="absolute top-6 right-6 font-mono text-4xl font-bold opacity-10"
                style={{ color: `hsl(${step.color})` }}
              >
                {step.number}
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p style={{ color: "hsl(var(--muted-foreground))" }}>{step.description}</p>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="mt-16 ghost-card p-8 rounded-2xl">
          <h3 className="text-center text-lg font-bold mb-8 glow-text">Agent Workflow</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-mono">
            {[
              { label: "You", color: "175 100% 50%" },
              { label: "→", color: null },
              { label: "Supervisor", color: "175 100% 50%" },
              { label: "→", color: null },
              { label: "Agent Team", color: "265 80% 65%" },
              { label: "→", color: null },
              { label: "Risk Check", color: "0 84% 60%" },
              { label: "→", color: null },
              { label: "Your Approval", color: "40 100% 60%" },
              { label: "→", color: null },
              { label: "Execution", color: "145 70% 50%" },
              { label: "→", color: null },
              { label: "Memory", color: "265 80% 65%" },
            ].map((item, i) => (
              item.color ? (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `hsl(${item.color} / 0.1)`, border: `1px solid hsl(${item.color} / 0.3)`, color: `hsl(${item.color})` }}
                >
                  {item.label}
                </span>
              ) : (
                <span key={i} style={{ color: "hsl(var(--muted-foreground))" }}>{item.label}</span>
              )
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
