import { POPULAR_SOURCES } from "./sources";
import { fetchPopularSource, type PopularArticle } from "./parse-popular";
import { rankPopularArticles, toSourceItems } from "./rank";
import type { NewsFeedResponse } from "./types";

export async function getNewsFeed(): Promise<NewsFeedResponse> {
  const results = await Promise.all(
    POPULAR_SOURCES.map(async (source) => {
      try {
        const articles = await fetchPopularSource(source, 15);
        return { source, articles, error: null as string | null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal mengambil terpopuler";
        return { source, articles: [] as PopularArticle[], error: message };
      }
    }),
  );

  const allArticles: PopularArticle[] = [];
  const bySource: NewsFeedResponse["bySource"] = {};
  const errors: NewsFeedResponse["errors"] = [];

  const sources = results.map(({ source, articles, error }) => {
    if (error) errors.push({ sourceId: source.id, message: error });
    allArticles.push(...articles);
    bySource[source.id] = toSourceItems(articles);
    return {
      id: source.id,
      name: source.name,
      shortName: source.shortName,
      color: source.color,
      siteUrl: source.siteUrl,
      ok: !error && articles.length > 0,
      count: articles.length,
    };
  });

  return {
    updatedAt: new Date().toISOString(),
    mode: "terpopuler",
    trending: rankPopularArticles(allArticles).slice(0, 40),
    bySource,
    sources,
    errors,
  };
}
