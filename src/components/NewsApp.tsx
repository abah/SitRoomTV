"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { NewsFeedResponse, NewsItem, NewsSourceId } from "@/lib/types";
import { formatClock, formatRelativeTime } from "@/lib/format";

type FilterId = "all" | "trending" | NewsSourceId;

const REFRESH_MS = 120_000;

function safeExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function NewsRow({
  item,
  index,
  emphasize,
}: {
  item: NewsItem;
  index: number;
  emphasize?: boolean;
}) {
  const href = safeExternalUrl(item.link);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`news-row group ${emphasize ? "news-row--hero" : ""}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="news-row__rank" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="news-row__body">
        <div className="news-row__meta">
          <span className="source-dot" style={{ background: item.sourceColor }} />
          <span className="source-name">{item.sourceName}</span>
          <span className="meta-sep" aria-hidden>
            ·
          </span>
          <time dateTime={item.publishedAt ?? undefined}>
            {formatRelativeTime(item.publishedAt)}
          </time>
          {item.clusterSize > 1 ? (
            <span className="cluster-pill">
              {item.clusterSize} media
            </span>
          ) : null}
        </div>
        <h3 className="news-row__title">{item.title}</h3>
        {item.summary ? <p className="news-row__summary">{item.summary}</p> : null}
        {item.relatedSources.length > 1 ? (
          <p className="news-row__related">
            Juga di {item.relatedSources.filter((name) => name !== item.sourceName).join(", ")}
          </p>
        ) : null}
      </div>
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          className="news-row__image"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="news-row__image news-row__image--empty" aria-hidden />
      )}
    </a>
  );
}

export default function NewsApp({ initialData }: { initialData: NewsFeedResponse }) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<FilterId>("trending");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/news", { cache: "no-store" });
        if (!response.ok) throw new Error("refresh failed");
        const next = (await response.json()) as NewsFeedResponse;
        if (!cancelled) {
          startTransition(() => {
            setData(next);
            setError(null);
          });
        }
      } catch {
        if (!cancelled) setError("Gagal memperbarui. Menampilkan data terakhir.");
      }
    }

    const id = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const visibleItems = useMemo(() => {
    const base =
      filter === "trending" || filter === "all"
        ? data.trending
        : data.bySource[filter] ?? [];

    const normalized = query.trim().toLowerCase();
    if (!normalized) return base;
    return base.filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) ||
        item.summary.toLowerCase().includes(normalized) ||
        item.sourceName.toLowerCase().includes(normalized),
    );
  }, [data, filter, query]);

  const liveSources = data.sources.filter((source) => source.ok).length;
  const topStory = data.trending[0];

  return (
    <div className="page">
      <div className="atmosphere" aria-hidden>
        <div className="atmosphere__glow atmosphere__glow--a" />
        <div className="atmosphere__glow atmosphere__glow--b" />
        <div className="atmosphere__grain" />
        <div className="atmosphere__grid" />
      </div>

      <header className="hero">
        <nav className="topbar">
          <div className="brand">
            <span className="brand__mark" aria-hidden />
            <span className="brand__name">SOROT</span>
          </div>
          <div className="topbar__status">
            <span className={`pulse ${isPending ? "pulse--busy" : ""}`} />
            <span>
              {liveSources}/{data.sources.length} media aktif
            </span>
          </div>
        </nav>

        <div className="hero__content">
          <p className="brand-lockup">SOROT</p>
          <h1 className="hero__title">Berita paling ramai di Indonesia, sekarang.</h1>
          <p className="hero__lede">
            Agregasi headline dari media online terbesar—diurutkan dari liputan
            lintas outlet, kecepatan, dan posisi di feed.
          </p>
          <div className="hero__actions">
            <a href="#daftar" className="btn btn--primary">
              Lihat sorotan
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                void (async () => {
                  try {
                    const response = await fetch("/api/news", { cache: "no-store" });
                    if (!response.ok) throw new Error("fail");
                    const next = (await response.json()) as NewsFeedResponse;
                    startTransition(() => {
                      setData(next);
                      setError(null);
                    });
                  } catch {
                    setError("Gagal memperbarui. Coba lagi.");
                  }
                })();
              }}
            >
              Segarkan
            </button>
          </div>
        </div>

        {topStory ? (
          <div className="hero__visual" aria-hidden>
            <div className="hero-panel">
              <div className="hero-panel__label">Sedang tren</div>
              <div className="hero-panel__score">{topStory.score}</div>
              <p className="hero-panel__title">{topStory.title}</p>
              <p className="hero-panel__meta">
                {topStory.sourceName}
                {topStory.clusterSize > 1
                  ? ` · ${topStory.clusterSize} media`
                  : ""}
              </p>
            </div>
          </div>
        ) : null}
      </header>

      <main id="daftar" className="main">
        <section className="toolbar" aria-label="Filter berita">
          <div className="toolbar__left">
            <h2>Sorotan hari ini</h2>
            <p>{formatClock(data.updatedAt)} WIB</p>
          </div>
          <label className="search">
            <span className="sr-only">Cari berita</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul, media, kata kunci…"
              autoComplete="off"
            />
          </label>
        </section>

        <div className="filters" role="tablist" aria-label="Sumber media">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "trending"}
            className={filter === "trending" ? "chip chip--active" : "chip"}
            onClick={() => setFilter("trending")}
          >
            Tren lintas media
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={filter === "all" ? "chip chip--active" : "chip"}
            onClick={() => setFilter("all")}
          >
            Semua ranking
          </button>
          {data.sources.map((source) => (
            <button
              key={source.id}
              type="button"
              role="tab"
              aria-selected={filter === source.id}
              className={filter === source.id ? "chip chip--active" : "chip"}
              onClick={() => setFilter(source.id)}
              disabled={!source.ok}
              title={source.ok ? source.name : `${source.name}: feed tidak tersedia`}
            >
              <span className="chip__dot" style={{ background: source.color }} />
              {source.shortName}
            </button>
          ))}
        </div>

        {error ? <p className="banner">{error}</p> : null}

        <section className="feed" aria-live="polite">
          {visibleItems.length === 0 ? (
            <p className="empty">Tidak ada berita yang cocok dengan filter ini.</p>
          ) : (
            visibleItems.map((item, index) => (
              <NewsRow
                key={`${item.id}-${item.link}`}
                item={item}
                index={index}
                emphasize={index === 0 && (filter === "trending" || filter === "all")}
              />
            ))
          )}
        </section>

        <section className="sources-board" aria-label="Status media">
          <h2>Media yang dipantau</h2>
          <ul>
            {data.sources.map((source) => (
              <li key={source.id}>
                <a href={source.siteUrl} target="_blank" rel="noopener noreferrer">
                  <span className="chip__dot" style={{ background: source.color }} />
                  <span>{source.name}</span>
                  <span className={source.ok ? "ok" : "bad"}>
                    {source.ok ? `${source.count} berita` : "offline"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>
          SOROT membaca RSS publik dari media Indonesia. Skor tren = liputan
          lintas media + kebaruan + posisi headline. Tautan membuka situs sumber.
        </p>
        <p className="footer__tick" suppressHydrationWarning>
          Sinkron {formatRelativeTime(data.updatedAt, now)}
        </p>
      </footer>
    </div>
  );
}
