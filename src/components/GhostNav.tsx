import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Agents", to: "/agents" },
  { label: "Docs", to: "/docs" },
];

const GhostNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || open ? "hsl(222 47% 4% / 0.95)" : "transparent",
        backdropFilter: scrolled || open ? "blur(16px)" : "none",
        borderBottom: scrolled || open ? "1px solid hsl(var(--ghost-border))" : "none",
      }}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">👻</span>
          <span className="font-bold text-lg glow-text">DeFi Ghost</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="text-sm transition-colors hover:text-foreground"
              style={{
                color: location.pathname === link.to
                  ? "hsl(var(--ghost-cyan))"
                  : "hsl(var(--muted-foreground))",
                fontWeight: location.pathname === link.to ? 600 : 400,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="hidden md:inline-flex btn-ghost-primary px-5 py-2 rounded-lg text-sm">
            Launch App
          </Link>
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 mb-1 transition-all" style={{ background: "hsl(var(--foreground))", transform: open ? "rotate(45deg) translate(3px,3px)" : "none" }} />
            <span className="block w-5 h-0.5 mb-1 transition-all" style={{ background: "hsl(var(--foreground))", opacity: open ? 0 : 1 }} />
            <span className="block w-5 h-0.5 transition-all" style={{ background: "hsl(var(--foreground))", transform: open ? "rotate(-45deg) translate(3px,-3px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-6 pb-5 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setOpen(false)}
              className="text-sm py-2 border-b transition-colors"
              style={{
                borderColor: "hsl(var(--ghost-border))",
                color: location.pathname === link.to ? "hsl(var(--ghost-cyan))" : "hsl(var(--muted-foreground))",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/dashboard" className="btn-ghost-primary px-5 py-2 rounded-lg text-sm text-center mt-2" onClick={() => setOpen(false)}>
            Launch App
          </Link>
        </div>
      )}
    </nav>
  );
};

export default GhostNav;
