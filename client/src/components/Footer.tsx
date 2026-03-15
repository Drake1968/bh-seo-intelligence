import { Link } from "wouter";
import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-card py-12 px-4 sm:px-6" data-testid="footer">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">BH SEO Intelligence</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated SEO auditing and monitoring for behavioral health treatment providers.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              BH SEO Intelligence LLC<br />Athens, Georgia
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <div className="flex flex-col gap-2">
              <Link href="/free-score" className="text-xs text-muted-foreground hover:text-foreground no-underline">Free SEO Score</Link>
              <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground no-underline">Pricing</Link>
              <Link href="/onboarding" className="text-xs text-muted-foreground hover:text-foreground no-underline">Get Started</Link>
              <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground no-underline">Contact Us</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground no-underline">Terms of Service</Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground no-underline">Privacy Policy</Link>
              <Link href="/refund" className="text-xs text-muted-foreground hover:text-foreground no-underline">Refund Policy</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Contact</h4>
            <div className="flex flex-col gap-2">
              <a href="mailto:support@bhseointelligence.com" className="text-xs text-muted-foreground hover:text-foreground no-underline">
                support@bhseointelligence.com
              </a>
              <span className="text-xs text-muted-foreground">Athens, GA</span>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BH SEO Intelligence LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground no-underline">Terms</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground no-underline">Privacy</Link>
            <Link href="/refund" className="text-xs text-muted-foreground hover:text-foreground no-underline">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
