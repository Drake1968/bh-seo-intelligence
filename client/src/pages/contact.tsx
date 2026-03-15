import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Building2 } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-bold tracking-tight mb-2" data-testid="contact-heading">Contact Us</h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Have a question about our SEO auditing platform? Need help with your account? We're here to help.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <Card className="border">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Email</h3>
                <a
                  href="mailto:support@bhseointelligence.com"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  data-testid="contact-email"
                >
                  support@bhseointelligence.com
                </a>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Location</h3>
                <p className="text-xs text-muted-foreground">
                  Athens, Georgia<br />United States
                </p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Company</h3>
                <p className="text-xs text-muted-foreground">
                  BH SEO Intelligence LLC
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-2">Sales Inquiries</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Interested in our Enterprise plan, white-label partnerships, or a custom SEO audit for your multi-location treatment organization? Email us at support@bhseointelligence.com and we'll schedule a call to discuss your needs.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">Technical Support</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For account issues, billing questions, or technical support, email support@bhseointelligence.com. We typically respond within one business day.
              </p>
            </div>

            <div>
              <h2 className="text-base font-semibold mb-2">About BH SEO Intelligence</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BH SEO Intelligence is the first SEO auditing platform built specifically for substance use and mental health treatment providers. Our AI-powered agents monitor your rankings, estimate lost admissions, analyze competitors, and deliver actionable roadmaps — all calibrated to the behavioral health industry. Founded in Athens, Georgia, we serve treatment centers, behavioral health agencies, and SEO professionals working in the recovery space.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
