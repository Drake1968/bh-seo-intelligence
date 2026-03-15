import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, CheckCircle2, Circle, Copy, ChevronDown, ChevronUp,
  Save, Clock, Mail, DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "nurturing", label: "Nurturing", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "summary_purchased", label: "Summary Purchased", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "converted", label: "Converted", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "lost", label: "Lost", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const NURTURE_STEPS = [
  { day: 0, label: "Day 0" },
  { day: 2, label: "Day 2" },
  { day: 5, label: "Day 5" },
  { day: 9, label: "Day 9" },
  { day: 14, label: "Day 14" },
];

const NURTURE_TEMPLATES = [
  {
    day: 0,
    subject: "Your SEO Health Score: {score}/100 — Here's What It Means for Admissions",
    body: `Hi {name},

Thank you for using our free SEO health tool. Your treatment center website ({website}) scored {score}/100.

Here are 3 quick wins you can implement today:
1. Add structured data (schema markup) for your treatment center — this helps Google understand your services
2. Ensure every level of care has its own dedicated page with unique content
3. Claim and fully optimize your Google Business Profile with treatment-specific categories

These changes alone can improve your visibility within 30-60 days.

Want the complete picture? Our Summary Report ($197) includes competitor analysis, keyword rankings, and a prioritized action plan — and the $197 is credited toward a Full Comprehensive Audit if you upgrade within 14 days.

Get Your Summary Report: https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04

Best,
BH SEO Intelligence Team
support@bhseointelligence.com`,
  },
  {
    day: 2,
    subject: "{competitor} is outranking you for \"{keyword}\" — here's why",
    body: `Hi {name},

When we analyzed your market, we found that competitors in {city}, {state} are ranking higher for critical treatment keywords.

Your score: {score}/100
Top local competitor: scoring significantly higher

The difference usually comes down to 3 things:
- Dedicated service pages for each level of care
- Consistent local citations and directory listings
- Regular content targeting treatment-specific keywords

Every day without SEO optimization means potential patients are finding your competitors first.

See exactly where you stand: https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04

— BH SEO Intelligence Team`,
  },
  {
    day: 5,
    subject: "You're leaving estimated revenue on the table every month",
    body: `Hi {name},

Based on search volume data for treatment keywords in {city}, {state}, centers with optimized SEO typically capture 15-25 additional inquiries per month.

At an average admission rate, that translates to significant monthly revenue you may be missing.

Your current score of {score}/100 suggests there's meaningful room for improvement.

Our Summary Report breaks down:
✓ Exactly which keywords you should target
✓ What your competitors are doing differently
✓ A prioritized action plan ranked by impact

$197 — credited toward Full Audit within 14 days: https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04

— BH SEO Intelligence Team`,
  },
  {
    day: 9,
    subject: "Your $197 credit expires in 5 days",
    body: `Hi {name},

Quick reminder — if you purchased a Summary Report, your $197 credit toward a Full Comprehensive Audit expires in 5 days.

The Full Audit ($1,997 — or $1,800 with your credit) includes:
✓ Complete 6-agent AI analysis
✓ Detailed competitor intelligence
✓ Admissions revenue projections
✓ Content strategy roadmap
✓ Local SEO action plan
✓ 30-day improvement roadmap

Upgrade before your credit expires: https://buy.stripe.com/3cIdRbewQaMwcl87wz6wE03

If you haven't gotten a Summary Report yet, it's not too late:
https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04

— BH SEO Intelligence Team`,
  },
  {
    day: 14,
    subject: "Your SEO score hasn't changed. Here's what happens next.",
    body: `Hi {name},

It's been 14 days since we scored your treatment center website at {score}/100.

In that time, your competitors have continued optimizing. Search algorithms have continued evolving. And potential patients have continued searching for treatment — and finding other providers first.

We built BH SEO Intelligence specifically for behavioral health treatment providers because generic SEO tools miss industry-specific signals.

If you're ready to take action:

→ Summary Report ($197): https://buy.stripe.com/cNieVf4Wgg6Q70OcQT6wE04
→ Full Comprehensive Audit ($1,997): https://buy.stripe.com/3cIdRbewQaMwcl87wz6wE03
→ Ongoing Monitoring Plans: https://bhseointelligence.com/#/pricing

Questions? Reply to this email or reach us at support@bhseointelligence.com.

— BH SEO Intelligence Team`,
  },
];

function fillTemplate(template: string, lead: Lead): string {
  return template
    .replace(/\{name\}/g, lead.name || "there")
    .replace(/\{website\}/g, lead.websiteUrl || "[WEBSITE]")
    .replace(/\{score\}/g, String(lead.freeScore ?? "[SCORE]"))
    .replace(/\{city\}/g, lead.city || "[CITY]")
    .replace(/\{state\}/g, lead.state || "[STATE]")
    .replace(/\{competitor\}/g, "[COMPETITOR NAME]")
    .replace(/\{keyword\}/g, "[TOP KEYWORD]");
}

function scoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function getStatusBadge(status: string | null) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  return <Badge variant="outline" className={`text-[10px] ${opt.color}`}>{opt.label}</Badge>;
}

export default function LeadsDashboard() {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const res = await fetch(`${"__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__"}/api/leads`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load leads");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}`, data);
      return res.json() as Promise<Lead>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  function handleStatusChange(lead: Lead, newStatus: string) {
    updateMutation.mutate({ id: lead.id, data: { status: newStatus } });
  }

  function handleSaveNotes(lead: Lead) {
    const notes = editNotes[lead.id] ?? lead.notes ?? "";
    updateMutation.mutate({ id: lead.id, data: { notes } });
    toast({ title: "Notes saved" });
  }

  function handleMarkSent(lead: Lead, day: number) {
    const existing = (lead.nurtureTouches as Array<{ day: number; sentAt: string }>) || [];
    const updated = [...existing, { day, sentAt: new Date().toISOString() }];
    updateMutation.mutate({ id: lead.id, data: { nurtureTouches: updated } });
    toast({ title: `Day ${day} marked as sent` });
  }

  function isTouchSent(lead: Lead, day: number): string | null {
    const touches = (lead.nurtureTouches as Array<{ day: number; sentAt: string }>) || [];
    const found = touches.find((t) => t.day === day);
    return found ? found.sentAt : null;
  }

  function copyEmail(lead: Lead, dayIndex: number) {
    const tpl = NURTURE_TEMPLATES[dayIndex];
    if (!tpl) return;
    const subject = fillTemplate(tpl.subject, lead);
    const body = fillTemplate(tpl.body, lead);
    const text = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Email copied to clipboard" });
    });
  }

  function getCreditCountdown(lead: Lead) {
    if (!lead.creditExpiresAt) return null;
    const expires = new Date(lead.creditExpiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? "s" : ""} remaining`;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold" data-testid="leads-heading">Lead Management</h1>
          <Badge variant="secondary" className="text-xs" data-testid="leads-count">{leads.length}</Badge>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-2 mb-6" data-testid="leads-filters">
          {[{ value: "all", label: "All" }, ...STATUS_OPTIONS].map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => setFilter(f.value)}
              data-testid={`filter-${f.value}`}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <Card className="border">
            <CardContent className="p-8 text-center text-muted-foreground">Loading leads...</CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border">
            <CardContent className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="leads-empty">
                {filter === "all"
                  ? "No leads yet. Leads from the Free SEO Score tool will appear here."
                  : `No leads with status "${STATUS_OPTIONS.find((s) => s.value === filter)?.label}".`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border">
            <Table data-testid="leads-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    expanded={expandedId === lead.id}
                    onToggle={() => toggleExpand(lead.id)}
                    onStatusChange={handleStatusChange}
                    onSaveNotes={handleSaveNotes}
                    onMarkSent={handleMarkSent}
                    onCopyEmail={copyEmail}
                    isTouchSent={isTouchSent}
                    editNotes={editNotes}
                    setEditNotes={setEditNotes}
                    getCreditCountdown={getCreditCountdown}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

interface LeadRowProps {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (lead: Lead, status: string) => void;
  onSaveNotes: (lead: Lead) => void;
  onMarkSent: (lead: Lead, day: number) => void;
  onCopyEmail: (lead: Lead, dayIndex: number) => void;
  isTouchSent: (lead: Lead, day: number) => string | null;
  editNotes: Record<number, string>;
  setEditNotes: (fn: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  getCreditCountdown: (lead: Lead) => string | null;
}

function LeadRow({
  lead, expanded, onToggle, onStatusChange, onSaveNotes, onMarkSent,
  onCopyEmail, isTouchSent, editNotes, setEditNotes, getCreditCountdown,
}: LeadRowProps) {
  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={onToggle}
        data-testid={`lead-row-${lead.id}`}
      >
        <TableCell className="w-8 px-2">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </TableCell>
        <TableCell className="font-medium text-sm">
          <div className="flex items-center gap-2">
            {lead.name || lead.email}
            {lead.summaryPurchasedAt && (
              <Badge variant="outline" className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-0.5" data-testid={`lead-purchased-badge-${lead.id}`}>
                <DollarSign className="w-2.5 h-2.5" /> Purchased
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
          {lead.websiteUrl}
        </TableCell>
        <TableCell>
          {lead.freeScore !== null ? (
            <span className={`font-bold text-sm ${scoreColor(lead.freeScore)}`}>{lead.freeScore}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
          {lead.city && lead.state ? `${lead.city}, ${lead.state}` : "—"}
        </TableCell>
        <TableCell>{getStatusBadge(lead.status)}</TableCell>
        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
          {lead.createdDate}
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            data-testid={`lead-expand-${lead.id}`}
          >
            {expanded ? "Close" : "Details"}
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow data-testid={`lead-detail-${lead.id}`}>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            <div className="p-5 space-y-5">
              {/* Lead Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{lead.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Website</span>
                  <p className="font-medium truncate">{lead.websiteUrl}</p>
                </div>
                {lead.name && (
                  <div>
                    <span className="text-muted-foreground">Center Name</span>
                    <p className="font-medium">{lead.name}</p>
                  </div>
                )}
                {lead.treatmentCategory && (
                  <div>
                    <span className="text-muted-foreground">Treatment Type</span>
                    <p className="font-medium capitalize">{lead.treatmentCategory === "sa" ? "Substance Abuse" : lead.treatmentCategory === "mh" ? "Mental Health" : "Dual Diagnosis"}</p>
                  </div>
                )}
                {lead.city && (
                  <div>
                    <span className="text-muted-foreground">City</span>
                    <p className="font-medium">{lead.city}</p>
                  </div>
                )}
                {lead.state && (
                  <div>
                    <span className="text-muted-foreground">State</span>
                    <p className="font-medium">{lead.state}</p>
                  </div>
                )}
                {lead.freeScore !== null && (
                  <div>
                    <span className="text-muted-foreground">Score</span>
                    <p className={`font-bold ${scoreColor(lead.freeScore)}`}>{lead.freeScore}/100</p>
                  </div>
                )}
              </div>

              {/* Status Change */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select
                  value={lead.status ?? "new"}
                  onValueChange={(val) => onStatusChange(lead, val)}
                >
                  <SelectTrigger className="w-48 h-8 text-xs" data-testid={`lead-status-select-${lead.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purchase & Credit Info */}
              {lead.summaryPurchasedAt && (
                <div className="flex flex-wrap items-center gap-3 text-xs p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20" data-testid={`lead-purchase-info-${lead.id}`}>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">
                      Summary purchased {new Date(lead.summaryPurchasedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {lead.creditExpiresAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">
                        Credit: {getCreditCountdown(lead) ?? "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Notes:</span>
                <Textarea
                  className="text-xs min-h-[60px]"
                  placeholder="Add follow-up notes..."
                  value={editNotes[lead.id] ?? lead.notes ?? ""}
                  onChange={(e) => setEditNotes((prev: Record<number, string>) => ({ ...prev, [lead.id]: e.target.value }))}
                  data-testid={`lead-notes-${lead.id}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => onSaveNotes(lead)}
                  data-testid={`lead-save-notes-${lead.id}`}
                >
                  <Save className="w-3 h-3" /> Save Notes
                </Button>
              </div>

              {/* Nurture Sequence */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">Nurture Sequence</span>
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {NURTURE_STEPS.map((step, idx) => {
                    const sentAt = isTouchSent(lead, step.day);
                    return (
                      <div key={step.day} className="flex items-center">
                        <div className="flex flex-col items-center gap-1 min-w-[90px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${sentAt ? "bg-green-500/20" : "bg-muted"}`}>
                            {sentAt ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{step.label}</span>
                          {sentAt ? (
                            <span className="text-[9px] text-green-400">Sent</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1.5 text-[10px]"
                              onClick={() => onMarkSent(lead, step.day)}
                              data-testid={`lead-mark-sent-${lead.id}-day${step.day}`}
                            >
                              Mark Sent
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] gap-1"
                            onClick={() => onCopyEmail(lead, idx)}
                            data-testid={`lead-copy-email-${lead.id}-day${step.day}`}
                          >
                            <Copy className="w-3 h-3" /> Copy Email
                          </Button>
                        </div>
                        {idx < NURTURE_STEPS.length - 1 && (
                          <div className={`w-6 h-0.5 mt-[-24px] ${sentAt ? "bg-green-500/40" : "bg-muted"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
