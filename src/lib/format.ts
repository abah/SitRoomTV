export function formatRelativeTime(iso: string | null, now = Date.now()): string {
  if (!iso) return "baru saja";
  const diffMs = now - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return "baru saja";

  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "kemarin";
  return `${days} hari lalu`;
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}
