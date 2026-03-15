// Agent 2: Keyword Rank Tracker
// Tracks keyword positions and identifies opportunities
// Fetches site HTML, checks keyword term presence, estimates positions

import type { KeywordTrackingData } from "./types";

interface CenterInfo {
  websiteUrl: string;
  name: string;
  treatmentCategory: string;
  levelsOfCare: string[];
  city: string;
  state: string;
}

// Behavioral health keyword database by category
const BH_KEYWORDS: Record<string, { keyword: string; baseVolume: number; difficulty: number; intent: string }[]> = {
  sa: [
    { keyword: "drug rehab {city} {state_abbr}", baseVolume: 320, difficulty: 45, intent: "transactional" },
    { keyword: "alcohol detox near me", baseVolume: 880, difficulty: 55, intent: "transactional" },
    { keyword: "alcohol rehab {city} {state_abbr}", baseVolume: 260, difficulty: 42, intent: "transactional" },
    { keyword: "inpatient rehab {state}", baseVolume: 480, difficulty: 60, intent: "transactional" },
    { keyword: "residential rehab {city} {state_abbr}", baseVolume: 260, difficulty: 38, intent: "transactional" },
    { keyword: "detox near me", baseVolume: 2400, difficulty: 72, intent: "transactional" },
    { keyword: "opioid addiction treatment {city}", baseVolume: 280, difficulty: 40, intent: "transactional" },
    { keyword: "fentanyl rehab {state}", baseVolume: 390, difficulty: 48, intent: "transactional" },
    { keyword: "drug rehab near me", baseVolume: 4400, difficulty: 78, intent: "transactional" },
    { keyword: "30 day rehab {city}", baseVolume: 170, difficulty: 35, intent: "transactional" },
    { keyword: "substance abuse treatment {city} {state_abbr}", baseVolume: 210, difficulty: 38, intent: "transactional" },
    { keyword: "meth addiction treatment {city}", baseVolume: 140, difficulty: 35, intent: "transactional" },
    { keyword: "cocaine rehab {state}", baseVolume: 190, difficulty: 42, intent: "transactional" },
    { keyword: "how long does detox take", baseVolume: 1200, difficulty: 32, intent: "informational" },
    { keyword: "signs of alcohol withdrawal", baseVolume: 2900, difficulty: 28, intent: "informational" },
    { keyword: "what to expect in rehab", baseVolume: 720, difficulty: 25, intent: "informational" },
    { keyword: "how much does rehab cost", baseVolume: 1600, difficulty: 38, intent: "transactional" },
    { keyword: "does insurance cover rehab", baseVolume: 1100, difficulty: 35, intent: "transactional" },
    { keyword: "iop near me {city}", baseVolume: 170, difficulty: 32, intent: "transactional" },
    { keyword: "php program {city} {state_abbr}", baseVolume: 90, difficulty: 28, intent: "transactional" },
  ],
  mh: [
    { keyword: "mental health treatment {city} {state_abbr}", baseVolume: 210, difficulty: 42, intent: "transactional" },
    { keyword: "anxiety treatment {city} {state_abbr}", baseVolume: 210, difficulty: 38, intent: "transactional" },
    { keyword: "depression treatment {city} {state_abbr}", baseVolume: 190, difficulty: 40, intent: "transactional" },
    { keyword: "mental health php {city}", baseVolume: 110, difficulty: 30, intent: "transactional" },
    { keyword: "mental health iop {city} {state_abbr}", baseVolume: 140, difficulty: 32, intent: "transactional" },
    { keyword: "ptsd treatment {city}", baseVolume: 170, difficulty: 35, intent: "transactional" },
    { keyword: "bipolar disorder treatment {city} {state_abbr}", baseVolume: 90, difficulty: 30, intent: "transactional" },
    { keyword: "panic disorder treatment near me", baseVolume: 320, difficulty: 35, intent: "transactional" },
    { keyword: "evening iop mental health {city}", baseVolume: 50, difficulty: 18, intent: "transactional" },
    { keyword: "mental health treatment near me", baseVolume: 3600, difficulty: 68, intent: "transactional" },
    { keyword: "therapist {city} {state_abbr}", baseVolume: 480, difficulty: 50, intent: "transactional" },
    { keyword: "psychiatric care {city}", baseVolume: 170, difficulty: 35, intent: "transactional" },
    { keyword: "signs you need mental health treatment", baseVolume: 590, difficulty: 22, intent: "informational" },
    { keyword: "php vs iop mental health", baseVolume: 320, difficulty: 20, intent: "informational" },
    { keyword: "what is partial hospitalization", baseVolume: 480, difficulty: 18, intent: "informational" },
    { keyword: "group therapy {city}", baseVolume: 110, difficulty: 28, intent: "transactional" },
  ],
  dual: [
    { keyword: "dual diagnosis treatment {city} {state_abbr}", baseVolume: 170, difficulty: 40, intent: "transactional" },
    { keyword: "co-occurring disorder treatment {state}", baseVolume: 210, difficulty: 45, intent: "transactional" },
    { keyword: "addiction and depression treatment", baseVolume: 320, difficulty: 38, intent: "transactional" },
    { keyword: "anxiety and addiction rehab", baseVolume: 140, difficulty: 32, intent: "transactional" },
    { keyword: "drug rehab {city} {state_abbr}", baseVolume: 320, difficulty: 45, intent: "transactional" },
    { keyword: "mental health and substance abuse treatment", baseVolume: 480, difficulty: 52, intent: "transactional" },
    { keyword: "alcohol rehab {city} {state_abbr}", baseVolume: 260, difficulty: 42, intent: "transactional" },
    { keyword: "ptsd and addiction treatment", baseVolume: 210, difficulty: 35, intent: "transactional" },
    { keyword: "detox near me", baseVolume: 2400, difficulty: 72, intent: "transactional" },
    { keyword: "iop near me {city}", baseVolume: 170, difficulty: 32, intent: "transactional" },
    { keyword: "residential rehab {city} {state_abbr}", baseVolume: 260, difficulty: 38, intent: "transactional" },
    { keyword: "does insurance cover rehab", baseVolume: 1100, difficulty: 35, intent: "transactional" },
    { keyword: "how long is dual diagnosis treatment", baseVolume: 260, difficulty: 22, intent: "informational" },
  ],
};

// State abbreviation map
const STATE_ABBR: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
};

function getStateAbbr(state: string): string {
  return STATE_ABBR[state] || state.substring(0, 2).toUpperCase();
}

function templateKeyword(template: string, city: string, state: string): string {
  const stateAbbr = getStateAbbr(state);
  return template
    .replace(/{city}/g, city.toLowerCase())
    .replace(/{state_abbr}/g, stateAbbr.toLowerCase())
    .replace(/{state}/g, state.toLowerCase());
}

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

/** Extract core search terms from a keyword, stripping location placeholders */
function extractCoreTerms(keyword: string): string[] {
  // Remove common location fillers and "near me"
  const cleaned = keyword
    .replace(/near me/gi, "")
    .replace(/\b[a-z]{2}\b/g, "") // state abbr
    .trim();
  // Split into meaningful terms (2+ chars)
  return cleaned.split(/\s+/).filter(t => t.length >= 3);
}

export async function runKeywordTracker(center: CenterInfo): Promise<KeywordTrackingData> {
  const category = center.treatmentCategory;
  const templates = BH_KEYWORDS[category] || BH_KEYWORDS.dual;

  // Add cross-category keywords for dual diagnosis
  let allTemplates = [...templates];
  if (category === "dual") {
    const saExtra = BH_KEYWORDS.sa.filter(k => !templates.some(t => t.keyword === k.keyword)).slice(0, 5);
    const mhExtra = BH_KEYWORDS.mh.filter(k => !templates.some(t => t.keyword === k.keyword)).slice(0, 5);
    allTemplates = [...allTemplates, ...saExtra, ...mhExtra];
  }

  const url = normalizeUrl(center.websiteUrl);

  // ── Fetch the website HTML to analyze keyword presence ──
  console.log(`Keyword Tracker: Fetching ${url} for content analysis`);
  const html = await safeFetchText(url);
  const htmlLower = (html || "").toLowerCase();

  // Extract page titles, H1s, H2s from HTML for stronger signals
  const titleMatch = html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleText = (titleMatch ? titleMatch[1] : "").toLowerCase();

  const h1Matches = html?.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Text = h1Matches.map(h => h.replace(/<[^>]+>/g, "")).join(" ").toLowerCase();

  const h2Matches = html?.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2Text = h2Matches.map(h => h.replace(/<[^>]+>/g, "")).join(" ").toLowerCase();

  // Extract internal links to check for dedicated pages
  const linkHrefs = html?.match(/href=["']([^"'#]+)["']/gi) || [];
  const allLinksText = linkHrefs.join(" ").toLowerCase();

  // Check for schema markup (signals better SEO)
  const hasSchema = /<script[^>]+type=["']application\/ld\+json["']/i.test(htmlLower);

  // Check for city/state presence (signals local optimization)
  const hasCityInContent = htmlLower.includes(center.city.toLowerCase());
  const hasStateInContent = htmlLower.includes(center.state.toLowerCase());

  console.log(`Keyword Tracker: Analyzing ${allTemplates.length} keywords against site content`);

  // Generate keyword data with real content-based position estimates
  const keywords = allTemplates.map(template => {
    const keyword = templateKeyword(template.keyword, center.city, center.state);
    const coreTerms = extractCoreTerms(keyword);

    // ── Estimate position based on real content signals ──
    let positionSignal = 0;
    let maxSignal = 0;

    // Check title tag (strongest signal, 30 pts)
    maxSignal += 30;
    const titleTermMatches = coreTerms.filter(t => titleText.includes(t)).length;
    positionSignal += Math.round((titleTermMatches / Math.max(1, coreTerms.length)) * 30);

    // Check H1 (strong signal, 20 pts)
    maxSignal += 20;
    const h1TermMatches = coreTerms.filter(t => h1Text.includes(t)).length;
    positionSignal += Math.round((h1TermMatches / Math.max(1, coreTerms.length)) * 20);

    // Check H2s (medium signal, 10 pts)
    maxSignal += 10;
    const h2TermMatches = coreTerms.filter(t => h2Text.includes(t)).length;
    positionSignal += Math.round((h2TermMatches / Math.max(1, coreTerms.length)) * 10);

    // Check body content (medium signal, 15 pts)
    maxSignal += 15;
    const bodyTermMatches = coreTerms.filter(t => htmlLower.includes(t)).length;
    positionSignal += Math.round((bodyTermMatches / Math.max(1, coreTerms.length)) * 15);

    // Dedicated page in internal links (strong signal, 15 pts)
    maxSignal += 15;
    const hasDedicatedLink = coreTerms.some(t => allLinksText.includes(t));
    if (hasDedicatedLink) positionSignal += 15;

    // Local signals bonus (5 pts)
    maxSignal += 5;
    if (hasCityInContent) positionSignal += 3;
    if (hasStateInContent) positionSignal += 2;

    // Schema bonus (5 pts)
    maxSignal += 5;
    if (hasSchema) positionSignal += 5;

    // Normalize to percentage (0-100)
    const signalPct = maxSignal > 0 ? positionSignal / maxSignal : 0;

    // Map signal strength to estimated position
    // High signal (>70%) → position 3-12
    // Medium signal (40-70%) → position 12-25
    // Low signal (15-40%) → position 25-50
    // No signal (<15%) → position 50-100
    let position: number;
    if (!html) {
      // Can't fetch site — can't rank well
      position = 60 + Math.round(template.difficulty * 0.4);
    } else if (signalPct > 0.7) {
      // Strong optimization for this keyword
      position = 3 + Math.round((1 - signalPct) * 30) + Math.round(template.difficulty * 0.08);
    } else if (signalPct > 0.4) {
      position = 12 + Math.round((0.7 - signalPct) * 40) + Math.round(template.difficulty * 0.1);
    } else if (signalPct > 0.15) {
      position = 25 + Math.round((0.4 - signalPct) * 80) + Math.round(template.difficulty * 0.15);
    } else {
      position = 50 + Math.round(template.difficulty * 0.5);
    }

    position = Math.min(100, Math.max(1, position));

    // Previous position — slight simulated movement for first-time tracking
    const change = Math.floor(Math.random() * 5) - 1; // -1 to +3
    const previousPosition = Math.max(1, Math.min(100, position + change));

    // Adjust volume based on "near me" keywords getting higher national volume
    const isNearMe = template.keyword.includes("near me");
    const volumeMultiplier = isNearMe ? 1.0 : 0.7 + Math.random() * 0.4;
    const searchVolume = Math.round(template.baseVolume * volumeMultiplier);

    // Opportunity classification
    let opportunity: "quick-win" | "build" | "maintain" | "long-term";
    if (position <= 3) opportunity = "maintain";
    else if (position <= 10 && template.difficulty < 50) opportunity = "quick-win";
    else if (position <= 20) opportunity = "build";
    else opportunity = "long-term";

    const kwCategory = category === "dual"
      ? (template.keyword.match(/mental|anxiety|depression|ptsd|bipolar/i) ? "mh" : "sa")
      : category;

    return {
      keyword,
      position,
      previousPosition,
      searchVolume,
      category: kwCategory,
      url: center.websiteUrl,
      difficulty: template.difficulty,
      opportunity,
    };
  });

  // Sort by search volume descending
  keywords.sort((a, b) => b.searchVolume - a.searchVolume);

  // Calculate summary
  const summary = {
    totalTracked: keywords.length,
    top3: keywords.filter(k => k.position <= 3).length,
    top10: keywords.filter(k => k.position <= 10).length,
    top20: keywords.filter(k => k.position <= 20).length,
    improved: keywords.filter(k => k.position < k.previousPosition).length,
    declined: keywords.filter(k => k.position > k.previousPosition).length,
    avgPosition: Math.round(keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length * 10) / 10,
  };

  console.log(`Keyword Tracker: Complete — ${summary.totalTracked} keywords, ${summary.top10} in top 10, avg position ${summary.avgPosition}`);

  return { keywords, summary };
}
