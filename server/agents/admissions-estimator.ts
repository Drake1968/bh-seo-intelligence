// Agent 6: Admissions Estimator
// Converts SEO data into admissions and revenue projections
// Uses BH-specific conversion models and industry benchmarks

import type { AdmissionsEstimateData } from "./types";

interface CenterInfo {
  websiteUrl: string;
  name: string;
  treatmentCategory: string;
  levelsOfCare: string[];
  city: string;
  state: string;
}

interface KeywordData {
  keyword: string;
  position: number;
  searchVolume: number;
  category: string;
}

// CTR by position (aggregated from AWR, Backlinko, and Sistrix 2025 studies)
const CTR_MODEL: Record<number, number> = {
  1: 0.314, 2: 0.1553, 3: 0.1103, 4: 0.0802, 5: 0.0553,
  6: 0.0405, 7: 0.0299, 8: 0.0226, 9: 0.0182, 10: 0.0150,
  11: 0.0105, 12: 0.0089, 13: 0.0075, 14: 0.0065, 15: 0.0058,
  16: 0.0052, 17: 0.0047, 18: 0.0043, 19: 0.004, 20: 0.0037,
};

// Average revenue per admission by level of care
const REV_PER_ADMISSION: Record<string, number> = {
  detox: 6500,
  rtc: 18000,
  residential: 18000,
  php: 8000,
  iop: 4500,
  outpatient: 2000,
  telehealth: 1500,
  crisis: 5000,
};

// Website-to-admission conversion rates by intent type
const CONVERSION_RATES: Record<string, number> = {
  transactional: 0.035, // 3.5% — "rehab near me", "detox athens ga"
  informational: 0.008, // 0.8% — "what is detox", "signs of withdrawal"
  local: 0.042, // 4.2% — high intent local searches
  navigational: 0.001, // 0.1% — brand searches (already know you)
};

function getCTR(position: number): number {
  if (position <= 0 || position > 100) return 0;
  if (position <= 20) return CTR_MODEL[position] || 0;
  if (position <= 50) return 0.003 - (position - 20) * 0.00005;
  return 0.001;
}

export async function runAdmissionsEstimator(
  center: CenterInfo,
  keywords: KeywordData[]
): Promise<AdmissionsEstimateData> {
  // Calculate weighted average revenue per admission based on LOC mix
  const locs = center.levelsOfCare;
  let totalRev = 0;
  for (const loc of locs) {
    totalRev += REV_PER_ADMISSION[loc] || 5000;
  }
  const avgRevPerAdmission = Math.round(totalRev / locs.length);

  // Calculate average length of stay
  const avgLOS = locs.includes("rtc") || locs.includes("residential") ? 28
    : locs.includes("detox") ? 7
    : locs.includes("php") ? 21
    : locs.includes("iop") ? 42
    : 14;

  // Cluster keywords by topic and calculate admissions per cluster
  const clusters: Record<string, { keywords: KeywordData[]; label: string }> = {};
  
  for (const kw of keywords) {
    let cluster = "general";
    const kwLower = kw.keyword.toLowerCase();
    
    if (kwLower.includes("detox")) cluster = "detox";
    else if (kwLower.includes("residential") || kwLower.includes("inpatient") || kwLower.includes("rtc")) cluster = "residential";
    else if (kwLower.includes("php") || kwLower.includes("partial")) cluster = "php";
    else if (kwLower.includes("iop") || kwLower.includes("outpatient")) cluster = "iop";
    else if (kwLower.includes("alcohol")) cluster = "alcohol";
    else if (kwLower.includes("opioid") || kwLower.includes("fentanyl") || kwLower.includes("heroin")) cluster = "opioid";
    else if (kwLower.includes("anxiety") || kwLower.includes("depression") || kwLower.includes("mental health") || kwLower.includes("ptsd") || kwLower.includes("bipolar")) cluster = "mental_health";
    else if (kwLower.includes("dual") || kwLower.includes("co-occurring")) cluster = "dual_diagnosis";
    else if (kwLower.includes("insurance") || kwLower.includes("cost")) cluster = "insurance_cost";
    else if (kwLower.includes("how") || kwLower.includes("what") || kwLower.includes("sign")) cluster = "informational";

    if (!clusters[cluster]) {
      clusters[cluster] = { keywords: [], label: cluster.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()) };
    }
    clusters[cluster].keywords.push(kw);
  }

  // Calculate current and potential admissions by cluster
  let totalCurrentAdmissions = 0;
  let totalPotentialAdmissions = 0;

  const byKeywordCluster = Object.entries(clusters).map(([key, cluster]) => {
    let clusterCurrent = 0;
    let clusterPotential = 0;

    for (const kw of cluster.keywords) {
      // Determine intent type
      const isInfo = kw.keyword.match(/how|what|sign|when|why/i);
      const isLocal = kw.keyword.match(/near me|{center.city}/i);
      const convRate = isInfo ? CONVERSION_RATES.informational 
        : isLocal ? CONVERSION_RATES.local 
        : CONVERSION_RATES.transactional;

      // Current monthly admissions from this keyword
      const currentCTR = getCTR(kw.position);
      const currentClicks = kw.searchVolume * currentCTR;
      const currentAdmissions = currentClicks * convRate;
      clusterCurrent += currentAdmissions;

      // Potential if ranking #1-3
      const targetPosition = Math.min(3, kw.position);
      const potentialCTR = getCTR(targetPosition);
      const potentialClicks = kw.searchVolume * potentialCTR;
      const potentialAdmissions = potentialClicks * convRate;
      clusterPotential += potentialAdmissions;
    }

    totalCurrentAdmissions += clusterCurrent;
    totalPotentialAdmissions += clusterPotential;

    const revenueOpportunity = (clusterPotential - clusterCurrent) * avgRevPerAdmission * 12;

    return {
      cluster: cluster.label,
      currentAdmissions: Math.round(clusterCurrent * 100) / 100,
      potentialAdmissions: Math.round(clusterPotential * 100) / 100,
      revenueOpportunity: Math.round(revenueOpportunity),
    };
  });

  // Sort by revenue opportunity
  byKeywordCluster.sort((a, b) => b.revenueOpportunity - a.revenueOpportunity);

  const lostMonthly = totalPotentialAdmissions - totalCurrentAdmissions;
  
  const annualRevenue = {
    current: Math.round(totalCurrentAdmissions * avgRevPerAdmission * 12),
    potential: Math.round(totalPotentialAdmissions * avgRevPerAdmission * 12),
    lost: Math.round(lostMonthly * avgRevPerAdmission * 12),
  };

  // Generate 12-month projections (assuming SEO improvement trajectory)
  const projections = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + i);
    const monthStr = date.toISOString().substring(0, 7); // YYYY-MM
    
    // SEO improvements typically show results after 3-6 months
    const seoGrowthFactor = i < 2 ? 0.05 : i < 4 ? 0.12 : i < 6 ? 0.22 : i < 9 ? 0.35 : 0.45;
    const withSeo = totalCurrentAdmissions + (lostMonthly * seoGrowthFactor);
    const withoutSeo = totalCurrentAdmissions * (1 - 0.02 * i); // Slight decline without SEO work
    
    projections.push({
      month: monthStr,
      withSeo: Math.round(withSeo * 100) / 100,
      withoutSeo: Math.round(Math.max(0, withoutSeo) * 100) / 100,
    });
  }

  return {
    currentMonthly: Math.round(totalCurrentAdmissions * 100) / 100,
    lostMonthly: Math.round(lostMonthly * 100) / 100,
    potentialMonthly: Math.round(totalPotentialAdmissions * 100) / 100,
    annualRevenue,
    byKeywordCluster,
    assumptions: {
      avgRevPerAdmission,
      conversionRate: 0.035,
      ctrModel: "Position-based (AWR/Backlinko/Sistrix 2025)",
      avgLengthOfStay: avgLOS,
    },
    projections,
  };
}
