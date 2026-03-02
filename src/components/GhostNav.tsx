import { useState, useEffect } from "react";

const GhostNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "hsl(222 47% 4% / 0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid hsl(var(--ghost-border))" : "none",
      }}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <span className="text-2xl">👻</span>
          <span className="font-bold text-lg glow-text">DeFi Ghost</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Solution", href: "#solution" },
            { label: "Agents", href: "#agents" },
            { label: "Demo", href: "#demo" },
            { label: "How It Works", href: "#how-it-works" },
            { label: "Powered By", href: "#powered-by" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm transition-colors hover:text-foreground"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button className="btn-ghost-primary px-5 py-2 rounded-lg text-sm">
          Launch App
        </button>
      </div>
    </nav>
  );
};

export default GhostNav;
