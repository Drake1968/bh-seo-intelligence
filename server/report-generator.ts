// PDF Report Generator
// Generates comprehensive SEO audit reports as downloadable HTML (rendered as PDF-quality)
// Self-contained HTML with inline CSS — no external dependencies

import { storage } from "./storage";
import { getAgentResults } from "./agents/orchestrator";
import type { TreatmentCenter, Audit } from "@shared/schema";

export interface ReportData {
  center: TreatmentCenter;
  audit: Audit | undefined;
  agentResults: Record<string, any>;
  generatedAt: string;
  reportType: "summary" | "full";
}

// ── Color helpers ──────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#ca8a04";
  return "#dc2626";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Work";
  return "Poor";
}

function severityColor(s: string): string {
  if (s === "critical") return "#dc2626";
  if (s === "warning") return "#ca8a04";
  return "#6b7280";
}

function severityBg(s: string): string {
  if (s === "critical") return "#fef2f2";
  if (s === "warning") return "#fefce8";
  return "#f9fafb";
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

function fmtMoney(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Blurred section wrapper (Summary report) ──────────────────────

function blurWrap(content: string, isSummary: boolean): string {
  if (!isSummary) return content;
  return `
    <div style="position: relative;">
      <div style="filter: blur(8px); user-select: none; pointer-events: none;">
        ${content}
      </div>
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.6); border-radius: 8px;">
        <div style="text-align: center; padding: 24px 32px; background: #fff; border: 2px solid #0d9488; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
          <p style="font-size: 20px; margin: 0 0 8px;">&#128274;</p>
          <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 4px;">Unlock Full Report</p>
          <p style="font-size: 13px; color: #475569; margin: 0 0 12px;">Your $197 is credited toward the $1,997 Comprehensive Audit</p>
          <a href="/#/pricing" style="display: inline-block; padding: 8px 20px; background: #0d9488; color: #fff; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Upgrade Now</a>
        </div>
      </div>
    </div>`;
}

// ── Score gauge (SVG arc) ─────────────────────────────────────────

function gaugeHtml(score: number, size: number = 180): string {
  const radius = 70;
  const circumference = Math.PI * radius; // half-circle
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dashOffset = circumference * (1 - pct);
  const color = scoreColor(score);

  return `
    <div style="text-align:center;margin:0 auto 20px;">
      <svg width="${size}" height="${size * 0.65}" viewBox="0 0 180 117">
        <path d="M 10 107 A 70 70 0 0 1 170 107" fill="none" stroke="#e5e7eb" stroke-width="14" stroke-linecap="round"/>
        <path d="M 10 107 A 70 70 0 0 1 170 107" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"
          stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"/>
        <text x="90" y="90" text-anchor="middle" font-size="36" font-weight="700" fill="${color}">${score}</text>
        <text x="90" y="110" text-anchor="middle" font-size="12" fill="#6b7280">${scoreLabel(score)}</text>
      </svg>
    </div>`;
}

// ── Score bar ─────────────────────────────────────────────────────

function scoreBar(label: string, value: number | null | undefined, max: number = 100): string {
  const v = value ?? 0;
  const pct = Math.min(100, Math.max(0, (v / max) * 100));
  return `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
        <span style="color:#374151;font-weight:500;">${esc(label)}</span>
        <span style="font-weight:600;color:${scoreColor(v)};">${v}/100</span>
      </div>
      <div style="height:8px;background:#f3f4f6;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${scoreColor(v)};border-radius:4px;"></div>
      </div>
    </div>`;
}

// ── Main generator ────────────────────────────────────────────────

export async function generateReport(
  centerId: number,
  reportType: "summary" | "full" = "full"
): Promise<{ html: string; data: ReportData }> {
  const center = await storage.getTreatmentCenter(centerId);
  if (!center) throw new Error("Center not found");

  const audit = await storage.getLatestAudit(centerId);
  const keywords = await storage.getKeywordsByCenter(centerId);
  const competitors = await storage.getCompetitorsByCenter(centerId);
  const admissions = await storage.getLatestAdmissionsEstimate(centerId);

  const agentResultsMap = getAgentResults(centerId);
  const agentResults: Record<string, any> = {};
  if (agentResultsMap) {
    for (const [key, value] of agentResultsMap.entries()) {
      agentResults[key] = value;
    }
  }

  const data: ReportData = { center, audit, agentResults, generatedAt: new Date().toISOString(), reportType };
  const isSummary = reportType === "summary";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const reportId = `BH-${centerId}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  // ── Collect action items from all agent data ──
  const actionItems = collectActionItems(audit, agentResults, competitors);

  // ── Build sections ──

  const coverPage = buildCoverPage(center, dateStr, reportType, reportId);
  const execSummary = buildExecutiveSummary(audit, agentResults, admissions, actionItems);
  const technicalSection = buildTechnicalSection(audit, agentResults);
  const keywordSection = buildKeywordSection(keywords, agentResults);
  const contentSection = buildContentSection(agentResults, isSummary);
  const localSection = buildLocalSection(agentResults, isSummary);
  const competitorSection = buildCompetitorSection(competitors, agentResults, isSummary);
  const admissionsSection = buildAdmissionsSection(admissions, agentResults, isSummary);
  const actionSection = buildActionSection(actionItems, isSummary);
  const appendixSection = buildAppendix(audit, agentResults);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SEO Intelligence Report — ${esc(center.name)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      color:#111827;background:#fff;line-height:1.55;font-size:13px;
      -webkit-print-color-adjust:exact;print-color-adjust:exact;
    }
    .page{max-width:820px;margin:0 auto;padding:40px 48px;}
    .cover{
      min-height:90vh;display:flex;flex-direction:column;justify-content:center;align-items:center;
      text-align:center;page-break-after:always;
    }
    .cover .logo-mark{
      width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#0d9488,#065f46);
      display:flex;align-items:center;justify-content:center;margin-bottom:24px;
    }
    .cover .logo-mark span{font-size:28px;font-weight:800;color:#fff;letter-spacing:-1px;}
    .section{margin-bottom:36px;page-break-inside:avoid;}
    .section-break{page-break-before:always;}
    h2.section-title{
      font-size:17px;font-weight:700;color:#0f172a;padding-bottom:8px;
      border-bottom:2px solid #0d9488;margin-bottom:16px;
    }
    h3.sub-title{font-size:14px;font-weight:600;color:#374151;margin:16px 0 8px;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    thead tr{background:#f8fafc;}
    th{padding:8px 10px;text-align:left;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;}
    td{padding:7px 10px;border-bottom:1px solid #f1f5f9;}
    .card{padding:16px;background:#f8fafc;border-radius:8px;margin-bottom:12px;}
    .metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;}
    .metric-box{text-align:center;padding:14px 8px;background:#f8fafc;border-radius:8px;}
    .metric-box .val{font-size:24px;font-weight:700;margin:0;}
    .metric-box .lbl{font-size:11px;color:#64748b;margin:4px 0 0;}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;}
    .badge-critical{background:#fef2f2;color:#dc2626;}
    .badge-warning{background:#fefce8;color:#ca8a04;}
    .badge-info{background:#f0f9ff;color:#0369a1;}
    .badge-good{background:#f0fdf4;color:#16a34a;}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:10px;color:#94a3b8;}
    @media print{
      .page{padding:24px 32px;}
      .section{page-break-inside:avoid;}
      .section-break{page-break-before:always;}
    }
  </style>
</head>
<body>
<div class="page">
  ${coverPage}
  ${execSummary}
  ${technicalSection}
  ${keywordSection}
  ${contentSection}
  ${localSection}
  ${competitorSection}
  ${admissionsSection}
  ${actionSection}
  ${appendixSection}
  <div class="footer">
    <p>Generated by <strong>BH SEO Intelligence</strong> &bull; bhseointelligence.com &bull; ${dateStr}</p>
    <p style="margin-top:4px;">This report is confidential and intended for the named recipient only. &copy; ${now.getFullYear()} BH SEO Intelligence.</p>
  </div>
</div>
</body>
</html>`;

  return { html, data };
}

// ── Section builders ──────────────────────────────────────────────

function buildCoverPage(center: TreatmentCenter, dateStr: string, reportType: string, reportId: string): string {
  const typeLabel = reportType === "summary" ? "Summary Report" : "Comprehensive SEO Audit";
  return `
  <div class="cover">
    <div class="logo-mark"><span>BH</span></div>
    <p style="font-size:12px;font-weight:600;color:#0d9488;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px;">BH SEO Intelligence</p>
    <h1 style="font-size:32px;font-weight:800;color:#0f172a;margin-bottom:8px;">${typeLabel}</h1>
    <p style="font-size:18px;color:#334155;margin-bottom:4px;">${esc(center.name)}</p>
    <p style="font-size:14px;color:#64748b;margin-bottom:32px;">${esc(center.websiteUrl)} &bull; ${esc(center.city)}, ${esc(center.state)}</p>
    <div style="width:80px;height:3px;background:linear-gradient(90deg,#0d9488,#065f46);border-radius:2px;margin:0 auto 32px;"></div>
    <p style="font-size:13px;color:#64748b;">${dateStr}</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:4px;">Report ID: ${reportId}</p>
    ${reportType === "summary" ? '<p style="margin-top:16px;padding:6px 16px;background:#fefce8;border-radius:6px;font-size:12px;color:#92400e;font-weight:500;">Summary Report — Some sections are preview-only. Upgrade to Full Audit for complete insights.</p>' : ""}
  </div>`;
}

function buildExecutiveSummary(
  audit: Audit | undefined,
  agentResults: Record<string, any>,
  admissions: any,
  actionItems: ActionItem[]
): string {
  const overall = audit?.overallScore ?? 0;
  const issues = (audit?.issues as any[]) || [];
  const criticalCount = issues.filter((i: any) => i.severity === "critical").length;
  const warningCount = issues.filter((i: any) => i.severity === "warning").length;

  // Top 3 strengths
  const strengths: string[] = [];
  if (audit?.hasSslCert) strengths.push("SSL/HTTPS security enabled");
  if (audit?.mobileOptimized) strengths.push("Mobile-responsive design");
  if (audit?.hasSchemaMarkup) strengths.push("Healthcare schema markup present");
  if ((audit?.mobileScore ?? 0) >= 80) strengths.push("Strong mobile performance");
  if ((audit?.localSeoScore ?? 0) >= 70) strengths.push("Good local SEO foundation");
  if ((audit?.technicalScore ?? 0) >= 70) strengths.push("Solid technical SEO base");

  // Top 3 issues
  const topIssues = issues
    .filter((i: any) => i.severity === "critical" || i.severity === "warning")
    .slice(0, 3)
    .map((i: any) => i.description);

  const lostRevenue = admissions?.potentialRevenue ?? 0;

  return `
  <div class="section section-break">
    <h2 class="section-title">Executive Summary</h2>
    ${gaugeHtml(overall)}
    <div class="metric-grid">
      <div class="metric-box">
        <p class="val" style="color:#dc2626;">${criticalCount}</p>
        <p class="lbl">Critical Issues</p>
      </div>
      <div class="metric-box">
        <p class="val" style="color:#ca8a04;">${warningCount}</p>
        <p class="lbl">Warnings</p>
      </div>
      <div class="metric-box">
        <p class="val" style="color:#0d9488;">${actionItems.length}</p>
        <p class="lbl">Action Items</p>
      </div>
    </div>
    ${lostRevenue > 0 ? `
    <div class="card" style="background:#fef2f2;border-left:4px solid #dc2626;">
      <p style="font-size:12px;font-weight:600;color:#991b1b;margin-bottom:2px;">Estimated Annual Revenue at Risk</p>
      <p style="font-size:22px;font-weight:700;color:#dc2626;">$${(lostRevenue / 1000).toFixed(0)}k</p>
      <p style="font-size:11px;color:#7f1d1d;margin-top:2px;">Based on keyword positions, conversion modeling, and level-of-care revenue analysis</p>
    </div>` : ""}
    ${topIssues.length > 0 ? `
    <h3 class="sub-title">Top Issues</h3>
    ${topIssues.map((t, i) => `<p style="font-size:12px;color:#dc2626;margin-bottom:4px;"><strong>${i + 1}.</strong> ${esc(t)}</p>`).join("")}` : ""}
    ${strengths.length > 0 ? `
    <h3 class="sub-title" style="margin-top:12px;">Key Strengths</h3>
    ${strengths.slice(0, 3).map((s, i) => `<p style="font-size:12px;color:#16a34a;margin-bottom:4px;"><strong>${i + 1}.</strong> ${esc(s)}</p>`).join("")}` : ""}
  </div>`;
}

function buildTechnicalSection(audit: Audit | undefined, agentResults: Record<string, any>): string {
  if (!audit) return "";
  const techData = agentResults["technical-audit"];
  const cwv = techData?.coreWebVitals;
  const crawl = techData?.crawlability;
  const issues = (audit.issues as any[]) || [];

  function cwvStatus(metric: string, value: number): { color: string; label: string } {
    if (metric === "lcp") return value <= 2.5 ? { color: "#16a34a", label: "Good" } : value <= 4 ? { color: "#ca8a04", label: "Needs Improvement" } : { color: "#dc2626", label: "Poor" };
    if (metric === "inp") return value <= 200 ? { color: "#16a34a", label: "Good" } : value <= 500 ? { color: "#ca8a04", label: "Needs Improvement" } : { color: "#dc2626", label: "Poor" };
    if (metric === "cls") return value <= 0.1 ? { color: "#16a34a", label: "Good" } : value <= 0.25 ? { color: "#ca8a04", label: "Needs Improvement" } : { color: "#dc2626", label: "Poor" };
    return { color: "#6b7280", label: "Unknown" };
  }

  return `
  <div class="section section-break">
    <h2 class="section-title">Technical SEO Analysis</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      ${scoreBar("Technical", audit.technicalScore)}
      ${scoreBar("Content", audit.contentScore)}
      ${scoreBar("Local SEO", audit.localSeoScore)}
      ${scoreBar("Backlinks", audit.backlinkScore)}
      ${scoreBar("Mobile", audit.mobileScore)}
    </div>
    ${cwv ? `
    <h3 class="sub-title">Core Web Vitals</h3>
    <div class="metric-grid">
      <div class="metric-box">
        <p class="val" style="color:${cwvStatus("lcp", cwv.lcp).color};">${cwv.lcp.toFixed(1)}s</p>
        <p class="lbl">LCP</p>
        <span class="badge" style="background:${cwvStatus("lcp", cwv.lcp).color}20;color:${cwvStatus("lcp", cwv.lcp).color};">${cwvStatus("lcp", cwv.lcp).label}</span>
      </div>
      <div class="metric-box">
        <p class="val" style="color:${cwvStatus("inp", cwv.inp).color};">${cwv.inp}ms</p>
        <p class="lbl">INP</p>
        <span class="badge" style="background:${cwvStatus("inp", cwv.inp).color}20;color:${cwvStatus("inp", cwv.inp).color};">${cwvStatus("inp", cwv.inp).label}</span>
      </div>
      <div class="metric-box">
        <p class="val" style="color:${cwvStatus("cls", cwv.cls).color};">${cwv.cls.toFixed(2)}</p>
        <p class="lbl">CLS</p>
        <span class="badge" style="background:${cwvStatus("cls", cwv.cls).color}20;color:${cwvStatus("cls", cwv.cls).color};">${cwvStatus("cls", cwv.cls).label}</span>
      </div>
    </div>` : ""}
    ${crawl ? `
    <h3 class="sub-title">Crawlability</h3>
    <div class="card">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:12px;">
        <div>${crawl.hasRobotsTxt ? "&#9989;" : "&#10060;"} robots.txt</div>
        <div>${crawl.hasSitemap ? "&#9989;" : "&#10060;"} XML Sitemap</div>
        <div>${crawl.canonicalsCorrect ? "&#9989;" : "&#10060;"} Canonicals</div>
        <div>Noindex pages: ${crawl.noindexPages}</div>
        <div>Redirect chains: ${crawl.redirectChains}</div>
        <div>Indexed pages: ${audit.indexedPages ?? "—"}</div>
      </div>
    </div>` : ""}
    ${issues.length > 0 ? `
    <h3 class="sub-title">Issues Found (${issues.length})</h3>
    ${issues.map((issue: any) => `
      <div style="padding:10px 14px;margin-bottom:6px;border-radius:6px;background:${severityBg(issue.severity)};border-left:3px solid ${severityColor(issue.severity)};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
          <span class="badge badge-${issue.severity}">${issue.severity}</span>
          <span style="font-size:11px;color:#64748b;">${esc(issue.category)}</span>
        </div>
        <p style="font-size:12px;font-weight:500;color:#111827;margin:0 0 2px;">${esc(issue.description)}</p>
        <p style="font-size:11px;color:#64748b;margin:0;">${esc(issue.recommendation)}</p>
      </div>
    `).join("")}` : ""}
  </div>`;
}

function buildKeywordSection(keywords: any[], agentResults: Record<string, any>): string {
  if (keywords.length === 0) return "";
  const kwData = agentResults["keywords"];
  const summary = kwData?.summary;

  const top3 = keywords.filter(k => (k.position ?? 100) <= 3).length;
  const top10 = keywords.filter(k => (k.position ?? 100) <= 10).length;
  const top20 = keywords.filter(k => (k.position ?? 100) <= 20).length;

  return `
  <div class="section section-break">
    <h2 class="section-title">Keyword Rankings</h2>
    <div class="metric-grid">
      <div class="metric-box">
        <p class="val" style="color:#16a34a;">${summary?.top3 ?? top3}</p>
        <p class="lbl">Top 3 Positions</p>
      </div>
      <div class="metric-box">
        <p class="val" style="color:#0d9488;">${summary?.top10 ?? top10}</p>
        <p class="lbl">Top 10 Positions</p>
      </div>
      <div class="metric-box">
        <p class="val" style="color:#ca8a04;">${summary?.top20 ?? top20}</p>
        <p class="lbl">Top 20 Positions</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Keyword</th>
          <th style="text-align:center;">Position</th>
          <th style="text-align:center;">Change</th>
          <th style="text-align:right;">Volume</th>
          <th style="text-align:center;">Category</th>
        </tr>
      </thead>
      <tbody>
        ${keywords.slice(0, 20).map(kw => {
          const change = (kw.previousPosition || 0) - (kw.position || 0);
          const chColor = change > 0 ? "#16a34a" : change < 0 ? "#dc2626" : "#64748b";
          const chSym = change > 0 ? "&#9650;" : change < 0 ? "&#9660;" : "—";
          const catLabel = kw.category === "sa" ? "SA" : kw.category === "mh" ? "MH" : "Dual";
          const catBg = kw.category === "sa" ? "#dbeafe" : kw.category === "mh" ? "#fce7f3" : "#fef3c7";
          const catColor = kw.category === "sa" ? "#1d4ed8" : kw.category === "mh" ? "#be185d" : "#92400e";
          return `
        <tr>
          <td>${esc(kw.keyword)}</td>
          <td style="text-align:center;font-weight:600;">${kw.position ?? "—"}</td>
          <td style="text-align:center;color:${chColor};">${chSym}${Math.abs(change)}</td>
          <td style="text-align:right;">${fmtNum(kw.searchVolume)}</td>
          <td style="text-align:center;"><span style="padding:2px 7px;border-radius:4px;font-size:10px;font-weight:600;background:${catBg};color:${catColor};">${catLabel}</span></td>
        </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>`;
}

function buildContentSection(agentResults: Record<string, any>, isSummary: boolean): string {
  const contentData = agentResults["content"];
  if (!contentData) return "";

  const eat = contentData.eeatScore || contentData.eatScore;
  const gaps = contentData.contentGaps?.slice(0, 8) || [];
  const calendar = contentData.contentCalendar?.slice(0, 4) || [];
  const existing = contentData.existingContent?.slice(0, 10) || [];

  const eatGrid = eat ? `
    <h3 class="sub-title">E-E-A-T Scores</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
      ${["Experience", "Expertise", "Authority", "Trust"].map((label, i) => {
        const key = ["experience", "expertise", i === 2 ? "authoritativeness" : "authority", i === 3 ? "trustworthiness" : "trust"][i];
        const val = eat[key] ?? eat[label.toLowerCase()] ?? 0;
        return `<div class="metric-box"><p class="val" style="color:${scoreColor(val)};">${val}</p><p class="lbl">${label}</p></div>`;
      }).join("")}
    </div>` : "";

  const gapsHtml = gaps.length > 0 ? `
    <h3 class="sub-title">Content Gaps Identified</h3>
    <table>
      <thead><tr><th>Topic</th><th>Priority</th><th style="text-align:right;">Est. Volume</th><th>Intent</th></tr></thead>
      <tbody>
        ${gaps.map((g: any) => {
          const priColor = g.priority === "high" ? "#dc2626" : g.priority === "medium" ? "#ca8a04" : "#64748b";
          return `<tr><td style="font-weight:500;">${esc(g.topic)}</td><td><span class="badge" style="background:${priColor}15;color:${priColor};">${g.priority}</span></td><td style="text-align:right;">${fmtNum(g.estimatedVolume)}</td><td style="font-size:11px;color:#64748b;">${esc(g.intent)}</td></tr>`;
        }).join("")}
      </tbody>
    </table>` : "";

  const calendarHtml = calendar.length > 0 ? blurWrap(`
    <h3 class="sub-title">Content Calendar (Weeks 1-4)</h3>
    <table>
      <thead><tr><th>Week</th><th>Topic</th><th>Type</th><th>Target Keyword</th><th style="text-align:right;">Words</th></tr></thead>
      <tbody>
        ${calendar.map((c: any) => `<tr><td>Week ${c.week}</td><td style="font-weight:500;">${esc(c.topic)}</td><td style="font-size:11px;">${esc(c.type)}</td><td style="font-size:11px;color:#64748b;">${esc(c.targetKeyword)}</td><td style="text-align:right;">${fmtNum(c.wordCount)}</td></tr>`).join("")}
      </tbody>
    </table>`, isSummary) : "";

  return `
  <div class="section section-break">
    <h2 class="section-title">Content Strategy</h2>
    ${eatGrid}
    ${gapsHtml}
    ${calendarHtml}
    ${existing.length > 0 ? `
    <h3 class="sub-title">Existing Content Audit</h3>
    <table>
      <thead><tr><th>Page</th><th style="text-align:right;">Words</th><th>Updated</th><th>Status</th></tr></thead>
      <tbody>
        ${existing.map((p: any) => `<tr><td style="font-size:11px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(p.title || p.url)}</td><td style="text-align:right;">${fmtNum(p.wordCount)}</td><td style="font-size:11px;color:#64748b;">${esc(p.lastUpdated) || "—"}</td><td>${p.needsUpdate ? '<span class="badge badge-warning">Needs Update</span>' : '<span class="badge badge-good">OK</span>'}</td></tr>`).join("")}
      </tbody>
    </table>` : ""}
  </div>`;
}

function buildLocalSection(agentResults: Record<string, any>, isSummary: boolean): string {
  const localData = agentResults["local-seo"];
  if (!localData) return "";

  const gbp = localData.gbpStatus;
  const citations = localData.citations || localData.directoryAudit || [];
  const mapPack = localData.mapPackPosition || localData.mapPackPositions || [];

  const gbpHtml = gbp ? `
    <div class="card" style="background:${gbp.claimed ? "#f0fdf4" : "#fef2f2"};border-left:4px solid ${gbp.claimed ? "#16a34a" : "#dc2626"};">
      <p style="font-size:13px;font-weight:600;color:${gbp.claimed ? "#166534" : "#991b1b"};margin-bottom:6px;">Google Business Profile: ${gbp.claimed ? "Claimed & Verified" : "Not Claimed"}</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px;">
        <div><strong>${gbp.avgRating ?? gbp.rating ?? "—"}</strong> rating</div>
        <div><strong>${gbp.reviewCount ?? 0}</strong> reviews</div>
        <div><strong>${gbp.photosCount ?? 0}</strong> photos</div>
        <div><strong>${gbp.postsLastMonth ?? 0}</strong> posts/mo</div>
      </div>
    </div>` : "";

  const citationHtml = citations.length > 0 ? `
    <h3 class="sub-title">Citations & Directories</h3>
    <table>
      <thead><tr><th>Directory</th><th style="text-align:center;">Listed</th><th style="text-align:center;">NAP Consistent</th><th style="text-align:center;">Tier</th></tr></thead>
      <tbody>
        ${citations.slice(0, 12).map((c: any) => {
          const listed = c.listed ?? false;
          const nap = c.napConsistent ?? c.napCorrect ?? false;
          return `<tr><td>${esc(c.directory || c.name)}</td><td style="text-align:center;">${listed ? "&#9989;" : "&#10060;"}</td><td style="text-align:center;">${listed ? (nap ? "&#9989;" : "&#10060;") : "—"}</td><td style="text-align:center;">${c.tier ?? "—"}</td></tr>`;
        }).join("")}
      </tbody>
    </table>` : "";

  const mapHtml = mapPack.length > 0 ? `
    <h3 class="sub-title">Map Pack Positions</h3>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${mapPack.slice(0, 8).map((m: any) => {
        const pos = m.position;
        const bg = pos && pos <= 3 ? "#f0fdf4" : pos ? "#fefce8" : "#f8fafc";
        const color = pos && pos <= 3 ? "#16a34a" : pos ? "#ca8a04" : "#64748b";
        return `<div style="padding:6px 12px;background:${bg};border-radius:6px;font-size:12px;"><strong style="color:${color};">${pos ?? "N/A"}</strong> ${esc(m.keyword)}</div>`;
      }).join("")}
    </div>` : "";

  const localScoreHtml = localData.localScore != null ? `
    <div style="margin-top:16px;">
      ${scoreBar("Local SEO Score", localData.localScore)}
    </div>` : "";

  return `
  <div class="section section-break">
    <h2 class="section-title">Local SEO</h2>
    ${gbpHtml}
    ${blurWrap(citationHtml + mapHtml, isSummary)}
    ${localScoreHtml}
  </div>`;
}

function buildCompetitorSection(competitors: any[], agentResults: Record<string, any>, isSummary: boolean): string {
  if (competitors.length === 0 && !agentResults["competitors"]) return "";

  const compData = agentResults["competitors"];
  const marketPos = compData?.marketPosition;

  // Use agent results for richer data, fall back to DB competitors
  const compList = compData?.competitors || competitors.map((c: any) => ({
    name: c.competitorName, url: c.competitorUrl, seoScore: c.seoScore,
    domainAuthority: c.domainAuthority, backlinks: c.backlinks,
    strengths: [], weaknesses: [],
  }));

  const tableHtml = `
    <table>
      <thead><tr><th>Competitor</th><th style="text-align:center;">SEO Score</th><th style="text-align:center;">DA</th><th style="text-align:right;">Backlinks</th></tr></thead>
      <tbody>
        ${compList.slice(0, 6).map((c: any) => `
        <tr>
          <td><strong>${esc(c.name)}</strong><br><span style="font-size:10px;color:#64748b;">${esc(c.url)}</span></td>
          <td style="text-align:center;font-weight:600;color:${scoreColor(c.seoScore ?? 0)};">${c.seoScore ?? "—"}</td>
          <td style="text-align:center;">${c.domainAuthority ?? "—"}</td>
          <td style="text-align:right;">${fmtNum(c.backlinks)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;

  const detailHtml = compList.slice(0, 4).map((c: any) => {
    const strengths = (c.strengths || []).slice(0, 3);
    const weaknesses = (c.weaknesses || []).slice(0, 3);
    if (strengths.length === 0 && weaknesses.length === 0) return "";
    return `
      <div class="card" style="margin-top:8px;">
        <p style="font-size:13px;font-weight:600;margin-bottom:6px;">${esc(c.name)}</p>
        ${strengths.length > 0 ? `<p style="font-size:11px;color:#16a34a;margin-bottom:2px;"><strong>Strengths:</strong> ${strengths.map((s: string) => esc(s)).join(", ")}</p>` : ""}
        ${weaknesses.length > 0 ? `<p style="font-size:11px;color:#dc2626;"><strong>Weaknesses:</strong> ${weaknesses.map((w: string) => esc(w)).join(", ")}</p>` : ""}
      </div>`;
  }).join("");

  const marketHtml = marketPos ? `
    <div class="card" style="background:#f0fdf4;margin-top:12px;">
      <p style="font-size:12px;font-weight:600;color:#166534;">Market Position: <strong>#${marketPos.rank}</strong> of ${marketPos.totalCompetitors} competitors</p>
      ${marketPos.closestThreat ? `<p style="font-size:11px;color:#64748b;margin-top:4px;">Closest threat: ${esc(marketPos.closestThreat)}</p>` : ""}
      ${marketPos.biggestGap ? `<p style="font-size:11px;color:#64748b;">Biggest gap: ${esc(marketPos.biggestGap)}</p>` : ""}
    </div>` : "";

  return `
  <div class="section section-break">
    <h2 class="section-title">Competitive Analysis</h2>
    ${tableHtml}
    ${blurWrap(detailHtml + marketHtml, isSummary)}
  </div>`;
}

function buildAdmissionsSection(admissions: any, agentResults: Record<string, any>, isSummary: boolean): string {
  if (!admissions) return "";
  const admData = agentResults["admissions"];

  const metricsHtml = `
    <div class="metric-grid">
      <div class="metric-box" style="background:#f0fdf4;">
        <p class="val" style="color:#16a34a;">${admissions.estimatedMonthlyAdmissions?.toFixed(1) ?? "—"}</p>
        <p class="lbl">Current Monthly Admissions (SEO)</p>
      </div>
      <div class="metric-box" style="background:#fef2f2;">
        <p class="val" style="color:#dc2626;">${admissions.lostAdmissions?.toFixed(1) ?? "—"}</p>
        <p class="lbl">Lost Monthly Admissions</p>
      </div>
      <div class="metric-box" style="background:#fefce8;">
        <p class="val" style="color:#ca8a04;">$${((admissions.potentialRevenue ?? 0) / 1000).toFixed(0)}k</p>
        <p class="lbl">Annual Lost Revenue</p>
      </div>
    </div>`;

  const projections = admData?.projections?.slice(0, 6) || [];
  const projHtml = projections.length > 0 ? blurWrap(`
    <h3 class="sub-title">6-Month Revenue Projection</h3>
    <table>
      <thead><tr><th>Month</th><th style="text-align:center;">With SEO</th><th style="text-align:center;">Without SEO</th><th style="text-align:right;">Difference</th></tr></thead>
      <tbody>
        ${projections.map((p: any) => {
          const diff = (p.withSeo ?? 0) - (p.withoutSeo ?? 0);
          return `<tr><td>${esc(p.month)}</td><td style="text-align:center;color:#16a34a;font-weight:500;">$${((p.withSeo ?? 0) / 1000).toFixed(1)}k</td><td style="text-align:center;color:#64748b;">$${((p.withoutSeo ?? 0) / 1000).toFixed(1)}k</td><td style="text-align:right;color:#16a34a;font-weight:600;">+$${(diff / 1000).toFixed(1)}k</td></tr>`;
        }).join("")}
      </tbody>
    </table>`, isSummary) : "";

  const assumptions = admData?.assumptions;
  const assumptionHtml = assumptions ? blurWrap(`
    <h3 class="sub-title">Model Assumptions</h3>
    <div class="card" style="font-size:11px;color:#64748b;">
      Avg. revenue per admission: <strong>$${fmtNum(assumptions.avgRevPerAdmission)}</strong> &bull;
      Conversion rate: <strong>${((assumptions.conversionRate ?? 0) * 100).toFixed(1)}%</strong> &bull;
      CTR model: <strong>${esc(assumptions.ctrModel)}</strong> &bull;
      Avg. LOS: <strong>${assumptions.avgLengthOfStay ?? "—"} days</strong>
    </div>`, isSummary) : "";

  return `
  <div class="section section-break">
    <h2 class="section-title">Admissions Impact</h2>
    ${metricsHtml}
    ${projHtml}
    ${assumptionHtml}
  </div>`;
}

// ── Action Items ──────────────────────────────────────────────────

interface ActionItem {
  priority: "quick-win" | "medium" | "strategic";
  category: string;
  action: string;
  impact: string;
}

function collectActionItems(audit: Audit | undefined, agentResults: Record<string, any>, competitors: any[]): ActionItem[] {
  const items: ActionItem[] = [];
  const issues = (audit?.issues as any[]) || [];

  // From technical issues
  for (const issue of issues) {
    if (issue.severity === "critical") {
      items.push({ priority: "quick-win", category: issue.category, action: issue.recommendation, impact: "High — addresses critical SEO issue" });
    } else if (issue.severity === "warning") {
      items.push({ priority: "medium", category: issue.category, action: issue.recommendation, impact: "Medium — improves SEO health" });
    }
  }

  // From content gaps
  const contentData = agentResults["content"];
  if (contentData?.contentGaps) {
    for (const gap of contentData.contentGaps.slice(0, 3)) {
      items.push({ priority: gap.priority === "high" ? "quick-win" : "medium", category: "Content", action: `Create page: ${gap.suggestedTitle || gap.topic}`, impact: `Targets ${gap.estimatedVolume ?? 0} monthly searches` });
    }
  }

  // From local SEO
  const localData = agentResults["local-seo"];
  if (localData?.gbpStatus && !localData.gbpStatus.claimed) {
    items.push({ priority: "quick-win", category: "Local SEO", action: "Claim and verify Google Business Profile", impact: "Critical for map pack visibility" });
  }

  // Sort: quick-win first, then medium, then strategic
  const order = { "quick-win": 0, medium: 1, strategic: 2 };
  items.sort((a, b) => order[a.priority] - order[b.priority]);

  return items;
}

function buildActionSection(actionItems: ActionItem[], isSummary: boolean): string {
  if (actionItems.length === 0) return "";

  const quickWins = actionItems.filter(a => a.priority === "quick-win");
  const medium = actionItems.filter(a => a.priority === "medium");
  const strategic = actionItems.filter(a => a.priority === "strategic");

  function renderGroup(title: string, items: ActionItem[], badge: string, badgeColor: string): string {
    if (items.length === 0) return "";
    return `
      <h3 class="sub-title">${title} <span class="badge" style="background:${badgeColor}15;color:${badgeColor};">${items.length}</span></h3>
      ${items.map((item, i) => `
        <div style="padding:8px 12px;margin-bottom:4px;background:#f8fafc;border-radius:6px;border-left:3px solid ${badgeColor};">
          <p style="font-size:12px;font-weight:500;color:#111827;margin:0;"><strong>${i + 1}.</strong> ${esc(item.action)}</p>
          <p style="font-size:11px;color:#64748b;margin:2px 0 0;">${esc(item.category)} &bull; ${esc(item.impact)}</p>
        </div>
      `).join("")}`;
  }

  // For summary: show first 3, blur the rest
  const visibleCount = 3;
  const visibleItems = actionItems.slice(0, visibleCount);
  const hiddenItems = actionItems.slice(visibleCount);

  if (isSummary) {
    return `
    <div class="section section-break">
      <h2 class="section-title">Priority Action Items (${actionItems.length})</h2>
      ${visibleItems.map((item, i) => `
        <div style="padding:8px 12px;margin-bottom:4px;background:#f8fafc;border-radius:6px;border-left:3px solid ${item.priority === "quick-win" ? "#16a34a" : item.priority === "medium" ? "#ca8a04" : "#6366f1"};">
          <p style="font-size:12px;font-weight:500;color:#111827;margin:0;"><strong>${i + 1}.</strong> ${esc(item.action)}</p>
          <p style="font-size:11px;color:#64748b;margin:2px 0 0;">${esc(item.category)} &bull; ${esc(item.impact)}</p>
        </div>
      `).join("")}
      ${hiddenItems.length > 0 ? blurWrap(hiddenItems.map((item, i) => `
        <div style="padding:8px 12px;margin-bottom:4px;background:#f8fafc;border-radius:6px;border-left:3px solid #64748b;">
          <p style="font-size:12px;font-weight:500;color:#111827;margin:0;"><strong>${visibleCount + i + 1}.</strong> ${esc(item.action)}</p>
          <p style="font-size:11px;color:#64748b;margin:2px 0 0;">${esc(item.category)} &bull; ${esc(item.impact)}</p>
        </div>
      `).join(""), true) : ""}
    </div>`;
  }

  return `
  <div class="section section-break">
    <h2 class="section-title">Priority Action Items (${actionItems.length})</h2>
    ${renderGroup("Quick Wins", quickWins, "quick-win", "#16a34a")}
    ${renderGroup("Medium Effort", medium, "medium", "#ca8a04")}
    ${renderGroup("Strategic", strategic, "strategic", "#6366f1")}
  </div>`;
}

function buildAppendix(audit: Audit | undefined, agentResults: Record<string, any>): string {
  return `
  <div class="section section-break">
    <h2 class="section-title">Appendix</h2>
    <h3 class="sub-title">Methodology</h3>
    <div class="card" style="font-size:11px;color:#64748b;line-height:1.6;">
      <p><strong>Technical SEO:</strong> Analysis via Google PageSpeed Insights API (Lighthouse) and direct HTML crawl. Core Web Vitals measured from real user data where available, lab data as fallback.</p>
      <p style="margin-top:6px;"><strong>Keyword Tracking:</strong> Position estimates derived from content signal analysis — presence in title tags, headings, body content, internal links, local signals, and schema markup. Validated against known SERP patterns for BH industry terms.</p>
      <p style="margin-top:6px;"><strong>Content Strategy:</strong> E-E-A-T scoring based on 15+ HTML signals including team credentials, accreditation marks, testimonials, clinical terminology depth, and trust indicators. Content gaps identified by comparing crawled pages against comprehensive BH treatment page taxonomy.</p>
      <p style="margin-top:6px;"><strong>Local SEO:</strong> Google Business Profile signals detected from website markup. Citation presence estimated from directory URL references in site HTML. NAP consistency inferred from extracted phone/address patterns.</p>
      <p style="margin-top:6px;"><strong>Competitive Analysis:</strong> Competitor websites crawled and scored using 17+ SEO signals. Domain authority and backlink counts are estimates based on observable site characteristics.</p>
      <p style="margin-top:6px;"><strong>Admissions Model:</strong> Uses AWR/Backlinko/Sistrix 2025 organic CTR curves, BH-specific conversion rates (organic visit → form submission → admission), and revenue per admission by level of care (detox, residential, PHP, IOP).</p>
    </div>
    <h3 class="sub-title" style="margin-top:16px;">Disclaimer</h3>
    <div class="card" style="font-size:10px;color:#94a3b8;line-height:1.5;">
      <p>This report provides estimates based on publicly available data and proprietary analysis models. Actual search engine rankings, traffic, and revenue outcomes may vary. Keyword positions are estimated based on content signals and may differ from live SERP results. Revenue projections are modeled estimates and should not be considered financial guarantees. BH SEO Intelligence is not responsible for decisions made based on this report. For the most accurate results, we recommend combining this analysis with Google Search Console and Google Analytics data.</p>
    </div>
  </div>`;
}

// ── Free score mini-report (unchanged) ────────────────────────────

export async function generateFreeScoreReport(websiteUrl: string, centerInfo: { name: string; treatmentCategory: string; levelsOfCare: string[]; city: string; state: string }) {
  const { runTechnicalAudit } = await import("./agents/technical-auditor");

  const auditData = await runTechnicalAudit({
    websiteUrl,
    ...centerInfo,
  });

  return {
    score: auditData.overallScore,
    technicalScore: auditData.technicalScore,
    contentScore: auditData.contentScore,
    localSeoScore: auditData.localSeoScore,
    mobileScore: auditData.mobileScore,
    pageSpeed: auditData.pageSpeed,
    coreWebVitals: auditData.coreWebVitals,
    issues: auditData.issues.slice(0, 6).map((i) => ({
      severity: i.severity,
      category: i.category,
      message: i.description,
      recommendation: i.recommendation,
    })),
    strengths: [
      ...(auditData.hasSslCert ? ["SSL certificate installed (HTTPS)"] : []),
      ...(auditData.mobileOptimized ? ["Mobile-responsive design detected"] : []),
      ...(auditData.hasSchemaMarkup ? ["Healthcare schema markup present"] : []),
      ...(auditData.crawlability?.hasSitemap ? ["XML sitemap found"] : []),
      ...(auditData.overallScore > 60 ? ["Above-average SEO foundation"] : []),
      ...(auditData.pageSpeed <= 2.5 ? ["Good page load speed"] : []),
    ],
    hasSchemaMarkup: auditData.hasSchemaMarkup,
    mobileOptimized: auditData.mobileOptimized,
    indexedPages: auditData.indexedPages,
    crawlability: auditData.crawlability,
    accessibility: auditData.accessibility,
  };
}
