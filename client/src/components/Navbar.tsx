import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const isDashboard = location === "/dashboard";

  if (isDashboard) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b" data-testid="navbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-foreground no-underline" data-testid="nav-logo">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base tracking-tight">BH SEO Intel</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/free-score" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline" data-testid="nav-free-score">
            Free SEO Score
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline" data-testid="nav-pricing">
            Pricing
          </Link>
          {!isLoading && isAuthenticated ? (
            <>
              <Link href="/leads" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline" data-testid="nav-leads">
                Leads
              </Link>
              <Link href="/dashboard">
                <Button size="sm" data-testid="nav-dashboard">Dashboard</Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="ghost" className="gap-1" data-testid="nav-login">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button size="sm" data-testid="nav-get-started">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-muted-foreground" 
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="nav-mobile-toggle"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 flex flex-col gap-3">
          <Link href="/free-score" className="text-sm text-muted-foreground py-2 no-underline" onClick={() => setMobileOpen(false)}>
            Free SEO Score
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground py-2 no-underline" onClick={() => setMobileOpen(false)}>
            Pricing
          </Link>
          {!isLoading && isAuthenticated ? (
            <>
              <Link href="/leads" className="text-sm text-muted-foreground py-2 no-underline" onClick={() => setMobileOpen(false)} data-testid="nav-leads-mobile">
                Leads
              </Link>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button size="sm" variant="outline" className="w-full gap-1"><LogIn className="w-3.5 h-3.5" /> Sign In</Button>
              </Link>
              <Link href="/onboarding" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
