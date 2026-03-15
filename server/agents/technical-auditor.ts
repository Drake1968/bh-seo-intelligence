// Agent 1: Technical SEO Auditor
// Analyzes a treatment center website for technical SEO factors
// Uses PageSpeed Insights API + direct HTML fetch + robots.txt + sitemap.xml

import type { TechnicalAuditData, AuditIssue } from "./types";

interface CenterInfo {
  websiteUrl: string;
  name: string;
  treatmentCategory: string;
  levelsOfCare: string[];
  city: string;
  state: string;
}

// BH-specific page patterns that indicate good SEO structure
const EXPECTED_PAGES: Record<string, { pattern: RegExp; label: string; weight: number }[]> = {
  sa: [
    { pattern: /detox/i, label: "Detox program page", weight: 15 },
    { pattern: /residential|inpatient|rtc/i, label: "Residential treatment page", weight: 15 },
    { pattern: /php|partial/i, label: "PHP program page", weight: 10 },
    { pattern: /iop|intensive.outpatient/i, label: "IOP program page", weight: 10 },
    { pattern: /dual.diagnosis|co.?occurring/i, label: "Dual diagnosis page", weight: 8 },
    { pattern: /alcohol/i, label: "Alcohol-specific page", weight: 5 },
    { pattern: /opioid|fentanyl|heroin/i, label: "Opioid-specific page", weight: 5 },
    { pattern: /insurance|verify/i, label: "Insurance/verification page", weight: 8 },
    { pattern: /admission|intake/i, label: "Admissions page", weight: 5 },
    { pattern: /about|team|staff/i, label: "About/team page", weight: 5 },
  ],
  mh: [
    { pattern: /php|partial/i, label: "PHP program page", weight: 15 },
    { pattern: /iop|intensive.outpatient/i, label: "IOP program page", weight: 15 },
    { pattern: /anxiety/i, label: "Anxiety treatment page", weight: 10 },
    { pattern: /depression/i, label: "Depression treatment page", weight: 10 },
    { pattern: /ptsd|trauma/i, label: "PTSD/trauma page", weight: 8 },
    { pattern: /bipolar/i, label: "Bipolar treatment page", weight: 5 },
    { pattern: /insurance|verify/i, label: "Insurance/verification page", weight: 8 },
    { pattern: /about|team|staff/i, label: "About/team page", weight: 5 },
  ],
  dual: [
    { pattern: /detox/i, label: "Detox program page", weight: 12 },
    { pattern: /residential|inpatient|rtc/i, label: "Residential treatment page", weight: 12 },
    { pattern: /php|partial/i, label: "PHP program page", weight: 10 },
    { pattern: /iop|intensive.outpatient/i, label: "IOP program page", weight: 10 },
    { pattern: /dual.diagnosis|co.?occurring/i, label: "Dual diagnosis page", weight: 12 },
    { pattern: /anxiety/i, label: "Anxiety treatment page", weight: 5 },
    { pattern: /depression/i, label: "Depression treatment page", weight: 5 },
    { pattern: /insurance|verify/i, label: "Insurance/verification page", weight: 8 },
    { pattern: /about|team|staff/i, label: "About/team page", weight: 5 },
  ],
};

function normalizeUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, "");
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  return u;
}

async function safeFetch(url: string): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "BH-SEO-Intel/1.0 (SEO Audit Bot)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    return res;
  } catch {
    return null;
  }
}

async function safeFetchText(url: string): Promise<string | null> {
  const res = await safeFetch(url);
  if (!res || !res.ok) return null;
  try {
    return await res.text();
  } catch {
    return null;
  }
}

async function safeFetchJson(url: string): Promise<any | null> {
  const res = await safeFetch(url);
  if (!res || !res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function runTechnicalAudit(center: CenterInfo): Promise<TechnicalAuditData> {
  const issues: AuditIssue[] = [];
  const url = normalizeUrl(center.websiteUrl);
  const domain = url.replace(/^https?:\/\//, "").replace(/\/.*/, "");

  console.log(`Technical Auditor: Starting audit for ${url}`);

  // ── 1. Fetch the website HTML ──
  const html = await safeFetchText(url);
  const hasSsl = url.startsWith("https://");
  let hasMetaDescription = false;
  let hasMetaViewport = false;
  let hasSchema = false;
  let schemaTypes: string[] = [];
  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;
  let imgCount = 0;
  let imgMissingAlt = 0;
  let hasCanonical = false;
  let hasOgTags = false;
  let titleTag = "";
  let wordCount = 0;
  let internalLinks: string[] = [];

  if (html) {
    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    titleTag = titleMatch ? titleMatch[1].trim() : "";

    // Meta description
    hasMetaDescription = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);

    // Viewport
    hasMetaViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);

    // Canonical
    hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);

    // OG tags
    hasOgTags = /<meta[^>]+property=["']og:/i.test(html);

    // Schema markup (JSON-LD)
    const schemaMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    hasSchema = schemaMatches.length > 0;
    for (const sm of schemaMatches) {
      try {
        const content = sm.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
        const parsed = JSON.parse(content);
        const t = parsed["@type"];
        if (t) schemaTypes.push(Array.isArray(t) ? t.join(", ") : t);
      } catch { /* ignore malformed JSON-LD */ }
    }

    // Headings
    h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    h3Count = (html.match(/<h3[\s>]/gi) || []).length;

    // Images & alt tags
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    imgCount = imgMatches.length;
    for (const img of imgMatches) {
      if (!(/alt=["'][^"']+["']/i.test(img))) {
        imgMissingAlt++;
      }
    }

    // Word count (strip tags)
    const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    wordCount = textContent.split(" ").filter(w => w.length > 0).length;

    // Extract internal links for content analysis
    const linkMatches = html.match(/href=["']([^"'#]+)["']/gi) || [];
    for (const link of linkMatches) {
      const href = link.replace(/href=["']/i, "").replace(/["']$/, "");
      if (href.startsWith("/") || href.includes(domain)) {
        internalLinks.push(href);
      }
    }
  } else {
    issues.push({
      severity: "critical",
      category: "Availability",
      description: "Could not fetch website — site may be down or blocking crawlers",
      recommendation: "Ensure your website is accessible and does not block search engine crawlers. Check server status and robots.txt.",
      impact: "Site cannot be indexed if not accessible",
    });
  }

  // SSL check
  if (!hasSsl) {
    issues.push({
      severity: "critical",
      category: "Security",
      description: "Website not using HTTPS",
      recommendation: "Install SSL certificate and redirect all HTTP traffic to HTTPS. Google considers this a ranking signal.",
      impact: "Ranking penalty + user trust loss",
    });
  }

  // Title tag
  if (!titleTag) {
    issues.push({
      severity: "critical",
      category: "On-Page SEO",
      description: "Missing or empty title tag",
      recommendation: "Add a unique, descriptive title tag (50-60 characters) that includes your primary keyword and location.",
      impact: "Title tag is the #1 on-page ranking factor",
    });
  } else if (titleTag.length > 60) {
    issues.push({
      severity: "warning",
      category: "On-Page SEO",
      description: `Title tag is ${titleTag.length} characters — may be truncated in search results (target ≤60)`,
      recommendation: "Shorten your title tag while keeping the primary keyword and location.",
    });
  }

  // Meta description
  if (!hasMetaDescription) {
    issues.push({
      severity: "critical",
      category: "On-Page SEO",
      description: "Missing meta description",
      recommendation: "Add a compelling meta description (150-160 characters) with your primary keyword and a call-to-action.",
      impact: "Lower click-through rates from search results",
    });
  }

  // Schema
  if (!hasSchema) {
    issues.push({
      severity: "critical",
      category: "Schema",
      description: "No JSON-LD structured data detected",
      recommendation: "Add JSON-LD structured data for MedicalBusiness with address, phone, services, medical specialty, and operating hours. Add FAQPage schema to program pages.",
      impact: "Missing rich results, Knowledge Panel opportunities, and Map Pack eligibility signals",
    });
  } else {
    const hasMedicalSchema = schemaTypes.some(t =>
      /medical|health|hospital|physician|local/i.test(t)
    );
    if (!hasMedicalSchema) {
      issues.push({
        severity: "warning",
        category: "Schema",
        description: `Schema markup found (${schemaTypes.join(", ")}) but missing MedicalBusiness or HealthcareFacility type`,
        recommendation: "Add MedicalBusiness or MedicalOrganization schema with service details, medical specialty, and accepted insurance.",
      });
    }
  }

  // Headings
  if (h1Count === 0) {
    issues.push({
      severity: "warning",
      category: "On-Page SEO",
      description: "No H1 heading found on homepage",
      recommendation: "Add exactly one H1 heading that includes your primary keyword and location.",
    });
  } else if (h1Count > 1) {
    issues.push({
      severity: "info",
      category: "On-Page SEO",
      description: `Multiple H1 tags found (${h1Count}) — best practice is one per page`,
      recommendation: "Use a single H1 for the main topic. Use H2/H3 for subtopics.",
    });
  }

  // Images
  if (imgMissingAlt > 0) {
    issues.push({
      severity: imgMissingAlt > 5 ? "warning" : "info",
      category: "Accessibility",
      description: `${imgMissingAlt} image(s) missing alt text out of ${imgCount} total`,
      recommendation: "Add descriptive alt text to all images. Use keywords naturally where relevant.",
    });
  }

  // Canonical
  if (!hasCanonical && html) {
    issues.push({
      severity: "warning",
      category: "Crawlability",
      description: "No canonical tag found — possible duplicate content concerns",
      recommendation: "Add a canonical tag pointing to the preferred URL on every page.",
    });
  }

  // OG tags
  if (!hasOgTags && html) {
    issues.push({
      severity: "info",
      category: "Social",
      description: "No Open Graph meta tags found — social shares will lack rich previews",
      recommendation: "Add og:title, og:description, og:image, and og:url tags for better social sharing.",
    });
  }

  // Viewport
  const mobileOptimized = hasMetaViewport;
  if (!mobileOptimized && html) {
    issues.push({
      severity: "critical",
      category: "Mobile",
      description: "No viewport meta tag — website is not mobile-optimized. 70%+ of BH searches happen on mobile",
      recommendation: "Add <meta name='viewport' content='width=device-width, initial-scale=1'> and implement responsive design.",
      impact: "Losing majority of mobile search traffic",
    });
  }

  // ── 2. Fetch robots.txt ──
  console.log(`Technical Auditor: Checking robots.txt for ${domain}`);
  const robotsTxt = await safeFetchText(`${url}/robots.txt`);
  const hasRobotsTxt = !!robotsTxt && robotsTxt.length > 10;
  let robotsBlocksAll = false;

  if (hasRobotsTxt && robotsTxt) {
    if (/Disallow:\s*\/\s*$/m.test(robotsTxt)) {
      robotsBlocksAll = true;
      issues.push({
        severity: "critical",
        category: "Crawlability",
        description: "robots.txt blocks all crawlers (Disallow: /)",
        recommendation: "Update robots.txt to allow search engines to crawl your site. Remove the 'Disallow: /' directive.",
        impact: "Site cannot be indexed",
      });
    }
  } else {
    issues.push({
      severity: "info",
      category: "Crawlability",
      description: "No robots.txt file found",
      recommendation: "Create a robots.txt file that references your sitemap and sets appropriate crawl directives.",
    });
  }

  // ── 3. Fetch sitemap.xml ──
  console.log(`Technical Auditor: Checking sitemap.xml for ${domain}`);
  const sitemapXml = await safeFetchText(`${url}/sitemap.xml`);
  const hasSitemap = !!sitemapXml && sitemapXml.includes("<url");
  let sitemapUrlCount = 0;

  if (hasSitemap && sitemapXml) {
    sitemapUrlCount = (sitemapXml.match(/<url>/gi) || []).length;
    if (sitemapUrlCount === 0) {
      // Could be sitemap index
      sitemapUrlCount = (sitemapXml.match(/<sitemap>/gi) || []).length;
    }
  } else {
    issues.push({
      severity: "warning",
      category: "Crawlability",
      description: "No XML sitemap found at /sitemap.xml",
      recommendation: "Create and submit an XML sitemap to Google Search Console. Include all program pages, blog posts, and location pages.",
    });
  }

  // ── 4. Google PageSpeed Insights API ──
  console.log(`Technical Auditor: Calling PageSpeed Insights API for ${url}`);
  const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=seo`;
  const psiData = await safeFetchJson(psiUrl);

  let perfScore = 50;
  let accessScore = 50;
  let seoScore = 50;
  let lcpMs = 3000;
  let inp = 200;
  let cls = 0.1;
  let pageSpeed = 3.0;

  if (psiData?.lighthouseResult) {
    const lh = psiData.lighthouseResult;
    const cats = lh.categories || {};

    perfScore = Math.round((cats.performance?.score ?? 0.5) * 100);
    accessScore = Math.round((cats.accessibility?.score ?? 0.5) * 100);
    seoScore = Math.round((cats.seo?.score ?? 0.5) * 100);

    // Core Web Vitals from audits
    const audits = lh.audits || {};
    lcpMs = audits["largest-contentful-paint"]?.numericValue ?? 3000;
    const tbt = audits["total-blocking-time"]?.numericValue ?? 300;
    // Approximate INP from TBT (INP not directly available in Lighthouse)
    inp = Math.round(tbt * 0.6 + 80);
    cls = audits["cumulative-layout-shift"]?.numericValue ?? 0.1;
    pageSpeed = Math.round(lcpMs / 100) / 10; // LCP in seconds (1 decimal)

    console.log(`Technical Auditor: PSI scores — Perf: ${perfScore}, Access: ${accessScore}, SEO: ${seoScore}`);
  } else {
    console.log("Technical Auditor: PageSpeed API unavailable, using fallback estimates");
    // Estimate from HTML signals
    if (html) {
      const hasLargeImages = (html.match(/<img[^>]+>/gi) || []).length > 15;
      const hasExternalScripts = (html.match(/<script[^>]+src=/gi) || []).length;
      pageSpeed = 2.0 + (hasLargeImages ? 1.5 : 0) + Math.min(hasExternalScripts * 0.2, 1.5);
      lcpMs = pageSpeed * 1000;
      perfScore = Math.max(20, 100 - Math.round(pageSpeed * 15));
    }
  }

  // Page speed issues
  const lcpSec = Math.round(lcpMs / 100) / 10;
  if (lcpSec > 2.5) {
    issues.push({
      severity: lcpSec > 4 ? "critical" : "warning",
      category: "Performance",
      description: `Largest Contentful Paint (LCP) is ${lcpSec}s — ${lcpSec > 4 ? "poor" : "needs improvement"} (target: ≤2.5s)`,
      recommendation: "Optimize hero images (compress, use WebP/AVIF, add width/height), implement lazy loading, and minimize render-blocking resources.",
      impact: `Core Web Vital failure affecting ${lcpSec > 4 ? "all" : "mobile"} rankings`,
    });
  }
  if (inp > 200) {
    issues.push({
      severity: inp > 500 ? "critical" : "warning",
      category: "Performance",
      description: `Estimated Interaction to Next Paint (INP) is ${inp}ms — needs improvement (target: ≤200ms)`,
      recommendation: "Reduce JavaScript execution time, break up long tasks, and minimize third-party script impact.",
    });
  }
  if (cls > 0.1) {
    issues.push({
      severity: "warning",
      category: "Performance",
      description: `Cumulative Layout Shift (CLS) is ${Math.round(cls * 1000) / 1000} — needs improvement (target: ≤0.1)`,
      recommendation: "Set explicit dimensions on images/ads, avoid injecting content above existing content.",
    });
  }

  // ── 5. Check expected program pages from internal links ──
  const expectedPages = EXPECTED_PAGES[center.treatmentCategory] || EXPECTED_PAGES.dual;
  let contentScore = 30; // base
  const missingPages: string[] = [];

  const allLinkText = internalLinks.join(" ").toLowerCase() + " " + (html || "").toLowerCase();
  for (const page of expectedPages) {
    if (page.pattern.test(allLinkText)) {
      contentScore += page.weight * 0.7;
    } else {
      missingPages.push(page.label);
    }
  }
  contentScore = Math.min(100, Math.round(contentScore));

  if (missingPages.length > 0) {
    const topMissing = missingPages.slice(0, 3);
    issues.push({
      severity: missingPages.length > 3 ? "critical" : "warning",
      category: "Content",
      description: `Missing ${missingPages.length} dedicated program/service pages: ${topMissing.join(", ")}${missingPages.length > 3 ? ` and ${missingPages.length - 3} more` : ""}`,
      recommendation: "Create dedicated pages for each treatment program (1,500-2,500 words) with program details, who it's for, typical schedule, insurance info, and FAQs.",
      impact: "Each missing page is a lost ranking opportunity for high-intent keywords",
    });
  }

  // Word count check
  if (html && wordCount < 300) {
    issues.push({
      severity: "warning",
      category: "Content",
      description: `Homepage has only ~${wordCount} words — too thin for competitive ranking (target: 800-1,500 words)`,
      recommendation: "Expand homepage content with treatment descriptions, location info, trust signals, and calls to action.",
    });
  }

  // E-E-A-T signals from HTML
  const htmlLower = (html || "").toLowerCase();
  const hasAuthorBios = /author|written by|reviewed by|lpc|lcsw|lcpc|lmhc|md|phd/i.test(htmlLower);
  const hasMedicalReview = /medically reviewed|clinical review|reviewed by.*md|reviewed by.*do/i.test(htmlLower);
  const hasCredentials = /licensed|accredited|certified|carf|joint commission|legitscript|nabh/i.test(htmlLower);

  if (!hasAuthorBios && html) {
    issues.push({
      severity: "warning",
      category: "E-E-A-T",
      description: "No author bylines or clinical credentials detected on the page",
      recommendation: "Add author bio sections with name, credentials (LPC, LCSW, MD), and photo to all clinical content. Critical for YMYL compliance.",
    });
  }
  if (!hasMedicalReview && html) {
    issues.push({
      severity: "warning",
      category: "E-E-A-T",
      description: "No medical review attribution on clinical content",
      recommendation: "Add 'Medically reviewed by [Name], [Credentials]' to all clinical pages with last-reviewed dates.",
    });
  }

  // Local SEO signals
  if (!domain.includes(center.city.toLowerCase().replace(/\s+/g, ""))) {
    const cityInContent = htmlLower.includes(center.city.toLowerCase());
    if (!cityInContent) {
      issues.push({
        severity: "warning",
        category: "Local",
        description: `City name "${center.city}" not found in homepage content`,
        recommendation: `Ensure "${center.city}, ${center.state}" appears in title tags, H1s, meta descriptions, and footer on every page.`,
      });
    }
  }

  // ── 6. Calculate scores ──
  const technicalBase = hasSsl ? 40 : 10;
  const technicalSpeed = perfScore * 0.3; // up to 30 points from performance
  const technicalCrawl = (hasRobotsTxt ? 5 : 0) + (hasSitemap ? 5 : 0) + (hasCanonical ? 5 : 0) + (!robotsBlocksAll ? 5 : 0);
  const technicalScore = Math.min(100, Math.round(technicalBase + technicalSpeed + technicalCrawl));

  const mobileScore = mobileOptimized
    ? Math.min(100, Math.round(perfScore * 0.5 + 50))
    : Math.min(40, Math.round(perfScore * 0.3));

  const localSeoScore = 50; // Placeholder — real value from Local SEO agent

  // Backlink score estimate (we can't do real backlink analysis without paid APIs)
  const backlinkScore = hasCredentials ? 45 : 30;

  const indexedPages = hasSitemap ? Math.max(sitemapUrlCount, internalLinks.length) : internalLinks.length;

  const overallScore = Math.round(
    technicalScore * 0.25 +
    contentScore * 0.25 +
    localSeoScore * 0.20 +
    backlinkScore * 0.15 +
    mobileScore * 0.15
  );

  // Sort issues by severity
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2));

  console.log(`Technical Auditor: Complete — overall score ${overallScore}/100, ${issues.length} issues found`);

  return {
    overallScore,
    technicalScore,
    contentScore,
    localSeoScore,
    backlinkScore,
    mobileScore,
    pageSpeed: Math.round(pageSpeed * 10) / 10,
    indexedPages: Math.max(1, indexedPages),
    hasSchemaMarkup: hasSchema,
    hasSslCert: hasSsl,
    mobileOptimized,
    issues,
    coreWebVitals: {
      lcp: Math.round(lcpMs),
      inp: Math.round(inp),
      cls: Math.round(cls * 1000) / 1000,
    },
    crawlability: {
      hasRobotsTxt,
      hasSitemap,
      canonicalsCorrect: hasCanonical,
      noindexPages: 0, // Can't detect without full crawl
      redirectChains: 0,
    },
    accessibility: {
      score: accessScore,
      missingAltTags: imgMissingAlt,
      missingHeadings: h1Count === 0,
      colorContrastIssues: 0, // Would need full PageSpeed audit details
    },
  };
}
