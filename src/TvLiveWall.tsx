import { useEffect, useRef, useState, type ReactNode } from "react";
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
  TV_STREAM_CATALOG,
  defaultSlotStreamIds,
  embedUrl,
  emptyPlayingSlots,
  isHlsOption,
  nextCatalogOptionId,
  openSourceLabel,
  optionById,
  watchUrl,
} from "./tvStreams";
import HlsPlayer from "./HlsPlayer";

const SLOT_STORAGE_KEY = "sitroom-tv-slots";

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

function loadSlotStreams(): string[] {
  const defaults = defaultSlotStreamIds();
  try {
    const raw = localStorage.getItem(SLOT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaults;
    return defaults.map((fallback, i) => {
      const id = parsed[i];
      return typeof id === "string" && TV_STREAM_CATALOG.some((o) => o.id === id)
        ? id
        : fallback;
    });
  } catch {
    return defaults;
  }
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
  const slotCount = TV_CATEGORIES.length;
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>(loadSlotStreams);
  const [playing, setPlaying] = useState<boolean[]>(() =>
    emptyPlayingSlots(slotCount),
  );
  const [enlarged, setEnlarged] = useState<number | null>(null);
  const [wallOpen, setWallOpen] = useState(false);
  const [wallFs, setWallFs] = useState(false);

  const pageCount = Math.max(1, Math.ceil(slotCount / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleSlots = Array.from(
    { length: pageSize },
    (_, i) => safePage * pageSize + i,
  ).filter((i) => i < slotCount);
  const countLabel = `${pageSize} TV`;
  const resolvedSubtitle =
    subtitle ??
    (pageSize === 4
      ? `4 layar per halaman · pilih stasiun di tiap kotak`
      : "8 layar · pilih stasiun bebas di tiap kotak");

  useEffect(() => {
    localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify(selected));
  }, [selected]);

  const playVisible = (on = true) => {
    setPlaying((p) => {
      const next = [...p];
      for (const i of visibleSlots) next[i] = on;
      return next;
    });
  };

  const optionFor = (slot: number) => optionById(selected[slot]);

  const tryNextLink = (slot: number) => {
    setSelected((s) => {
      const next = [...s];
      next[slot] = nextCatalogOptionId(s[slot]);
      return next;
    });
    setPlaying((p) => {
      const next = [...p];
      next[slot] = true;
      return next;
    });
  };

  const setSlotStream = (slot: number, id: string, start = false) => {
    setSelected((s) => {
      const next = [...s];
      next[slot] = id;
      return next;
    });
    if (start) {
      setPlaying((p) => {
        const next = [...p];
        next[slot] = true;
        return next;
      });
    }
  };

  useEffect(() => {
    setPage((n) => Math.min(n, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const enlargedOpt = enlarged != null ? optionFor(enlarged) : null;

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

  const streamSelect = (slot: number, mini = false) => (
    <select
      className={`sr-tv-select${mini ? " sr-tv-select-mini" : ""}`}
      value={selected[slot]}
      onChange={(e) => setSlotStream(slot, e.target.value, !mini)}
    >
      {TV_STREAM_CATALOG.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );

  const renderPlayer = (slot: number, mode: "grid" | "wall" | "single") => {
    const opt = optionFor(slot);
    const isPlaying = playing[slot] || mode === "wall" || mode === "single";

    return (
      <div
        key={`${mode}-${slot}`}
        className={`sr-tv-player${mode === "wall" ? " wall" : ""}`}
      >
        {mode !== "single" && (
          <div className="sr-tv-player-head">
            <div>
              <small>Layar {slot + 1}</small>
            </div>
            {mode === "grid" && (
              <div className="sr-tv-player-actions">
                <button
                  className="btn small"
                  type="button"
                  onClick={() =>
                    setPlaying((p) => {
                      const next = [...p];
                      next[slot] = !next[slot];
                      return next;
                    })
                  }
                >
                  {playing[slot] ? "Pause" : "Putar"}
                </button>
                <button
                  className="btn small"
                  type="button"
                  title="Coba link berikutnya"
                  onClick={() => tryNextLink(slot)}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  className="btn small"
                  type="button"
                  onClick={() => {
                    setPlaying((p) => {
                      const next = [...p];
                      next[slot] = true;
                      return next;
                    });
                    setEnlarged(slot);
                  }}
                  title="Perbesar"
                >
                  <Expand size={13} />
                </button>
              </div>
            )}
            {mode === "wall" && (
              <div className="sr-tv-wall-pick">
                {streamSelect(slot, true)}
                <button
                  className="btn small"
                  type="button"
                  title="Coba link berikutnya"
                  onClick={() => tryNextLink(slot)}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            )}
          </div>
        )}
        {mode === "grid" && (
          <>
            {streamSelect(slot)}
            <small className="sr-tv-option-hint">
              Pilih stasiun bebas · {TV_STREAM_CATALOG.length} opsi · ↻ ganti link
            </small>
          </>
        )}
        <div className="sr-tv-frame">
          {isPlaying ? (
            isHlsOption(opt) && opt.hlsUrl ? (
              <HlsPlayer
                key={`${mode}-${slot}-${opt.id}`}
                src={opt.hlsUrl}
                title={opt.label}
              />
            ) : (
              <iframe
                key={`${mode}-${slot}-${opt.id}`}
                src={embedUrl(opt, true)}
                title={opt.label}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )
          ) : (
            <button
              type="button"
              className="sr-tv-poster"
              onClick={() =>
                setPlaying((p) => {
                  const next = [...p];
                  next[slot] = true;
                  return next;
                })
              }
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
            <ExternalLink size={12} /> {openSourceLabel(opt)}
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
              title="Putar layar di halaman ini"
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
          {visibleSlots.map((slot) => renderPlayer(slot, "grid"))}
        </div>
      </div>

      {wallOpen && (
        <div className="sr-tv-wall-overlay" role="dialog" aria-modal>
          <div className="sr-tv-wall" ref={wallFsRef}>
            <header className="sr-tv-wall-bar">
              <div>
                <b>
                  Monitoring TV — {visibleSlots.length} layar
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
              {visibleSlots.map((slot) => renderPlayer(slot, "wall"))}
            </div>
          </div>
        </div>
      )}

      {enlarged != null && enlargedOpt && (
        <div className="sr-screen-overlay" role="dialog" aria-modal>
          <div className="sr-screen sr-tv-enlarged">
            <header className="sr-screen-bar">
              <div>
                <b>
                  Layar {enlarged + 1} — {enlargedOpt.label}
                </b>
                <small>Pilih stasiun dari menu</small>
              </div>
              <div className="sr-screen-actions">
                {streamSelect(enlarged, true)}
                <button
                  className="btn small"
                  type="button"
                  title="Coba link berikutnya"
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
                  <ExternalLink size={14} /> {openSourceLabel(enlargedOpt)}
                </a>
                <button className="btn small" onClick={() => setEnlarged(null)}>
                  <X size={14} /> Tutup
                </button>
              </div>
            </header>
            <div className="sr-tv-enlarged-frame">
              {isHlsOption(enlargedOpt) && enlargedOpt.hlsUrl ? (
                <HlsPlayer
                  key={`enlarged-${enlarged}-${enlargedOpt.id}`}
                  src={enlargedOpt.hlsUrl}
                  title={enlargedOpt.label}
                />
              ) : (
                <iframe
                  key={`enlarged-${enlarged}-${enlargedOpt.id}`}
                  src={embedUrl(enlargedOpt, true)}
                  title={enlargedOpt.label}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
