import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_SECONDS = 600;

interface WhatsOnItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  excerpt?: string;
  imageUrl?: string;
  source: string;
}

let cache: { items: WhatsOnItem[]; fetchedAt: string } | null = null;
let cacheTime = 0;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function makeAbsolute(url: string, base: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return base + url;
  return url;
}

function getTagContent(item: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${tag}>`, "i");
  const match = item.match(regex);
  return match?.[1]?.trim() || undefined;
}

// ── Source 1: ellaslist.com.au ──
async function fetchEllaslist(): Promise<WhatsOnItem[]> {
  try {
    const BASE = "https://www.ellaslist.com.au";
    const res = await fetch(BASE + "/sydney/events/this-week", {
      headers: { "User-Agent": "SYDMAP/1.0", "Accept": "text/html" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const items: WhatsOnItem[] = [];
    const seen = new Set<string>();

    const skipSlugs = new Set(["this-week", "today", "this-weekend", "tomorrow", "freebies",
      "rainy-day", "book-ahead", "editors-picks", "featured", "kids-shows",
      "baby-and-toddler", "school-holidays", "indoors", "sensory-friendly"]);

    // Collect featured images keyed by slug
    const imageMap = new Map<string, string>();
    const imgPattern = /href=["']\/sydney\/events\/([a-z0-9-]+)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']*\/system\/events\/featured_images\/[^"']+)["']/gi;
    let m;
    while ((m = imgPattern.exec(html)) !== null) {
      if (!skipSlugs.has(m[1])) imageMap.set(m[1], makeAbsolute(m[2], BASE));
    }

    // Collect h2 titles keyed by slug
    const h2Pattern = /<h2[^>]*>\s*<a[^>]*href=["']\/sydney\/events\/([a-z0-9-]+)["'][^>]*>\s*([\s\S]*?)\s*<\/a>\s*<\/h2>/gi;
    while ((m = h2Pattern.exec(html)) !== null && items.length < 15) {
      const slug = m[1];
      const title = stripHtml(m[2]);
      if (skipSlugs.has(slug) || seen.has(slug) || title.length < 5) continue;
      seen.add(slug);
      items.push({
        id: simpleHash(BASE + "/sydney/events/" + slug),
        title,
        url: BASE + "/sydney/events/" + slug,
        category: "Kids & Family",
        imageUrl: imageMap.get(slug),
        source: "ellaslist",
      });
    }

    console.log(`ellaslist: found ${items.length} items`);
    return items;
  } catch (e) {
    console.error("ellaslist error:", e);
    return [];
  }
}

// ── Source 2: whatsonsydney.com kids-world RSS ──
async function fetchWhatsOnSydneyKids(): Promise<WhatsOnItem[]> {
  try {
    const res = await fetch("https://www.whatsonsydney.com/rssloader?catid=14", {
      headers: { "User-Agent": "SYDMAP/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: WhatsOnItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const block = match[1];
      const title = getTagContent(block, "title");
      const link = getTagContent(block, "link");
      if (!title || !link) continue;

      const description = getTagContent(block, "description") || "";
      let imageUrl: string | undefined;
      const encMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      if (encMatch) imageUrl = encMatch[1];
      if (!imageUrl) {
        const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["']/i);
        if (mediaMatch) imageUrl = mediaMatch[1];
      }
      if (!imageUrl) {
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      items.push({
        id: simpleHash(link),
        title: stripHtml(title),
        url: link.trim(),
        category: "Kids Events",
        excerpt: description ? stripHtml(description).slice(0, 200) : undefined,
        imageUrl,
        source: "whatsonsydney",
      });
    }

    console.log(`whatsonsydney: found ${items.length} items`);
    return items;
  } catch (e) {
    console.error("whatsonsydney error:", e);
    return [];
  }
}

// ── Source 3: GetYourGuide ──
async function fetchGetYourGuide(): Promise<WhatsOnItem[]> {
  try {
    const res = await fetch(
      "https://www.getyourguide.com/s/?q=Family-friendly+activities%2C+Sydney&searchSource=3&src=search_bar",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept": "text/html",
          "Accept-Language": "en-AU,en;q=0.9",
        },
      }
    );
    if (!res.ok) return [];
    const html = await res.text();
    const items: WhatsOnItem[] = [];
    const seen = new Set<string>();
    const BASE = "https://www.getyourguide.com";

    const actPattern = /href=["'](\/[^"']*-t(\d+)\/?)[^"']*["']/gi;
    let am;
    while ((am = actPattern.exec(html)) !== null && items.length < 15) {
      const path = am[1].split("?")[0];
      const url = BASE + path;
      if (seen.has(url)) continue;
      seen.add(url);

      const slugMatch = path.match(/\/([^/]+)-t\d+/);
      if (!slugMatch) continue;
      const title = slugMatch[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      if (title.length < 8) continue;

      items.push({
        id: simpleHash(url),
        title,
        url,
        category: "Tours & Activities",
        source: "getyourguide",
      });
    }

    console.log(`getyourguide: found ${items.length} items`);
    return items;
  } catch (e) {
    console.error("getyourguide error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_SECONDS * 1000) {
      return new Response(JSON.stringify(cache), {
        headers: { ...corsHeaders, "Content-Type": "application/json",
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}` },
      });
    }

    const [ellaslist, whatsOnKids, gyg] = await Promise.all([
      fetchEllaslist(),
      fetchWhatsOnSydneyKids(),
      fetchGetYourGuide(),
    ]);

    // Interleave sources for variety
    const allItems: WhatsOnItem[] = [];
    const maxLen = Math.max(ellaslist.length, whatsOnKids.length, gyg.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < ellaslist.length) allItems.push(ellaslist[i]);
      if (i < whatsOnKids.length) allItems.push(whatsOnKids[i]);
      if (i < gyg.length) allItems.push(gyg[i]);
    }

    const result = { items: allItems, fetchedAt: new Date().toISOString() };
    cache = result;
    cacheTime = now;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json",
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}` },
    });
  } catch (error) {
    console.error("whats-on-today error:", error);
    if (cache) {
      return new Response(JSON.stringify(cache), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: error.message, items: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
