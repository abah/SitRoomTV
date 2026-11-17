import { PAGES, type AppRoute } from "@/lib/pages";

export default function SiteNav({
  active,
  onNavigate,
}: {
  active: AppRoute;
  onNavigate: (to: AppRoute) => void;
}) {
  return (
    <nav className="site-nav" aria-label="Menu halaman">
      {(Object.keys(PAGES) as AppRoute[]).map((route) => {
        const page = PAGES[route];
        const isActive = active === route;
        return (
          <button
            key={route}
            type="button"
            className={isActive ? "site-nav__link site-nav__link--active" : "site-nav__link"}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onNavigate(route)}
          >
            {page.navLabel}
          </button>
        );
      })}
    </nav>
  );
}
