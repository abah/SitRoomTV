import { useEffect, useState } from "react";
import NewsApp from "@/components/NewsApp";
import BrandMark from "@/components/BrandMark";
import SiteNav from "@/components/SiteNav";
import { usePath } from "@/hooks/usePath";
import { PAGES } from "@/lib/pages";
import type { NewsFeedResponse } from "@/lib/types";

const cache = new Map<string, NewsFeedResponse>();

export default function App() {
  const { path, navigate } = usePath();
  const page = PAGES[path];
  const [data, setData] = useState<NewsFeedResponse | null>(() => cache.get(page.apiPath) ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !cache.has(page.apiPath));

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(page.apiPath);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }

    (async () => {
      try {
        const response = await fetch(page.apiPath);
        if (!response.ok) throw new Error("fail");
        const json = (await response.json()) as NewsFeedResponse;
        cache.set(page.apiPath, json);
        if (!cancelled) {
          setData(json);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          if (!cache.has(page.apiPath)) {
            setError("Gagal memuat berita pertama kali.");
            setLoading(false);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page.apiPath]);

  if (error && !data) {
    return (
      <div className="boot-error">
        <div className="brand">
          <BrandMark />
          <span className="brand__name">SOROT</span>
        </div>
        <SiteNav active={path} onNavigate={navigate} />
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="boot-loading">
        <div className="brand">
          <BrandMark />
          <span className="brand__name">SOROT</span>
        </div>
        <SiteNav active={path} onNavigate={navigate} />
        <p>
          {page.mode === "keuangan"
            ? "Mengambil headline keuangan & pasar modal…"
            : "Mengambil headline dari media Indonesia…"}
        </p>
      </div>
    );
  }

  return <NewsApp page={page} initialData={data} onNavigate={navigate} />;
}
