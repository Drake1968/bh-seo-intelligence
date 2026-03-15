import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, CheckCircle2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

const LEVELS_OF_CARE = {
  residential: [
    { id: "detox", label: "Medical Detox" },
    { id: "rtc", label: "Residential / RTC" },
    { id: "crisis", label: "Crisis Stabilization" },
  ],
  outpatient: [
    { id: "php", label: "Partial Hospitalization (PHP)" },
    { id: "iop", label: "Intensive Outpatient (IOP)" },
    { id: "outpatient", label: "Outpatient Therapy" },
    { id: "telehealth", label: "Telehealth" },
  ],
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const { user, isAuthenticated, setToken } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    treatmentCategory: "",
    levelsOfCare: [] as string[],
    city: "",
    state: "",
    websiteUrl: "",
    name: "",
    email: user?.email || "",
    contactName: user?.name || "",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/onboarding", data);
      return res.json();
    },
    onSuccess: async (data) => {
      // Store auth token from onboarding response
      if (data.token) {
        await setToken(data.token);
      }
      setStep(4);
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  const toggleLoc = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      levelsOfCare: prev.levelsOfCare.includes(id)
        ? prev.levelsOfCare.filter((x) => x !== id)
        : [...prev.levelsOfCare, id],
    }));
  };

  const canProceed = () => {
    if (step === 1) return formData.treatmentCategory && formData.levelsOfCare.length > 0;
    if (step === 2) return formData.city && formData.state && formData.websiteUrl;
    if (step === 3) return formData.name && formData.email && formData.contactName;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8" data-testid="onboarding-progress">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step > s ? 'bg-primary text-primary-foreground' : step === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {step === 4 ? (
            <Card className="border text-center" data-testid="onboarding-success">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-2">You're all set</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  We've set up your dashboard with an initial SEO analysis.
                  Your full audit report will be available within 48 hours.
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard">
                    <Button className="w-full gap-2" data-testid="go-to-dashboard-btn">
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full" data-testid="view-plans-btn">
                      View Subscription Plans
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border" data-testid="onboarding-form">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Step {step} of 3</Badge>
                </div>
                <CardTitle className="text-base">
                  {step === 1 && "Treatment Category & Levels of Care"}
                  {step === 2 && "Market Location & Website"}
                  {step === 3 && "Contact Information"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {step === 1 && "Help us tailor the audit to your specific treatment offerings."}
                  {step === 2 && "We'll analyze your market and website for SEO performance."}
                  {step === 3 && "Where should we send your results?"}
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Treatment Category</Label>
                      <Select
                        value={formData.treatmentCategory}
                        onValueChange={(v) => setFormData({ ...formData, treatmentCategory: v })}
                      >
                        <SelectTrigger data-testid="select-treatment-category">
                          <SelectValue placeholder="Select treatment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sa">Substance Use Treatment (SA)</SelectItem>
                          <SelectItem value="mh">Mental Health Treatment (MH)</SelectItem>
                          <SelectItem value="dual">Dual Diagnosis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Levels of Care Offered</Label>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Residential</p>
                        {LEVELS_OF_CARE.residential.map((loc) => (
                          <div key={loc.id} className="flex items-center gap-2">
                            <Checkbox
                              id={loc.id}
                              checked={formData.levelsOfCare.includes(loc.id)}
                              onCheckedChange={() => toggleLoc(loc.id)}
                              data-testid={`checkbox-${loc.id}`}
                            />
                            <label htmlFor={loc.id} className="text-sm cursor-pointer">{loc.label}</label>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Outpatient</p>
                        {LEVELS_OF_CARE.outpatient.map((loc) => (
                          <div key={loc.id} className="flex items-center gap-2">
                            <Checkbox
                              id={loc.id}
                              checked={formData.levelsOfCare.includes(loc.id)}
                              onCheckedChange={() => toggleLoc(loc.id)}
                              data-testid={`checkbox-${loc.id}`}
                            />
                            <label htmlFor={loc.id} className="text-sm cursor-pointer">{loc.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">City</Label>
                        <Input
                          placeholder="Athens"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          data-testid="input-city"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">State</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(v) => setFormData({ ...formData, state: v })}
                        >
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Website URL</Label>
                      <Input
                        placeholder="https://www.example.com"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        data-testid="input-website-url"
                      />
                      <p className="text-xs text-muted-foreground">Your treatment center's primary website</p>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Treatment Center Name</Label>
                      <Input
                        placeholder="Serenity Grove"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        data-testid="input-center-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Your Name</Label>
                      <Input
                        placeholder="Jay Veal"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        data-testid="input-email"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-2">
                  {step > 1 ? (
                    <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} data-testid="btn-back">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  {step < 3 ? (
                    <Button
                      size="sm"
                      disabled={!canProceed()}
                      onClick={() => setStep(step + 1)}
                      data-testid="btn-next"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canProceed() || submitMutation.isPending}
                      onClick={() => submitMutation.mutate(formData)}
                      data-testid="btn-submit"
                    >
                      {submitMutation.isPending ? "Submitting..." : "Complete Setup"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
