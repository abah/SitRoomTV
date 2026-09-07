import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ExternalLink,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Tv,
  X,
} from "lucide-react";
import {
  TV_CATEGORIES,
  embedUrl,
  emptyPlayingState,
  nextOptionId,
  watchUrl,
  type TvCategoryId,
} from "./tvStreams";

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function isFsActive(el: Element | null): boolean {
  const d = document as FsDocument;
  return Boolean(
    el && (document.fullscreenElement ?? d.webkitFullscreenElement) === el,
  );
}

export default function TvLiveWall({
  title = "Kanal TV Live",
  subtitle,
  pageSize = 8,
  headerActions,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  pageSize?: 4 | 8;
  headerActions?: ReactNode;
  className?: string;
}) {
  const wallFsRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Record<TvCategoryId, string>>(() =>
    Object.fromEntries(
      TV_CATEGORIES.map((c) => [c.id, c.options[0].id]),
    ) as Record<TvCategoryId, string>,
  );
  const [playing, setPlaying] =
    useState<Record<TvCategoryId, boolean>>(emptyPlayingState);
  const [enlarged, setEnlarged] = useState<TvCategoryId | null>(null);
  const [wallOpen, setWallOpen] = useState(false);
  const [wallFs, setWallFs] = useState(false);

  const pageCount = Math.max(1, Math.ceil(TV_CATEGORIES.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = TV_CATEGORIES.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );
  const visibleIds = visible.map((c) => c.id);
  const countLabel = `${pageSize} TV`;
  const resolvedSubtitle =
    subtitle ??
    (pageSize === 4
      ? `4 stasiun per halaman · ${pageCount} halaman · mute · fullscreen`
      : "8 kanal live · mute · fullscreen wall untuk monitoring");

  const playVisible = (on = true) => {
    setPlaying((p) => {
      const next = { ...p };
      for (const id of visibleIds) next[id] = on;
      return next;
    });
  };

  const optionFor = (catId: TvCategoryId) => {
    const cat = TV_CATEGORIES.find((c) => c.id === catId)!;
    return (
      cat.options.find((o) => o.id === selected[catId]) ?? cat.options[0]
    );
  };

  const tryNextLink = (catId: TvCategoryId) => {
    setSelected((s) => ({
      ...s,
      [catId]: nextOptionId(catId, s[catId]),
    }));
    setPlaying((p) => ({ ...p, [catId]: true }));
  };

  useEffect(() => {
    setPage((n) => Math.min(n, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const enlargedCat = useMemo(
    () => TV_CATEGORIES.find((c) => c.id === enlarged) ?? null,
    [enlarged],
  );
  const enlargedOpt = enlarged ? optionFor(enlarged) : null;

  const openWall = () => {
    playVisible(true);
    setEnlarged(null);
    setWallOpen(true);
  };

  const closeWall = async () => {
    setWallOpen(false);
    setWallFs(false);
    const d = document as FsDocument;
    if (document.fullscreenElement || d.webkitFullscreenElement) {
      try {
        await (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d);
      } catch {
        /* ignore */
      }
    }
  };

  const toggleBrowserFullscreen = async () => {
    const el = wallFsRef.current as FsElement | null;
    if (!el) return;
    const d = document as FsDocument;
    try {
      if (isFsActive(el)) {
        await (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d);
      } else {
        await (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
      }
    } catch {
      /* browser menolak fullscreen */
    }
  };

  useEffect(() => {
    if (!wallOpen) return;
    const sync = () => setWallFs(isFsActive(wallFsRef.current));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void closeWall();
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      void toggleBrowserFullscreen();
    }, 80);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallOpen]);

  const renderPlayer = (
    catId: TvCategoryId,
    mode: "grid" | "wall" | "single",
  ) => {
    const cat = TV_CATEGORIES.find((c) => c.id === catId)!;
    const opt = optionFor(catId);
    const isPlaying = playing[catId] || mode === "wall" || mode === "single";

    return (
      <div
        key={`${mode}-${catId}`}
        className={`sr-tv-player${mode === "wall" ? " wall" : ""}`}
      >
        {mode !== "single" && (
          <div className="sr-tv-player-head">
            <div>
              <b>{cat.title}</b>
              <small>
                {mode === "wall" ? opt.label : cat.hint}
              </small>
            </div>
            {mode === "grid" && (
              <div className="sr-tv-player-actions">
                <button
                  className="btn small"
                  type="button"
                  onClick={() =>
                    setPlaying((p) => ({ ...p, [catId]: !p[catId] }))
                  }
                >
                  {playing[catId] ? "Pause" : "Putar"}
                </button>
                <button
                  className="btn small"
                  type="button"
                  title="Coba link live berikutnya"
                  onClick={() => tryNextLink(catId)}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  className="btn small"
                  type="button"
                  onClick={() => {
                    setPlaying((p) => ({ ...p, [catId]: true }));
                    setEnlarged(catId);
                  }}
                  title="Perbesar satu kanal"
                >
                  <Expand size={13} />
                </button>
              </div>
            )}
            {mode === "wall" && (
              <div className="sr-tv-wall-pick">
                <select
                  className="sr-tv-select sr-tv-select-mini"
                  value={selected[catId]}
                  onChange={(e) => {
                    setSelected((s) => ({ ...s, [catId]: e.target.value }));
                  }}
                >
                  {cat.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  className="btn small"
                  type="button"
                  title="Coba link live berikutnya"
                  onClick={() => tryNextLink(catId)}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
          </div>
        )}
        {mode === "grid" && (
          <>
            <select
              className="sr-tv-select"
              value={selected[catId]}
              onChange={(e) => {
                setSelected((s) => ({ ...s, [catId]: e.target.value }));
                setPlaying((p) => ({ ...p, [catId]: true }));
              }}
            >
              {cat.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <small className="sr-tv-option-hint">
              {cat.options.length} opsi · jika mati pilih link lain / ↻
            </small>
          </>
        )}
        <div className="sr-tv-frame">
          {isPlaying ? (
            <iframe
              key={`${mode}-${catId}-${opt.id}`}
              src={embedUrl(opt, true)}
              title={`${cat.title} — ${opt.label}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="sr-tv-poster"
              onClick={() => setPlaying((p) => ({ ...p, [catId]: true }))}
            >
              <span className="sr-tv-play" aria-hidden>
                <Play size={20} fill="currentColor" />
              </span>
              <span>{opt.label}</span>
              <small>Klik untuk putar live</small>
            </button>
          )}
        </div>
        {mode === "grid" && (
          <a
            className="sr-tv-open"
            href={watchUrl(opt)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={12} /> Buka di YouTube
          </a>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`card sr-tv-slot ${className}`.trim()}>
        <div className="sr-feed-head">
          <h3>
            <Tv size={16} /> {title}
          </h3>
          <div className="sr-tv-head-actions">
            <small>{resolvedSubtitle}</small>
            {headerActions}
            {pageCount > 1 && (
              <div className="sr-tv-pager">
                <button
                  type="button"
                  className="btn small"
                  disabled={safePage <= 0}
                  onClick={() => setPage((n) => Math.max(0, n - 1))}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span>
                  {safePage + 1}/{pageCount}
                </span>
                <button
                  type="button"
                  className="btn small"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((n) => Math.min(pageCount - 1, n + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn small"
              onClick={() => playVisible(true)}
              title="Putar kanal di halaman ini"
            >
              <Play size={13} /> Putar semua
            </button>
            <button
              type="button"
              className="btn small primary"
              onClick={openWall}
              title={`Fullscreen ${countLabel}`}
            >
              <Maximize2 size={13} /> Fullscreen {countLabel}
            </button>
          </div>
        </div>

        <div className={`sr-tv-grid sr-tv-grid-${pageSize}`}>
          {visible.map((cat) => renderPlayer(cat.id, "grid"))}
        </div>
      </div>

      {wallOpen && (
        <div className="sr-tv-wall-overlay" role="dialog" aria-modal>
          <div className="sr-tv-wall" ref={wallFsRef}>
            <header className="sr-tv-wall-bar">
              <div>
                <b>
                  Monitoring TV — {visible.length} kanal
                  {pageCount > 1 ? ` · halaman ${safePage + 1}/${pageCount}` : ""}
                </b>
                <small>
                  {wallFs
                    ? "Mode layar penuh browser · Esc untuk keluar"
                    : "Tekan Layar penuh untuk mengisi monitor"}
                </small>
              </div>
              <div className="sr-screen-actions">
                <button
                  className="btn small"
                  type="button"
                  onClick={() => void toggleBrowserFullscreen()}
                >
                  {wallFs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {wallFs ? "Keluar FS" : "Layar penuh"}
                </button>
                <button
                  className="btn small"
                  type="button"
                  onClick={() => void closeWall()}
                >
                  <X size={14} /> Tutup
                </button>
              </div>
            </header>
            <div className={`sr-tv-wall-grid sr-tv-wall-grid-${pageSize}`}>
              {visible.map((cat) => renderPlayer(cat.id, "wall"))}
            </div>
          </div>
        </div>
      )}

      {enlarged && enlargedCat && enlargedOpt && (
        <div className="sr-screen-overlay" role="dialog" aria-modal>
          <div className="sr-screen sr-tv-enlarged">
            <header className="sr-screen-bar">
              <div>
                <b>
                  {enlargedCat.title} — {enlargedOpt.label}
                </b>
                <small>{enlargedCat.hint}</small>
              </div>
              <div className="sr-screen-actions">
                <select
                  className="sr-tv-select sr-tv-select-mini"
                  value={selected[enlarged]}
                  onChange={(e) => {
                    setSelected((s) => ({
                      ...s,
                      [enlarged]: e.target.value,
                    }));
                  }}
                >
                  {enlargedCat.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  className="btn small"
                  type="button"
                  title="Coba link live berikutnya"
                  onClick={() => tryNextLink(enlarged)}
                >
                  <RefreshCw size={14} /> Link lain
                </button>
                <button
                  className="btn small primary"
                  type="button"
                  onClick={() => {
                    setEnlarged(null);
                    openWall();
                  }}
                >
                  <Maximize2 size={14} /> Wall {countLabel}
                </button>
                <a
                  className="btn small"
                  href={watchUrl(enlargedOpt)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> YouTube
                </a>
                <button className="btn small" onClick={() => setEnlarged(null)}>
                  <X size={14} /> Tutup
                </button>
              </div>
            </header>
            <div className="sr-tv-enlarged-frame">
              <iframe
                key={`enlarged-${enlarged}-${enlargedOpt.id}`}
                src={embedUrl(enlargedOpt, true)}
                title={`${enlargedCat.title} — ${enlargedOpt.label}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
