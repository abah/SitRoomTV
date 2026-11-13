import type { NewsSource } from "./types";

/** Allowlisted RSS feeds only — never accept visitor-controlled URLs. */
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: "detik",
    name: "Detik",
    shortName: "Detik",
    color: "#F15A22",
    feedUrl: "https://news.detik.com/berita/rss",
    siteUrl: "https://www.detik.com",
  },
  {
    id: "cnn",
    name: "CNN Indonesia",
    shortName: "CNN",
    color: "#CC0000",
    feedUrl: "https://www.cnnindonesia.com/rss",
    siteUrl: "https://www.cnnindonesia.com",
  },
  {
    id: "antara",
    name: "ANTARA",
    shortName: "ANTARA",
    color: "#0B5CAB",
    feedUrl: "https://www.antaranews.com/rss/terkini.xml",
    siteUrl: "https://www.antaranews.com",
  },
  {
    id: "cnbc",
    name: "CNBC Indonesia",
    shortName: "CNBC",
    color: "#005BAC",
    feedUrl: "https://www.cnbcindonesia.com/news/rss",
    siteUrl: "https://www.cnbcindonesia.com",
  },
  {
    id: "tempo",
    name: "Tempo",
    shortName: "Tempo",
    color: "#C41E3A",
    feedUrl: "https://rss.tempo.co/nasional",
    siteUrl: "https://www.tempo.co",
  },
  {
    id: "tribun",
    name: "Tribunnews",
    shortName: "Tribun",
    color: "#E31C25",
    feedUrl: "https://www.tribunnews.com/rss",
    siteUrl: "https://www.tribunnews.com",
  },
  {
    id: "okezone",
    name: "Okezone",
    shortName: "Okezone",
    color: "#FF6600",
    feedUrl: "https://sindikasi.okezone.com/index.php/rss/1/RSS2.0",
    siteUrl: "https://www.okezone.com",
  },
  {
    id: "republika",
    name: "Republika",
    shortName: "Republika",
    color: "#006633",
    feedUrl: "https://www.republika.co.id/rss/",
    siteUrl: "https://www.republika.co.id",
  },
  {
    id: "media-indonesia",
    name: "Media Indonesia",
    shortName: "MI",
    color: "#1A1A1A",
    feedUrl: "https://www.mediaindonesia.com/feed",
    siteUrl: "https://mediaindonesia.com",
  },
  {
    id: "bbc-indonesia",
    name: "BBC News Indonesia",
    shortName: "BBC",
    color: "#BB1919",
    feedUrl: "https://feeds.bbci.co.uk/indonesia/rss.xml",
    siteUrl: "https://www.bbc.com/indonesia",
  },
];

export const SOURCE_BY_ID = Object.fromEntries(
  NEWS_SOURCES.map((source) => [source.id, source]),
) as Record<string, NewsSource>;
