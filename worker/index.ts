import type { BrowserWorker } from "@cloudflare/puppeteer";
import { getFinanceNewsFeed, getNewsFeed } from "../src/lib/fetch-news";

export interface Env {
  ASSETS: Fetcher;
  BROWSER: BrowserWorker;
}

function jsonFeed(data: unknown): Response {
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/news" || url.pathname === "/api/news/keuangan") {
      try {
        const feed =
          url.pathname === "/api/news/keuangan"
            ? await getFinanceNewsFeed({ browser: env.BROWSER })
            : await getNewsFeed({ browser: env.BROWSER });
        return jsonFeed(feed);
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
