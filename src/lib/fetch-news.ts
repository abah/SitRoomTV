import { NEWS_SOURCES } from "./sources";
import { parseRssXml, type ParsedArticle } from "./parse-rss";
import { rankArticles } from "./rank";
import type { NewsFeedResponse, NewsItem } from "./types";

const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; SorotBerita/1.0; +https://cursor.com) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function fetchSource(source: (typeof NEWS_SOURCES)[number]): Promise<{
  articles: ParsedArticle[];
  error?: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, */*",
        "User-Agent": USER_AGENT,
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { articles: [], error: `HTTP ${response.status}` };
    }

    const xml = await response.text();
    if (!xml.includes("<rss") && !xml.includes("<feed")) {
      return { articles: [], error: "Bukan feed RSS yang valid" };
    }

    return { articles: parseRssXml(xml, source, 18) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil feed";
    return { articles: [], error: message };
  } finally {
    clearTimeout(timer);
  }
}

export async function getNewsFeed(): Promise<NewsFeedResponse> {
  const results = await Promise.all(NEWS_SOURCES.map((source) => fetchSource(source)));

  const allArticles: ParsedArticle[] = [];
  const bySource: Record<string, NewsItem[]> = {};
  const errors: Array<{ sourceId: string; message: string }> = [];
  const sources = NEWS_SOURCES.map((source, index) => {
    const result = results[index];
    if (result.error) {
      errors.push({ sourceId: source.id, message: result.error });
    }
    allArticles.push(...result.articles);

    const items: NewsItem[] = result.articles.map((article) => ({
      id: `${article.sourceId}-${article.feedRank}-${article.link.slice(-24)}`,
      title: article.title,
      link: article.link,
      summary: article.summary,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      sourceId: article.sourceId,
      sourceName: article.sourceName,
      sourceColor: article.sourceColor,
      feedRank: article.feedRank,
      score: Math.round(
        100 - article.feedRank * 3 + (article.publishedAt ? 10 : 0),
      ),
      clusterSize: 1,
      relatedSources: [article.sourceName],
    }));

    bySource[source.id] = items;

    return {
      id: source.id,
      name: source.name,
      shortName: source.shortName,
      color: source.color,
      siteUrl: source.siteUrl,
      ok: !result.error && items.length > 0,
      count: items.length,
    };
  });

  const trending = rankArticles(allArticles).slice(0, 30);

  return {
    updatedAt: new Date().toISOString(),
    trending,
    bySource,
    sources,
    errors,
  };
}
