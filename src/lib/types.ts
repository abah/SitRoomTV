export type NewsSourceId =
  | "detik"
  | "cnn"
  | "antara"
  | "cnbc"
  | "tempo"
  | "tribun"
  | "okezone"
  | "republika"
  | "media-indonesia"
  | "bbc-indonesia";

export interface NewsSource {
  id: NewsSourceId;
  name: string;
  shortName: string;
  color: string;
  feedUrl: string;
  siteUrl: string;
}

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
  feedRank: number;
  score: number;
  clusterSize: number;
  relatedSources: string[];
}

export interface NewsFeedResponse {
  updatedAt: string;
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
