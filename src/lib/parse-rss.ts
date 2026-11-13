import { XMLParser } from "fast-xml-parser";
import type { NewsSource } from "./types";

export interface ParsedArticle {
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string | null;
  feedRank: number;
  sourceId: NewsSource["id"];
  sourceName: string;
  sourceColor: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  cdataPropName: "__cdata",
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("__cdata" in record) return textOf(record.__cdata);
    if ("#text" in record) return textOf(record["#text"]);
  }
  return "";
}

function stripHtml(html: string): string {
  return html
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

function extractImage(item: Record<string, unknown>, descriptionHtml: string): string | null {
  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  if (enclosure?.["@_url"] && String(enclosure["@_type"] ?? "").startsWith("image")) {
    return String(enclosure["@_url"]);
  }
  if (enclosure?.["@_url"] && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(String(enclosure["@_url"]))) {
    return String(enclosure["@_url"]);
  }

  const mediaContent = asArray(item["media:content"] as Record<string, unknown> | Record<string, unknown>[]);
  for (const media of mediaContent) {
    const url = media?.["@_url"];
    if (url) return String(url);
  }

  const mediaThumb = asArray(item["media:thumbnail"] as Record<string, unknown> | Record<string, unknown>[]);
  for (const media of mediaThumb) {
    const url = media?.["@_url"];
    if (url) return String(url);
  }

  const imgMatch = descriptionHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch?.[1] ?? null;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function parseRssXml(xml: string, source: NewsSource, limit = 20): ParsedArticle[] {
  const parsed = parser.parse(xml);
  const channel = parsed?.rss?.channel ?? parsed?.feed;
  if (!channel) return [];

  const rawItems = asArray(
    (channel.item ?? channel.entry) as Record<string, unknown> | Record<string, unknown>[],
  );

  const articles: ParsedArticle[] = [];

  for (const [index, item] of rawItems.entries()) {
    if (index >= limit) break;
    const title = textOf(item.title);
    const link =
      textOf(item.link) ||
      textOf((item.link as Record<string, unknown> | undefined)?.["@_href"]) ||
      textOf(item.guid);

    if (!title || !link) continue;

    const descriptionHtml =
      textOf(item.description) ||
      textOf(item.summary) ||
      textOf(item["content:encoded"]) ||
      textOf(item.content);

    articles.push({
      title,
      link: link.startsWith("http") ? link : new URL(link, source.siteUrl).toString(),
      summary: stripHtml(descriptionHtml).slice(0, 220),
      imageUrl: extractImage(item, descriptionHtml),
      publishedAt: parseDate(
        textOf(item.pubDate) || textOf(item.published) || textOf(item.updated),
      ),
      feedRank: index + 1,
      sourceId: source.id,
      sourceName: source.name,
      sourceColor: source.color,
    });
  }

  return articles;
}
