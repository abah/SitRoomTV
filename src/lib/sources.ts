import type { NewsSourceId } from "./types";

export type PopularSourceKind = "html" | "mostpop-json";

export interface PopularSource {
  id: NewsSourceId;
  name: string;
  shortName: string;
  color: string;
  siteUrl: string;
  kind: PopularSourceKind;
  /** HTML page or mostpop API path base */
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
];
