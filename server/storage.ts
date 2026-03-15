import type {
  Tenant, InsertTenant,
  User, InsertUser,
  Session, InsertSession,
  TreatmentCenter, InsertTreatmentCenter,
  Audit, InsertAudit,
  KeywordRanking, InsertKeywordRanking,
  Competitor, InsertCompetitor,
  AdmissionsEstimate, InsertAdmissionsEstimate,
  Order, InsertOrder,
  Lead, InsertLead,
  Report, InsertReport,
  ScheduledRun, InsertScheduledRun,
  PaymentEvent,
} from "@shared/schema";

export interface IStorage {
  // Tenants
  createTenant(data: InsertTenant): Promise<Tenant>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant | undefined>;

  // Users
  createUser(data: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;

  // Sessions
  createSession(data: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

  // Treatment Centers
  createTreatmentCenter(data: InsertTreatmentCenter): Promise<TreatmentCenter>;
  getTreatmentCenter(id: number): Promise<TreatmentCenter | undefined>;
  getTreatmentCentersByTenant(tenantId: number): Promise<TreatmentCenter[]>;
  getTreatmentCentersByUser(userId: number): Promise<TreatmentCenter[]>;
  updateTreatmentCenter(id: number, data: Partial<TreatmentCenter>): Promise<TreatmentCenter | undefined>;

  // Audits
  createAudit(data: InsertAudit): Promise<Audit>;
  getAuditsByCenter(centerId: number): Promise<Audit[]>;
  getLatestAudit(centerId: number): Promise<Audit | undefined>;

  // Keywords
  createKeywordRanking(data: InsertKeywordRanking): Promise<KeywordRanking>;
  getKeywordsByCenter(centerId: number): Promise<KeywordRanking[]>;

  // Competitors
  createCompetitor(data: InsertCompetitor): Promise<Competitor>;
  getCompetitorsByCenter(centerId: number): Promise<Competitor[]>;

  // Admissions
  createAdmissionsEstimate(data: InsertAdmissionsEstimate): Promise<AdmissionsEstimate>;
  getLatestAdmissionsEstimate(centerId: number): Promise<AdmissionsEstimate | undefined>;

  // Orders
  createOrder(data: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;

  // Leads
  createLead(data: InsertLead): Promise<Lead>;
  getLeadByEmail(email: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  updateLead(id: number, data: Partial<Lead>): Promise<Lead | undefined>;
  getLeadById(id: number): Promise<Lead | undefined>;

  // Reports
  createReport(data: InsertReport): Promise<Report>;
  getReportsByCenter(centerId: number): Promise<Report[]>;
  getReport(id: number): Promise<Report | undefined>;
  updateReport(id: number, data: Partial<Report>): Promise<Report | undefined>;

  // Scheduled Runs
  createScheduledRun(data: InsertScheduledRun): Promise<ScheduledRun>;
  getScheduledRunByCenter(centerId: number): Promise<ScheduledRun | undefined>;
  updateScheduledRun(id: number, data: Partial<ScheduledRun>): Promise<ScheduledRun | undefined>;
  getActiveScheduledRuns(): Promise<ScheduledRun[]>;

  // Payments
  addPaymentEvent(event: Omit<PaymentEvent, "id">): Promise<PaymentEvent>;
  getRecentPayments(): Promise<PaymentEvent[]>;
}

export class MemStorage implements IStorage {
  private tenants: Map<number, Tenant> = new Map();
  private users: Map<number, User> = new Map();
  private sessionStore: Map<string, Session> = new Map();
  private centers: Map<number, TreatmentCenter> = new Map();
  private audits: Map<number, Audit> = new Map();
  private keywords: Map<number, KeywordRanking> = new Map();
  private competitors: Map<number, Competitor> = new Map();
  private admissions: Map<number, AdmissionsEstimate> = new Map();
  private orders: Map<number, Order> = new Map();
  private leads: Map<number, Lead> = new Map();
  private reports: Map<number, Report> = new Map();
  private scheduledRuns: Map<number, ScheduledRun> = new Map();
  private payments: PaymentEvent[] = [];
  private nextId = 1;

  private getId() { return this.nextId++; }

  async createTenant(data: InsertTenant) {
    const t: Tenant = { ...data, id: this.getId(), isActive: true, plan: data.plan ?? "none", primaryColor: data.primaryColor ?? "#0f766e", accentColor: data.accentColor ?? "#1e3a5f", fontFamily: data.fontFamily ?? "General Sans", logoUrl: data.logoUrl ?? null, domain: data.domain ?? null, stripeCustomerId: data.stripeCustomerId ?? null };
    this.tenants.set(t.id, t);
    return t;
  }
  async getTenant(id: number) { return this.tenants.get(id); }
  async getTenantBySlug(slug: string) { return [...this.tenants.values()].find(t => t.slug === slug); }
  async updateTenant(id: number, data: Partial<Tenant>) {
    const t = this.tenants.get(id);
    if (!t) return undefined;
    const updated = { ...t, ...data };
    this.tenants.set(id, updated);
    return updated;
  }

  async createUser(data: InsertUser) {
    const u: User = { ...data, id: this.getId(), role: data.role ?? "owner", tenantId: data.tenantId ?? null, stripeCustomerId: data.stripeCustomerId ?? null, passwordHash: data.passwordHash ?? null };
    this.users.set(u.id, u);
    return u;
  }
  async getUser(id: number) { return this.users.get(id); }
  async getUserByEmail(email: string) { return [...this.users.values()].find(u => u.email === email); }
  async updateUser(id: number, data: Partial<User>) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const updated = { ...u, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async createSession(data: InsertSession) {
    const s: Session = { ...data };
    this.sessionStore.set(s.id, s);
    return s;
  }
  async getSession(id: string) {
    const s = this.sessionStore.get(id);
    if (!s) return undefined;
    if (new Date(s.expiresAt) < new Date()) {
      this.sessionStore.delete(id);
      return undefined;
    }
    return s;
  }
  async deleteSession(id: string) { this.sessionStore.delete(id); }
  async deleteExpiredSessions() {
    const now = new Date();
    for (const [id, s] of this.sessionStore.entries()) {
      if (new Date(s.expiresAt) < now) this.sessionStore.delete(id);
    }
  }

  async createTreatmentCenter(data: InsertTreatmentCenter) {
    const c: TreatmentCenter = { ...data, id: this.getId(), seoScore: null, lastAuditDate: null, status: "pending", tenantId: data.tenantId ?? null, userId: data.userId ?? null };
    this.centers.set(c.id, c);
    return c;
  }
  async getTreatmentCenter(id: number) { return this.centers.get(id); }
  async getTreatmentCentersByTenant(tenantId: number) { return [...this.centers.values()].filter(c => c.tenantId === tenantId); }
  async getTreatmentCentersByUser(userId: number) { return [...this.centers.values()].filter(c => c.userId === userId); }
  async updateTreatmentCenter(id: number, data: Partial<TreatmentCenter>) {
    const c = this.centers.get(id);
    if (!c) return undefined;
    const updated = { ...c, ...data };
    this.centers.set(id, updated);
    return updated;
  }

  async createAudit(data: InsertAudit) {
    const a: Audit = { ...data, id: this.getId(), tenantId: data.tenantId ?? null, overallScore: data.overallScore ?? null, technicalScore: data.technicalScore ?? null, contentScore: data.contentScore ?? null, localSeoScore: data.localSeoScore ?? null, backlinkScore: data.backlinkScore ?? null, mobileScore: data.mobileScore ?? null, pageSpeed: data.pageSpeed ?? null, indexedPages: data.indexedPages ?? null, hasSchemaMarkup: data.hasSchemaMarkup ?? null, hasSslCert: data.hasSslCert ?? null, mobileOptimized: data.mobileOptimized ?? null, issues: data.issues ?? null, reportUrl: data.reportUrl ?? null };
    this.audits.set(a.id, a);
    return a;
  }
  async getAuditsByCenter(centerId: number) { return [...this.audits.values()].filter(a => a.centerId === centerId); }
  async getLatestAudit(centerId: number) { return [...this.audits.values()].filter(a => a.centerId === centerId).pop(); }

  async createKeywordRanking(data: InsertKeywordRanking) {
    const k: KeywordRanking = { ...data, id: this.getId(), previousPosition: data.previousPosition ?? null, searchVolume: data.searchVolume ?? null, category: data.category ?? null, position: data.position ?? null };
    this.keywords.set(k.id, k);
    return k;
  }
  async getKeywordsByCenter(centerId: number) { return [...this.keywords.values()].filter(k => k.centerId === centerId); }

  async createCompetitor(data: InsertCompetitor) {
    const c: Competitor = { ...data, id: this.getId(), seoScore: data.seoScore ?? null, domainAuthority: data.domainAuthority ?? null, backlinks: data.backlinks ?? null, sharedKeywords: data.sharedKeywords ?? null };
    this.competitors.set(c.id, c);
    return c;
  }
  async getCompetitorsByCenter(centerId: number) { return [...this.competitors.values()].filter(c => c.centerId === centerId); }

  async createAdmissionsEstimate(data: InsertAdmissionsEstimate) {
    const a: AdmissionsEstimate = { ...data, id: this.getId(), estimatedMonthlyAdmissions: data.estimatedMonthlyAdmissions ?? null, lostAdmissions: data.lostAdmissions ?? null, potentialRevenue: data.potentialRevenue ?? null, assumptions: data.assumptions ?? null };
    this.admissions.set(a.id, a);
    return a;
  }
  async getLatestAdmissionsEstimate(centerId: number) { return [...this.admissions.values()].filter(a => a.centerId === centerId).pop(); }

  async createOrder(data: InsertOrder) {
    const o: Order = { ...data, id: this.getId(), status: "pending", userId: data.userId ?? null, tenantId: data.tenantId ?? null, centerId: data.centerId ?? null, stripePaymentId: data.stripePaymentId ?? null };
    this.orders.set(o.id, o);
    return o;
  }
  async getOrdersByUser(userId: number) { return [...this.orders.values()].filter(o => o.userId === userId); }
  async updateOrder(id: number, data: Partial<Order>) {
    const o = this.orders.get(id);
    if (!o) return undefined;
    const updated = { ...o, ...data };
    this.orders.set(id, updated);
    return updated;
  }

  async createLead(data: InsertLead) {
    const l: Lead = { ...data, id: this.getId(), freeScore: null, convertedToCustomer: false, tenantId: data.tenantId ?? null, name: data.name ?? null, treatmentCategory: data.treatmentCategory ?? null, city: data.city ?? null, state: data.state ?? null, status: "new", summaryPurchasedAt: null, creditExpiresAt: null, notes: null, nurtureTouches: null };
    this.leads.set(l.id, l);
    return l;
  }
  async getLeadByEmail(email: string) { return [...this.leads.values()].find(l => l.email === email); }
  async getAllLeads() { return [...this.leads.values()].sort((a, b) => b.id - a.id); }
  async updateLead(id: number, data: Partial<Lead>) {
    const l = this.leads.get(id);
    if (!l) return undefined;
    const updated = { ...l, ...data };
    this.leads.set(id, updated);
    return updated;
  }
  async getLeadById(id: number) { return this.leads.get(id); }

  async createReport(data: InsertReport) {
    const r: Report = { ...data, id: this.getId(), status: "generating", tenantId: data.tenantId ?? null, data: data.data ?? null };
    this.reports.set(r.id, r);
    return r;
  }
  async getReportsByCenter(centerId: number) {
    return [...this.reports.values()].filter(r => r.centerId === centerId).sort((a, b) => b.id - a.id);
  }
  async getReport(id: number) { return this.reports.get(id); }
  async updateReport(id: number, data: Partial<Report>) {
    const r = this.reports.get(id);
    if (!r) return undefined;
    const updated = { ...r, ...data };
    this.reports.set(id, updated);
    return updated;
  }

  async createScheduledRun(data: InsertScheduledRun) {
    const s: ScheduledRun = { ...data, id: this.getId(), enabled: data.enabled ?? true, frequency: data.frequency ?? "weekly", lastRunAt: null, nextRunAt: null, tenantId: data.tenantId ?? null };
    this.scheduledRuns.set(s.id, s);
    return s;
  }
  async getScheduledRunByCenter(centerId: number) {
    return [...this.scheduledRuns.values()].find(s => s.centerId === centerId);
  }
  async updateScheduledRun(id: number, data: Partial<ScheduledRun>) {
    const s = this.scheduledRuns.get(id);
    if (!s) return undefined;
    const updated = { ...s, ...data };
    this.scheduledRuns.set(id, updated);
    return updated;
  }
  async getActiveScheduledRuns() {
    return [...this.scheduledRuns.values()].filter(s => s.enabled);
  }

  async addPaymentEvent(event: Omit<PaymentEvent, "id">) {
    const p: PaymentEvent = { ...event, id: this.getId() };
    this.payments.push(p);
    return p;
  }
  async getRecentPayments() {
    return [...this.payments].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();
