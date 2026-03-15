// Agent system types

export interface AgentResult {
  agentName: string;
  status: "success" | "error" | "partial";
  data: any;
  errors?: string[];
  runDuration: number; // ms
  runDate: string;
}

export interface TechnicalAuditData {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  localSeoScore: number;
  backlinkScore: number;
  mobileScore: number;
  pageSpeed: number;
  indexedPages: number;
  hasSchemaMarkup: boolean;
  hasSslCert: boolean;
  mobileOptimized: boolean;
  issues: AuditIssue[];
  coreWebVitals: {
    lcp: number;
    inp: number;
    cls: number;
  };
  crawlability: {
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    canonicalsCorrect: boolean;
    noindexPages: number;
    redirectChains: number;
  };
  accessibility: {
    score: number;
    missingAltTags: number;
    missingHeadings: boolean;
    colorContrastIssues: number;
  };
}

export interface AuditIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  description: string;
  recommendation: string;
  impact?: string;
}

export interface KeywordTrackingData {
  keywords: {
    keyword: string;
    position: number;
    previousPosition: number;
    searchVolume: number;
    category: string;
    url: string;
    difficulty: number;
    opportunity: "quick-win" | "build" | "maintain" | "long-term";
  }[];
  summary: {
    totalTracked: number;
    top3: number;
    top10: number;
    top20: number;
    improved: number;
    declined: number;
    avgPosition: number;
  };
}

export interface ContentStrategyData {
  contentGaps: {
    topic: string;
    intent: string;
    competitorsCovering: number;
    estimatedVolume: number;
    priority: "high" | "medium" | "low";
    suggestedTitle: string;
    suggestedUrl: string;
  }[];
  eatScore: {
    experience: number;
    expertise: number;
    authoritativeness: number;
    trustworthiness: number;
    overall: number;
  };
  contentCalendar: {
    week: number;
    topic: string;
    type: string;
    targetKeyword: string;
    wordCount: number;
    priority: "high" | "medium" | "low";
  }[];
  existingContent: {
    url: string;
    title: string;
    wordCount: number;
    lastUpdated: string;
    needsUpdate: boolean;
  }[];
}

export interface LocalSeoData {
  gbpStatus: {
    claimed: boolean;
    verified: boolean;
    categoriesCorrect: boolean;
    hoursAccurate: boolean;
    photosCount: number;
    reviewCount: number;
    avgRating: number;
    postsLastMonth: number;
    qaPending: number;
  };
  citations: {
    directory: string;
    listed: boolean;
    napConsistent: boolean;
    tier: number;
  }[];
  mapPackPosition: {
    keyword: string;
    position: number | null;
  }[];
  localScore: number;
}

export interface CompetitorData {
  competitors: {
    name: string;
    url: string;
    seoScore: number;
    domainAuthority: number;
    backlinks: number;
    sharedKeywords: number;
    uniqueKeywords: number;
    topPages: string[];
    strengths: string[];
    weaknesses: string[];
    recentChanges: string[];
  }[];
  marketPosition: {
    rank: number;
    totalCompetitors: number;
    closestThreat: string;
    biggestGap: string;
  };
}

export interface AdmissionsEstimateData {
  currentMonthly: number;
  lostMonthly: number;
  potentialMonthly: number;
  annualRevenue: {
    current: number;
    potential: number;
    lost: number;
  };
  byKeywordCluster: {
    cluster: string;
    currentAdmissions: number;
    potentialAdmissions: number;
    revenueOpportunity: number;
  }[];
  assumptions: {
    avgRevPerAdmission: number;
    conversionRate: number;
    ctrModel: string;
    avgLengthOfStay: number;
  };
  projections: {
    month: string;
    withSeo: number;
    withoutSeo: number;
  }[];
}
