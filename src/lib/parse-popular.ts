import type { BrowserWorker } from "@cloudflare/puppeteer";
import { XMLParser } from "fast-xml-parser";
import { fetchGoogleNewsXml } from "./fetch-google-rss";
import type { PopularSource } from "./sources";

export interface PopularArticle {
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string | null;
  popularRank: number;
  sourceId: PopularSource["id"];
  sourceName: string;
  sourceColor: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const rssParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Google News titles often end with " - Publisher"; strip for clustering. */
function cleanGoogleTitle(raw: string, publisher?: string): string {
  let title = stripHtml(raw);
  if (publisher) {
    const suffix = ` - ${publisher}`;
    if (title.endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
  }
  title = title.replace(/\s+-\s+[A-Za-z0-9.&' ]{2,40}$/u, "").trim();
  return title;
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseRssText(node: unknown): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object") {
    const record = node as Record<string, unknown>;
    if (typeof record["#text"] === "string") return record["#text"];
    if (typeof record["@_url"] === "string") return record["@_url"];
  }
  return "";
}

function absolutize(href: string, siteUrl: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return new URL(href, siteUrl).toString();
}

function pushUnique(
  list: PopularArticle[],
  seen: Set<string>,
  article: Omit<PopularArticle, "popularRank">,
  limit: number,
) {
  if (list.length >= limit) return;
  if (seen.has(article.link) || seen.has(article.title.toLowerCase())) return;
  if (article.title.length < 18) return;
  seen.add(article.link);
  seen.add(article.title.toLowerCase());
  list.push({ ...article, popularRank: list.length + 1 });
}

function parseDetik(html: string, source: PopularSource, limit: number): PopularArticle[] {
  const list: PopularArticle[] = [];
  const seen = new Set<string>();
  const re =
    /<a[^>]+href="(https:\/\/[^"]+\/d-\d+\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    const link = match[1];
    const title = stripHtml(match[2]);
    pushUnique(
      list,
      seen,
      {
        title,
        link,
        summary: "",
        imageUrl: null,
        publishedAt: null,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }
  return list;
}

function parseAntara(html: string, source: PopularSource, limit: number): PopularArticle[] {
  const list: PopularArticle[] = [];
  const seen = new Set<string>();
  const re =
    /<a[^>]+href="(https:\/\/www\.antaranews\.com\/berita\/\d+\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    pushUnique(
      list,
      seen,
      {
        title: stripHtml(match[2]),
        link: match[1],
        summary: "",
        imageUrl: null,
        publishedAt: null,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }
  return list;
}

function parseKompas(html: string, source: PopularSource, limit: number): PopularArticle[] {
  const list: PopularArticle[] = [];
  const seen = new Set<string>();
  const re =
    /href="(https:\/\/[^"]+\.kompas\.com\/read\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    let title = stripHtml(match[2]);
    title = title
      .replace(/\b(News|Bola|Tren|Money|Tekno|Lifestyle|Health|Travel)\b.*$/i, "")
      .replace(/\d{1,2}\s+November\s+\d{4}.*$/i, "")
      .trim();
    pushUnique(
      list,
      seen,
      {
        title,
        link: match[1].split("?")[0],
        summary: "",
        imageUrl: null,
        publishedAt: null,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }
  return list;
}

function parseLiputan6(html: string, source: PopularSource, limit: number): PopularArticle[] {
  const list: PopularArticle[] = [];
  const seen = new Set<string>();
  const re =
    /href="(https:\/\/www\.liputan6\.com\/[^"]+\/read\/\d+\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    if (match[1].includes("/cek-fakta/")) continue;
    pushUnique(
      list,
      seen,
      {
        title: stripHtml(match[2]),
        link: match[1].split("?")[0],
        summary: "",
        imageUrl: null,
        publishedAt: null,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }
  return list;
}

function parseRepublika(html: string, source: PopularSource, limit: number): PopularArticle[] {
  const list: PopularArticle[] = [];
  const seen = new Set<string>();
  const re =
    /href="(https:\/\/[^"]*republika\.co\.id\/berita\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    let title = stripHtml(match[2]);
    title = title.replace(/^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu).+?WIB\s*/i, "").trim();
    pushUnique(
      list,
      seen,
      {
        title,
        link: match[1].split("?")[0],
        summary: "",
        imageUrl: null,
        publishedAt: null,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }
  return list;
}

function parseHtmlPopular(html: string, source: PopularSource, limit: number): PopularArticle[] {
  switch (source.id) {
    case "detik":
      return parseDetik(html, source, limit);
    case "antara":
      return parseAntara(html, source, limit);
    case "kompas":
      return parseKompas(html, source, limit);
    case "liputan6":
      return parseLiputan6(html, source, limit);
    case "republika":
      return parseRepublika(html, source, limit);
    default:
      return [];
  }
}

function parseGoogleRss(
  xml: string,
  source: PopularSource,
  limit: number,
): PopularArticle[] {
  const parsed = rssParser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
  };
  const items = asArray(parsed.rss?.channel?.item);
  if (items.length === 0) throw new Error("Feed Google News kosong");

  const list: PopularArticle[] = [];
  const seen = new Set<string>();

  for (const raw of items) {
    const item = raw as Record<string, unknown>;
    const publisher = stripHtml(parseRssText(item.source));
    const title = cleanGoogleTitle(parseRssText(item.title), publisher || undefined);
    const link = parseRssText(item.link).trim();
    if (!title || !link) continue;

    const description = stripHtml(parseRssText(item.description)).slice(0, 220);
    const pubDate = parseRssText(item.pubDate);
    let publishedAt: string | null = null;
    if (pubDate) {
      const ms = Date.parse(pubDate);
      if (!Number.isNaN(ms)) publishedAt = new Date(ms).toISOString();
    }

    const summaryParts = [
      publisher ? `Sumber: ${publisher}` : "",
      description,
    ].filter(Boolean);

    pushUnique(
      list,
      seen,
      {
        title,
        link,
        summary: summaryParts.join(" — ").slice(0, 220),
        imageUrl: null,
        publishedAt,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }

  return list;
}

function parseMostpopJson(
  payload: unknown,
  source: PopularSource,
  limit: number,
): PopularArticle[] {
  const root = payload as {
    status?: string;
    data?: Array<Record<string, unknown>>;
  };
  if (root.status !== "success" || !Array.isArray(root.data)) {
    throw new Error("Respons mostpop tidak valid");
  }

  const list: PopularArticle[] = [];
  const seen = new Set<string>();

  for (const item of root.data) {
    const title = stripHtml(String(item.strjudul ?? item.title ?? ""));
    const rawUrl = String(item.articleUrl ?? item.strurl ?? item.url ?? "");
    if (!title || !rawUrl) continue;
    const link = absolutize(rawUrl, source.siteUrl);
    const image =
      (typeof item.image === "string" && item.image) ||
      (typeof item.strimage === "string" && item.strimage) ||
      null;
    pushUnique(
      list,
      seen,
      {
        title,
        link,
        summary: stripHtml(String(item.strdeskripsi ?? item.description ?? "")).slice(0, 220),
        imageUrl: image,
        publishedAt: null,
        sourceId: source.id,
        sourceName: source.name,
        sourceColor: source.color,
      },
      limit,
    );
  }
  return list;
}

export interface FetchPopularOptions {
  browser?: BrowserWorker;
}

export async function fetchPopularSource(
  source: PopularSource,
  limit = 15,
  options: FetchPopularOptions = {},
): Promise<PopularArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    if (source.kind === "mostpop-json") {
      const endpoint = `${source.url}/${source.kanal ?? "all"}?limit=${limit}`;
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return parseMostpopJson(json, source, limit);
    }

    if (source.kind === "rss") {
      if (source.id === "google") {
        const xml = await fetchGoogleNewsXml(source.url, options.browser);
        const articles = parseGoogleRss(xml, source, limit);
        if (articles.length === 0) throw new Error("Tidak menemukan artikel Google News");
        return articles;
      }
      throw new Error(`Parser RSS belum tersedia untuk ${source.id}`);
    }

    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": USER_AGENT,
        "Accept-Language": "id-ID,id;q=0.9",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const articles = parseHtmlPopular(html, source, limit);
    if (articles.length === 0) throw new Error("Tidak menemukan daftar terpopuler");
    return articles;
  } finally {
    clearTimeout(timer);
  }
}
