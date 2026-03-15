// Agent Orchestrator — coordinates all 6 agents and stores results
// This is the API bridge between agents and the dashboard

import { runTechnicalAudit } from "./technical-auditor";
import { runKeywordTracker } from "./keyword-tracker";
import { runContentStrategist } from "./content-strategist";
import { runLocalSeoMonitor } from "./local-seo-monitor";
import { runCompetitorAnalyst } from "./competitor-analyst";
import { runAdmissionsEstimator } from "./admissions-estimator";
import { storage } from "../storage";
import type { TreatmentCenter } from "@shared/schema";
import type { AgentResult } from "./types";

export interface AgentRunStatus {
  centerId: number;
  status: "idle" | "running" | "complete" | "error";
  agents: {
    name: string;
    status: "pending" | "running" | "complete" | "error";
    startedAt?: string;
    completedAt?: string;
    duration?: number;
    error?: string;
  }[];
  startedAt?: string;
  completedAt?: string;
  totalDuration?: number;
}

// In-memory run tracking (in production, this would be in the database)
const runStatuses: Map<number, AgentRunStatus> = new Map();
const agentResults: Map<number, Map<string, any>> = new Map();

const AGENT_NAMES = [
  "Technical SEO Auditor",
  "Keyword Rank Tracker",
  "Content Strategist",
  "Local SEO Monitor",
  "Competitor Analyst",
  "Admissions Estimator",
];

export function getRunStatus(centerId: number): AgentRunStatus | null {
  return runStatuses.get(centerId) || null;
}

export function getAgentResults(centerId: number): Map<string, any> | null {
  return agentResults.get(centerId) || null;
}

export async function runAllAgents(center: TreatmentCenter): Promise<AgentRunStatus> {
  const centerId = center.id;
  
  // Initialize status
  const status: AgentRunStatus = {
    centerId,
    status: "running",
    agents: AGENT_NAMES.map(name => ({ name, status: "pending" as const })),
    startedAt: new Date().toISOString(),
  };
  runStatuses.set(centerId, status);
  
  if (!agentResults.has(centerId)) {
    agentResults.set(centerId, new Map());
  }
  const results = agentResults.get(centerId)!;

  const centerInfo = {
    websiteUrl: center.websiteUrl,
    name: center.name,
    treatmentCategory: center.treatmentCategory,
    levelsOfCare: center.levelsOfCare,
    city: center.city,
    state: center.state,
  };

  const startTime = Date.now();

  try {
    // === Agent 1: Technical SEO Auditor ===
    await runAgent(status, 0, async () => {
      const auditData = await runTechnicalAudit(centerInfo);
      results.set("technical-audit", auditData);

      // Store in platform database
      await storage.createAudit({
        centerId,
        tenantId: center.tenantId,
        overallScore: auditData.overallScore,
        technicalScore: auditData.technicalScore,
        contentScore: auditData.contentScore,
        localSeoScore: auditData.localSeoScore,
        backlinkScore: auditData.backlinkScore,
        mobileScore: auditData.mobileScore,
        pageSpeed: auditData.pageSpeed,
        indexedPages: auditData.indexedPages,
        hasSchemaMarkup: auditData.hasSchemaMarkup,
        hasSslCert: auditData.hasSslCert,
        mobileOptimized: auditData.mobileOptimized,
        issues: auditData.issues,
        auditDate: new Date().toISOString().split("T")[0],
      });

      // Update center
      await storage.updateTreatmentCenter(centerId, {
        seoScore: auditData.overallScore,
        lastAuditDate: new Date().toISOString().split("T")[0],
        status: "complete",
      });

      return auditData;
    });

    // === Agent 2: Keyword Rank Tracker ===
    await runAgent(status, 1, async () => {
      const keywordData = await runKeywordTracker(centerInfo);
      results.set("keywords", keywordData);

      // Store in platform database (clear old rankings first)
      for (const kw of keywordData.keywords) {
        await storage.createKeywordRanking({
          centerId,
          keyword: kw.keyword,
          position: kw.position,
          previousPosition: kw.previousPosition,
          searchVolume: kw.searchVolume,
          category: kw.category,
          trackDate: new Date().toISOString().split("T")[0],
        });
      }

      return keywordData;
    });

    // === Agent 3: Content Strategist ===
    await runAgent(status, 2, async () => {
      const contentData = await runContentStrategist(centerInfo);
      results.set("content", contentData);
      return contentData;
    });

    // === Agent 4: Local SEO Monitor ===
    await runAgent(status, 3, async () => {
      const localData = await runLocalSeoMonitor(centerInfo);
      results.set("local-seo", localData);
      return localData;
    });

    // === Agent 5: Competitor Analyst ===
    await runAgent(status, 4, async () => {
      const competitorData = await runCompetitorAnalyst(centerInfo);
      results.set("competitors", competitorData);

      // Store competitors in database
      for (const comp of competitorData.competitors) {
        await storage.createCompetitor({
          centerId,
          competitorName: comp.name,
          competitorUrl: comp.url,
          seoScore: comp.seoScore,
          domainAuthority: comp.domainAuthority,
          backlinks: comp.backlinks,
          sharedKeywords: comp.sharedKeywords,
        });
      }

      return competitorData;
    });

    // === Agent 6: Admissions Estimator ===
    await runAgent(status, 5, async () => {
      const keywordData = results.get("keywords");
      const kwForEstimation = keywordData?.keywords?.map((kw: any) => ({
        keyword: kw.keyword,
        position: kw.position,
        searchVolume: kw.searchVolume,
        category: kw.category,
      })) || [];

      const admissionsData = await runAdmissionsEstimator(centerInfo, kwForEstimation);
      results.set("admissions", admissionsData);

      // Store admissions estimate
      await storage.createAdmissionsEstimate({
        centerId,
        estimatedMonthlyAdmissions: admissionsData.currentMonthly,
        lostAdmissions: admissionsData.lostMonthly,
        potentialRevenue: admissionsData.annualRevenue.lost,
        estimateDate: new Date().toISOString().split("T")[0],
        assumptions: admissionsData.assumptions,
      });

      return admissionsData;
    });

    // All agents complete
    status.status = "complete";
    status.completedAt = new Date().toISOString();
    status.totalDuration = Date.now() - startTime;

  } catch (error) {
    status.status = "error";
    console.error("Agent orchestration error:", error);
  }

  return status;
}

async function runAgent(
  status: AgentRunStatus,
  index: number,
  fn: () => Promise<any>
): Promise<void> {
  const agent = status.agents[index];
  agent.status = "running";
  agent.startedAt = new Date().toISOString();

  try {
    await fn();
    agent.status = "complete";
    agent.completedAt = new Date().toISOString();
    agent.duration = new Date(agent.completedAt).getTime() - new Date(agent.startedAt).getTime();
  } catch (error) {
    agent.status = "error";
    agent.error = error instanceof Error ? error.message : "Unknown error";
    agent.completedAt = new Date().toISOString();
    agent.duration = new Date(agent.completedAt).getTime() - new Date(agent.startedAt).getTime();
    console.error(`Agent "${agent.name}" error:`, error);
  }
}
