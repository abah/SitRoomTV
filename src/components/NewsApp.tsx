import { useEffect, useMemo, useState, useTransition } from "react";
import type { NewsFeedResponse, NewsItem, NewsSourceId } from "@/lib/types";
import { formatClock, formatRelativeTime } from "@/lib/format";

type FilterId = "overall" | NewsSourceId;

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
      className={`news-row ${emphasize ? "news-row--lead" : ""}`}
    >
      <div className="news-row__rank" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="news-row__body">
        <div className="news-row__meta">
          <span className="source-name">{item.sourceName}</span>
          <span className="meta-sep" aria-hidden>
            ·
          </span>
          <span>#{item.popularRank}</span>
          <span className="meta-sep" aria-hidden>
            ·
          </span>
          <span>{item.score} poin</span>
          {item.clusterSize > 1 ? (
            <>
              <span className="meta-sep" aria-hidden>
                ·
              </span>
              <span className="cluster-pill">{item.clusterSize} media</span>
            </>
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
  const [filter, setFilter] = useState<FilterId>("overall");
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
      filter === "overall" ? data.trending : data.bySource[filter] ?? [];

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

  async function refreshNow() {
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
  }

  return (
    <div className="page">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand">
            <span className="brand__name">SOROT</span>
            <span className="brand__tag">Berita terpopuler Indonesia</span>
          </div>
          <div className="header-actions">
            <span>
              <span className={`status-dot ${isPending ? "is-busy" : ""}`} />{" "}
              {liveSources}/{data.sources.length} media
            </span>
            <button type="button" className="btn" onClick={() => void refreshNow()}>
              Segarkan
            </button>
          </div>
        </div>
      </header>

      <section className="masthead">
        <h1>SOROT</h1>
        <p>
          Ranking keseluruhan memberi poin dari posisi terpopuler tiap media
          termasuk Google News (#1 = 15 poin … #15 = 1 poin), lalu dijumlah.
          Filter per kanal = ranking asli sumber.
        </p>
      </section>

      <main id="daftar" className="main">
        <section className="toolbar" aria-label="Filter berita">
          <div className="toolbar__left">
            <h2>Terpopuler hari ini</h2>
            <p>{formatClock(data.updatedAt)} WIB</p>
          </div>
          <label className="search">
            <span className="sr-only">Cari berita</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari judul atau media"
              autoComplete="off"
            />
          </label>
        </section>

        <div className="filters" role="tablist" aria-label="Sumber media">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "overall"}
            className={filter === "overall" ? "chip chip--active" : "chip"}
            onClick={() => setFilter("overall")}
          >
            Keseluruhan
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
              title={source.ok ? source.name : `${source.name}: tidak tersedia`}
            >
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
                emphasize={index === 0 && filter === "overall"}
              />
            ))
          )}
        </section>

        <section className="sources-board" aria-label="Status media">
          <h2>Sumber</h2>
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
        <div className="footer__inner">
          <p>
            Keseluruhan = jumlah poin Borda dari semua media. Per kanal = ranking
            terpopuler asli sumber.
          </p>
          <p suppressHydrationWarning>Diperbarui {formatRelativeTime(data.updatedAt, now)}</p>
        </div>
      </footer>
    </div>
  );
}
