import { useEffect, useState } from "react";
import NewsApp from "@/components/NewsApp";
import BrandMark from "@/components/BrandMark";
import type { NewsFeedResponse } from "@/lib/types";

const EMPTY: NewsFeedResponse = {
  updatedAt: new Date().toISOString(),
  mode: "terpopuler",
  trending: [],
  bySource: {},
  sources: [],
  errors: [],
};

export default function App() {
  const [data, setData] = useState<NewsFeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) throw new Error("fail");
        const json = (await response.json()) as NewsFeedResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Gagal memuat berita pertama kali.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error && !data) {
    return (
      <div className="boot-error">
        <div className="brand">
          <BrandMark />
          <span className="brand__name">SOROT</span>
        </div>
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="boot-loading">
        <div className="brand">
          <BrandMark />
          <span className="brand__name">SOROT</span>
        </div>
        <p>Mengambil headline dari media Indonesia…</p>
      </div>
    );
  }

  return <NewsApp initialData={data ?? EMPTY} />;
}
