import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Radio } from "lucide-react";
import TvLiveWall from "./TvLiveWall";
import "./styles.css";

function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const date = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="sr-clock">
      <span className="sr-clock-time">{time}</span>
      <span className="sr-clock-date">{date} · WIB</span>
    </div>
  );
}

function currentPageSize(): 4 | 8 {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/4" ? 4 : 8;
}

function App() {
  const [pageSize, setPageSize] = useState<4 | 8>(currentPageSize);

  useEffect(() => {
    const sync = () => setPageSize(currentPageSize());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const go = (to: string, size: 4 | 8) => {
    window.history.pushState({}, "", to);
    setPageSize(size);
  };

  return (
    <div className="situroom-app">
      <header className="sr-app-bar">
        <div className="sr-brand">
          <span className="sr-live-dot" aria-hidden />
          <div>
            <h1>SitRoom TV</h1>
            <p>
              Situation Room · Monitoring {pageSize} kanal live
            </p>
          </div>
        </div>
        <div className="sr-app-meta">
          <nav className="sr-layout-nav" aria-label="Tampilan wall">
            <a
              href="/"
              className={pageSize === 8 ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                go("/", 8);
              }}
            >
              8 TV
            </a>
            <a
              href="/4"
              className={pageSize === 4 ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                go("/4", 4);
              }}
            >
              4 TV
            </a>
          </nav>
          <span className="sr-live-badge">
            <Radio size={13} /> LIVE
          </span>
          <Clock />
        </div>
      </header>

      <main className="sr-app-main">
        <TvLiveWall
          key={pageSize}
          pageSize={pageSize}
          title="Kanal TV Live"
          subtitle={
            pageSize === 4
              ? "4 layar per halaman · pilih stasiun di tiap kotak"
              : "8 layar · pilih stasiun bebas di tiap kotak"
          }
        />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
