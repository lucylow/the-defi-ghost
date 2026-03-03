import { useEffect, useState } from "react";
import { memoryItems as defaultMemoryItems } from "./demoScenarios";

interface MemoryTickerProps {
  /** When provided (e.g. from API), shows live memory; otherwise demo items. */
  memoryItems?: string[];
}

const MemoryTicker = ({ memoryItems: propItems }: MemoryTickerProps) => {
  const [memoryIndex, setMemoryIndex] = useState(0);
  const memoryItems = propItems?.length ? propItems : defaultMemoryItems;

  useEffect(() => {
    if (memoryItems.length === 0) return;
    const interval = setInterval(() => {
      setMemoryIndex((i) => (i + 1) % memoryItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [memoryItems.length]);

  return (
    <div
      className="p-3 border-t"
      style={{ borderColor: "hsl(var(--ghost-border))", background: "hsl(265 80% 65% / 0.05)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold" style={{ color: "hsl(var(--ghost-purple))" }}>
          🧠 MEMORY
        </span>
        <div className="flex-1 overflow-hidden">
          <p
            className="text-xs truncate animate-pulse font-mono"
            style={{ color: "hsl(265 80% 65% / 0.8)" }}
          >
            {memoryItems[memoryIndex] ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemoryTicker;
