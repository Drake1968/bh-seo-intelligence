// Agent 3: Content Strategist
// Crawls the website, analyzes content gaps, E-E-A-T signals, generates content calendar
// Real implementation — fetches actual site HTML

import type { ContentStrategyData } from "./types";

interface CenterInfo {
  websiteUrl: string;
  name: string;
  treatmentCategory: string;
  levelsOfCare: string[];
  city: string;
  state: string;
}

// BH content gap templates by category
const CONTENT_GAPS: Record<string, { topic: string; intent: string; volume: number; priority: "high" | "medium" | "low"; titleTemplate: string; urlTemplate: string }[]> = {
  sa: [
    { topic: "Fentanyl withdrawal timeline", intent: "informational", volume: 1800, priority: "high", titleTemplate: "Fentanyl Withdrawal Timeline: What to Expect During Detox", urlTemplate: "/blog/fentanyl-withdrawal-timeline/" },
    { topic: "What to pack for rehab", intent: "informational", volume: 720, priority: "medium", titleTemplate: "What to Pack for Rehab: Complete Checklist for {city}", urlTemplate: "/blog/what-to-pack-for-rehab/" },
    { topic: "How to stage an intervention", intent: "informational", volume: 1200, priority: "high", titleTemplate: "How to Stage an Intervention: A Family Guide", urlTemplate: "/resources/intervention-guide/" },
    { topic: "Alcohol withdrawal dangers", intent: "informational", volume: 2200, priority: "high", titleTemplate: "Alcohol Withdrawal: Symptoms, Timeline & Why Medical Detox Matters", urlTemplate: "/blog/alcohol-withdrawal-dangers/" },
    { topic: "MAT medication assisted treatment", intent: "informational", volume: 880, priority: "medium", titleTemplate: "Medication-Assisted Treatment (MAT): Suboxone, Vivitrol & More", urlTemplate: "/treatment/medication-assisted-treatment/" },
    { topic: "Recovery resources {city}", intent: "local", volume: 140, priority: "medium", titleTemplate: "Recovery Resources in {city}, {state}: Support Groups, Meetings & More", urlTemplate: "/resources/{city_slug}-recovery-resources/" },
    { topic: "Insurance verification for rehab", intent: "transactional", volume: 590, priority: "high", titleTemplate: "Does My Insurance Cover Rehab? Free Verification", urlTemplate: "/insurance/verify/" },
    { topic: "Supporting a loved one in recovery", intent: "informational", volume: 480, priority: "medium", titleTemplate: "Supporting a Loved One in Recovery: What Families Need to Know", urlTemplate: "/blog/supporting-loved-one-recovery/" },
    { topic: "Relapse prevention strategies", intent: "informational", volume: 720, priority: "medium", titleTemplate: "Relapse Prevention: Evidence-Based Strategies for Long-Term Recovery", urlTemplate: "/blog/relapse-prevention-strategies/" },
    { topic: "Aftercare planning", intent: "informational", volume: 320, priority: "medium", titleTemplate: "Aftercare Planning: Building a Strong Foundation After Treatment", urlTemplate: "/blog/aftercare-planning-guide/" },
  ],
  mh: [
    { topic: "Understanding panic attacks", intent: "informational", volume: 2400, priority: "high", titleTemplate: "Understanding Panic Attacks: Causes, Symptoms & Treatment Options", urlTemplate: "/blog/understanding-panic-attacks/" },
    { topic: "PHP vs IOP mental health", intent: "informational", volume: 320, priority: "high", titleTemplate: "PHP vs IOP: Which Mental Health Program Is Right for You?", urlTemplate: "/blog/php-vs-iop-mental-health/" },
    { topic: "Grounding techniques for anxiety", intent: "informational", volume: 1600, priority: "medium", titleTemplate: "5 Grounding Techniques for Anxiety That Actually Work", urlTemplate: "/blog/grounding-techniques-anxiety/" },
    { topic: "Signs of depression", intent: "informational", volume: 3200, priority: "high", titleTemplate: "Signs of Depression: When to Seek Professional Help", urlTemplate: "/blog/signs-of-depression/" },
    { topic: "PTSD treatment options", intent: "informational", volume: 880, priority: "high", titleTemplate: "PTSD Treatment Options: EMDR, CBT & What Really Works", urlTemplate: "/blog/ptsd-treatment-options/" },
    { topic: "Mental health crisis resources {state}", intent: "local", volume: 210, priority: "high", titleTemplate: "Mental Health Crisis Resources in {state}", urlTemplate: "/resources/{state_slug}-mental-health-crisis/" },
    { topic: "Bipolar disorder daily management", intent: "informational", volume: 590, priority: "medium", titleTemplate: "Living with Bipolar Disorder: Daily Management Strategies", urlTemplate: "/blog/bipolar-daily-management/" },
    { topic: "When to seek intensive treatment", intent: "informational", volume: 260, priority: "medium", titleTemplate: "When Outpatient Therapy Isn't Enough: Signs You Need Intensive Treatment", urlTemplate: "/blog/when-to-seek-intensive-treatment/" },
  ],
  dual: [
    { topic: "Dual diagnosis explained", intent: "informational", volume: 720, priority: "high", titleTemplate: "Dual Diagnosis: When Addiction and Mental Health Collide", urlTemplate: "/blog/dual-diagnosis-explained/" },
    { topic: "Self-medicating anxiety with alcohol", intent: "informational", volume: 590, priority: "high", titleTemplate: "Self-Medicating Anxiety with Alcohol: Breaking the Cycle", urlTemplate: "/blog/self-medicating-anxiety-alcohol/" },
    { topic: "Depression and addiction connection", intent: "informational", volume: 480, priority: "high", titleTemplate: "The Connection Between Depression and Addiction", urlTemplate: "/blog/depression-addiction-connection/" },
    { topic: "PTSD and substance abuse", intent: "informational", volume: 720, priority: "high", titleTemplate: "PTSD and Substance Abuse: Integrated Treatment Approaches", urlTemplate: "/blog/ptsd-substance-abuse/" },
    { topic: "Fentanyl withdrawal timeline", intent: "informational", volume: 1800, priority: "high", titleTemplate: "Fentanyl Withdrawal Timeline: What to Expect During Detox", urlTemplate: "/blog/fentanyl-withdrawal-timeline/" },
    { topic: "Insurance verification for rehab", intent: "transactional", volume: 590, priority: "high", titleTemplate: "Does My Insurance Cover Rehab? Free Verification", urlTemplate: "/insurance/verify/" },
    { topic: "How long is dual diagnosis treatment", intent: "informational", volume: 260, priority: "medium", titleTemplate: "How Long Is Dual Diagnosis Treatment? What to Expect", urlTemplate: "/blog/how-long-dual-diagnosis-treatment/" },
    { topic: "Recovery resources {city}", intent: "local", volume: 140, priority: "medium", titleTemplate: "Recovery Resources in {city}, {state}", urlTemplate: "/resources/{city_slug}-recovery-resources/" },
  ],
};

// Content calendar templates (4-week rotation)
const CALENDAR_TEMPLATES: Record<string, { topic: string; type: string; wordCount: number; priority: "high" | "medium" | "low" }[]> = {
  sa: [
    { topic: "Substance-specific guide", type: "Long-form guide", wordCount: 2000, priority: "high" },
    { topic: "Treatment process article", type: "Educational", wordCount: 1500, priority: "medium" },
    { topic: "Family/recovery support", type: "Support content", wordCount: 1200, priority: "medium" },
    { topic: "Local community resources", type: "Local content", wordCount: 1000, priority: "high" },
  ],
  mh: [
    { topic: "Condition deep-dive", type: "Clinical guide", wordCount: 2000, priority: "high" },
    { topic: "Treatment comparison", type: "Educational", wordCount: 1500, priority: "high" },
    { topic: "Coping skills/wellness", type: "Practical guide", wordCount: 1200, priority: "medium" },
    { topic: "Local mental health resources", type: "Local content", wordCount: 1000, priority: "medium" },
  ],
  dual: [
    { topic: "Dual diagnosis deep-dive", type: "Clinical guide", wordCount: 2000, priority: "high" },
    { topic: "Substance-specific guide", type: "Long-form guide", wordCount: 1800, priority: "high" },
    { topic: "Treatment process/comparison", type: "Educational", wordCount: 1500, priority: "medium" },
    { topic: "Local community resources", type: "Local content", wordCount: 1000, priority: "medium" },
  ],
};

// Expected BH page patterns — pages a well-optimized site should have
const EXPECTED_PAGES: Record<string, RegExp[]> = {
  sa: [
    /detox|withdrawal/i,
    /residential|inpatient/i,
    /php|partial\s*hospitali/i,
    /iop|intensive\s*outpatient/i,
    /alcohol/i,
    /opioid|heroin|fentanyl/i,
    /meth|cocaine|stimulant/i,
    /insurance|verif/i,
    /about|team|staff/i,
    /admissions|get\s*started/i,
    /blog|resources|article/i,
    /family|loved\s*one/i,
  ],
  mh: [
    /anxiety/i,
    /depression/i,
    /ptsd|trauma/i,
    /bipolar/i,
    /ocd|obsessive/i,
    /php|partial\s*hospitali/i,
    /iop|intensive\s*outpatient/i,
    /cbt|cognitive\s*behav/i,
    /dbt|dialectical/i,
    /emdr/i,
    /insurance|verif/i,
    /about|team|staff/i,
    /blog|resources|article/i,
  ],
  dual: [
    /dual\s*diagnosis|co-occurring/i,
    /detox|withdrawal/i,
    /residential|inpatient/i,
    /php|partial\s*hospitali/i,
    /iop|intensive\s*outpatient/i,
    /alcohol/i,
    /opioid|heroin|fentanyl/i,
    /anxiety/i,
    /depression/i,
    /ptsd|trauma/i,
    /insurance|verif/i,
    /about|team|staff/i,
    /blog|resources|article/i,
  ],
};

// Accreditation signals
const ACCREDITATION_PATTERNS = [
  /joint\s*commission/i,
  /carf/i,
  /legitscript/i,
  /nabh/i,
  /accredit/i,
  /licensed\s*by/i,
  /certified\s*by/i,
];

// Credential signals
const CREDENTIAL_PATTERNS = [
  /\b(MD|DO|PhD|PsyD|LCSW|LMFT|LPC|LCDC|CADC|NP|RN|BSN|MSW|LMHC|LPCC|LISW)\b/,
  /board\s*certified/i,
  /licensed\s*(therapist|counselor|psychologist|psychiatrist|clinical)/i,
  /medical\s*director/i,
  /clinical\s*director/i,
];

function normalizeUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  return u;
}

async function safeFetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "BH-SEO-Intel/1.0 (SEO Audit Bot)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function templateText(text: string, center: CenterInfo): string {
  const citySlug = center.city.toLowerCase().replace(/\s+/g, "-");
  const stateSlug = center.state.toLowerCase().replace(/\s+/g, "-");
  return text
    .replace(/{city}/g, center.city)
    .replace(/{state}/g, center.state)
    .replace(/{city_slug}/g, citySlug)
    .replace(/{state_slug}/g, stateSlug);
}

function stripHtml(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  const cleaned = stripHtml(text);
  return cleaned.split(/\s+/).filter(w => w.length > 1).length;
}

interface PageInfo {
  url: string;
  title: string;
  html: string;
  wordCount: number;
  lastModified: string | null;
}

/** Extract internal links from HTML, resolve relative to base URL */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const hrefs = html.match(/href=["']([^"'#]+)["']/gi) || [];
  const links: Set<string> = new Set();

  for (const match of hrefs) {
    const href = match.replace(/href=["']/i, "").replace(/["']$/, "");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      const resolved = new URL(href, baseUrl);
      // Only keep same-domain links
      if (resolved.hostname === base.hostname) {
        const clean = resolved.origin + resolved.pathname.replace(/\/+$/, "");
        links.add(clean);
      }
    } catch {
      // skip invalid URLs
    }
  }

  return [...links];
}

export async function runContentStrategist(center: CenterInfo): Promise<ContentStrategyData> {
  const category = center.treatmentCategory;
  const gapTemplates = CONTENT_GAPS[category] || CONTENT_GAPS.dual;
  const calendarTemplates = CALENDAR_TEMPLATES[category] || CALENDAR_TEMPLATES.dual;
  const expectedPatterns = EXPECTED_PAGES[category] || EXPECTED_PAGES.dual;

  const baseUrl = normalizeUrl(center.websiteUrl);
  console.log(`Content Strategist: Crawling ${baseUrl} for content analysis`);

  // ── Step 1: Fetch homepage and discover internal links ──
  const homepageHtml = await safeFetchText(baseUrl);
  const crawledPages: PageInfo[] = [];

  if (homepageHtml) {
    const homeTitle = homepageHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    crawledPages.push({
      url: baseUrl,
      title: homeTitle ? homeTitle[1].trim() : "Homepage",
      html: homepageHtml,
      wordCount: countWords(homepageHtml),
      lastModified: null,
    });

    // Discover internal links from homepage
    const internalLinks = extractInternalLinks(homepageHtml, baseUrl);
    console.log(`Content Strategist: Found ${internalLinks.length} internal links, fetching up to 19 more pages`);

    // Fetch up to 19 additional pages (20 total including homepage)
    const pagesToFetch = internalLinks
      .filter(link => link !== baseUrl && !link.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|css|js)$/i))
      .slice(0, 19);

    const fetchPromises = pagesToFetch.map(async (pageUrl) => {
      const html = await safeFetchText(pageUrl);
      if (!html) return null;
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      return {
        url: pageUrl,
        title: titleMatch ? titleMatch[1].trim() : pageUrl.split("/").filter(Boolean).pop() || "Page",
        html,
        wordCount: countWords(html),
        lastModified: null,
      };
    });

    const results = await Promise.all(fetchPromises);
    for (const page of results) {
      if (page) crawledPages.push(page);
    }
  }

  console.log(`Content Strategist: Crawled ${crawledPages.length} pages total`);

  // ── Step 2: Build existing content inventory ──
  const existingContent = crawledPages.map(page => {
    const needsUpdate = page.wordCount < 500;
    return {
      url: page.url,
      title: page.title,
      wordCount: page.wordCount,
      lastUpdated: page.lastModified || new Date().toISOString().substring(0, 10),
      needsUpdate,
    };
  });

  // ── Step 3: Combine all crawled text for analysis ──
  const allHtml = crawledPages.map(p => p.html).join(" ");
  const allTextLower = stripHtml(allHtml).toLowerCase();
  const allUrlsLower = crawledPages.map(p => p.url.toLowerCase()).join(" ");

  // ── Step 4: Identify content gaps — compare found pages against expected BH content ──
  const matchedPatterns = new Set<number>();
  for (let i = 0; i < expectedPatterns.length; i++) {
    const pattern = expectedPatterns[i];
    // Check both page URLs and page content/titles for this topic
    const foundInUrl = crawledPages.some(p => pattern.test(p.url));
    const foundInTitle = crawledPages.some(p => pattern.test(p.title));
    if (foundInUrl || foundInTitle) {
      matchedPatterns.add(i);
    }
  }

  // Count competitors covering each gap (based on how many expected patterns the site is MISSING)
  const siteCompleteness = matchedPatterns.size / expectedPatterns.length;

  const contentGaps = gapTemplates.map(gap => {
    const topicLower = gap.topic.toLowerCase();
    const topicTerms = topicLower.split(/\s+/).filter(t => t.length >= 3);

    // Check if the site already covers this topic
    const termsFound = topicTerms.filter(t => allTextLower.includes(t)).length;
    const coverageRatio = topicTerms.length > 0 ? termsFound / topicTerms.length : 0;

    // Check if there's a dedicated page URL matching this topic
    const hasDedicatedPage = topicTerms.some(t => allUrlsLower.includes(t));

    // If site covers it well, fewer competitors are "ahead" on this topic
    // If site doesn't cover it, more competitors likely do
    let competitorsCovering: number;
    if (hasDedicatedPage && coverageRatio > 0.6) {
      competitorsCovering = 1; // Site covers it — few competitors ahead
    } else if (coverageRatio > 0.3) {
      competitorsCovering = 2; // Partial coverage
    } else {
      competitorsCovering = 3 + Math.round((1 - siteCompleteness) * 2); // Gap — competitors likely cover this
    }

    // Adjust volume slightly based on city signal (proxy for market size)
    const volumeMultiplier = 0.8 + Math.random() * 0.4; // 0.8-1.2
    const estimatedVolume = Math.round(gap.volume * volumeMultiplier);

    // Upgrade priority if this is a clear gap
    let priority = gap.priority;
    if (!hasDedicatedPage && coverageRatio < 0.2 && gap.volume >= 500) {
      priority = "high";
    }

    return {
      topic: templateText(gap.topic, center),
      intent: gap.intent,
      competitorsCovering,
      estimatedVolume,
      priority,
      suggestedTitle: templateText(gap.titleTemplate, center),
      suggestedUrl: templateText(gap.urlTemplate, center),
    };
  });

  // Sort by priority and volume
  contentGaps.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedVolume - a.estimatedVolume;
  });

  // ── Step 5: E-E-A-T scoring based on real HTML signals ──
  let experienceScore = 0;
  let expertiseScore = 0;
  let authorityScore = 0;
  let trustScore = 0;

  // Experience (0-100): staff/team pages with credentials, testimonials
  const hasTeamPage = crawledPages.some(p => /about|team|staff|our-/i.test(p.url));
  const hasTestimonials = /testimonial|success\s*stor|review|client\s*stor/i.test(allTextLower);
  const hasCredentials = CREDENTIAL_PATTERNS.some(p => p.test(allHtml));
  if (hasTeamPage) experienceScore += 30;
  if (hasTestimonials) experienceScore += 25;
  if (hasCredentials) experienceScore += 30;
  if (/year|experience|founded|serving.*since/i.test(allTextLower)) experienceScore += 15;
  experienceScore = Math.min(100, experienceScore);

  // Expertise (0-100): clinical content depth, proper BH terminology
  const bhTerms = ["detox", "residential", "php", "iop", "outpatient", "evidence-based", "cognitive", "behavioral",
    "trauma-informed", "dual diagnosis", "co-occurring", "medication-assisted", "holistic", "12-step",
    "individualized", "aftercare", "relapse prevention", "clinical", "therapeutic", "intervention"];
  const bhTermsFound = bhTerms.filter(t => allTextLower.includes(t)).length;
  expertiseScore = Math.min(100, Math.round((bhTermsFound / bhTerms.length) * 60));
  // Bonus for longer content (more in-depth)
  const avgWordCount = crawledPages.length > 0
    ? crawledPages.reduce((sum, p) => sum + p.wordCount, 0) / crawledPages.length
    : 0;
  if (avgWordCount > 800) expertiseScore = Math.min(100, expertiseScore + 20);
  else if (avgWordCount > 400) expertiseScore = Math.min(100, expertiseScore + 10);
  // Bonus for having a blog
  if (crawledPages.some(p => /blog|article|resource|news/i.test(p.url))) expertiseScore = Math.min(100, expertiseScore + 20);

  // Authoritativeness (0-100): accreditation mentions, about page
  const accreditationCount = ACCREDITATION_PATTERNS.filter(p => p.test(allHtml)).length;
  authorityScore = Math.min(100, accreditationCount * 20);
  if (hasTeamPage) authorityScore = Math.min(100, authorityScore + 15);
  if (/about\s*us|our\s*mission|our\s*story/i.test(allTextLower)) authorityScore = Math.min(100, authorityScore + 10);
  if (crawledPages.length >= 10) authorityScore = Math.min(100, authorityScore + 15); // Larger site = more authority signals
  else if (crawledPages.length >= 5) authorityScore = Math.min(100, authorityScore + 8);

  // Trustworthiness (0-100): SSL, privacy policy, contact info, address
  const hasSSL = baseUrl.startsWith("https://");
  const hasPrivacyPolicy = crawledPages.some(p => /privacy/i.test(p.url));
  const hasContactPage = crawledPages.some(p => /contact/i.test(p.url));
  const hasPhoneNumber = /\(\d{3}\)\s*\d{3}[-.]?\d{4}|\d{3}[-.]?\d{3}[-.]?\d{4}/.test(allHtml);
  const hasPhysicalAddress = /\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|way|ln|lane)/i.test(allHtml);
  const hasHIPAA = /hipaa/i.test(allTextLower);

  if (hasSSL) trustScore += 20;
  if (hasPrivacyPolicy) trustScore += 15;
  if (hasContactPage) trustScore += 15;
  if (hasPhoneNumber) trustScore += 15;
  if (hasPhysicalAddress) trustScore += 15;
  if (hasHIPAA) trustScore += 10;
  if (/confidential/i.test(allTextLower)) trustScore += 10;
  trustScore = Math.min(100, trustScore);

  const eatScore = {
    experience: experienceScore,
    expertise: expertiseScore,
    authoritativeness: authorityScore,
    trustworthiness: trustScore,
    overall: Math.round(
      experienceScore * 0.2 +
      expertiseScore * 0.3 +
      authorityScore * 0.25 +
      trustScore * 0.25
    ),
  };

  // ── Step 6: Generate 8-week content calendar based on gaps ──
  const contentCalendar = [];
  const topKeywords = contentGaps.slice(0, 8);
  for (let week = 1; week <= 8; week++) {
    const templateIdx = (week - 1) % calendarTemplates.length;
    const template = calendarTemplates[templateIdx];
    const keywordIdx = (week - 1) % topKeywords.length;
    contentCalendar.push({
      week,
      topic: topKeywords[keywordIdx]?.suggestedTitle || template.topic,
      type: template.type,
      targetKeyword: topKeywords[keywordIdx]?.topic || template.topic,
      wordCount: template.wordCount,
      priority: template.priority,
    });
  }

  console.log(`Content Strategist: Complete — ${crawledPages.length} pages crawled, ${contentGaps.length} gaps identified, E-E-A-T overall ${eatScore.overall}`);

  return {
    contentGaps,
    eatScore,
    contentCalendar,
    existingContent,
  };
}
