// Scheduled Agent Run Manager
// Manages automatic re-running of agents on configured intervals
// In production this would be a real cron system (Railway cron, etc.)
// For MVP: setInterval-based scheduler that checks every minute

import { storage } from "./storage";
import { runAllAgents, getRunStatus } from "./agents/orchestrator";

const FREQUENCY_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  biweekly: 14 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

let schedulerInterval: NodeJS.Timeout | null = null;

export function startScheduler() {
  if (schedulerInterval) return;

  console.log("[Scheduler] Starting automatic agent run scheduler (checks every 60s)");

  schedulerInterval = setInterval(async () => {
    try {
      const activeRuns = await storage.getActiveScheduledRuns();
      const now = Date.now();

      for (const run of activeRuns) {
        // Skip if agents are already running for this center
        const currentStatus = getRunStatus(run.centerId);
        if (currentStatus?.status === "running") continue;

        // Check if it's time to run
        const intervalMs = FREQUENCY_MS[run.frequency] || FREQUENCY_MS.weekly;
        const lastRun = run.lastRunAt ? new Date(run.lastRunAt).getTime() : 0;
        const nextDue = lastRun + intervalMs;

        if (now >= nextDue) {
          console.log(`[Scheduler] Triggering scheduled run for center ${run.centerId} (${run.frequency})`);

          const center = await storage.getTreatmentCenter(run.centerId);
          if (!center) continue;

          // Update lastRunAt and nextRunAt
          const nowIso = new Date().toISOString();
          const nextRunAt = new Date(now + intervalMs).toISOString();
          await storage.updateScheduledRun(run.id, {
            lastRunAt: nowIso,
            nextRunAt,
          });

          // Run agents in background
          runAllAgents(center).catch(err =>
            console.error(`[Scheduler] Agent run failed for center ${run.centerId}:`, err)
          );
        }
      }
    } catch (err) {
      console.error("[Scheduler] Error checking scheduled runs:", err);
    }
  }, 60 * 1000); // Check every 60 seconds
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Stopped");
  }
}

// Helper to calculate next run date for display
export function getNextRunDate(frequency: string, lastRunAt?: string | null): string {
  const intervalMs = FREQUENCY_MS[frequency] || FREQUENCY_MS.weekly;
  const base = lastRunAt ? new Date(lastRunAt).getTime() : Date.now();
  return new Date(base + intervalMs).toISOString();
}
