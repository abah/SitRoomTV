/** Sumber live YouTube untuk wall Monitoring TV Sitroom (8 slot). */
export type TvCategoryId =
  | "tvone"
  | "kompas"
  | "tvri"
  | "metro"
  | "cnn"
  | "garuda"
  | "nusantara"
  | "btv";

export interface TvStreamOption {
  id: string;
  label: string;
  /** videoId tetap (24 jam) — lebih andal untuk embed. */
  videoId?: string;
  /** Fallback: channel live_stream embed jika videoId kosong. */
  channelId?: string;
}

export interface TvCategory {
  id: TvCategoryId;
  title: string;
  hint: string;
  options: TvStreamOption[];
}

/**
 * Katalog stream YouTube.
 * Satu stasiun bisa punya banyak entry (24 jam, channel live, event live)
 * supaya operator bisa ganti cepat jika satu link mati.
 */
export const TV_STREAM_CATALOG: TvStreamOption[] = [
  /* —— Metro TV (banyak live paralel) —— */
  {
    id: "metro-24jam",
    label: "Metro TV 24 jam",
    videoId: "AUE5iHINUIw",
    channelId: "UCzl0OrB3-ehunyotIQvK77A",
  },
  {
    id: "metro-channel",
    label: "Metro TV (channel live)",
    channelId: "UCzl0OrB3-ehunyotIQvK77A",
  },
  {
    id: "metro-bn-raker",
    label: "Metro · BN Raker Migran",
    videoId: "Biwok0-9CC0",
  },
  {
    id: "metro-bn-rdp",
    label: "Metro · BN RDP BGN",
    videoId: "8XsZXdOr1bo",
  },
  {
    id: "metro-lambe",
    label: "Metro · Lambe Politik",
    videoId: "ra6hRPiInLo",
  },

  /* —— TV One —— */
  {
    id: "tvone-24jam",
    label: "tvOne 24 jam",
    videoId: "rQJoEpzKkNk",
    channelId: "UCER4rvDnRBPr_ncYW4UCZjg",
  },
  {
    id: "tvone-channel",
    label: "tvOne (channel live)",
    channelId: "UCER4rvDnRBPr_ncYW4UCZjg",
  },

  /* —— Kompas TV (+ regional) —— */
  {
    id: "kompas-24jam",
    label: "Kompas TV 24 jam",
    videoId: "DOOrIxw5xOw",
    channelId: "UC0C-Hj5AjweeGNyAIHb--8g",
  },
  {
    id: "kompas-channel",
    label: "Kompas TV (channel live)",
    channelId: "UC0C-Hj5AjweeGNyAIHb--8g",
  },
  {
    id: "kompas-merauke",
    label: "Kompas TV Merauke",
    videoId: "ua-VsvGDAW4",
  },
  {
    id: "kompas-makassar",
    label: "Kompas TV Makassar",
    videoId: "msWaHnmgJXQ",
  },
  {
    id: "kompas-medan",
    label: "Kompas TV Medan",
    videoId: "19f9Vhwmzk8",
  },

  /* —— TVRI —— */
  {
    id: "tvri-channel",
    label: "TVRI Nasional (channel live)",
    channelId: "UCyIMsCzDRm8_y_6wM26_PWQ",
  },

  /* —— CNN / CNBC / iNews / Sindo —— */
  {
    id: "cnnid-24jam",
    label: "CNN Indonesia 24 jam",
    videoId: "PDDOkUq33Sw",
    channelId: "UCKII0Ml9S5wneKbHswmUrIQ",
  },
  {
    id: "cnnid-channel",
    label: "CNN Indonesia (channel live)",
    channelId: "UCKII0Ml9S5wneKbHswmUrIQ",
  },
  {
    id: "cnbc-channel",
    label: "CNBC Indonesia (channel live)",
    channelId: "UCGN9JsnkvK05v2lnTI_-uGA",
  },
  {
    id: "inews-24jam",
    label: "iNews 24 jam",
    videoId: "WHTPYAvakTg",
  },
  {
    id: "inews-sumut",
    label: "iNews Sumut",
    videoId: "rTNOg9B2Ie4",
  },
  {
    id: "inews-jatim",
    label: "iNews Jatim",
    videoId: "rRFtxo6GQfg",
  },
  {
    id: "sindo-24jam",
    label: "SINDOnews 24 jam",
    videoId: "z31jg2THbWM",
  },

  /* —— Garuda TV / Nusantara TV / BTV —— */
  {
    id: "garuda-live",
    label: "Garuda TV live",
    videoId: "6k9nOc6RuXY",
    channelId: "UCmXp0n4Oq8DGzjRZj3EvG4Q",
  },
  {
    id: "garuda-breaking",
    label: "Garuda TV · Breaking News",
    videoId: "cAhGxenukeo",
  },
  {
    id: "garuda-halim",
    label: "Garuda TV · Halim / Krakatau",
    videoId: "yXyAjwi7dHo",
  },
  {
    id: "garuda-channel",
    label: "Garuda TV (channel live)",
    channelId: "UCmXp0n4Oq8DGzjRZj3EvG4Q",
  },
  {
    id: "nusantara-live",
    label: "Nusantara TV live",
    videoId: "OP9MloieXYw",
    channelId: "UCAMpZJJNQPZ6q7ZYKJV1igQ",
  },
  {
    id: "nusantara-krakatau",
    label: "Nusantara · Erupsi Anak Krakatau",
    videoId: "8ndkO6gEeaQ",
  },
  {
    id: "nusantara-ratas",
    label: "Nusantara · Ratas Bencana",
    videoId: "FqZ3Z874T5I",
  },
  {
    id: "nusantara-suara",
    label: "Nusantara · Suara Nusantara",
    videoId: "XSSw7jUJFpc",
  },
  {
    id: "nusantara-channel",
    label: "Nusantara TV (channel live)",
    channelId: "UCAMpZJJNQPZ6q7ZYKJV1igQ",
  },
  {
    id: "btv-live",
    label: "BTV live · Arah Baru Informasi",
    videoId: "bWS6nvXQUlM",
    channelId: "UCo6NXGgBiaXcvdF2vHXGB4A",
  },
  {
    id: "btv-krakatau",
    label: "BTV · Breaking Krakatau",
    videoId: "Ocl-8-xlGZc",
  },
  {
    id: "btv-dampak",
    label: "BTV · Dampak Erupsi",
    videoId: "1lrIncJ8szQ",
  },
  {
    id: "btv-channel",
    label: "BTV (channel live)",
    channelId: "UCo6NXGgBiaXcvdF2vHXGB4A",
  },
  {
    id: "beritasatu-breaking",
    label: "BeritaSatu · Breaking News",
    videoId: "UYFL-2TPfWw",
    channelId: "UCqLsfkQSM0yfyGvONAGWd3Q",
  },
  {
    id: "beritasatu-channel",
    label: "BeritaSatu (channel live)",
    channelId: "UCqLsfkQSM0yfyGvONAGWd3Q",
  },

  /* —— Internasional —— */
  {
    id: "aje",
    label: "Al Jazeera English",
    videoId: "gCNeDWCI0vo",
    channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg",
  },
  {
    id: "sky",
    label: "Sky News",
    videoId: "YDvsBbKfLPA",
    channelId: "UCoMdktPbMcKghW4a1tJxQxg",
  },
  {
    id: "france24",
    label: "France 24",
    videoId: "Ap-UM1O9RBU",
    channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg",
  },
  {
    id: "dw",
    label: "DW News",
    videoId: "LuKwFajn37U",
    channelId: "UCknLrEdhRCp1aegoBwRoMZQ",
  },
  {
    id: "euronews",
    label: "Euronews",
    videoId: "pykpO5kQJ98",
    channelId: "UCSrZ3UV4jMd8ug_E7HjWMsQ",
  },
];

/** Susun opsi: preferred dulu, lalu sisa katalog (tanpa duplikat). */
function optionsWithDefaults(...preferredIds: string[]): TvStreamOption[] {
  const byId = new Map(TV_STREAM_CATALOG.map((s) => [s.id, s]));
  const preferred = preferredIds
    .map((id) => byId.get(id))
    .filter((s): s is TvStreamOption => Boolean(s));
  const rest = TV_STREAM_CATALOG.filter((s) => !preferredIds.includes(s.id));
  return [...preferred, ...rest];
}

/**
 * 8 slot wall — Garuda / Nusantara / BTV mengganti slot extra.
 * Tiap menu tetap punya banyak opsi cadangan.
 */
export const TV_CATEGORIES: TvCategory[] = [
  {
    id: "tvone",
    title: "TV One",
    hint: "Beberapa link live · ganti jika mati",
    options: optionsWithDefaults(
      "tvone-24jam",
      "tvone-channel",
      "cnnid-24jam",
      "kompas-24jam",
      "metro-24jam",
      "inews-24jam",
      "sindo-24jam",
      "cnbc-channel",
    ),
  },
  {
    id: "kompas",
    title: "Kompas TV",
    hint: "Nasional + regional · ganti jika mati",
    options: optionsWithDefaults(
      "kompas-24jam",
      "kompas-channel",
      "kompas-merauke",
      "kompas-makassar",
      "kompas-medan",
      "cnnid-24jam",
      "tvone-24jam",
      "metro-24jam",
      "inews-24jam",
    ),
  },
  {
    id: "tvri",
    title: "TVRI",
    hint: "Channel live + cadangan nasional",
    options: optionsWithDefaults(
      "tvri-channel",
      "kompas-24jam",
      "metro-24jam",
      "tvone-24jam",
      "cnnid-24jam",
      "inews-24jam",
    ),
  },
  {
    id: "metro",
    title: "MetroTV",
    hint: "Banyak live Metro · coba opsi lain jika mati",
    options: optionsWithDefaults(
      "metro-channel",
      "metro-24jam",
      "metro-bn-raker",
      "metro-bn-rdp",
      "metro-lambe",
      "cnnid-24jam",
      "kompas-24jam",
      "tvone-24jam",
      "inews-24jam",
      "sindo-24jam",
      "cnbc-channel",
    ),
  },
  {
    id: "cnn",
    title: "CNN Indonesia",
    hint: "CNN + cadangan berita nasional",
    options: optionsWithDefaults(
      "cnnid-24jam",
      "cnnid-channel",
      "cnbc-channel",
      "inews-24jam",
      "inews-sumut",
      "inews-jatim",
      "sindo-24jam",
      "kompas-24jam",
      "tvone-24jam",
      "metro-24jam",
    ),
  },
  {
    id: "garuda",
    title: "Garuda TV",
    hint: "Live + breaking · ganti jika mati",
    options: optionsWithDefaults(
      "garuda-breaking",
      "garuda-halim",
      "garuda-live",
      "garuda-channel",
      "nusantara-krakatau",
      "btv-dampak",
      "cnnid-24jam",
      "metro-24jam",
      "kompas-24jam",
      "tvone-24jam",
    ),
  },
  {
    id: "nusantara",
    title: "Nusantara TV",
    hint: "Live + breaking · ganti jika mati",
    options: optionsWithDefaults(
      "nusantara-krakatau",
      "nusantara-ratas",
      "nusantara-suara",
      "nusantara-live",
      "nusantara-channel",
      "garuda-breaking",
      "btv-dampak",
      "kompas-24jam",
      "cnnid-24jam",
      "metro-24jam",
    ),
  },
  {
    id: "btv",
    title: "BTV",
    hint: "BTV + BeritaSatu · ganti jika mati",
    options: optionsWithDefaults(
      "btv-dampak",
      "btv-live",
      "btv-krakatau",
      "beritasatu-breaking",
      "btv-channel",
      "beritasatu-channel",
      "garuda-breaking",
      "nusantara-krakatau",
      "cnbc-channel",
      "cnnid-24jam",
    ),
  },
];

export function emptyPlayingState(): Record<TvCategoryId, boolean> {
  return Object.fromEntries(
    TV_CATEGORIES.map((c) => [c.id, false]),
  ) as Record<TvCategoryId, boolean>;
}

export function allPlayingState(on = true): Record<TvCategoryId, boolean> {
  return Object.fromEntries(
    TV_CATEGORIES.map((c) => [c.id, on]),
  ) as Record<TvCategoryId, boolean>;
}

export function nextOptionId(
  catId: TvCategoryId,
  currentId: string,
): string {
  const cat = TV_CATEGORIES.find((c) => c.id === catId);
  if (!cat?.options.length) return currentId;
  const idx = cat.options.findIndex((o) => o.id === currentId);
  const next = cat.options[(idx + 1) % cat.options.length];
  return next?.id ?? cat.options[0].id;
}

export function embedUrl(opt: TvStreamOption, autoplay: boolean): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (opt.videoId) {
    return `https://www.youtube.com/embed/${opt.videoId}?${params}`;
  }
  if (opt.channelId) {
    return `https://www.youtube.com/embed/live_stream?channel=${opt.channelId}&${params}`;
  }
  return "";
}

export function watchUrl(opt: TvStreamOption): string {
  if (opt.videoId) return `https://www.youtube.com/watch?v=${opt.videoId}`;
  if (opt.channelId) return `https://www.youtube.com/channel/${opt.channelId}/live`;
  return "https://www.youtube.com";
}
