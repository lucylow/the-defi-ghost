const GhostFooter = () => {
  return (
    <footer className="py-20 px-6" style={{ borderTop: "1px solid hsl(var(--ghost-border))" }}>
      <div className="container mx-auto max-w-6xl">
        {/* CTA */}
        <div className="text-center mb-16 ghost-card p-12 rounded-2xl relative overflow-hidden" style={{ background: "var(--gradient-ghost)", borderColor: "hsl(var(--ghost-cyan) / 0.3)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, hsl(175 100% 50% / 0.1) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <div className="text-6xl mb-6 animate-float inline-block">👻</div>
            <h2 className="section-heading mb-4">
              Join the <span className="glow-text">Ghost</span> Revolution
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "hsl(var(--muted-foreground))" }}>
              The future of DeFi is autonomous, intelligent, and human-controlled. Be part of it.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#" className="btn-ghost-primary px-8 py-4 rounded-xl text-lg inline-block">
                📂 GitHub Repo
              </a>
              <a href="#" className="btn-ghost-outline px-8 py-4 rounded-xl text-lg inline-block">
                💬 Discord
              </a>
              <a href="#" className="btn-ghost-outline px-8 py-4 rounded-xl text-lg inline-block">
                🚀 Deploy Your Own Agent
              </a>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👻</span>
            <span className="font-bold text-lg glow-text">DeFi Ghost</span>
          </div>
          <div className="flex gap-6 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Hackathon Submission</a>
          </div>
          <div className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Built with ❤️ for the Animoca Brands Hackathon
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GhostFooter;
