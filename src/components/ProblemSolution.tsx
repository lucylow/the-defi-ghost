import agentTeamHero from "@/assets/agent-team-hero.png";

const problems = [
  { icon: "⚡", text: "DeFi opportunities vanish in minutes" },
  { icon: "😴", text: "Manual monitoring is impossible 24/7" },
  { icon: "🧠", text: "Complex strategies require deep expertise" },
  { icon: "😰", text: "Fear of losing control to automated bots" },
];

const solutions = [
  { icon: "🤖", text: "A multi-agent system that never sleeps" },
  { icon: "🎯", text: "Specialized agents for research, risk, and execution" },
  { icon: "✅", text: "Human-in-the-loop: you always approve final moves" },
  { icon: "⚡", text: "Powered by Animoca Minds and OpenClaw" },
];

const ProblemSolution = () => {
  return (
    <section className="py-24 px-6" id="solution">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="section-heading mb-4">
            The <span className="glow-text">Problem</span> &{" "}
            <span style={{ color: "hsl(var(--ghost-purple))" }}>Solution</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
            DeFi is powerful, but unforgiving. Ghost changes that.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem */}
          <div className="ghost-card p-8 space-y-6" style={{ borderColor: "hsl(0 84% 60% / 0.3)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "hsl(0 84% 60% / 0.15)", border: "1px solid hsl(0 84% 60% / 0.3)" }}>
                ❌
              </div>
              <h3 className="text-xl font-bold" style={{ color: "hsl(0 84% 60%)" }}>The Problem</h3>
            </div>
            <div className="space-y-4">
              {problems.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(0 84% 60% / 0.05)" }}>
                  <span className="text-xl">{p.icon}</span>
                  <span style={{ color: "hsl(var(--foreground) / 0.8)" }}>{p.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div className="ghost-card p-8 space-y-6" style={{ borderColor: "hsl(var(--ghost-cyan) / 0.3)", boxShadow: "var(--shadow-card), 0 0 30px hsl(var(--ghost-cyan) / 0.08)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "hsl(var(--ghost-cyan) / 0.15)", border: "1px solid hsl(var(--ghost-cyan) / 0.3)" }}>
                👻
              </div>
              <h3 className="text-xl font-bold glow-text">Ghost Solution</h3>
            </div>
            <div className="space-y-4">
              {solutions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "hsl(var(--ghost-cyan) / 0.05)" }}>
                  <span className="text-xl">{s.icon}</span>
                  <span style={{ color: "hsl(var(--foreground) / 0.9)" }}>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
