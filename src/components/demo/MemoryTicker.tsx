import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { memoryItems as defaultMemoryItems } from "./demoScenarios";

interface MemoryTickerProps {
  memoryItems?: string[];
}

const MemoryTicker = ({ memoryItems: propItems }: MemoryTickerProps) => {
  const [memoryIndex, setMemoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const memoryItems = propItems?.length ? propItems : defaultMemoryItems;

  useEffect(() => {
    if (memoryItems.length === 0 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setMemoryIndex((i) => (i + 1) % memoryItems.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [memoryItems.length, isPaused]);

  return (
    <div
      className="p-3 border-t cursor-default select-none"
      style={{ borderColor: "hsl(var(--ghost-border))", background: "hsl(265 80% 65% / 0.05)" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      title="Hover to pause"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: "hsl(var(--ghost-purple))" }}>
          🧠 MEMORY
        </span>
        <div className="flex-1 overflow-hidden relative h-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={memoryIndex}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-xs truncate font-mono absolute inset-0"
              style={{ color: "hsl(265 80% 65% / 0.85)" }}
            >
              {memoryItems[memoryIndex] ?? "—"}
            </motion.p>
          </AnimatePresence>
        </div>
        <span className="text-xs flex-shrink-0 font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
          {memoryIndex + 1}/{memoryItems.length}
        </span>
        {isPaused && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs flex-shrink-0"
            style={{ color: "hsl(var(--ghost-purple))" }}
          >
            ⏸
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default MemoryTicker;
