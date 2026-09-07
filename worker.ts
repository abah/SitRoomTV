const ALLOWED_HOSTS = new Set([
  "hgmtv.com",
  "lnd0t3b922.tenbytecdn.com",
]);

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "no-store",
};

function isAllowed(target: URL): boolean {
  if (target.protocol !== "https:" && target.protocol !== "http:") return false;
  return ALLOWED_HOSTS.has(target.hostname);
}

function refererFor(target: URL): string {
  if (target.hostname === "hgmtv.com") return "https://garuda.tv/live/";
  return "https://www.beritasatu.com/btv-live-streaming";
}

function rewritePlaylist(body: string, playlistUrl: URL): string {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
          const abs = new URL(uri, playlistUrl).toString();
          return `URI="/hls?u=${encodeURIComponent(abs)}"`;
        });
      }
      const abs = new URL(trimmed, playlistUrl).toString();
      return `/hls?u=${encodeURIComponent(abs)}`;
    })
    .join("\n");
}

async function proxyHls(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const raw = new URL(request.url).searchParams.get("u");
  if (!raw) return new Response("missing u", { status: 400, headers: CORS });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad url", { status: 400, headers: CORS });
  }
  if (!isAllowed(target)) {
    return new Response("forbidden", { status: 403, headers: CORS });
  }

  const upstream = await fetch(target.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent":
        request.headers.get("User-Agent") ??
        "Mozilla/5.0 (compatible; SitRoomTV/1.0)",
      Referer: refererFor(target),
      Origin: refererFor(target).replace(/\/$/, ""),
    },
  });

  const contentType = upstream.headers.get("content-type") ?? "";
  const isPlaylist =
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegURL") ||
    target.pathname.endsWith(".m3u8");

  if (isPlaylist) {
    const text = await upstream.text();
    return new Response(rewritePlaylist(text, target), {
      status: upstream.status,
      headers: {
        ...CORS,
        "Content-Type": "application/vnd.apple.mpegurl",
      },
    });
  }

  const headers = new Headers(CORS);
  headers.set(
    "Content-Type",
    contentType || "application/octet-stream",
  );
  return new Response(upstream.body, { status: upstream.status, headers });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/hls") return proxyHls(request);
    return new Response("not found", { status: 404 });
  },
};
