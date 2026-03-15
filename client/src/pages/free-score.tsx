import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Zap, ArrowRight, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Globe, Smartphone, Shield, Gauge, FileSearch, Info, CreditCard
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FreeScoreResult {
  score: number;
  technicalScore: number;
  contentScore: number;
  localSeoScore: number;
  mobileScore: number;
  pageSpeed: number;
  coreWebVitals: { lcp: number; inp: number; cls: number };
  issues: { severity: string; category: string; message: string; recommendation: string }[];
  strengths: string[];
  hasSchemaMarkup: boolean;
  mobileOptimized: boolean;
  indexedPages: number;
  crawlability: { hasRobotsTxt: boolean; hasSitemap: boolean; canonicalsCorrect: boolean };
  accessibility: { score: number; missingAltTags: number };
}

export default function FreeScore() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [centerName, setCenterName] = useState("");
  const [treatmentCategory, setTreatmentCategory] = useState("dual");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [result, setResult] = useState<FreeScoreResult | null>(null);

  // Normalize URL: ensure it starts with https://
  function normalizeUrl(raw: string): string {
    let u = raw.trim();
    if (!u) return u;
    if (!u.startsWith("http://") && !u.startsWith("https://")) {
      u = "https://" + u;
    }
    return u;
  }

  const scoreMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/free-score", {
        websiteUrl: normalizeUrl(url),
        email,
        centerName: centerName || undefined,
        treatmentCategory,
        city: city || undefined,
        state: state || undefined,
      });
      return res.json() as Promise<FreeScoreResult>;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const progressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const cwvStatus = (name: string, value: number) => {
    const thresholds: Record<string, [number, number]> = {
      lcp: [2500, 4000],
      inp: [200, 500],
      cls: [0.1, 0.25],
    };
    const [good, poor] = thresholds[name] || [0, 0];
    if (value <= good) return { label: "Good", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" };
    if (value <= poor) return { label: "Needs Work", color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950" };
    return { label: "Poor", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          {!result ? (
            <>
              <div className="text-center mb-8">
                <Badge variant="secondary" className="mb-3 text-xs font-medium px-3 py-1">
                  Free Tool — Powered by AI
                </Badge>
                <h1 className="text-xl font-bold tracking-tight mb-2" data-testid="free-score-heading">
                  Instant SEO Health Score
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Our AI agent audits your treatment center website and delivers a detailed
                  technical SEO assessment in seconds. No credit card. No commitment.
                </p>
              </div>

              <Card className="border" data-testid="free-score-form">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Website URL</Label>
                    <Input
                      placeholder="www.example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      data-testid="input-free-url"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email (for results)</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-free-email"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Center Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input
                        placeholder="Your Center"
                        value={centerName}
                        onChange={(e) => setCenterName(e.target.value)}
                        data-testid="input-free-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Treatment Type</Label>
                      <Select value={treatmentCategory} onValueChange={setTreatmentCategory}>
                        <SelectTrigger data-testid="select-free-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sa">Substance Abuse</SelectItem>
                          <SelectItem value="mh">Mental Health</SelectItem>
                          <SelectItem value="dual">Dual Diagnosis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">City <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input placeholder="Athens" value={city} onChange={(e) => setCity(e.target.value)} data-testid="input-free-city" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">State <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input placeholder="GA" value={state} onChange={(e) => setState(e.target.value)} data-testid="input-free-state" />
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    disabled={!url || !email || scoreMutation.isPending}
                    onClick={() => scoreMutation.mutate()}
                    data-testid="btn-get-score"
                  >
                    {scoreMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Running AI Audit...</>
                    ) : (
                      <><Zap className="w-4 h-4" /> Get Free Score</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    AI-powered analysis of Core Web Vitals, schema markup, mobile optimization,
                    crawlability, E-E-A-T signals, and content gaps.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="space-y-5" data-testid="free-score-results">
              <div className="text-center">
                <Badge variant="secondary" className="mb-3 text-xs font-medium px-3 py-1">
                  AI Audit Complete
                </Badge>
                <h2 className="text-lg font-bold mb-1">Your SEO Health Score</h2>
                <p className="text-xs text-muted-foreground">{url}</p>
              </div>

              {/* Overall Score */}
              <Card className="border overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center mb-5">
                    <p className={`text-4xl font-bold ${scoreColor(result.score)}`} data-testid="score-value">
                      {result.score}<span className="text-lg text-muted-foreground">/100</span>
                    </p>
                    <div className="mt-3 max-w-xs mx-auto">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progressColor(result.score)}`} style={{ width: `${result.score}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {result.score >= 80 ? "Strong foundation — room for optimization" : result.score >= 60 ? "Average — significant opportunity to gain rankings" : "Needs attention — you're losing potential admissions"}
                    </p>
                  </div>

                  {/* Sub-scores */}
                  <div className="grid grid-cols-5 gap-2 mb-5">
                    {[
                      { label: "Technical", score: result.technicalScore, icon: Settings2 },
                      { label: "Content", score: result.contentScore, icon: FileSearch },
                      { label: "Local SEO", score: result.localSeoScore, icon: Globe },
                      { label: "Mobile", score: result.mobileScore, icon: Smartphone },
                      { label: "Speed", score: Math.round((1 - (result.pageSpeed - 1) / 4) * 100), icon: Gauge },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-2 rounded-lg bg-muted/50">
                        <p className={`text-lg font-bold ${scoreColor(s.score)}`}>{s.score}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Core Web Vitals */}
              <Card className="border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Gauge className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">Core Web Vitals</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "lcp", label: "LCP", value: result.coreWebVitals.lcp, unit: "ms", desc: "Largest Contentful Paint" },
                      { name: "inp", label: "INP", value: result.coreWebVitals.inp, unit: "ms", desc: "Interaction to Next Paint" },
                      { name: "cls", label: "CLS", value: result.coreWebVitals.cls, unit: "", desc: "Cumulative Layout Shift" },
                    ].map((cwv) => {
                      const status = cwvStatus(cwv.name, cwv.value);
                      return (
                        <div key={cwv.name} className={`p-3 rounded-lg ${status.bg}`}>
                          <p className="text-[10px] text-muted-foreground mb-1">{cwv.desc}</p>
                          <p className={`text-lg font-bold ${status.color}`}>
                            {cwv.name === "cls" ? cwv.value.toFixed(2) : Math.round(cwv.value)}{cwv.unit}
                          </p>
                          <Badge variant="outline" className={`text-[10px] mt-1 ${status.color}`}>{status.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* CTA — Summary Report Upsell (placed prominently after score) */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <div className="text-center mb-4">
                    <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Recommended Next Step</Badge>
                    <p className="text-sm font-semibold">Get Your Summary Report</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Same format as our full audit — with competitor analysis, keyword data, and action items.
                      Key strategic sections shown in preview format.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a href="https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04" target="_blank" rel="noopener noreferrer" className="no-underline">
                      <Button size="sm" className="w-full gap-2" data-testid="btn-buy-summary-top">
                        <CreditCard className="w-4 h-4" /> Summary Report — $197 <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                    <p className="text-[11px] text-muted-foreground text-center">
                      $197 credited toward Full Comprehensive Audit if you upgrade within 14 days
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Checks */}
              <Card className="border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">Technical Checks</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Schema Markup", pass: result.hasSchemaMarkup },
                      { label: "Mobile Optimized", pass: result.mobileOptimized },
                      { label: "XML Sitemap", pass: result.crawlability.hasSitemap },
                      { label: "robots.txt", pass: result.crawlability.hasRobotsTxt },
                      { label: "Canonical Tags", pass: result.crawlability.canonicalsCorrect },
                      { label: `${result.indexedPages} Pages Indexed`, pass: result.indexedPages > 20 },
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded bg-muted/30">
                        {check.pass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-xs">{check.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Issues */}
              {result.issues.length > 0 && (
                <Card className="border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <p className="text-sm font-semibold">Issues Found ({result.issues.length})</p>
                    </div>
                    <div className="space-y-2">
                      {result.issues.map((issue, i) => (
                        <div key={i} className={`p-3 rounded-lg border-l-2 ${issue.severity === "critical" ? "border-l-red-500 bg-red-50 dark:bg-red-950/30" : issue.severity === "warning" ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30" : "border-l-gray-300 bg-muted/30"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[10px] ${issue.severity === "critical" ? "text-red-600 border-red-200" : issue.severity === "warning" ? "text-yellow-600 border-yellow-200" : "text-gray-500"}`}>
                              {issue.severity}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{issue.category}</span>
                          </div>
                          <p className="text-xs font-medium">{issue.message}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{issue.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {result.strengths.length > 0 && (
                <Card className="border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-semibold">Strengths</p>
                    </div>
                    <div className="space-y-1.5">
                      {result.strengths.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-xs">{s}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA — Summary Report Upsell */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <div className="text-center mb-4">
                    <Badge className="mb-2 bg-primary text-primary-foreground text-xs">Recommended Next Step</Badge>
                    <p className="text-sm font-semibold">Get Your Summary Report</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Same format as our full audit — with competitor analysis, keyword data, and action items.
                      Key strategic sections shown in preview format.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <a href="https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04" target="_blank" rel="noopener noreferrer" className="no-underline">
                      <Button size="sm" className="w-full gap-2" data-testid="btn-buy-summary">
                        <CreditCard className="w-4 h-4" /> Summary Report — $197 <ArrowRight className="w-4 h-4" />
                      </Button>
                    </a>
                    <p className="text-[11px] text-muted-foreground text-center">
                      $197 credited toward Full Comprehensive Audit if you upgrade within 14 days
                    </p>
                    <div className="border-t pt-3 mt-1">
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a href="https://buy.stripe.com/3cIdRbewQaMwcl87wz6wE03" target="_blank" rel="noopener noreferrer" className="no-underline">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto gap-2" data-testid="btn-buy-full-audit">
                            Full Audit — $1,997
                          </Button>
                        </a>
                        <Link href="/pricing">
                          <Button size="sm" variant="ghost" className="w-full sm:w-auto" data-testid="btn-view-plans">
                            View Monitoring Plans
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Try Again */}
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={() => setResult(null)} data-testid="btn-try-again">
                  Scan another website
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Placeholder for icon used inline
function Settings2(props: any) {
  return <Gauge {...props} />;
}
