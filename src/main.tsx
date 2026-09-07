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

function App() {
  return (
    <div className="situroom-app">
      <header className="sr-app-bar">
        <div className="sr-brand">
          <span className="sr-live-dot" aria-hidden />
          <div>
            <h1>SitRoom TV</h1>
            <p>Situation Room · Monitoring 11 kanal live</p>
          </div>
        </div>
        <div className="sr-app-meta">
          <span className="sr-live-badge">
            <Radio size={13} /> LIVE
          </span>
          <Clock />
        </div>
      </header>

      <main className="sr-app-main">
        <TvLiveWall
          title="Kanal TV Live"
          subtitle="11 kanal · banyak link cadangan per stasiun · ↻ ganti jika mati"
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
