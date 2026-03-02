import { useEffect, useRef } from "react";
import ghostHero from "@/assets/ghost-hero.png";

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(175, 100%, 60%, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(175, 100%, 60%, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      {/* Animated background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Radial glow behind ghost */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, hsl(175 100% 50% / 0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono" style={{ background: "hsl(175 100% 50% / 0.1)", border: "1px solid hsl(175 100% 50% / 0.3)", color: "hsl(var(--ghost-cyan))" }}>
              <span className="status-dot" />
              <span>Multi-Agent DeFi System • Live</span>
            </div>

            <h1 className="section-heading text-foreground">
              DeFi Ghost –{" "}
              <span className="glow-text">Your Autonomous</span>{" "}
              Yield Coordinator
            </h1>

            <p className="text-xl leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              A team of AI agents that work 24/7 to find, analyze, and execute the best DeFi opportunities, while you stay in control.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#demo">
                <button className="btn-ghost-primary px-8 py-4 rounded-xl text-lg">
                  🚀 Launch Demo
                </button>
              </a>
              <button className="btn-ghost-outline px-8 py-4 rounded-xl text-lg">
                👻 Connect Wallet
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              {[
                { value: "9", label: "AI Agents" },
                { value: "24/7", label: "Monitoring" },
                { value: "100%", label: "You in Control" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold glow-text">{stat.value}</div>
                  <div className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ghost illustration */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative animate-float">
              <div className="absolute inset-0 rounded-full animate-glow-pulse" style={{ background: "radial-gradient(circle, hsl(175 100% 50% / 0.2) 0%, transparent 70%)" }} />
              <img
                src={ghostHero}
                alt="DeFi Ghost – AI Multi-Agent System"
                className="relative z-10 w-full max-w-lg rounded-2xl"
                style={{ filter: "drop-shadow(0 0 40px hsl(175 100% 50% / 0.4))" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--background)))" }} />
    </section>
  );
};

export default HeroSection;
