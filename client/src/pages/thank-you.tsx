import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle2, Search, Cpu, Mail, ArrowRight, Home,
} from "lucide-react";

const PRODUCT_MESSAGES: Record<string, { heading: string; message: string }> = {
  summary: {
    heading: "Your SEO Summary Report Is On Its Way!",
    message:
      "Your SEO Summary Report will be delivered to your email within 24 hours. Our team is already analyzing your website.",
  },
  audit: {
    heading: "Your Comprehensive Audit Has Begun!",
    message:
      "Your Comprehensive SEO Audit is being prepared by our 6-agent AI system. You'll receive your detailed report within 48 hours.",
  },
  subscription: {
    heading: "Welcome to BH SEO Intelligence!",
    message:
      "Your monitoring dashboard is being set up. You'll receive an email with login details within 24 hours.",
  },
};

const DEFAULT_MESSAGE = {
  heading: "Thank You for Your Purchase!",
  message: "Your order has been received! We'll be in touch shortly.",
};

const STEPS = [
  {
    icon: Search,
    title: "We Analyze Your Website",
    desc: "Our AI agents crawl your site, evaluating 50+ ranking signals specific to behavioral health treatment providers.",
  },
  {
    icon: Cpu,
    title: "Our AI Agents Compile Findings",
    desc: "Six specialized agents — technical audit, keywords, competitors, local SEO, content, and admissions — compile their results.",
  },
  {
    icon: Mail,
    title: "Report Delivered to Your Inbox",
    desc: "You'll receive a comprehensive, actionable report with scores, issues, competitor data, and a prioritized roadmap.",
  },
];

function getProductParam(): string | null {
  // Query params live in location.search (e.g. "?product=summary")
  // because the server redirect puts them before the hash fragment.
  const params = new URLSearchParams(window.location.search);
  if (params.has("product")) return params.get("product");

  // Fallback: check inside the hash in case of direct navigation
  const hash = window.location.hash;
  const qIdx = hash.indexOf("?");
  if (qIdx === -1) return null;
  return new URLSearchParams(hash.slice(qIdx)).get("product");
}

export default function ThankYou() {
  const product = getProductParam();
  const { heading, message } =
    (product && PRODUCT_MESSAGES[product]) || DEFAULT_MESSAGE;

  return (
    <div className="min-h-screen bg-background" data-testid="thank-you-page">
      <Navbar />

      <section className="pt-28 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center" data-testid="thank-you-icon">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>

          {/* Heading */}
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-4 text-foreground"
            data-testid="thank-you-heading"
          >
            {heading}
          </h1>

          {/* Product-specific message */}
          <p
            className="text-base text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed"
            data-testid="thank-you-message"
          >
            {message}
          </p>

          {/* What Happens Next */}
          <Card className="border mb-10">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6" data-testid="next-steps-heading">
                What Happens Next?
              </h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {STEPS.map((step, idx) => (
                  <div key={step.title} className="text-center space-y-3">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs font-bold text-primary">{idx + 1}.</span>
                      <span className="text-sm font-semibold">{step.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border mb-10 bg-muted/30">
            <CardContent className="p-5 text-center">
              <h3 className="text-sm font-semibold mb-2" data-testid="questions-heading">Questions?</h3>
              <p className="text-xs text-muted-foreground mb-1">
                Our team is here to help. Reach us at:
              </p>
              <a
                href="mailto:support@bhseointelligence.com"
                className="text-sm text-primary hover:underline font-medium"
                data-testid="support-email"
              >
                support@bhseointelligence.com
              </a>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="gap-2" data-testid="back-home-btn">
                <Home className="w-4 h-4" /> Back to Homepage
              </Button>
            </Link>
            <Link href="/free-score">
              <Button className="gap-2" data-testid="free-score-btn">
                Get Another Free Score <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
