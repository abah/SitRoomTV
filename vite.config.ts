// @ts-nocheck
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const ALLOWED_HOSTS = new Set([
  "hgmtv.com",
  "lnd0t3b922.tenbytecdn.com",
]);

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
            const target = new URL(raw);
            if (!ALLOWED_HOSTS.has(target.hostname)) {
              res.statusCode = 403;
              res.end("forbidden");
              return;
            }
            const upstream = await fetch(target.toString(), {
              headers: {
                "User-Agent": req.headers["user-agent"] ?? "SitRoomTV",
                Referer: target.hostname.includes("hgmtv")
                  ? "https://garuda.tv/live/"
                  : "https://www.beritasatu.com/btv-live-streaming",
              },
            });
            const ctype = upstream.headers.get("content-type") ?? "";
            const isPlaylist =
              ctype.includes("mpegurl") || target.pathname.endsWith(".m3u8");
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
                      const abs = new URL(uri, target).toString();
                      return `URI="/hls?u=${encodeURIComponent(abs)}"`;
                    });
                  }
                  const abs = new URL(trimmed, target).toString();
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
