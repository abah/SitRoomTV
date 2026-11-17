import { useEffect, useState } from "react";
import { resolveRoute, type AppRoute } from "@/lib/pages";

export function usePath(): {
  path: AppRoute;
  navigate: (to: AppRoute) => void;
} {
  const [path, setPath] = useState<AppRoute>(() =>
    typeof window === "undefined" ? "/" : resolveRoute(window.location.pathname),
  );

  useEffect(() => {
    const onPop = () => setPath(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(to: AppRoute) {
    if (window.location.pathname !== to) {
      window.history.pushState({}, "", to);
    }
    setPath(to);
  }

  return { path, navigate };
}
