import type { ParsedArticle } from "./parse-rss";
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
  "belum",
  "oleh",
  "karena",
  "saat",
  "setelah",
  "sebelum",
  "bisa",
  "tak",
  "tidak",
  "lebih",
  "banyak",
  "jadi",
  "hingga",
  "the",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "for",
  "is",
  "are",
  "as",
  "at",
]);

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
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function recencyScore(publishedAt: string | null): number {
  if (!publishedAt) return 35;
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (ageHours <= 1) return 100;
  if (ageHours <= 3) return 85;
  if (ageHours <= 6) return 70;
  if (ageHours <= 12) return 55;
  if (ageHours <= 24) return 40;
  if (ageHours <= 48) return 25;
  return 10;
}

function positionScore(feedRank: number): number {
  if (feedRank <= 1) return 100;
  if (feedRank <= 3) return 85;
  if (feedRank <= 5) return 70;
  if (feedRank <= 10) return 55;
  if (feedRank <= 15) return 40;
  return 25;
}

function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

interface Cluster {
  articles: ParsedArticle[];
  tokens: Set<string>;
}

/**
 * Rank stories by cross-outlet coverage, recency, and feed position.
 * Stories covered by multiple media rise as "sedang tren".
 */
export function rankArticles(articles: ParsedArticle[]): NewsItem[] {
  const clusters: Cluster[] = [];

  for (const article of articles) {
    const tokens = tokenize(article.title);
    let bestIndex = -1;
    let bestScore = 0;

    for (let i = 0; i < clusters.length; i += 1) {
      const cluster = clusters[i];
      const sameSource = cluster.articles.some((item) => item.sourceId === article.sourceId);
      if (sameSource) continue;
      const score = jaccard(tokens, cluster.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0 && bestScore >= 0.42) {
      const cluster = clusters[bestIndex];
      cluster.articles.push(article);
      for (const token of tokens) cluster.tokens.add(token);
    } else {
      clusters.push({ articles: [article], tokens });
    }
  }

  const ranked: NewsItem[] = clusters.map((cluster) => {
    const sorted = [...cluster.articles].sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return a.feedRank - b.feedRank;
    });
    const primary = sorted[0];
    const uniqueSources = [...new Set(sorted.map((item) => item.sourceName))];
    const avgPosition =
      sorted.reduce((sum, item) => sum + positionScore(item.feedRank), 0) / sorted.length;
    const avgRecency =
      sorted.reduce((sum, item) => sum + recencyScore(item.publishedAt), 0) / sorted.length;
    const coverageScore = Math.min(100, uniqueSources.length * 28);

    const score = Math.round(coverageScore * 0.45 + avgRecency * 0.35 + avgPosition * 0.2);

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
      feedRank: primary.feedRank,
      score,
      clusterSize: uniqueSources.length,
      relatedSources: uniqueSources,
    };
  });

  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}
