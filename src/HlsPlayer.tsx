import { useEffect, useRef } from "react";

export default function HlsPlayer({
  src,
  title,
}: {
  src: string;
  title: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let destroyed = false;
    let hls: { destroy: () => void } | undefined;
    const playSrc = `/hls?u=${encodeURIComponent(src)}`;

    const tryPlay = () => {
      void video.play().catch(() => {
        /* autoplay may be blocked until user gesture */
      });
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = playSrc;
      tryPlay();
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    void import("hls.js").then(({ default: Hls }) => {
      if (destroyed || !Hls.isSupported()) return;
      const instance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      });
      hls = instance;
      instance.loadSource(playSrc);
      instance.attachMedia(video);
      instance.on(Hls.Events.MANIFEST_PARSED, tryPlay);
    });

    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      title={title}
      muted
      autoPlay
      playsInline
      controls={false}
    />
  );
}
