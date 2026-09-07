const ALLOWED_SUFFIXES = [
  "hgmtv.com",
  "tenbytecdn.com",
  "beritasatumedia.com",
  "rctiplus.id",
];

const INEWS_EMBED = "https://embed.rctiplus.com/live/inews/inewsid";
let inewsMasterUrl = "";
let inewsMasterAt = 0;

async function resolveInewsMaster(): Promise<string> {
  const now = Date.now();
  if (inewsMasterUrl && now - inewsMasterAt < 10 * 60 * 1000) {
    return inewsMasterUrl;
  }
  const html = await fetch(INEWS_EMBED, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SitRoomTV/1.0)",
      Referer: "https://tv.inews.id/streaming",
    },
  }).then((r) => r.text());
  const match =
    html.match(/STREAM_URL\]\s*=\s*atob\('([A-Za-z0-9+/=]+)'\)/) ??
    html.match(/atob\('(aHR0cHM6Ly9pbmV3cy1saW5pZXJ[^']*)'\)/);
  if (!match) throw new Error("inews token missing");
  inewsMasterUrl = atob(match[1]);
  inewsMasterAt = now;
  return inewsMasterUrl;
}

function isInewsMaster(target: URL): boolean {
  return (
    target.hostname === "inews-linier.rctiplus.id" &&
    target.pathname.endsWith("/inews-sdi.m3u8")
  );
}

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Cache-Control": "no-store",
};

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function isAllowed(target: URL): boolean {
  if (target.protocol !== "https:" && target.protocol !== "http:") return false;
  return isAllowedHost(target.hostname);
}

function refererFor(target: URL): string {
  if (target.hostname === "hgmtv.com" || target.hostname.endsWith(".hgmtv.com")) {
    return "https://garuda.tv/live/";
  }
  if (
    target.hostname.endsWith(".rctiplus.id") ||
    target.hostname === "rctiplus.id"
  ) {
    return INEWS_EMBED;
  }
  return "https://www.beritasatu.com/btv-live-streaming";
}

function originFor(referer: string): string {
  try {
    return new URL(referer).origin;
  } catch {
    return referer;
  }
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

  if (isInewsMaster(target)) {
    try {
      target = new URL(await resolveInewsMaster());
    } catch {
      return new Response("inews token failed", { status: 502, headers: CORS });
    }
  }

  const referer = refererFor(target);
  const upstream = await fetch(target.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent":
        request.headers.get("User-Agent") ??
        "Mozilla/5.0 (compatible; SitRoomTV/1.0)",
      Referer: referer,
      Origin: originFor(referer),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  let playlistBase = target;
  try {
    const finalUrl = new URL(upstream.url);
    if (isAllowed(finalUrl)) playlistBase = finalUrl;
  } catch {
    /* keep original target as rewrite base */
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const isPlaylist =
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegURL") ||
    target.pathname.endsWith(".m3u8") ||
    playlistBase.pathname.endsWith(".m3u8");

  if (isPlaylist) {
    const text = await upstream.text();
    return new Response(rewritePlaylist(text, playlistBase), {
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
