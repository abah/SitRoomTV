import type { PopularArticle } from "./parse-popular";
import type { NewsItem } from "./types";

const STOPWORDS = new Set([
  "di",
  "ke",
  "dari",
  "yang",
  "dan",
  "atau",
  "untuk",
  "dengan",
  "pada",
  "dalam",
  "ini",
  "itu",
  "akan",
  "ada",
  "juga",
  "sudah",
  "oleh",
  "karena",
  "saat",
  "tak",
  "tidak",
  "the",
  "and",
  "for",
]);

/** Points for popular rank #1..N (Borda-style). #1 gets most points. */
const MAX_LIST_SIZE = 15;

function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9à-ÿ\s]/gi, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** #1 = 15, #2 = 14, ... #15 = 1 */
export function rankPoints(popularRank: number): number {
  if (popularRank < 1) return 0;
  return Math.max(0, MAX_LIST_SIZE - popularRank + 1);
}

function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

interface Cluster {
  articles: PopularArticle[];
  tokens: Set<string>;
}

/**
 * Overall national ranking:
 * 1. Group similar titles across outlets
 * 2. Sum Borda points from each outlet's popular position
 * 3. Higher total = more popular overall
 *
 * Example: #1 Detik (15) + #3 CNN (13) + #2 Kompas (14) = 42 points
 */
export function rankPopularArticles(articles: PopularArticle[]): NewsItem[] {
  const clusters: Cluster[] = [];

  for (const article of articles) {
    const tokens = tokenize(article.title);
    let bestIndex = -1;
    let bestScore = 0;

    for (let i = 0; i < clusters.length; i += 1) {
      const cluster = clusters[i];
      if (cluster.articles.some((item) => item.sourceId === article.sourceId)) continue;
      const score = jaccard(tokens, cluster.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0 && bestScore >= 0.4) {
      const cluster = clusters[bestIndex];
      cluster.articles.push(article);
      for (const token of tokens) cluster.tokens.add(token);
    } else {
      clusters.push({ articles: [article], tokens });
    }
  }

  const ranked: NewsItem[] = clusters.map((cluster) => {
    const sorted = [...cluster.articles].sort((a, b) => a.popularRank - b.popularRank);
    const primary = sorted[0];
    const uniqueSources = [...new Set(sorted.map((item) => item.sourceName))];
    const totalPoints = sorted.reduce((sum, item) => sum + rankPoints(item.popularRank), 0);
    // Normalize to 0-100 for display: max theoretical = MAX_LIST_SIZE * numSources in cluster
    // Use absolute points as score so multi-outlet stories naturally rank higher
    const score = totalPoints;

    return {
      id: hashId(`${primary.sourceId}:${primary.link}`),
      title: primary.title,
      link: primary.link,
      summary: primary.summary,
      imageUrl: sorted.find((item) => item.imageUrl)?.imageUrl ?? null,
      publishedAt: primary.publishedAt,
      sourceId: primary.sourceId,
      sourceName: primary.sourceName,
      sourceColor: primary.sourceColor,
      popularRank: primary.popularRank,
      score,
      clusterSize: uniqueSources.length,
      relatedSources: uniqueSources,
    };
  });

  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.clusterSize !== a.clusterSize) return b.clusterSize - a.clusterSize;
    return a.popularRank - b.popularRank;
  });
}

export function toSourceItems(articles: PopularArticle[]): NewsItem[] {
  return articles.map((article) => ({
    id: hashId(`${article.sourceId}:${article.link}`),
    title: article.title,
    link: article.link,
    summary: article.summary,
    imageUrl: article.imageUrl,
    publishedAt: article.publishedAt,
    sourceId: article.sourceId,
    sourceName: article.sourceName,
    sourceColor: article.sourceColor,
    popularRank: article.popularRank,
    score: rankPoints(article.popularRank),
    clusterSize: 1,
    relatedSources: [article.sourceName],
  }));
}
