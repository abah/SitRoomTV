import type { NewsSourceId } from "./types";

export type PopularSourceKind = "html" | "mostpop-json" | "rss";

export interface PopularSource {
  id: NewsSourceId;
  name: string;
  shortName: string;
  color: string;
  siteUrl: string;
  kind: PopularSourceKind;
  /** HTML page, mostpop API path base, or RSS feed URL */
  url: string;
  /** For mostpop-json: kanal id/path segment */
  kanal?: string;
}

/** Allowlisted popular endpoints only — never accept visitor-controlled URLs. */
export const POPULAR_SOURCES: PopularSource[] = [
  {
    id: "detik",
    name: "Detik",
    shortName: "Detik",
    color: "#F15A22",
    siteUrl: "https://www.detik.com",
    kind: "html",
    url: "https://www.detik.com/terpopuler",
  },
  {
    id: "cnn",
    name: "CNN Indonesia",
    shortName: "CNN",
    color: "#CC0000",
    siteUrl: "https://www.cnnindonesia.com",
    kind: "mostpop-json",
    url: "https://www.cnnindonesia.com/api/v2/mostpop",
    kanal: "all",
  },
  {
    id: "cnbc",
    name: "CNBC Indonesia",
    shortName: "CNBC",
    color: "#005BAC",
    siteUrl: "https://www.cnbcindonesia.com",
    kind: "mostpop-json",
    url: "https://www.cnbcindonesia.com/api/v2/mostpop",
    kanal: "2",
  },
  {
    id: "antara",
    name: "ANTARA",
    shortName: "ANTARA",
    color: "#0B5CAB",
    siteUrl: "https://www.antaranews.com",
    kind: "html",
    url: "https://www.antaranews.com/terpopuler",
  },
  {
    id: "kompas",
    name: "Kompas",
    shortName: "Kompas",
    color: "#0056A4",
    siteUrl: "https://www.kompas.com",
    kind: "html",
    url: "https://indeks.kompas.com/terpopuler",
  },
  {
    id: "liputan6",
    name: "Liputan6",
    shortName: "Liputan6",
    color: "#E31C25",
    siteUrl: "https://www.liputan6.com",
    kind: "html",
    url: "https://www.liputan6.com/indeks/terpopuler",
  },
  {
    id: "republika",
    name: "Republika",
    shortName: "Republika",
    color: "#006633",
    siteUrl: "https://www.republika.co.id",
    kind: "html",
    url: "https://news.republika.co.id/hot",
  },
  {
    id: "google",
    name: "Google News",
    shortName: "Google",
    color: "#4285F4",
    siteUrl: "https://news.google.com/?hl=id&gl=ID&ceid=ID:id",
    kind: "rss",
    url: "https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id",
  },
];

/** Sumber fokus industri keuangan & pasar modal. */
export const FINANCE_SOURCES: PopularSource[] = [
  {
    id: "cnbc",
    name: "CNBC Indonesia",
    shortName: "CNBC",
    color: "#005BAC",
    siteUrl: "https://www.cnbcindonesia.com",
    kind: "mostpop-json",
    url: "https://www.cnbcindonesia.com/api/v2/mostpop",
    kanal: "2",
  },
  {
    id: "cnn-ekonomi",
    name: "CNN Ekonomi",
    shortName: "CNN",
    color: "#CC0000",
    siteUrl: "https://www.cnnindonesia.com/ekonomi",
    kind: "mostpop-json",
    url: "https://www.cnnindonesia.com/api/v2/mostpop",
    kanal: "ekonomi",
  },
  {
    id: "detik-finance",
    name: "Detik Finance",
    shortName: "Detik",
    color: "#F15A22",
    siteUrl: "https://finance.detik.com",
    kind: "html",
    url: "https://finance.detik.com/berita-ekonomi-bisnis",
  },
  {
    id: "kontan",
    name: "Kontan Investasi",
    shortName: "Kontan",
    color: "#F5A623",
    siteUrl: "https://investasi.kontan.co.id",
    kind: "html",
    url: "https://investasi.kontan.co.id",
  },
  {
    id: "investor",
    name: "Investor Daily",
    shortName: "Investor",
    color: "#1B4F72",
    siteUrl: "https://investor.id",
    kind: "html",
    url: "https://investor.id",
  },
  {
    id: "liputan6-bisnis",
    name: "Liputan6 Bisnis",
    shortName: "Liputan6",
    color: "#E31C25",
    siteUrl: "https://www.liputan6.com/bisnis",
    kind: "html",
    url: "https://www.liputan6.com/bisnis/indeks/terpopuler",
  },
  {
    id: "kompas-money",
    name: "Kompas Money",
    shortName: "Kompas",
    color: "#0056A4",
    siteUrl: "https://money.kompas.com",
    kind: "html",
    url: "https://money.kompas.com",
  },
  {
    id: "google-finance",
    name: "Google Finance",
    shortName: "Google",
    color: "#4285F4",
    siteUrl: "https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtdHZHZ0pMVWlnQVAB?hl=id&gl=ID&ceid=ID:id",
    kind: "rss",
    url: "https://news.google.com/rss/search?q=IHSG%20OR%20%22pasar%20modal%22%20OR%20saham%20OR%20emiten%20when:1d&hl=id&gl=ID&ceid=ID:id",
  },
];
