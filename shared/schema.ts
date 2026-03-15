import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Multi-tenant organization (white-label ready)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#0f766e"),
  accentColor: text("accent_color").default("#1e3a5f"),
  fontFamily: text("font_family").default("General Sans"),
  domain: text("domain"), // custom domain for Phase II white-label
  stripeCustomerId: text("stripe_customer_id"),
  plan: text("plan").default("none"), // none, basic, premium, enterprise
  isActive: boolean("is_active").default(true),
});

// Users within tenants
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"), // bcrypt hash
  role: text("role").default("owner"), // owner, admin, viewer
  stripeCustomerId: text("stripe_customer_id"),
});

// Sessions for auth
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // UUID token
  userId: integer("user_id").notNull(),
  tenantId: integer("tenant_id"),
  expiresAt: text("expires_at").notNull(),
});

// Treatment centers being monitored
export const treatmentCenters = pgTable("treatment_centers", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  userId: integer("user_id"),
  name: text("name").notNull(),
  websiteUrl: text("website_url").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  treatmentCategory: text("treatment_category").notNull(), // sa, mh, dual
  levelsOfCare: text("levels_of_care").array().notNull(), // detox, rtc, crisis, php, iop, outpatient, telehealth
  seoScore: integer("seo_score"),
  lastAuditDate: text("last_audit_date"),
  status: text("status").default("pending"), // pending, auditing, complete
});

// SEO audit results
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  tenantId: integer("tenant_id"),
  overallScore: integer("overall_score"),
  technicalScore: integer("technical_score"),
  contentScore: integer("content_score"),
  localSeoScore: integer("local_seo_score"),
  backlinkScore: integer("backlink_score"),
  mobileScore: integer("mobile_score"),
  pageSpeed: real("page_speed"),
  indexedPages: integer("indexed_pages"),
  hasSchemaMarkup: boolean("has_schema_markup"),
  hasSslCert: boolean("has_ssl_cert"),
  mobileOptimized: boolean("mobile_optimized"),
  issues: jsonb("issues"), // array of {severity, category, description, recommendation}
  auditDate: text("audit_date").notNull(),
  reportUrl: text("report_url"),
});

// Keyword rankings
export const keywordRankings = pgTable("keyword_rankings", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  keyword: text("keyword").notNull(),
  position: integer("position"),
  previousPosition: integer("previous_position"),
  searchVolume: integer("search_volume"),
  category: text("category"), // sa, mh
  trackDate: text("track_date").notNull(),
});

// Competitor data
export const competitors = pgTable("competitors", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  competitorName: text("competitor_name").notNull(),
  competitorUrl: text("competitor_url").notNull(),
  seoScore: integer("seo_score"),
  domainAuthority: integer("domain_authority"),
  backlinks: integer("backlinks"),
  sharedKeywords: integer("shared_keywords"),
});

// Admissions estimates
export const admissionsEstimates = pgTable("admissions_estimates", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  estimatedMonthlyAdmissions: real("estimated_monthly_admissions"),
  lostAdmissions: real("lost_admissions"),
  potentialRevenue: real("potential_revenue"),
  estimateDate: text("estimate_date").notNull(),
  assumptions: jsonb("assumptions"), // {avgRevPerAdmission, conversionRate, ctr}
});

// Audit orders (Stripe payments)
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  tenantId: integer("tenant_id"),
  centerId: integer("center_id"),
  productType: text("product_type").notNull(), // audit, basic, premium, enterprise
  amount: integer("amount").notNull(), // cents
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").default("pending"), // pending, paid, processing, complete
  orderDate: text("order_date").notNull(),
});

// SEO Reports (PDF generation tracking)
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  tenantId: integer("tenant_id"),
  reportType: text("report_type").notNull(), // full, technical, keywords, content, local, competitor, admissions
  generatedAt: text("generated_at").notNull(),
  data: jsonb("data"), // snapshot of agent results at generation time
  status: text("status").default("generating"), // generating, ready, error
});

// Scheduled run configuration
export const scheduledRuns = pgTable("scheduled_runs", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull(),
  tenantId: integer("tenant_id"),
  frequency: text("frequency").notNull().default("weekly"), // daily, weekly, biweekly, monthly
  enabled: boolean("enabled").default(true),
  lastRunAt: text("last_run_at"),
  nextRunAt: text("next_run_at"),
});

// Free SEO score leads
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  email: text("email").notNull(),
  websiteUrl: text("website_url").notNull(),
  name: text("name"),
  treatmentCategory: text("treatment_category"),
  city: text("city"),
  state: text("state"),
  freeScore: integer("free_score"),
  convertedToCustomer: boolean("converted_to_customer").default(false),
  createdDate: text("created_date").notNull(),
  status: text("status").default("new"), // new, contacted, nurturing, summary_purchased, converted, lost
  summaryPurchasedAt: text("summary_purchased_at"),
  creditExpiresAt: text("credit_expires_at"),
  notes: text("notes"),
  nurtureTouches: jsonb("nurture_touches"), // [{day: 0, sentAt: "..."}]
});

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions);
export const insertTreatmentCenterSchema = createInsertSchema(treatmentCenters).omit({ id: true, seoScore: true, lastAuditDate: true, status: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true });
export const insertKeywordRankingSchema = createInsertSchema(keywordRankings).omit({ id: true });
export const insertCompetitorSchema = createInsertSchema(competitors).omit({ id: true });
export const insertAdmissionsEstimateSchema = createInsertSchema(admissionsEstimates).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, status: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, freeScore: true, convertedToCustomer: true, status: true, summaryPurchasedAt: true, creditExpiresAt: true, notes: true, nurtureTouches: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, status: true });
export const insertScheduledRunSchema = createInsertSchema(scheduledRuns).omit({ id: true, lastRunAt: true, nextRunAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type TreatmentCenter = typeof treatmentCenters.$inferSelect;
export type InsertTreatmentCenter = z.infer<typeof insertTreatmentCenterSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type KeywordRanking = typeof keywordRankings.$inferSelect;
export type InsertKeywordRanking = z.infer<typeof insertKeywordRankingSchema>;
export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type AdmissionsEstimate = typeof admissionsEstimates.$inferSelect;
export type InsertAdmissionsEstimate = z.infer<typeof insertAdmissionsEstimateSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type ScheduledRun = typeof scheduledRuns.$inferSelect;
export type InsertScheduledRun = z.infer<typeof insertScheduledRunSchema>;

// Payment event type (in-memory, not a DB table)
export interface PaymentEvent {
  id: number;
  email: string;
  amount: number;
  product: string;
  timestamp: string;
  paymentIntentId: string | null;
}

// Onboarding form validation
export const onboardingSchema = z.object({
  treatmentCategory: z.enum(["sa", "mh", "dual"]),
  levelsOfCare: z.array(z.string()).min(1, "Select at least one level of care"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  websiteUrl: z.string().min(1, "Website URL is required").transform((val) => {
    const trimmed = val.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return "https://" + trimmed;
    }
    return trimmed;
  }),
  name: z.string().min(1, "Center name is required"),
  email: z.string().email("Enter a valid email"),
  contactName: z.string().min(1, "Contact name is required"),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Stripe product/price mapping
export const STRIPE_CONFIG = {
  audit: {
    productId: "prod_U9LP6Pohk3NaUP",
    priceId: "price_1TB2jF2N45x0bONipNcHPlLr",
    amount: 199700,
    name: "Comprehensive SEO Audit",
  },
  basic: {
    productId: "prod_U9LPAuKQDKqaiB",
    priceId: "price_1TB2jF2N45x0bONiQvD8CpD9",
    amount: 39500,
    name: "Basic Plan",
  },
  premium: {
    productId: "prod_U9LPeRkOK1dIsc",
    priceId: "price_1TB2jF2N45x0bONiMT2Q3Iur",
    amount: 59500,
    name: "Premium Plan",
  },
  enterprise: {
    productId: "prod_U9LPRTDvuxRjXv",
    priceId: "price_1TB2jF2N45x0bONiUv7WNI2q",
    amount: 99500,
    name: "Enterprise Plan",
  },
} as const;
