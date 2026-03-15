import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { onboardingSchema, loginSchema, registerSchema, STRIPE_CONFIG } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import type { User, Tenant } from "@shared/schema";
import { runAllAgents, getRunStatus, getAgentResults } from "./agents/orchestrator";
import { generateReport, generateFreeScoreReport } from "./report-generator";
import { sendReportToCustomer, notifyAdminOfPurchase, sendFreeScoreEmail } from "./email-service";
import { startScheduler, getNextRunDate } from "./scheduler";
import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Stripe webhook signature verification
// ---------------------------------------------------------------------------
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Lazy Stripe instance — only created when needed (avoids crash if STRIPE_SECRET_KEY is not set)
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key) {
      _stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" as any });
    }
  }
  return _stripe!;
}

// ---------------------------------------------------------------------------
// Pipeline status tracking (in-memory for debug)
// ---------------------------------------------------------------------------
const pipelineLog: { timestamp: string; centerId: number; step: string; status: string; detail?: string }[] = [];
function logPipeline(centerId: number, step: string, status: string, detail?: string) {
  const entry = { timestamp: new Date().toISOString(), centerId, step, status, detail };
  pipelineLog.push(entry);
  if (pipelineLog.length > 50) pipelineLog.shift();
  console.log(`[pipeline] ${step}: ${status}${detail ? " — " + detail : ""}`);
}
export function getPipelineLog() { return pipelineLog; }

// ---------------------------------------------------------------------------
// Fire-and-forget pipeline: agents → report → email
// ---------------------------------------------------------------------------
async function runReportPipeline(
  centerId: number,
  email: string,
  reportType: "summary" | "full",
  amount: number,
) {
  try {
    const center = await storage.getTreatmentCenter(centerId);
    if (!center) {
      logPipeline(centerId, "init", "error", "Center not found");
      return;
    }

    logPipeline(centerId, "init", "started", `${reportType} report for ${center.name}`);

    // 1. Run all 6 agents
    logPipeline(centerId, "agents", "running");
    await runAllAgents(center);
    logPipeline(centerId, "agents", "complete");

    // 2. Generate branded HTML report
    logPipeline(centerId, "report", "generating");
    const { html, data } = await generateReport(centerId, reportType);
    logPipeline(centerId, "report", "complete", `${html.length} bytes`);

    // 3. Persist report record
    const report = await storage.createReport({
      centerId,
      tenantId: center.tenantId,
      reportType,
      generatedAt: new Date().toISOString(),
      data: { htmlLength: html.length, snapshot: data } as any,
    });
    await storage.updateReport(report.id, { status: "ready" });
    logPipeline(centerId, "persist", "complete");

    // 4. Email report to customer
    logPipeline(centerId, "email", "sending", `to ${email}`);
    await sendReportToCustomer(email, center.name, reportType, html);
    logPipeline(centerId, "email", "sent");

    // 5. Notify admin
    await notifyAdminOfPurchase(email, center.name, reportType, amount);
    logPipeline(centerId, "admin-notify", "sent");

    // 6. Update center status
    await storage.updateTreatmentCenter(centerId, {
      status: "complete",
      lastAuditDate: new Date().toISOString().split("T")[0],
    });

    logPipeline(centerId, "pipeline", "complete", `${center.name} → ${email}`);
  } catch (err: any) {
    logPipeline(centerId, "pipeline", "FAILED", err?.message || String(err));
    console.error(`[pipeline] Failed for center ${centerId}:`, err);
  }
}

// Extend Request with auth
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tenant?: Tenant;
    }
  }
}

// Auth middleware
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const token = authHeader.split(" ")[1];
  const session = await storage.getSession(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  req.user = user;
  if (session.tenantId) {
    req.tenant = await storage.getTenant(session.tenantId);
  }
  next();
}

// Seed demo data for a center
async function seedDemoData(centerId: number, tenantId: number) {
  // Create audit
  await storage.createAudit({
    centerId,
    tenantId,
    overallScore: 72,
    technicalScore: 78,
    contentScore: 65,
    localSeoScore: 80,
    backlinkScore: 55,
    mobileScore: 85,
    pageSpeed: 2.4,
    indexedPages: 47,
    hasSchemaMarkup: false,
    hasSslCert: true,
    mobileOptimized: true,
    issues: [
      { severity: "critical", category: "Schema", description: "No MedicalBusiness schema markup", recommendation: "Add JSON-LD structured data for treatment center" },
      { severity: "critical", category: "Content", description: "Missing dedicated program pages for PHP and IOP", recommendation: "Create individual service pages optimized for each LOC" },
      { severity: "warning", category: "Backlinks", description: "Low domain authority (DA 22)", recommendation: "Build directory citations and healthcare backlinks" },
      { severity: "warning", category: "Technical", description: "LCP 2.4s — needs improvement", recommendation: "Optimize hero images and server response time" },
      { severity: "info", category: "Local", description: "GBP missing secondary categories", recommendation: "Add detox center and substance abuse treatment categories" },
    ],
    auditDate: new Date().toISOString().split("T")[0],
  });

  // Update center with score
  await storage.updateTreatmentCenter(centerId, {
    seoScore: 72,
    lastAuditDate: new Date().toISOString().split("T")[0],
    status: "complete",
  });

  // Create keywords
  const keywords = [
    { keyword: "drug rehab athens ga", position: 4, previousPosition: 7, searchVolume: 320, category: "sa" },
    { keyword: "alcohol detox near me", position: 8, previousPosition: 12, searchVolume: 880, category: "sa" },
    { keyword: "mental health php athens", position: 3, previousPosition: 5, searchVolume: 110, category: "mh" },
    { keyword: "detox near me", position: 15, previousPosition: 18, searchVolume: 2400, category: "sa" },
    { keyword: "inpatient rehab georgia", position: 11, previousPosition: 9, searchVolume: 480, category: "sa" },
    { keyword: "anxiety treatment athens ga", position: 6, previousPosition: 8, searchVolume: 210, category: "mh" },
    { keyword: "dual diagnosis treatment", position: 19, previousPosition: 22, searchVolume: 720, category: "dual" },
    { keyword: "iop near me athens", position: 5, previousPosition: 6, searchVolume: 170, category: "sa" },
    { keyword: "residential rehab athens ga", position: 7, previousPosition: 10, searchVolume: 260, category: "sa" },
    { keyword: "depression treatment athens", position: 9, previousPosition: 14, searchVolume: 190, category: "mh" },
    { keyword: "fentanyl rehab georgia", position: 12, previousPosition: 15, searchVolume: 390, category: "sa" },
    { keyword: "opioid detox athens ga", position: 6, previousPosition: 8, searchVolume: 280, category: "sa" },
  ];
  for (const kw of keywords) {
    await storage.createKeywordRanking({
      centerId,
      ...kw,
      trackDate: new Date().toISOString().split("T")[0],
    });
  }

  // Create competitors
  const comps = [
    { competitorName: "Twin Lakes Recovery", competitorUrl: "twinlakesrecovery.com", seoScore: 68, domainAuthority: 28, backlinks: 420, sharedKeywords: 34 },
    { competitorName: "SummitRidge Hospital", competitorUrl: "summitridgehospital.com", seoScore: 81, domainAuthority: 45, backlinks: 1200, sharedKeywords: 41 },
    { competitorName: "Athens Addiction Recovery", competitorUrl: "athensbestrehab.com", seoScore: 54, domainAuthority: 15, backlinks: 85, sharedKeywords: 22 },
    { competitorName: "Samba Recovery", competitorUrl: "sambarecovery.com", seoScore: 75, domainAuthority: 35, backlinks: 680, sharedKeywords: 29 },
  ];
  for (const c of comps) {
    await storage.createCompetitor({ centerId, ...c });
  }

  // Create admissions estimate
  await storage.createAdmissionsEstimate({
    centerId,
    estimatedMonthlyAdmissions: 8.4,
    lostAdmissions: 12.2,
    potentialRevenue: 96000,
    estimateDate: new Date().toISOString().split("T")[0],
    assumptions: { avgRevPerAdmission: 8000, conversionRate: 0.035, ctr: "position-based" },
  });
}

export async function registerRoutes(server: Server, app: Express) {
  // Start the scheduler for automatic agent runs
  startScheduler();
  // ============ AUTH ROUTES ============

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        email: data.email,
        name: data.name,
        passwordHash,
        role: "owner",
      });

      // Create session (7 days)
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await storage.createSession({ id: token, userId: user.id, tenantId: user.tenantId, expiresAt });

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Register error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Create session (7 days)
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await storage.createSession({ id: token, userId: user.id, tenantId: user.tenantId, expiresAt });

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    const token = req.headers.authorization!.split(" ")[1];
    await storage.deleteSession(token);
    res.json({ success: true });
  });

  // Get current user + their data
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = req.user!;
    const centers = await storage.getTreatmentCentersByUser(user.id);
    const tenant = user.tenantId ? await storage.getTenant(user.tenantId) : null;

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, primaryColor: tenant.primaryColor, accentColor: tenant.accentColor, fontFamily: tenant.fontFamily, logoUrl: tenant.logoUrl } : null,
      centers,
    });
  });

  // ============ ONBOARDING ============

  app.post("/api/onboarding", async (req, res) => {
    try {
      const data = onboardingSchema.parse(req.body);

      // If user is authenticated, use their account; otherwise create one
      let user;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const session = await storage.getSession(token);
        if (session) {
          user = await storage.getUser(session.userId);
        }
      }

      if (!user) {
        user = await storage.getUserByEmail(data.email);
        if (!user) {
          // Create user with a default password (they'll set it up later)
          const passwordHash = await bcrypt.hash(data.email + "temp123", 10);
          user = await storage.createUser({
            email: data.email,
            name: data.contactName,
            passwordHash,
            role: "owner",
          });
        }
      }

      // Create tenant
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const tenant = await storage.createTenant({
        name: data.name,
        slug,
      });

      // Link user to tenant
      await storage.updateUser(user.id, { tenantId: tenant.id });

      // Create treatment center
      const center = await storage.createTreatmentCenter({
        tenantId: tenant.id,
        userId: user.id,
        name: data.name,
        websiteUrl: data.websiteUrl,
        city: data.city,
        state: data.state,
        treatmentCategory: data.treatmentCategory,
        levelsOfCare: data.levelsOfCare,
      });

      // Run agent intelligence in the background
      runAllAgents(center).catch(err => console.error("Initial agent run failed:", err));

      // Create session for user
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await storage.createSession({ id: token, userId: user.id, tenantId: tenant.id, expiresAt });

      res.json({
        success: true,
        token,
        userId: user.id,
        tenantId: tenant.id,
        centerId: center.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        console.error("Onboarding error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // ============ STRIPE / CHECKOUT ============

  // Get Stripe payment links for pricing page
  app.get("/api/stripe/config", (_req, res) => {
    res.json({
      audit: { priceId: STRIPE_CONFIG.audit.priceId, amount: STRIPE_CONFIG.audit.amount, name: STRIPE_CONFIG.audit.name },
      basic: { priceId: STRIPE_CONFIG.basic.priceId, amount: STRIPE_CONFIG.basic.amount, name: STRIPE_CONFIG.basic.name },
      premium: { priceId: STRIPE_CONFIG.premium.priceId, amount: STRIPE_CONFIG.premium.amount, name: STRIPE_CONFIG.premium.name },
      enterprise: { priceId: STRIPE_CONFIG.enterprise.priceId, amount: STRIPE_CONFIG.enterprise.amount, name: STRIPE_CONFIG.enterprise.name },
    });
  });

  // Record order from Stripe checkout (called after payment success)
  app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const { productType, stripePaymentId, centerId } = req.body;
      const config = STRIPE_CONFIG[productType as keyof typeof STRIPE_CONFIG];
      if (!config) {
        return res.status(400).json({ error: "Invalid product type" });
      }

      const order = await storage.createOrder({
        userId: req.user!.id,
        tenantId: req.tenant?.id,
        centerId: centerId || null,
        productType,
        amount: config.amount,
        stripePaymentId: stripePaymentId || null,
        orderDate: new Date().toISOString().split("T")[0],
      });

      // Update tenant plan for subscription products
      if (productType !== "audit" && req.tenant) {
        await storage.updateTenant(req.tenant.id, { plan: productType });
      }

      res.json(order);
    } catch (error) {
      console.error("Order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ============ STRIPE WEBHOOK ============

  app.post("/api/webhooks/stripe", async (req: Request, res) => {
    try {
      let event: any;

      // Verify webhook signature if secret is configured
      if (STRIPE_WEBHOOK_SECRET) {
        const sig = req.headers["stripe-signature"] as string;
        if (!sig) {
          console.error("[webhook] Missing stripe-signature header");
          return res.status(400).json({ error: "Missing signature" });
        }
        try {
          event = getStripe().webhooks.constructEvent(
            req.rawBody as Buffer,
            sig,
            STRIPE_WEBHOOK_SECRET,
          );
        } catch (err: any) {
          console.error(`[webhook] Signature verification failed: ${err.message}`);
          return res.status(400).json({ error: "Invalid signature" });
        }
      } else {
        // No secret configured — accept raw body (dev only)
        event = req.body;
        console.warn("[webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification");
      }

      if (!event || !event.type) {
        return res.status(400).json({ error: "Invalid event payload" });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data?.object;
        const email = session?.customer_email || session?.customer_details?.email || null;
        const amountTotal = session?.amount_total || 0; // in cents
        const paymentIntentId = session?.payment_intent || null;
        const productName = session?.metadata?.product || session?.display_items?.[0]?.custom?.name || "unknown";
        const mode = session?.mode; // "payment" or "subscription"

        console.log("=== STRIPE PAYMENT RECEIVED ===");
        console.log(`Email: ${email}`);
        console.log(`Amount: $${(amountTotal / 100).toFixed(2)}`);
        console.log(`Product: ${productName}`);
        console.log(`Payment Intent: ${paymentIntentId}`);
        console.log(`Mode: ${mode}`);
        console.log("===============================");

        // Determine product type from amount, payment link, or metadata
        let product = "unknown";
        const paymentLink = session?.payment_link || "";
        const successUrl = session?.success_url || "";
        const lineItems = session?.line_items?.data || [];

        if (amountTotal === 19700) {
          product = "summary";
        } else if (amountTotal === 199700) {
          product = "audit";
        } else if (mode === "subscription") {
          product = "subscription";
        }

        // Fallback: identify by payment link ID or success_url when coupon makes amount $0
        if (product === "unknown") {
          // Check success_url for product hint
          if (successUrl.includes("product=summary") || paymentLink.includes("cQT6wE04")) {
            product = "summary";
          } else if (successUrl.includes("product=audit") || paymentLink.includes("6wE03")) {
            product = "audit";
          }
        }

        console.log(`[webhook] Resolved product: ${product} (amount: ${amountTotal}, link: ${paymentLink})`);

        // Store payment event
        await storage.addPaymentEvent({
          email: email || "unknown",
          amount: amountTotal,
          product,
          timestamp: new Date().toISOString(),
          paymentIntentId,
        });

        // Match to existing lead and update status
        if (email) {
          const lead = await storage.getLeadByEmail(email);
          if (lead) {
            if (product === "summary") {
              const creditExpires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
              await storage.updateLead(lead.id, {
                status: "summary_purchased",
                summaryPurchasedAt: new Date().toISOString(),
                creditExpiresAt: creditExpires,
              });
              console.log(`Lead ${lead.id} (${email}) updated to summary_purchased, credit expires ${creditExpires}`);
            } else if (product === "audit") {
              await storage.updateLead(lead.id, {
                status: "converted",
                convertedToCustomer: true,
              });
              console.log(`Lead ${lead.id} (${email}) updated to converted (full audit)`);
            } else if (product === "subscription") {
              await storage.updateLead(lead.id, {
                status: "converted",
                convertedToCustomer: true,
              });
              console.log(`Lead ${lead.id} (${email}) updated to converted (subscription)`);
            }
          } else {
            console.log(`No lead found for email: ${email}`);
          }
        }

        // Fire-and-forget: run agents → generate report → email
        if (email && (product === "summary" || product === "audit")) {
          const reportType: "summary" | "full" = product === "audit" ? "full" : "summary";

          // Find or create a center for this lead
          const lead = await storage.getLeadByEmail(email);
          let centerId: number | null = null;

          if (lead) {
            // Check if there's already a center for this lead's website
            // Search existing centers by URL match
            const allCenters = lead.websiteUrl
              ? (await storage.getTreatmentCentersByTenant(0)).concat(
                  await storage.getTreatmentCentersByUser(0),
                )
              : [];
            // Broader search: look through all recent centers
            // For MVP, create a center from lead data if we can't find one
            if (centerId === null && lead.websiteUrl) {
              const newCenter = await storage.createTreatmentCenter({
                name: lead.name || "Treatment Center",
                websiteUrl: lead.websiteUrl,
                city: lead.city || "Unknown",
                state: lead.state || "US",
                treatmentCategory: lead.treatmentCategory || "dual",
                levelsOfCare: ["php", "iop"],
              });
              centerId = newCenter.id;
              console.log(`[webhook] Created center ${centerId} from lead ${lead.id}`);
            }
          }

          if (centerId) {
            // Fire and forget — don't await, return 200 to Stripe immediately
            runReportPipeline(centerId, email, reportType, amountTotal).catch((err) =>
              console.error("[webhook] Pipeline error:", err),
            );
          } else {
            console.log(`[webhook] No center could be created for ${email}, skipping pipeline`);
            // Still notify admin
            notifyAdminOfPurchase(email, "Unknown Center", reportType, amountTotal).catch(() => {});
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ============ DIAGNOSTIC (temporary) ============
  app.get("/api/debug/status", async (_req, res) => {
    const payments = await storage.getRecentPayments();
    const leads = await storage.getAllLeads();
    res.json({
      smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      smtpHost: process.env.SMTP_HOST || "NOT SET",
      smtpUser: process.env.SMTP_USER || "NOT SET",
      stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
      recentPayments: payments,
      recentLeads: leads.slice(-5).map(l => ({ id: l.id, email: l.email, score: l.freeScore, status: l.status, created: l.createdDate })),
      pipelineLog: getPipelineLog(),
    });
  });

  // ============ ADMIN PAYMENTS ============

  // Get recent payment events (admin, auth required)
  app.get("/api/admin/payments", authMiddleware, async (_req, res) => {
    const payments = await storage.getRecentPayments();
    res.json(payments);
  });

  // ============ FREE SEO SCORE (Powered by Real Technical Auditor Agent) ============

  app.post("/api/free-score", async (req, res) => {
    try {
      const { websiteUrl: rawUrl, email, centerName, treatmentCategory, city, state } = req.body;

      if (!rawUrl || !email) {
        return res.status(400).json({ error: "Website URL and email required" });
      }

      // Normalize URL — accept with or without protocol
      let websiteUrl = rawUrl.trim();
      if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
        websiteUrl = "https://" + websiteUrl;
      }

      await storage.createLead({
        email,
        websiteUrl,
        name: centerName || null,
        treatmentCategory: treatmentCategory || null,
        city: city || null,
        state: state || null,
        createdDate: new Date().toISOString().split("T")[0],
      });

      // Run real Technical Auditor agent for the free score
      const result = await generateFreeScoreReport(websiteUrl, {
        name: centerName || "Treatment Center",
        treatmentCategory: treatmentCategory || "dual",
        levelsOfCare: ["php", "iop"],
        city: city || "Unknown",
        state: state || "US",
      });

      // Save score to lead
      const existingLead = await storage.getLeadByEmail(email);
      if (existingLead) {
        await storage.updateLead(existingLead.id, { freeScore: result.score });
      }

      // Send free score email (fire-and-forget — don't block the response)
      sendFreeScoreEmail(email, centerName || websiteUrl, result.score, websiteUrl).catch((err) =>
        console.error("[free-score] Email send failed:", err),
      );

      res.json(result);
    } catch (error) {
      console.error("Free score error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ DASHBOARD DATA (AUTH REQUIRED) ============

  // Get all centers for authenticated user
  app.get("/api/dashboard/centers", authMiddleware, async (req, res) => {
    const centers = await storage.getTreatmentCentersByUser(req.user!.id);
    res.json(centers);
  });

  // Get treatment center dashboard data
  app.get("/api/centers/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const center = await storage.getTreatmentCenter(id);
    if (!center) return res.status(404).json({ error: "Not found" });
    // Verify ownership
    if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(center);
  });

  // Get audit for a center
  app.get("/api/centers/:id/audit", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const audit = await storage.getLatestAudit(id);
    res.json(audit || null);
  });

  // Get keywords for a center
  app.get("/api/centers/:id/keywords", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const keywords = await storage.getKeywordsByCenter(id);
    res.json(keywords);
  });

  // Get competitors for a center
  app.get("/api/centers/:id/competitors", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const comps = await storage.getCompetitorsByCenter(id);
    res.json(comps);
  });

  // Get admissions estimate
  app.get("/api/centers/:id/admissions", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const estimate = await storage.getLatestAdmissionsEstimate(id);
    res.json(estimate || null);
  });

  // ============ AGENT INTELLIGENCE ============

  // Trigger a full agent run for a treatment center
  app.post("/api/centers/:id/run-agents", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const center = await storage.getTreatmentCenter(id);
      if (!center) return res.status(404).json({ error: "Center not found" });
      if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Start agents (non-blocking — returns immediately)
      const statusNow = getRunStatus(id);
      if (statusNow?.status === "running") {
        return res.json({ message: "Agents already running", status: statusNow });
      }

      // Run in background
      runAllAgents(center).catch(err => console.error("Agent run failed:", err));

      res.json({ message: "Agent run started", status: getRunStatus(id) });
    } catch (error) {
      console.error("Run agents error:", error);
      res.status(500).json({ error: "Failed to start agents" });
    }
  });

  // Get agent run status
  app.get("/api/centers/:id/agent-status", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const status = getRunStatus(id);
    res.json(status || { centerId: id, status: "idle", agents: [] });
  });

  // Get extended agent results (content strategy, local SEO, etc.)
  app.get("/api/centers/:id/agent-results", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const center = await storage.getTreatmentCenter(id);
    if (!center) return res.status(404).json({ error: "Center not found" });
    if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const results = getAgentResults(id);
    if (!results) {
      return res.json({ hasResults: false });
    }

    // Return all extended agent data (beyond what's in the standard DB tables)
    const data: Record<string, any> = { hasResults: true };
    for (const [key, value] of results.entries()) {
      data[key] = value;
    }
    res.json(data);
  });

  // Get content strategy data specifically
  app.get("/api/centers/:id/content-strategy", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const results = getAgentResults(id);
    res.json(results?.get("content") || null);
  });

  // Get local SEO data specifically
  app.get("/api/centers/:id/local-seo", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const results = getAgentResults(id);
    res.json(results?.get("local-seo") || null);
  });

  // Get technical audit extended data
  app.get("/api/centers/:id/technical-audit", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const results = getAgentResults(id);
    res.json(results?.get("technical-audit") || null);
  });

  // Get admissions projections data
  app.get("/api/centers/:id/admissions-projections", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const results = getAgentResults(id);
    res.json(results?.get("admissions") || null);
  });

  // ============ REPORT GENERATION & DELIVERY ============

  // Generate a new report for a center
  app.post("/api/centers/:id/reports", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const center = await storage.getTreatmentCenter(id);
      if (!center) return res.status(404).json({ error: "Center not found" });
      if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Create report record
      const report = await storage.createReport({
        centerId: id,
        tenantId: center.tenantId,
        reportType: req.body.reportType || "full",
        generatedAt: new Date().toISOString(),
      });

      // Generate report in background
      generateReport(id)
        .then(async ({ html, data }) => {
          await storage.updateReport(report.id, {
            status: "ready",
            data: { html: html.length, snapshot: data } as any,
          });
        })
        .catch(async (err) => {
          console.error("Report generation error:", err);
          await storage.updateReport(report.id, { status: "error" });
        });

      res.json(report);
    } catch (error) {
      console.error("Report creation error:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Get reports for a center
  app.get("/api/centers/:id/reports", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const reports = await storage.getReportsByCenter(id);
    res.json(reports);
  });

  // Download report as HTML (print-to-PDF ready)
  app.get("/api/centers/:id/report-download", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const center = await storage.getTreatmentCenter(id);
      if (!center) return res.status(404).json({ error: "Center not found" });
      if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { html } = await generateReport(id);
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `inline; filename="seo-report-${center.name.replace(/[^a-z0-9]/gi, "-")}.html"`);
      res.send(html);
    } catch (error) {
      console.error("Report download error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ============ ADMIN REPORT GENERATION ============

  // Manual admin trigger: run agents + generate report + email
  app.post("/api/admin/generate-report", authMiddleware, async (req, res) => {
    try {
      const { leadId, reportType, centerId: reqCenterId } = req.body;

      if (!leadId && !reqCenterId) {
        return res.status(400).json({ error: "leadId or centerId required" });
      }

      const rType: "summary" | "full" = reportType === "summary" ? "summary" : "full";
      let centerId: number | null = reqCenterId ? parseInt(reqCenterId) : null;
      let email = "";

      if (leadId) {
        const lead = await storage.getLeadById(parseInt(leadId));
        if (!lead) return res.status(404).json({ error: "Lead not found" });
        email = lead.email;

        // Create center from lead if no centerId provided
        if (!centerId && lead.websiteUrl) {
          const newCenter = await storage.createTreatmentCenter({
            name: lead.name || "Treatment Center",
            websiteUrl: lead.websiteUrl,
            city: lead.city || "Unknown",
            state: lead.state || "US",
            treatmentCategory: lead.treatmentCategory || "dual",
            levelsOfCare: ["php", "iop"],
          });
          centerId = newCenter.id;
        }
      }

      if (!centerId) {
        return res.status(400).json({ error: "Could not determine center" });
      }

      const center = await storage.getTreatmentCenter(centerId);
      if (!center) return res.status(404).json({ error: "Center not found" });

      if (!email) email = req.user!.email;

      // Fire and forget
      runReportPipeline(centerId, email, rType, 0).catch((err) =>
        console.error("[admin-generate] Pipeline error:", err),
      );

      res.json({ message: "Report generation started", centerId, reportType: rType, email });
    } catch (error) {
      console.error("Admin generate-report error:", error);
      res.status(500).json({ error: "Failed to start report generation" });
    }
  });

  // View a cached/generated report by center + type
  app.get("/api/reports/:centerId/:reportType", authMiddleware, async (req, res) => {
    try {
      const centerId = parseInt(req.params.centerId);
      const reportType = req.params.reportType as string;
      const center = await storage.getTreatmentCenter(centerId);
      if (!center) return res.status(404).json({ error: "Center not found" });

      // Check ownership
      if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Look for the most recent report of this type
      const reports = await storage.getReportsByCenter(centerId);
      const match = reports.find((r) => r.reportType === reportType && r.status === "ready");

      if (!match) {
        return res.status(404).json({ error: "No ready report found. Generate one first." });
      }

      // If client wants HTML, regenerate from agents (data is cached in orchestrator)
      if (req.headers.accept?.includes("text/html")) {
        const rType = reportType === "summary" ? "summary" : "full" as const;
        const { html } = await generateReport(centerId, rType);
        res.setHeader("Content-Type", "text/html");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${center.name.replace(/[^a-z0-9]/gi, "-")}-${reportType}-report.html"`,
        );
        return res.send(html);
      }

      // Otherwise return the report metadata
      res.json(match);
    } catch (error) {
      console.error("Report view error:", error);
      res.status(500).json({ error: "Failed to retrieve report" });
    }
  });

  // ============ SCHEDULED RUNS ============

  // Get scheduled run config for a center
  app.get("/api/centers/:id/schedule", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const schedule = await storage.getScheduledRunByCenter(id);
    if (!schedule) {
      return res.json({ enabled: false, frequency: "weekly", nextRunAt: null, lastRunAt: null });
    }
    res.json({
      ...schedule,
      nextRunAt: schedule.nextRunAt || getNextRunDate(schedule.frequency, schedule.lastRunAt),
    });
  });

  // Create or update scheduled run for a center
  app.post("/api/centers/:id/schedule", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const center = await storage.getTreatmentCenter(id);
      if (!center) return res.status(404).json({ error: "Center not found" });
      if (center.userId !== req.user!.id && center.tenantId !== req.tenant?.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { frequency, enabled } = req.body;
      let schedule = await storage.getScheduledRunByCenter(id);

      if (schedule) {
        schedule = await storage.updateScheduledRun(schedule.id, {
          frequency: frequency || schedule.frequency,
          enabled: enabled !== undefined ? enabled : schedule.enabled,
          nextRunAt: getNextRunDate(frequency || schedule.frequency, schedule.lastRunAt),
        });
      } else {
        schedule = await storage.createScheduledRun({
          centerId: id,
          tenantId: center.tenantId,
          frequency: frequency || "weekly",
          enabled: enabled !== undefined ? enabled : true,
        });
        // Set initial nextRunAt
        schedule = await storage.updateScheduledRun(schedule!.id, {
          nextRunAt: getNextRunDate(frequency || "weekly"),
        });
      }

      res.json(schedule);
    } catch (error) {
      console.error("Schedule error:", error);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  // ============ LEAD MANAGEMENT ============

  // Get all leads (admin — no tenant filter for now)
  app.get("/api/leads", authMiddleware, async (req, res) => {
    const leads = await storage.getAllLeads();
    res.json(leads);
  });

  // Get single lead
  app.get("/api/leads/:id", authMiddleware, async (req, res) => {
    const lead = await storage.getLeadById(parseInt(req.params.id));
    if (!lead) return res.status(404).json({ error: "Not found" });
    res.json(lead);
  });

  // Update lead (status, notes, nurture touches)
  app.patch("/api/leads/:id", authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status, notes, nurtureTouches, convertedToCustomer } = req.body;
    const updated = await storage.updateLead(id, {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(nurtureTouches && { nurtureTouches }),
      ...(convertedToCustomer !== undefined && { convertedToCustomer }),
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ============ WHITE-LABEL THEMING ============

  // Get tenant theme config
  app.get("/api/tenant/:slug/theme", async (req, res) => {
    const tenant = await storage.getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Not found" });
    res.json({
      name: tenant.name,
      primaryColor: tenant.primaryColor,
      accentColor: tenant.accentColor,
      fontFamily: tenant.fontFamily,
      logoUrl: tenant.logoUrl,
      plan: tenant.plan,
    });
  });

  // ============ STRIPE REDIRECT → HASH ROUTING ============
  // Stripe payment links redirect to path-based URLs, but the SPA uses hash routing.
  // wouter's useHashLocation reads location.hash and includes query params in the path
  // (e.g. "#/thank-you?product=summary" → path "/thank-you?product=summary" which won't match).
  // Fix: put query params OUTSIDE the hash so they land in location.search instead.
  // Final URL: https://bhseointelligence.com/?product=summary#/thank-you
  app.get("/thank-you", (req, res) => {
    const query = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    res.redirect(302, `/${query}#/thank-you`);
  });

  // Update tenant theme (owner only)
  app.patch("/api/tenant/theme", authMiddleware, async (req, res) => {
    if (!req.tenant) {
      return res.status(400).json({ error: "No tenant associated" });
    }
    const { primaryColor, accentColor, fontFamily, logoUrl } = req.body;
    const updated = await storage.updateTenant(req.tenant.id, {
      ...(primaryColor && { primaryColor }),
      ...(accentColor && { accentColor }),
      ...(fontFamily && { fontFamily }),
      ...(logoUrl && { logoUrl }),
    });
    res.json(updated);
  });
}
