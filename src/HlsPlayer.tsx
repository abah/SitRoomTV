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

    void import("hls.js").then(({ default: Hls }) => {
      if (destroyed) return;

      if (Hls.isSupported()) {
        const instance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 20,
          liveSyncDurationCount: 3,
          capLevelToPlayerSize: true,
          manifestLoadingTimeOut: 15000,
          fragLoadingTimeOut: 20000,
        });
        hls = instance;
        instance.on(
          Hls.Events.ERROR,
          (_event: unknown, data: { fatal?: boolean; type?: string }) => {
            if (!data?.fatal) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              instance.startLoad();
              return;
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              instance.recoverMediaError();
              return;
            }
            instance.destroy();
          },
        );
        instance.on(Hls.Events.MANIFEST_PARSED, tryPlay);
        instance.loadSource(playSrc);
        instance.attachMedia(video);
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playSrc;
        tryPlay();
      }
    });

    return () => {
      destroyed = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
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
