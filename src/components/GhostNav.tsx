import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled || open ? "hsl(222 47% 4% / 0.92)" : "transparent",
        backdropFilter: scrolled || open ? "blur(20px)" : "none",
        borderBottom: scrolled || open ? "1px solid hsl(var(--ghost-border))" : "none",
        boxShadow: scrolled ? "0 4px 24px hsl(175 100% 50% / 0.04)" : "none",
      }}
    >
      <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.span
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
            className="text-2xl"
          >
            👻
          </motion.span>
          <span className="font-bold text-lg glow-text tracking-tight">DeFi Ghost</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.label}
                to={link.to}
                className="relative px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ color: active ? "hsl(var(--ghost-cyan))" : "hsl(var(--muted-foreground))", fontWeight: active ? 600 : 400 }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "hsl(var(--ghost-cyan) / 0.1)", border: "1px solid hsl(var(--ghost-cyan) / 0.2)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="hidden md:inline-flex btn-ghost-primary px-5 py-2 rounded-lg text-sm items-center gap-1.5"
          >
            <span>🚀</span> Launch App
          </Link>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 w-9 h-9 rounded-lg items-center transition-colors"
            style={{ background: open ? "hsl(var(--ghost-cyan) / 0.1)" : "transparent" }}
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }} className="block w-5 h-0.5 rounded-full" style={{ background: "hsl(var(--foreground))" }} />
            <motion.span animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }} className="block w-5 h-0.5 rounded-full" style={{ background: "hsl(var(--foreground))" }} />
            <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }} className="block w-5 h-0.5 rounded-full" style={{ background: "hsl(var(--foreground))" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
            style={{ borderTop: "1px solid hsl(var(--ghost-border))" }}
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link, i) => {
                const active = location.pathname === link.to;
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.to}
                      className="flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors"
                      style={{
                        background: active ? "hsl(var(--ghost-cyan) / 0.1)" : "transparent",
                        color: active ? "hsl(var(--ghost-cyan))" : "hsl(var(--muted-foreground))",
                        fontWeight: active ? 600 : 400,
                        border: active ? "1px solid hsl(var(--ghost-cyan) / 0.2)" : "1px solid transparent",
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2">
                <Link to="/dashboard" className="btn-ghost-primary px-5 py-2.5 rounded-lg text-sm text-center w-full flex justify-center gap-1.5">
                  <span>🚀</span> Launch App
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default GhostNav;
