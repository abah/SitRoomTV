# SOROT

Agregator berita populer dari media online terbesar di Indonesia.

## Fitur

- Mengambil RSS publik dari Detik, CNN Indonesia, ANTARA, CNBC Indonesia, Tempo, Tribunnews, Okezone, Republika, Media Indonesia, dan BBC News Indonesia
- Mengurutkan sorotan berdasarkan liputan lintas media, kebaruan, dan posisi headline
- Filter per media, pencarian, dan penyegaran otomatis

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## API

`GET /api/news` mengembalikan JSON ranking dan daftar per sumber. URL feed dikunci di server (allowlist) agar tidak menerima URL dari pengunjung.
