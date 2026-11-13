import { getNewsFeed } from "@/lib/fetch-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const feed = await getNewsFeed();
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
