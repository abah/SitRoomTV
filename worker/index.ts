import type { BrowserWorker } from "@cloudflare/puppeteer";
import { getNewsFeed } from "../src/lib/fetch-news";

export interface Env {
  ASSETS: Fetcher;
  BROWSER: BrowserWorker;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/news") {
      try {
        const feed = await getNewsFeed({ browser: env.BROWSER });
        return Response.json(feed, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        });
      } catch {
        return Response.json(
          { error: "Gagal memuat berita. Coba lagi sebentar." },
          { status: 500 },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
