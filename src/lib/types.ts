export type NewsSourceId =
  | "detik"
  | "cnn"
  | "cnbc"
  | "antara"
  | "kompas"
  | "liputan6"
  | "republika";

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string | null;
  sourceId: NewsSourceId;
  sourceName: string;
  sourceColor: string;
  /** Rank on that outlet's popular list (1 = most popular) */
  popularRank: number;
  score: number;
  clusterSize: number;
  relatedSources: string[];
}

export interface NewsFeedResponse {
  updatedAt: string;
  mode: "terpopuler";
  trending: NewsItem[];
  bySource: Record<string, NewsItem[]>;
  sources: Array<{
    id: NewsSourceId;
    name: string;
    shortName: string;
    color: string;
    siteUrl: string;
    ok: boolean;
    count: number;
  }>;
  errors: Array<{ sourceId: string; message: string }>;
}
