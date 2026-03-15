import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Search, BarChart3, Users, TrendingUp, FileText, Shield,
  ArrowRight, CheckCircle2, Activity, Globe, Zap, Target
} from "lucide-react";

const agents = [
  { icon: Search, title: "Treatment Center Discovery", desc: "Automatically discover competing treatment providers from Google Maps, SAMHSA, and directories." },
  { icon: Activity, title: "SEO Scanner", desc: "Full technical audits: page speed, indexing, schema, mobile optimization, and 50+ ranking signals." },
  { icon: BarChart3, title: "Keyword Ranking", desc: "Track SA and MH keywords tailored to your treatment category and level of care." },
  { icon: Users, title: "Competitor Intelligence", desc: "Identify competitors in your market. Compare rankings, backlinks, and content coverage." },
  { icon: TrendingUp, title: "Admissions Estimator", desc: "Estimate lost admissions from poor SEO based on search volume, CTR, and ranking position." },
  { icon: FileText, title: "Report Generator", desc: "Professional audit reports with scores, issues, competitor comparisons, and a 30-day roadmap." },
];

const benefits = [
  "SEO audits built for behavioral health, not generic websites",
  "Keywords mapped to SA, MH, and dual diagnosis treatment types",
  "Estimates tied to admissions revenue, not just traffic",
  "Competitor intelligence within your geographic market",
  "Automated monitoring — no manual checks required",
  "White-label ready for SEO agencies serving treatment providers",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6" data-testid="hero-section">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
            Built for Behavioral Health
          </Badge>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-4 text-foreground max-w-3xl mx-auto" data-testid="hero-heading">
            SEO Intelligence That Estimates Admissions, Not Just Rankings
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            The first SEO auditing platform built specifically for substance use and mental health treatment providers. 
            Know your score. See lost admissions. Get a roadmap.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/free-score">
              <Button size="lg" className="w-full sm:w-auto gap-2" data-testid="hero-free-score-btn">
                <Zap className="w-4 h-4" /> Get Free SEO Score
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2" data-testid="hero-pricing-btn">
                View Pricing <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Score preview visual */}
      <section className="pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden border bg-card">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/5 via-transparent to-accent/30 p-6 sm:p-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { label: "SEO Score", value: "72", suffix: "/100", color: "text-chart-1" },
                    { label: "Keywords Tracked", value: "48", suffix: "", color: "text-chart-2" },
                    { label: "Est. Lost Admissions", value: "12", suffix: "/mo", color: "text-destructive" },
                    { label: "Revenue Opportunity", value: "$96K", suffix: "/yr", color: "text-chart-3" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4 rounded-lg bg-background/60 backdrop-blur-sm" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: `hsl(var(--${stat.color.replace('text-', '')}))` }}>
                        {stat.value}<span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Agents section */}
      <section className="py-16 px-4 sm:px-6 bg-card border-y" data-testid="agents-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs">6 AI Agents Working For You</Badge>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-2">Automated SEO Intelligence</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Six specialized agents continuously audit, track, and analyze your SEO performance — tuned for behavioral health.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, i) => (
              <Card key={i} className="border hover:border-primary/30 transition-colors" data-testid={`agent-card-${i}`}>
                <CardContent className="p-5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <agent.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{agent.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6" data-testid="benefits-section">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-2">Built for Treatment Providers</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Generic SEO tools don't understand behavioral health. Our platform is purpose-built for 
                substance use treatment and mental health providers.
              </p>
              <div className="flex flex-col gap-3">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Card className="border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Substance Use Treatment</p>
                    <p className="text-xs text-muted-foreground">Detox, Residential, PHP, IOP keywords</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Mental Health Treatment</p>
                    <p className="text-xs text-muted-foreground">Anxiety, depression, PTSD, psychiatric keywords</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Dual Diagnosis</p>
                    <p className="text-xs text-muted-foreground">Co-occurring disorder treatment keywords</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 bg-primary/5 border-t" data-testid="cta-section">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-2">Start with a free SEO score</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your website and get an instant SEO health score — no credit card required.
          </p>
          <Link href="/free-score">
            <Button size="lg" className="gap-2" data-testid="cta-free-score-btn">
              <Zap className="w-4 h-4" /> Get Your Free Score
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
