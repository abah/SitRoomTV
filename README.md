# SOROT

Agregator berita populer Indonesia — Cloudflare Worker di **tren.abah.me**.

## Stack

- Vite + React (SPA)
- Worker API `/api/news` (RSS allowlist + ranking lintas media)
- Domain: `tren.abah.me`

## Lokal

```bash
npm install
npm run build
npx wrangler dev
```

## Deploy

```bash
npm run deploy
```

Butuh `CLOUDFLARE_API_TOKEN` (Workers Edit + Zone DNS Edit) dan akun yang punya zone `abah.me`.
