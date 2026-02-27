import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsOnItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  excerpt?: string;
  imageUrl?: string;
  source: string;
}

interface ScrapedData {
  description: string;
  imageUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  hours_open?: string;
  hours_close?: string;
  phone?: string;
  website?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract a clean description from markdown, skipping nav/boilerplate */
function extractDescription(markdown: string): string {
  const lines = markdown.split("\n");
  const meaningful: string[] = [];
  const skipPatterns = [
    /^#{1,3}\s/, // headings
    /^!\[/, // images
    /^\[.*\]\(/, // standalone links
    /^(\*{3}|---)/,  // horizontal rules
    /^(menu|sign up|log in|subscribe|follow|share|facebook|twitter|instagram|pinterest)/i,
    /^(home|about|contact|privacy|terms|copyright|©)/i,
    /^\s*$/,
    /cookie|newsletter|subscribe|sign.?up.*free/i,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 15) continue;
    if (skipPatterns.some(p => p.test(trimmed))) continue;
    // Skip lines that are mostly links
    const linkCount = (trimmed.match(/\[.*?\]\(.*?\)/g) || []).length;
    if (linkCount > 2) continue;
    // Clean markdown formatting
    const clean = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1") // italic
      .replace(/^>\s*/, "") // blockquotes
      .trim();
    if (clean.length > 15) meaningful.push(clean);
    if (meaningful.length >= 8) break;
  }

  return meaningful.join("\n").slice(0, 800).trim();
}

/** Extract address from markdown using multiple patterns */
function extractAddress(markdown: string): string | undefined {
  const patterns = [
    // "Address: ..." or "Location: ..." or "Venue: ..."
    /(?:address|location|venue|where|place)[:\s]+([^\n]{10,120})/i,
    // Street number + street name patterns (Australian format)
    /(\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St(?:reet)?|Rd|Road|Ave(?:nue)?|Dr(?:ive)?|Blvd|Ln|Lane|Pde|Parade|Hwy|Highway|Way|Pl|Place|Cres(?:cent)?|Tce|Terrace|Ct|Court)[,.\s]+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:[,.\s]+(?:NSW|VIC|QLD|SA|WA|TAS|ACT|NT))?(?:\s+\d{4})?)/,
    // Suburb, NSW pattern
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*[,.\s]+(?:NSW|New South Wales)(?:\s+\d{4})?)/,
    // Google Maps or map link with address text
    /(?:maps|directions)[^)]*\).*?([^\n]{10,100}(?:Sydney|NSW))/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      const addr = stripHtml(match[1]).slice(0, 200);
      // Validate it looks like an address (has a suburb or state)
      if (addr.length > 8) return addr;
    }
  }
  return undefined;
}

/** Extract opening hours from markdown */
function extractHours(markdown: string): { open?: string; close?: string } {
  const patterns = [
    // "Open: 9am - 5pm" or "Hours: 9:00am–5:00pm"
    /(?:open|hours|time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    // "9am - 5pm" standalone
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) return { open: match[1].trim(), close: match[2].trim() };
  }
  return {};
}

/** Extract phone number */
function extractPhone(markdown: string): string | undefined {
  const match = markdown.match(
    /(?:phone|tel|call|contact)[:\s]*(\(?0[2-9]\)?\s*\d{4}\s*\d{4}|\d{4}\s*\d{3}\s*\d{3}|\+61\s*\d[\s\d]{8,12})/i
  );
  if (match) return match[1].trim();

  // Standalone Australian phone pattern
  const phoneMatch = markdown.match(/(\(?0[2-9]\)?\s*\d{4}\s*\d{4})/);
  if (phoneMatch) return phoneMatch[1].trim();

  return undefined;
}

/** Extract best image URL from markdown */
function extractImage(markdown: string, source: string): string | undefined {
  const imgMatches = markdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g);
  const candidates: { url: string; score: number }[] = [];

  for (const m of imgMatches) {
    const alt = m[1].toLowerCase();
    const url = m[2];
    // Skip tiny icons, logos, tracking pixels
    if (/logo|icon|avatar|pixel|badge|button|spinner/i.test(url)) continue;
    if (/\.svg$|1x1|spacer/i.test(url)) continue;

    let score = 0;
    if (/hero|banner|featured|main|primary|cover/i.test(alt)) score += 3;
    if (/event|activity|venue|photo/i.test(alt)) score += 2;
    if (/jpg|jpeg|png|webp/i.test(url)) score += 1;
    // Prefer larger images (heuristic from URL params)
    if (/w=\d{3,4}|width=\d{3,4}|\/\d{3,4}x/i.test(url)) score += 1;
    candidates.push({ url, score });
  }

  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].url;
}

/** Use Firecrawl to scrape an event page and extract structured data */
async function scrapeEventPage(
  url: string,
  firecrawlKey: string,
  source: string
): Promise<ScrapedData | null> {
  try {
    console.log("Scraping:", url);
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!res.ok) {
      console.error(`Firecrawl error for ${url}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const markdown: string = data?.data?.markdown || data?.markdown || "";

    if (!markdown || markdown.length < 50) {
      console.log(`Insufficient content scraped from ${url}`);
      return null;
    }

    const description = extractDescription(markdown);
    const imageUrl = extractImage(markdown, source);
    const address = extractAddress(markdown);
    const hours = extractHours(markdown);
    const phone = extractPhone(markdown);

    // Try to extract a website link (not the source URL itself)
    let website: string | undefined;
    const webMatch = markdown.match(
      /(?:website|official site|book now|tickets)[:\s]*\[?[^\]]*\]?\(?(https?:\/\/[^\s)]+)/i
    );
    if (webMatch && webMatch[1] !== url) website = webMatch[1];

    console.log(`Extracted from ${url}: desc=${description.length}ch, addr=${address || "none"}, img=${imageUrl ? "yes" : "no"}, hours=${hours.open || "none"}`);

    return {
      description,
      imageUrl,
      address,
      hours_open: hours.open,
      hours_close: hours.close,
      phone,
      website,
    };
  } catch (e) {
    console.error(`Scrape failed for ${url}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { items } = (await req.json()) as { items: WhatsOnItem[] };
    if (!items?.length) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which URLs are already imported
    const urls = items.map((i) => i.url);
    const { data: existing } = await supabase
      .from("activities")
      .select("id, source_url")
      .in("source_url", urls);

    const existingUrls = new Set((existing || []).map((e: any) => e.source_url));
    const toImport = items.filter((i) => !existingUrls.has(i.url));

    console.log(`${toImport.length} new events to import (${existingUrls.size} already exist)`);

    const imported: { url: string; activityId: string }[] = [];
    const errors: { url: string; error: string }[] = [];

    // Import up to 10 at a time to stay within function timeout
    const batch = toImport.slice(0, 10);

    for (const item of batch) {
      try {
        const scraped = await scrapeEventPage(item.url, firecrawlKey, item.source);

        const categoryMap: Record<string, string> = {
          "Kids & Family": "Playground",
          "Kids Events": "Playground",
          "Tours & Activities": "tourist attraction",
        };
        const category = categoryMap[item.category || ""] || "tourist attraction";

        // Default Sydney CBD coords
        const latitude = -33.8688;
        const longitude = 151.2093;

        const { data: inserted, error } = await supabase
          .from("activities")
          .insert({
            name: item.title,
            category,
            latitude,
            longitude,
            address: scraped?.address || "Sydney, NSW",
            description: scraped?.description || item.excerpt || item.title,
            hero_image_url:
              scraped?.imageUrl ||
              item.imageUrl ||
              "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop",
            website: scraped?.website || item.url,
            source_url: item.url,
            phone: scraped?.phone || null,
            hours_open: scraped?.hours_open || null,
            hours_close: scraped?.hours_close || null,
            is_open: true,
            rating: 0,
            review_count: 0,
          })
          .select("id")
          .single();

        if (error) {
          console.error(`Insert error for ${item.title}:`, error.message);
          errors.push({ url: item.url, error: error.message });
        } else {
          imported.push({ url: item.url, activityId: inserted.id });
          console.log(`Imported: ${item.title} → ${inserted.id}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        errors.push({ url: item.url, error: msg });
      }
    }

    const allMappings: Record<string, string> = {};
    for (const e of existing || []) allMappings[e.source_url] = e.id;
    for (const i of imported) allMappings[i.url] = i.activityId;

    return new Response(
      JSON.stringify({
        imported: imported.length,
        skipped: existingUrls.size,
        errors: errors.length,
        mappings: allMappings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("import-whats-on error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
