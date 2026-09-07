// @ts-nocheck
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const ALLOWED_SUFFIXES = [
  "hgmtv.com",
  "tenbytecdn.com",
  "beritasatumedia.com",
  "rctiplus.id",
];

const INEWS_EMBED = "https://embed.rctiplus.com/live/inews/inewsid";
let inewsMasterUrl = "";
let inewsMasterAt = 0;

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

async function resolveInewsMaster(): Promise<string> {
  const now = Date.now();
  if (inewsMasterUrl && now - inewsMasterAt < 10 * 60 * 1000) {
    return inewsMasterUrl;
  }
  const html = await fetch(INEWS_EMBED, {
    headers: {
      "User-Agent": "SitRoomTV",
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

function refererFor(hostname: string): string {
  if (hostname.includes("hgmtv")) return "https://garuda.tv/live/";
  if (hostname.includes("rctiplus")) return INEWS_EMBED;
  return "https://www.beritasatu.com/btv-live-streaming";
}

function hlsDevProxy(): Plugin {
  return {
    name: "hls-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/hls", (req, res, next) => {
        void (async () => {
          try {
            const rawUrl = req.url ?? "/";
            const full = new URL(rawUrl, "http://127.0.0.1/hls");
            const raw = full.searchParams.get("u");
            if (!raw) {
              res.statusCode = 400;
              res.end("missing u");
              return;
            }
            let target = new URL(raw);
            if (!isAllowedHost(target.hostname)) {
              res.statusCode = 403;
              res.end("forbidden");
              return;
            }
            if (
              target.hostname === "inews-linier.rctiplus.id" &&
              target.pathname.endsWith("/inews-sdi.m3u8")
            ) {
              target = new URL(await resolveInewsMaster());
            }
            const referer = refererFor(target.hostname);
            const upstream = await fetch(target.toString(), {
              redirect: "follow",
              headers: {
                "User-Agent": req.headers["user-agent"] ?? "SitRoomTV",
                Referer: referer,
                Origin: new URL(referer).origin,
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            });
            let playlistBase = target;
            try {
              const finalUrl = new URL(upstream.url);
              if (isAllowedHost(finalUrl.hostname)) playlistBase = finalUrl;
            } catch {
              /* keep original target */
            }
            const ctype = upstream.headers.get("content-type") ?? "";
            const isPlaylist =
              ctype.includes("mpegurl") ||
              target.pathname.endsWith(".m3u8") ||
              playlistBase.pathname.endsWith(".m3u8");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Cache-Control", "no-store");
            if (isPlaylist) {
              const text = await upstream.text();
              const rewritten = text
                .split(/\r?\n/)
                .map((line) => {
                  const trimmed = line.trim();
                  if (!trimmed) return line;
                  if (trimmed.startsWith("#")) {
                    return line.replace(/URI="([^"]+)"/g, (_m, uri: string) => {
                      const abs = new URL(uri, playlistBase).toString();
                      return `URI="/hls?u=${encodeURIComponent(abs)}"`;
                    });
                  }
                  const abs = new URL(trimmed, playlistBase).toString();
                  return `/hls?u=${encodeURIComponent(abs)}`;
                })
                .join("\n");
              res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
              res.end(rewritten);
              return;
            }
            res.setHeader("Content-Type", ctype || "application/octet-stream");
            res.statusCode = upstream.status;
            const buf = Buffer.from(await upstream.arrayBuffer());
            res.end(buf);
          } catch (err) {
            next(err);
          }
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), hlsDevProxy()],
});
