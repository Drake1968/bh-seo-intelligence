import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, ArrowRight, Star, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { STRIPE_CONFIG } from "@shared/schema";

// Stripe Payment Links
const PAYMENT_LINKS: Record<string, string> = {
  audit: "https://buy.stripe.com/3cIdRbewQaMwcl87wz6wE03",
  basic: "https://buy.stripe.com/bJecN7coI7Akcl87wz6wE02",
  premium: "https://buy.stripe.com/14AeVf88s7Akcl8g356wE01",
  enterprise: "https://buy.stripe.com/7sY14p88s6wg5WKeZ16wE00",
};

const auditFeatures = [
  "SEO technical audit (50+ ranking signals)",
  "Keyword ranking analysis (SA or MH specific)",
  "Local map pack performance evaluation",
  "Competitor comparison (top 5 in your market)",
  "Backlink analysis and authority score",
  "Service page coverage analysis",
  "Mobile speed and Core Web Vitals",
  "Estimated admissions opportunity",
  "30-day SEO improvement roadmap",
];

const plans = [
  {
    name: "Basic",
    price: 395,
    period: "/month",
    key: "basic" as const,
    description: "Quarterly monitoring for treatment providers beginning their SEO journey.",
    features: [
      "Quarterly SEO audit",
      "Monthly ranking tracking",
      "Competitor alerts",
      "Monthly action tasks",
      "Email support",
    ],
    cta: "Start Basic",
    popular: false,
  },
  {
    name: "Premium",
    price: 595,
    period: "/month",
    key: "premium" as const,
    description: "Weekly intelligence for treatment providers serious about admissions growth.",
    features: [
      "Monthly SEO audits",
      "Weekly ranking tracking",
      "Weekly SEO task list",
      "Competitor backlink monitoring",
      "AI search visibility monitoring",
      "Priority support",
      "Free audit with 6-month commitment",
    ],
    cta: "Start Premium",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 995,
    period: "/month",
    key: "enterprise" as const,
    note: "+ $395 per additional site",
    description: "Multi-location treatment organizations and agency partners.",
    features: [
      "Multi-site monitoring",
      "Monthly audits for all locations",
      "Competitive market share analysis",
      "Weekly optimization recommendations",
      "Expansion opportunity analysis",
      "Dedicated account manager",
      "White-label available",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handlePurchase = (planKey: string) => {
    const link = PAYMENT_LINKS[planKey];
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
            Transparent Pricing
          </Badge>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" data-testid="pricing-heading">
            SEO Intelligence Plans
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            One-time audits or ongoing monitoring. Every plan is purpose-built for behavioral health treatment providers.
          </p>
        </div>
      </section>

      {/* One-time audit */}
      <section className="pb-12 px-4 sm:px-6" data-testid="audit-section">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary/20 overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="font-bold text-base">Behavioral Health SEO Audit</h2>
                  <p className="text-xs text-muted-foreground">Comprehensive analysis delivered in 48 hours</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">$1,997</p>
                  <p className="text-xs text-muted-foreground">one-time</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {auditFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-foreground">{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button
                  className="gap-2 w-full sm:w-auto"
                  onClick={() => handlePurchase("audit")}
                  data-testid="buy-audit-btn"
                >
                  <CreditCard className="w-4 h-4" /> Purchase Audit <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Included free with 6-month Premium commitment
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Subscription plans */}
      <section className="pb-16 px-4 sm:px-6" data-testid="plans-section">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-center mb-6">Ongoing Monitoring Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan, i) => (
              <Card
                key={i}
                className={`border relative ${plan.popular ? 'border-primary ring-1 ring-primary/20' : ''}`}
                data-testid={`plan-card-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary text-primary-foreground text-xs">
                      <Star className="w-3 h-3" /> Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2 pt-5">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.note && (
                    <p className="text-xs text-muted-foreground">{plan.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">{plan.description}</p>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex flex-col gap-2 mb-5">
                    {plan.features.map((f, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full text-sm"
                    onClick={() => handlePurchase(plan.key)}
                    data-testid={`plan-cta-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
