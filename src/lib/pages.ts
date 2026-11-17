import type { FeedMode } from "./types";

export type AppRoute = "/" | "/keuangan";

export interface PageConfig {
  route: AppRoute;
  mode: FeedMode;
  apiPath: string;
  navLabel: string;
  eyebrow: string;
  description: string;
  listTitle: string;
  documentTitle: string;
  tagline: string;
}

export const PAGES: Record<AppRoute, PageConfig> = {
  "/": {
    route: "/",
    mode: "terpopuler",
    apiPath: "/api/news",
    navLabel: "Umum",
    eyebrow: "Ranking lintas media",
    description:
      "Satu daftar berbobot dari berita terpopuler media Indonesia dan Google News — diperbarui otomatis.",
    listTitle: "Terpopuler hari ini",
    documentTitle: "SOROT — Berita Terpopuler Indonesia",
    tagline: "Berita terpopuler Indonesia",
  },
  "/keuangan": {
    route: "/keuangan",
    mode: "keuangan",
    apiPath: "/api/news/keuangan",
    navLabel: "Keuangan",
    eyebrow: "Keuangan & pasar modal",
    description:
      "Ranking berita terpopuler khusus industri keuangan, investasi, dan pasar modal dari media bisnis Indonesia.",
    listTitle: "Terpopuler keuangan",
    documentTitle: "SOROT Keuangan — Pasar Modal & Industri Keuangan",
    tagline: "Keuangan & pasar modal",
  },
};

export function resolveRoute(pathname: string): AppRoute {
  if (pathname === "/keuangan" || pathname.startsWith("/keuangan/")) return "/keuangan";
  return "/";
}
