import type { BrowserWorker } from "@cloudflare/puppeteer";
import puppeteer from "@cloudflare/puppeteer";

const CACHE_URL = "https://sorot.internal/cache/google-news-rss";
const CACHE_TTL_SECONDS = 600;

async function readCache(): Promise<string | null> {
  try {
    const cached = await caches.default.match(CACHE_URL);
    if (!cached) return null;
    const text = await cached.text();
    return text.includes("<item>") ? text : null;
  } catch {
    return null;
  }
}

async function writeCache(xml: string): Promise<void> {
  try {
    await caches.default.put(
      CACHE_URL,
      new Response(xml, {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      }),
    );
  } catch {
    // Cache is best-effort.
  }
}

async function fetchViaBrowser(browser: BrowserWorker, url: string): Promise<string> {
  const instance = await puppeteer.launch(browser);
  try {
    const page = await instance.newPage();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 25_000,
    });
    if (!response) throw new Error("Browser tidak mendapat respons Google News");

    let xml = await response.text();
    if (!xml.includes("<item>")) {
      const html = await page.content();
      const match = html.match(/<rss\b[\s\S]*?<\/rss>/i);
      if (!match) throw new Error("RSS Google News tidak ditemukan via browser");
      xml = match[0];
    }
    if (!xml.includes("<item>")) throw new Error("Feed Google News kosong via browser");
    return xml;
  } finally {
    await instance.close();
  }
}

/**
 * Google blocks most Cloudflare edge IPs for news.google.com RSS.
 * Direct fetch first; on failure use Browser Rendering + Cache API.
 */
export async function fetchGoogleNewsXml(
  url: string,
  browser?: BrowserWorker,
): Promise<string> {
  const cached = await readCache();
  if (cached) return cached;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9",
      },
    });
    if (response.ok) {
      const xml = await response.text();
      if (xml.includes("<item>")) {
        await writeCache(xml);
        return xml;
      }
    }
  } catch {
    // Fall through to browser rendering.
  }

  if (!browser) {
    throw new Error("Google News memblokir edge Worker (perlu Browser Rendering)");
  }

  const xml = await fetchViaBrowser(browser, url);
  await writeCache(xml);
  return xml;
}
