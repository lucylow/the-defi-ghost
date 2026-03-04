// useMockAgent.ts – React hook wiring the mock simulation engine to component state
import { useState, useCallback, useRef } from 'react';
import {
  AgentActivity,
  SupervisorResponse,
  Opportunity,
  demoScenarios,
  simulateExecution,
  getNextMemorySnippet,
  memorySnippets,
} from '@/lib/mockAgentService';

export type { AgentActivity, SupervisorResponse, Opportunity };

export function useMockAgent() {
  const [activities, setActivities]         = useState<AgentActivity[]>([]);
  const [supervisorMsg, setSupervisorMsg]   = useState<string>('');
  const [pendingOpp, setPendingOpp]         = useState<Opportunity | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [isRunning, setIsRunning]           = useState(false);
  const [memoryIndex, setMemoryIndex]       = useState(0);
  const abortRef = useRef(false);

  const memoryItems = memorySnippets.map((m) => m.text);
  const currentMemory = memoryItems[memoryIndex % memoryItems.length];

  /** Advance memory ticker manually (or auto-advance via MemoryTicker) */
  const advanceMemory = useCallback(() => {
    setMemoryIndex((i) => i + 1);
    getNextMemorySnippet(); // keeps internal counter in sync
  }, []);

  const runScenario = useCallback(async (scenarioId: string) => {
    const scenario = demoScenarios.find((s) => s.id === scenarioId);
    if (!scenario || isRunning) return;

    abortRef.current = false;
    setIsRunning(true);
    setActivities([]);
    setSupervisorMsg('');
    setPendingOpp(null);
    setRequiresApproval(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gen = scenario.run() as AsyncGenerator<AgentActivity[], any>;

    try {
      let result = await gen.next();
      while (!result.done) {
        if (abortRef.current) break;
        setActivities((prev) => [...prev, ...result.value]);
        result = await gen.next();
      }
      if (!abortRef.current && result.done && result.value) {
        const res: SupervisorResponse = result.value;
        setSupervisorMsg(res.message);
        setRequiresApproval(res.requiresApproval);
        if (res.bestOpportunity) setPendingOpp(res.bestOpportunity);
      }
    } catch (e) {
      console.error('Mock agent error', e);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  const sendApproval = useCallback(async (approved: boolean, modifiedAmount?: number) => {
    if (!approved || !pendingOpp) {
      setSupervisorMsg('Transaction cancelled.');
      setRequiresApproval(false);
      return;
    }

    const opp = modifiedAmount ? { ...pendingOpp, amount: modifiedAmount } : pendingOpp;
    abortRef.current = false;
    setIsRunning(true);
    setRequiresApproval(false);

    const gen = simulateExecution(opp);
    try {
      let result = await gen.next();
      while (!result.done) {
        if (abortRef.current) break;
        setActivities((prev) => [...prev, ...result.value]);
        result = await gen.next();
      }
      if (!abortRef.current && result.done && result.value) {
        setSupervisorMsg(result.value.message);
        setPendingOpp(null);
      }
    } catch (e) {
      console.error('Execution error', e);
    } finally {
      setIsRunning(false);
    }
  }, [pendingOpp]);

  const abort = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);

  return {
    activities,
    supervisorMsg,
    pendingOpp,
    requiresApproval,
    isRunning,
    memoryItems,
    currentMemory,
    advanceMemory,
    runScenario,
    sendApproval,
    abort,
  };
}
