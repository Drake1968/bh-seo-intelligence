import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Activity, BarChart3, TrendingUp, TrendingDown, Users, FileText, Globe,
  ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Search,
  Settings, LogOut, Loader2, Play, MapPin, BookOpen, Cpu, XCircle,
  Target, Zap, Clock, ChevronRight, Star, ExternalLink,
  Download, CalendarClock, ToggleLeft, ToggleRight, FileDown
} from "lucide-react";

import { useAuth, getAuthHeaders } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { TreatmentCenter, Audit, KeywordRanking, Competitor, AdmissionsEstimate } from "@shared/schema";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

// ============ TYPES ============

interface AgentRunStatus {
  centerId: number;
  status: "idle" | "running" | "complete" | "error";
  agents: {
    name: string;
    status: "pending" | "running" | "complete" | "error";
    duration?: number;
    error?: string;
  }[];
  startedAt?: string;
  completedAt?: string;
  totalDuration?: number;
}

interface ContentStrategy {
  contentGaps: {
    topic: string;
    intent: string;
    competitorsCovering: number;
    estimatedVolume: number;
    priority: "high" | "medium" | "low";
    suggestedTitle: string;
    suggestedUrl: string;
  }[];
  eatScore: { experience: number; expertise: number; authoritativeness: number; trustworthiness: number; overall: number };
  contentCalendar: { week: number; topic: string; type: string; targetKeyword: string; wordCount: number; priority: "high" | "medium" | "low" }[];
  existingContent: { url: string; title: string; wordCount: number; lastUpdated: string; needsUpdate: boolean }[];
}

interface LocalSeo {
  gbpStatus: {
    claimed: boolean; verified: boolean; categoriesCorrect: boolean; hoursAccurate: boolean;
    photosCount: number; reviewCount: number; avgRating: number; postsLastMonth: number; qaPending: number;
  };
  citations: { directory: string; listed: boolean; napConsistent: boolean; tier: number }[];
  mapPackPosition: { keyword: string; position: number | null }[];
  localScore: number;
}

interface TechnicalAuditExt {
  coreWebVitals: { lcp: number; inp: number; cls: number };
  crawlability: { hasRobotsTxt: boolean; hasSitemap: boolean; canonicalsCorrect: boolean; noindexPages: number; redirectChains: number };
  accessibility: { score: number; missingAltTags: number; missingHeadings: boolean; colorContrastIssues: number };
}

interface AdmissionsProjections {
  currentMonthly: number;
  lostMonthly: number;
  potentialMonthly: number;
  annualRevenue: { current: number; potential: number; lost: number };
  byKeywordCluster: { cluster: string; currentAdmissions: number; potentialAdmissions: number; revenueOpportunity: number }[];
  assumptions: { avgRevPerAdmission: number; conversionRate: number; ctrModel: string; avgLengthOfStay: number };
  projections: { month: string; withSeo: number; withoutSeo: number }[];
}

// ============ COMPONENTS ============

function ScoreGauge({ score, label, size = "sm" }: { score: number; label: string; size?: "sm" | "lg" }) {
  const color = score >= 80 ? "text-green-600 dark:text-green-400" : score >= 60 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400";
  const bgColor = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="text-center">
      <p className={`${size === "lg" ? "text-3xl" : "text-xl"} font-bold ${color}`}>{score}</p>
      <div className="h-1.5 rounded-full bg-muted mt-1 mb-1 overflow-hidden">
        <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function AgentStatusPanel({ status, onRun }: { status: AgentRunStatus | null; onRun: () => void }) {
  const isRunning = status?.status === "running";
  const isComplete = status?.status === "complete";
  const agentIcons = [Cpu, Search, BookOpen, MapPin, Users, BarChart3];

  return (
    <Card className="border" data-testid="agent-status-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> AI Agent Intelligence
          </CardTitle>
          <Button
            size="sm"
            className="text-xs gap-1.5"
            onClick={onRun}
            disabled={isRunning}
            data-testid="btn-run-agents"
          >
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> {isComplete ? "Re-Run Agents" : "Run Analysis"}</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(status?.agents || [
            { name: "Technical Auditor", status: "pending" },
            { name: "Keyword Tracker", status: "pending" },
            { name: "Content Strategist", status: "pending" },
            { name: "Local SEO Monitor", status: "pending" },
            { name: "Competitor Analyst", status: "pending" },
            { name: "Admissions Estimator", status: "pending" },
          ]).map((agent, i) => {
            const Icon = agentIcons[i] || Cpu;
            const statusColor = agent.status === "complete" ? "text-green-600 dark:text-green-400"
              : agent.status === "running" ? "text-blue-600 dark:text-blue-400"
              : agent.status === "error" ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground";
            const bgClass = agent.status === "complete" ? "bg-green-500/10"
              : agent.status === "running" ? "bg-blue-500/10"
              : agent.status === "error" ? "bg-red-500/10"
              : "bg-muted/30";
            return (
              <div key={i} className={`rounded-lg p-2.5 text-center ${bgClass}`}>
                {agent.status === "running" ? (
                  <Loader2 className={`w-4 h-4 mx-auto mb-1 animate-spin ${statusColor}`} />
                ) : agent.status === "complete" ? (
                  <CheckCircle2 className={`w-4 h-4 mx-auto mb-1 ${statusColor}`} />
                ) : agent.status === "error" ? (
                  <XCircle className={`w-4 h-4 mx-auto mb-1 ${statusColor}`} />
                ) : (
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${statusColor}`} />
                )}
                <p className="text-[10px] font-medium leading-tight">{agent.name.replace("SEO ", "").replace("Rank ", "")}</p>
                {agent.duration != null && (
                  <p className="text-[9px] text-muted-foreground mt-0.5">{(agent.duration / 1000).toFixed(1)}s</p>
                )}
              </div>
            );
          })}
        </div>
        {status?.totalDuration != null && (
          <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> All agents completed in {(status.totalDuration / 1000).toFixed(1)}s
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="border"><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border"><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN DASHBOARD ============

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, tenant, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  // Fetch user's centers
  const { data: centers, isLoading: centersLoading } = useQuery<TreatmentCenter[]>({
    queryKey: ["/api/dashboard/centers"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/dashboard/centers`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const center = centers?.[0];

  // Fetch audit
  const { data: audit } = useQuery<Audit | null>({
    queryKey: ["/api/centers", center?.id, "audit"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/audit`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center,
  });

  // Fetch keywords
  const { data: keywords } = useQuery<KeywordRanking[]>({
    queryKey: ["/api/centers", center?.id, "keywords"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/keywords`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center,
  });

  // Fetch competitors
  const { data: competitorData } = useQuery<Competitor[]>({
    queryKey: ["/api/centers", center?.id, "competitors"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/competitors`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center,
  });

  // Fetch admissions
  const { data: admissions } = useQuery<AdmissionsEstimate | null>({
    queryKey: ["/api/centers", center?.id, "admissions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/admissions`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center,
  });

  // Fetch agent status (polls while running)
  const { data: agentStatus } = useQuery<AgentRunStatus>({
    queryKey: ["/api/centers", center?.id, "agent-status"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/agent-status`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center,
    refetchInterval: (query) => {
      const data = query.state.data as AgentRunStatus | undefined;
      return data?.status === "running" ? 800 : false;
    },
  });

  // Fetch extended data (content strategy, local SEO, technical details, admissions projections)
  const { data: contentStrategy } = useQuery<ContentStrategy | null>({
    queryKey: ["/api/centers", center?.id, "content-strategy"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/content-strategy`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center && agentStatus?.status === "complete",
  });

  const { data: localSeo } = useQuery<LocalSeo | null>({
    queryKey: ["/api/centers", center?.id, "local-seo"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/local-seo`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center && agentStatus?.status === "complete",
  });

  const { data: technicalExt } = useQuery<TechnicalAuditExt | null>({
    queryKey: ["/api/centers", center?.id, "technical-audit"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/technical-audit`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center && agentStatus?.status === "complete",
  });

  const { data: admissionsProj } = useQuery<AdmissionsProjections | null>({
    queryKey: ["/api/centers", center?.id, "admissions-projections"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${center!.id}/admissions-projections`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    enabled: !!center && agentStatus?.status === "complete",
  });

  // Run agents mutation
  const runAgentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/centers/${center!.id}/run-agents`);
      return res.json();
    },
    onSuccess: () => {
      // Start polling agent status
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center?.id, "agent-status"] });
    },
  });

  // When agents complete, refetch all dashboard data
  useEffect(() => {
    if (agentStatus?.status === "complete" && center) {
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "audit"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "competitors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "admissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "content-strategy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "local-seo"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "technical-audit"] });
      queryClient.invalidateQueries({ queryKey: ["/api/centers", center.id, "admissions-projections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/centers"] });
    }
  }, [agentStatus?.status, center?.id]);

  if (authLoading || centersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b bg-card px-4 sm:px-6 flex items-center"><Skeleton className="h-6 w-32" /></header>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6"><DashboardSkeleton /></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const planLabel = tenant?.plan === "none" ? "Free" : (tenant?.plan || "Free");

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      {/* Dashboard navbar */}
      <header className="h-14 border-b bg-card px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-foreground no-underline" data-testid="dashboard-logo">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">{tenant?.name || "BH SEO Intel"}</span>
          </Link>
          <Badge variant="outline" className="text-xs hidden sm:inline-flex capitalize">{planLabel}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
          <Button variant="ghost" size="sm" className="text-xs gap-1" data-testid="btn-settings">
            <Settings className="w-3.5 h-3.5" /> Settings
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={async () => { await logout(); setLocation("/"); }} data-testid="btn-logout">
            <LogOut className="w-3.5 h-3.5" /> Exit
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {!center ? (
          <Card className="border text-center p-8" data-testid="no-center">
            <CardContent>
              <h2 className="text-lg font-bold mb-2">No treatment center configured</h2>
              <p className="text-sm text-muted-foreground mb-4">Complete onboarding to set up your dashboard.</p>
              <Link href="/onboarding"><Button data-testid="btn-go-onboarding">Complete Setup</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Center info header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <h1 className="text-lg font-bold" data-testid="dashboard-center-name">{center.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{center.websiteUrl}</span>
                  <span>·</span>
                  <span>{center.city}, {center.state}</span>
                </div>
              </div>
            </div>

            {/* Agent Status Panel */}
            <div className="mb-5">
              <AgentStatusPanel
                status={agentStatus || null}
                onRun={() => runAgentsMutation.mutate()}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-5 flex-wrap">
                <TabsTrigger value="overview" className="text-xs" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="keywords" className="text-xs" data-testid="tab-keywords">Keywords</TabsTrigger>
                <TabsTrigger value="content" className="text-xs" data-testid="tab-content">Content</TabsTrigger>
                <TabsTrigger value="local" className="text-xs" data-testid="tab-local">Local SEO</TabsTrigger>
                <TabsTrigger value="competitors" className="text-xs" data-testid="tab-competitors">Competitors</TabsTrigger>
                <TabsTrigger value="admissions" className="text-xs" data-testid="tab-admissions">Admissions</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs" data-testid="tab-settings">Reports & Settings</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-4">
                {audit ? (
                  <>
                    {/* Score cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <Card className="border"><CardContent className="p-4"><ScoreGauge score={audit.overallScore!} label="Overall" size="lg" /></CardContent></Card>
                      <Card className="border"><CardContent className="p-4"><ScoreGauge score={audit.technicalScore!} label="Technical" /></CardContent></Card>
                      <Card className="border"><CardContent className="p-4"><ScoreGauge score={audit.contentScore!} label="Content" /></CardContent></Card>
                      <Card className="border"><CardContent className="p-4"><ScoreGauge score={audit.localSeoScore!} label="Local SEO" /></CardContent></Card>
                      <Card className="border"><CardContent className="p-4"><ScoreGauge score={audit.backlinkScore!} label="Backlinks" /></CardContent></Card>
                      <Card className="border"><CardContent className="p-4"><ScoreGauge score={audit.mobileScore!} label="Mobile" /></CardContent></Card>
                    </div>

                    {/* Core Web Vitals (from extended technical data) */}
                    {technicalExt?.coreWebVitals && (
                      <Card className="border" data-testid="cwv-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Core Web Vitals</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: "LCP", value: `${(technicalExt.coreWebVitals.lcp / 1000).toFixed(1)}s`, target: "≤ 2.5s", good: technicalExt.coreWebVitals.lcp <= 2500 },
                              { label: "INP", value: `${technicalExt.coreWebVitals.inp}ms`, target: "≤ 200ms", good: technicalExt.coreWebVitals.inp <= 200 },
                              { label: "CLS", value: technicalExt.coreWebVitals.cls.toFixed(2), target: "≤ 0.1", good: technicalExt.coreWebVitals.cls <= 0.1 },
                            ].map((metric, i) => (
                              <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                                <p className={`text-lg font-bold ${metric.good ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{metric.value}</p>
                                <p className="text-xs font-medium">{metric.label}</p>
                                <p className="text-[10px] text-muted-foreground">Target: {metric.target}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Key metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Page Speed", value: `${audit.pageSpeed}s`, icon: Activity, trend: audit.pageSpeed! <= 2.5 ? "Good" : "Improve", up: audit.pageSpeed! <= 2.5 },
                        { label: "Indexed Pages", value: audit.indexedPages, icon: FileText, trend: `${audit.indexedPages}`, up: true },
                        { label: "Est. Monthly Admissions", value: admissions?.estimatedMonthlyAdmissions?.toFixed(1) ?? "—", icon: TrendingUp, trend: "+SEO", up: true },
                        { label: "Lost Admissions / Mo", value: admissions?.lostAdmissions?.toFixed(1) ?? "—", icon: AlertTriangle, trend: "Recoverable", up: false },
                      ].map((m, i) => (
                        <Card key={i} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <m.icon className="w-4 h-4 text-muted-foreground" />
                              <span className={`text-[10px] ${m.up ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>{m.trend}</span>
                            </div>
                            <p className="text-xl font-bold">{m.value}</p>
                            <p className="text-xs text-muted-foreground">{m.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Issues */}
                    <Card className="border" data-testid="issues-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Issues Found ({(audit.issues as any[])?.length ?? 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {(audit.issues as any[])?.map((issue: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <Badge variant={issue.severity === "critical" ? "destructive" : "secondary"} className="text-xs mt-0.5 flex-shrink-0">{issue.severity}</Badge>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium">{issue.description}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{issue.recommendation}</p>
                                {issue.impact && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Impact: {issue.impact}</p>}
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{issue.category}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border text-center p-8">
                    <CardContent>
                      <Cpu className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">No audit data yet</p>
                      <p className="text-xs text-muted-foreground">Click "Run Analysis" above to start your first agent-powered audit.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* KEYWORDS TAB */}
              <TabsContent value="keywords" className="space-y-4">
                <Card className="border" data-testid="keywords-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4" /> Keyword Rankings</CardTitle>
                      <Badge variant="outline" className="text-xs">{keywords?.length ?? 0} tracked</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!keywords || keywords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Run agents to start tracking keywords</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full" data-testid="keywords-table">
                          <thead>
                            <tr className="text-xs text-muted-foreground border-b">
                              <th className="text-left py-2 pr-4 font-medium">Keyword</th>
                              <th className="text-center py-2 px-2 font-medium">Position</th>
                              <th className="text-center py-2 px-2 font-medium">Change</th>
                              <th className="text-right py-2 px-2 font-medium">Volume</th>
                              <th className="text-center py-2 pl-2 font-medium">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keywords.map((kw) => {
                              const change = (kw.previousPosition ?? 0) - (kw.position ?? 0);
                              return (
                                <tr key={kw.id} className="text-xs border-b last:border-0">
                                  <td className="py-2.5 pr-4 font-medium">{kw.keyword}</td>
                                  <td className="py-2.5 px-2 text-center">
                                    <Badge variant="outline" className="font-mono text-xs">{kw.position}</Badge>
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <span className={`flex items-center justify-center gap-0.5 ${change > 0 ? "text-green-600 dark:text-green-400" : change < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                                      {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : change < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                                      {change > 0 ? `+${change}` : change < 0 ? change : "–"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-muted-foreground">{kw.searchVolume?.toLocaleString()}</td>
                                  <td className="py-2.5 pl-2 text-center">
                                    <Badge variant="secondary" className="text-xs uppercase">{kw.category}</Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONTENT STRATEGY TAB */}
              <TabsContent value="content" className="space-y-4">
                {contentStrategy ? (
                  <>
                    {/* E-E-A-T Score */}
                    <Card className="border" data-testid="eat-score-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> E-E-A-T Score (YMYL Compliance)</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { label: "Experience", score: contentStrategy.eatScore.experience },
                            { label: "Expertise", score: contentStrategy.eatScore.expertise },
                            { label: "Authority", score: contentStrategy.eatScore.authoritativeness },
                            { label: "Trust", score: contentStrategy.eatScore.trustworthiness },
                            { label: "Overall", score: contentStrategy.eatScore.overall },
                          ].map((item, i) => (
                            <div key={i} className="text-center">
                              <p className={`text-lg font-bold ${item.score >= 70 ? "text-green-600 dark:text-green-400" : item.score >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{item.score}</p>
                              <Progress value={item.score} className="h-1.5 mt-1" />
                              <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Gaps */}
                    <Card className="border" data-testid="content-gaps-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4" /> Content Gaps</CardTitle>
                          <Badge variant="outline" className="text-xs">{contentStrategy.contentGaps.length} opportunities</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {contentStrategy.contentGaps.slice(0, 8).map((gap, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <Badge variant={gap.priority === "high" ? "destructive" : "secondary"} className="text-[10px] mt-0.5 flex-shrink-0">{gap.priority}</Badge>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium">{gap.suggestedTitle}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  ~{gap.estimatedVolume.toLocaleString()} monthly searches · {gap.competitorsCovering} competitors covering · {gap.intent} intent
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Calendar */}
                    <Card className="border" data-testid="content-calendar-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> 8-Week Content Calendar</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {contentStrategy.contentCalendar.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">W{item.week}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{item.topic}</p>
                                <p className="text-[10px] text-muted-foreground">{item.type} · {item.wordCount.toLocaleString()} words</p>
                              </div>
                              <Badge variant={item.priority === "high" ? "default" : "secondary"} className="text-[10px]">{item.priority}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border text-center p-8">
                    <CardContent>
                      <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">No content strategy data</p>
                      <p className="text-xs text-muted-foreground">Run agents to generate your content strategy, E-E-A-T score, and calendar.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* LOCAL SEO TAB */}
              <TabsContent value="local" className="space-y-4">
                {localSeo ? (
                  <>
                    {/* Local Score + GBP Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="border" data-testid="local-score-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Local SEO Score</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-center">
                          <p className={`text-4xl font-bold ${localSeo.localScore >= 70 ? "text-green-600 dark:text-green-400" : localSeo.localScore >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}>{localSeo.localScore}</p>
                          <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                        </CardContent>
                      </Card>

                      <Card className="border" data-testid="gbp-status-card">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Google Business Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                              { label: "Claimed", ok: localSeo.gbpStatus.claimed },
                              { label: "Verified", ok: localSeo.gbpStatus.verified },
                              { label: "Categories OK", ok: localSeo.gbpStatus.categoriesCorrect },
                              { label: "Hours Accurate", ok: localSeo.gbpStatus.hoursAccurate },
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                {item.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded bg-muted/50"><p className="text-sm font-bold">{localSeo.gbpStatus.reviewCount}</p><p className="text-[10px] text-muted-foreground">Reviews</p></div>
                            <div className="p-2 rounded bg-muted/50"><p className="text-sm font-bold flex items-center justify-center gap-0.5"><Star className="w-3 h-3 text-yellow-500" />{localSeo.gbpStatus.avgRating}</p><p className="text-[10px] text-muted-foreground">Rating</p></div>
                            <div className="p-2 rounded bg-muted/50"><p className="text-sm font-bold">{localSeo.gbpStatus.photosCount}</p><p className="text-[10px] text-muted-foreground">Photos</p></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Map Pack Positions */}
                    <Card className="border" data-testid="map-pack-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Google Map Pack Positions</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {localSeo.mapPackPosition.map((mp, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border">
                              <span className="text-xs font-medium">{mp.keyword}</span>
                              {mp.position ? (
                                <Badge variant={mp.position <= 3 ? "default" : "secondary"} className="text-xs font-mono">#{mp.position}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">Not ranked</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Citation Audit */}
                    <Card className="border" data-testid="citations-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Citation Audit</CardTitle>
                          <Badge variant="outline" className="text-xs">{localSeo.citations.filter(c => c.listed).length}/{localSeo.citations.length} listed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1.5">
                          {localSeo.citations.map((c, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] w-4 text-center">T{c.tier}</Badge>
                                <span className="font-medium">{c.directory}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {c.listed ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                    {c.napConsistent ? (
                                      <span className="text-green-600 dark:text-green-400">NAP ✓</span>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400">NAP ✗</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">Not listed</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border text-center p-8">
                    <CardContent>
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">No local SEO data</p>
                      <p className="text-xs text-muted-foreground">Run agents to analyze your Google Business Profile, citations, and Map Pack positions.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* COMPETITORS TAB */}
              <TabsContent value="competitors" className="space-y-4">
                <Card className="border" data-testid="competitors-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4" /> Competitor Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Your center row */}
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold flex items-center gap-1">{center.name} <Badge variant="default" className="text-xs ml-1">You</Badge></p>
                          <p className="text-xs text-muted-foreground">{center.websiteUrl}</p>
                        </div>
                        <div className="text-center px-3"><p className="text-sm font-bold">{center.seoScore ?? "—"}</p><p className="text-xs text-muted-foreground">Score</p></div>
                      </div>
                      {competitorData?.map((c) => (
                        <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{c.competitorName}</p>
                            <p className="text-xs text-muted-foreground">{c.competitorUrl}</p>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div><p className="text-sm font-bold">{c.seoScore}</p><p className="text-xs text-muted-foreground">Score</p></div>
                            <div><p className="text-sm font-bold">{c.domainAuthority}</p><p className="text-xs text-muted-foreground">DA</p></div>
                            <div><p className="text-sm font-bold">{c.backlinks?.toLocaleString()}</p><p className="text-xs text-muted-foreground">Links</p></div>
                            <div><p className="text-sm font-bold">{c.sharedKeywords}</p><p className="text-xs text-muted-foreground">Shared</p></div>
                          </div>
                        </div>
                      ))}
                      {(!competitorData || competitorData.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-8">Run agents to identify competitors</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ADMISSIONS TAB */}
              <TabsContent value="admissions" className="space-y-4">
                {admissionsProj ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="border"><CardContent className="p-5 text-center">
                        <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{admissionsProj.currentMonthly.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Current Est. Monthly</p>
                      </CardContent></Card>
                      <Card className="border"><CardContent className="p-5 text-center">
                        <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
                        <p className="text-2xl font-bold text-destructive">{admissionsProj.lostMonthly.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Lost Admissions / Mo</p>
                      </CardContent></Card>
                      <Card className="border"><CardContent className="p-5 text-center">
                        <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">${admissionsProj.annualRevenue.lost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Annual Revenue Opportunity</p>
                      </CardContent></Card>
                    </div>

                    {/* Revenue by Keyword Cluster */}
                    <Card className="border" data-testid="cluster-revenue-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Revenue Opportunity by Keyword Cluster</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {admissionsProj.byKeywordCluster.filter(c => c.revenueOpportunity > 0).map((cluster, i) => {
                            const maxRev = Math.max(...admissionsProj.byKeywordCluster.map(c => c.revenueOpportunity));
                            const pct = maxRev > 0 ? (cluster.revenueOpportunity / maxRev) * 100 : 0;
                            return (
                              <div key={i} className="p-3 rounded-lg border">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-medium capitalize">{cluster.cluster}</span>
                                  <span className="text-xs font-bold text-green-600 dark:text-green-400">${cluster.revenueOpportunity.toLocaleString()}/yr</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex justify-between mt-1">
                                  <span className="text-[10px] text-muted-foreground">Current: {cluster.currentAdmissions.toFixed(1)}/mo</span>
                                  <span className="text-[10px] text-muted-foreground">Potential: {cluster.potentialAdmissions.toFixed(1)}/mo</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 12-Month Projections */}
                    <Card className="border" data-testid="projections-card">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> 12-Month Admission Projections</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                          {admissionsProj.projections.map((proj, i) => {
                            const maxVal = Math.max(...admissionsProj.projections.map(p => p.withSeo));
                            const heightPct = maxVal > 0 ? (proj.withSeo / maxVal) * 100 : 0;
                            const baseHeightPct = maxVal > 0 ? (proj.withoutSeo / maxVal) * 100 : 0;
                            return (
                              <div key={i} className="text-center">
                                <div className="h-20 flex items-end justify-center gap-0.5">
                                  <div className="w-2.5 rounded-t bg-muted" style={{ height: `${baseHeightPct}%` }} title={`Without SEO: ${proj.withoutSeo}`} />
                                  <div className="w-2.5 rounded-t bg-primary" style={{ height: `${heightPct}%` }} title={`With SEO: ${proj.withSeo}`} />
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-1">{proj.month.substring(5)}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary" /> With SEO</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-muted-foreground/40" /> Without SEO</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Methodology */}
                    <Card className="border" data-testid="admissions-methodology">
                      <CardHeader className="pb-3"><CardTitle className="text-sm">Estimation Methodology</CardTitle></CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-[10px] text-muted-foreground mb-1">Avg Revenue / Admission</p>
                            <p className="font-semibold text-xs">${admissionsProj.assumptions.avgRevPerAdmission.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-[10px] text-muted-foreground mb-1">Conversion Rate</p>
                            <p className="font-semibold text-xs">{(admissionsProj.assumptions.conversionRate * 100).toFixed(1)}%</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-[10px] text-muted-foreground mb-1">CTR Model</p>
                            <p className="font-semibold text-xs">Position-based (2025)</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-[10px] text-muted-foreground mb-1">Avg Length of Stay</p>
                            <p className="font-semibold text-xs">{admissionsProj.assumptions.avgLengthOfStay} days</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : admissions ? (
                  // Fallback to basic admissions data
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card className="border"><CardContent className="p-5 text-center">
                      <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{admissions.estimatedMonthlyAdmissions?.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Current Est. Monthly Admissions</p>
                    </CardContent></Card>
                    <Card className="border"><CardContent className="p-5 text-center">
                      <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
                      <p className="text-2xl font-bold text-destructive">{admissions.lostAdmissions?.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Est. Lost Admissions / Month</p>
                    </CardContent></Card>
                    <Card className="border"><CardContent className="p-5 text-center">
                      <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">${(admissions.potentialRevenue ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Annual Revenue Opportunity</p>
                    </CardContent></Card>
                  </div>
                ) : (
                  <Card className="border text-center p-8">
                    <CardContent>
                      <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">No admissions data yet</p>
                      <p className="text-xs text-muted-foreground">Run agents to generate admissions estimates and revenue projections.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* REPORTS & SETTINGS TAB */}
              <TabsContent value="settings" className="space-y-4">
                <SettingsTab centerId={center.id} centerName={center.name} user={user} tenant={tenant} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>


    </div>
  );
}

// ============ SETTINGS TAB COMPONENT ============

interface ScheduleConfig {
  id?: number;
  enabled: boolean;
  frequency: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface ReportRecord {
  id: number;
  reportType: string;
  generatedAt: string;
  status: string;
}

function SettingsTab({ centerId, centerName, user, tenant }: { centerId: number; centerName: string; user: any; tenant: any }) {
  const { data: schedule } = useQuery<ScheduleConfig>({
    queryKey: ["/api/centers", centerId, "schedule"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${centerId}/schedule`, { headers: getAuthHeaders() });
      return res.json();
    },
  });

  const { data: reports } = useQuery<ReportRecord[]>({
    queryKey: ["/api/centers", centerId, "reports"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/centers/${centerId}/reports`, { headers: getAuthHeaders() });
      return res.json();
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (body: { frequency?: string; enabled?: boolean }) => {
      const res = await apiRequest("POST", `/api/centers/${centerId}/schedule`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/centers", centerId, "schedule"] });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/centers/${centerId}/reports`, { reportType: "full" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/centers", centerId, "reports"] });
    },
  });

  const downloadReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/centers/${centerId}/report-download`, { headers: getAuthHeaders() });
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seo-report-${centerName.replace(/[^a-z0-9]/gi, "-")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Report Generation */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileDown className="w-4 h-4" /> SEO Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Generate a comprehensive SEO report with all agent data — scores, keywords,
            content strategy, local SEO, competitor analysis, and admissions projections.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => downloadReport()}
              data-testid="btn-download-report"
            >
              <Download className="w-3.5 h-3.5" /> Download Report
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={generateReportMutation.isPending}
              onClick={() => generateReportMutation.mutate()}
              data-testid="btn-generate-report"
            >
              {generateReportMutation.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="w-3.5 h-3.5" /> Generate New</>
              )}
            </Button>
          </div>

          {reports && reports.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Report History</p>
              <div className="space-y-1.5">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-xs">
                    <span className="font-medium">{r.reportType === "full" ? "Full SEO Report" : r.reportType}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${r.status === "ready" ? "text-green-600" : r.status === "error" ? "text-red-600" : "text-yellow-600"}`}>
                        {r.status}
                      </Badge>
                      <span className="text-muted-foreground">{formatDate(r.generatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Runs */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> Automated Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Schedule automatic agent runs to keep your SEO data fresh.
            Agents will re-analyze your site on the configured frequency.
          </p>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {schedule?.enabled ? (
                <ToggleRight className="w-5 h-5 text-primary cursor-pointer" onClick={() => scheduleMutation.mutate({ enabled: false })} />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground cursor-pointer" onClick={() => scheduleMutation.mutate({ enabled: true })} />
              )}
              <span className="text-sm font-medium">{schedule?.enabled ? "Monitoring Active" : "Monitoring Disabled"}</span>
            </div>
            <Badge variant={schedule?.enabled ? "default" : "secondary"} className="text-xs">
              {schedule?.frequency || "weekly"}
            </Badge>
          </div>

          <div className="flex gap-2">
            {["daily", "weekly", "biweekly", "monthly"].map((freq) => (
              <Button
                key={freq}
                size="sm"
                variant={schedule?.frequency === freq ? "default" : "outline"}
                className="text-xs capitalize flex-1"
                onClick={() => scheduleMutation.mutate({ frequency: freq, enabled: true })}
                data-testid={`btn-freq-${freq}`}
              >
                {freq}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground">Last Run</p>
              <p className="text-xs font-medium">{formatDate(schedule?.lastRunAt)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30">
              <p className="text-[10px] text-muted-foreground">Next Scheduled</p>
              <p className="text-xs font-medium">{schedule?.enabled ? formatDate(schedule?.nextRunAt) : "Disabled"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="border lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
              <p className="text-xs font-medium mt-0.5">{user?.email || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Organization</p>
              <p className="text-xs font-medium mt-0.5">{tenant?.name || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plan</p>
              <p className="text-xs font-medium mt-0.5 capitalize">{tenant?.plan === "none" ? "Free" : tenant?.plan || "Free"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Role</p>
              <p className="text-xs font-medium mt-0.5 capitalize">{user?.role || "owner"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
