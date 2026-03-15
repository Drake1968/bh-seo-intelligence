import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/auth";
import Landing from "@/pages/landing";
import Pricing from "@/pages/pricing";
import Onboarding from "@/pages/onboarding";
import FreeScore from "@/pages/free-score";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Refund from "@/pages/refund";
import Contact from "@/pages/contact";
import LeadsDashboard from "@/pages/leads-dashboard";
import ThankYou from "@/pages/thank-you";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/free-score" component={FreeScore} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/leads" component={LeadsDashboard} />
      <Route path="/thank-you" component={ThankYou} />
      <Route path="/login" component={Login} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund" component={Refund} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
