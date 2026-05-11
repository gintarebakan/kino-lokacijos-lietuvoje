import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const InfoIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="8.5" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="11" x2="12" y2="16" />
  </svg>
);

const LocationsIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const FilmIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
    <line x1="7" y1="2" x2="7" y2="22"/>
    <line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/>
    <line x1="17" y1="17" x2="22" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
  </svg>
);

const HomeIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
    <polyline points="9 21 9 12 15 12 15 21" />
  </svg>
);

// Žemėlapio ikona — fold lines stilius
const MapIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const BookmarkIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 3H15C15.6 3 16 3.4 16 4V18L10 14L4 18V4C4 3.4 4.4 3 5 3Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const items: NavItem[] = [
  { to: "/about",     label: "Apie",       icon: InfoIcon },
  { to: "/locations", label: "Lokacijos",  icon: LocationsIcon },
  { to: "/films",     label: "Turinys",    icon: FilmIcon },
  { to: "/",          label: "Pagrindinis",icon: HomeIcon },
  { to: "/map",       label: "Žemėlapis",  icon: MapIcon },
  { to: "/saved",     label: "Išsaugota",  icon: BookmarkIcon },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) {
    return (
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100dvh",
          width: "72px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 40,
          background: "var(--color-bg-primary)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, paddingBottom: 16 }}>
          <span style={{ fontFamily: "Georgia, serif", color: "var(--color-gold)", fontSize: "28px", letterSpacing: "0.15em", lineHeight: 1 }}>
            CM
          </span>
        </div>
        <div style={{ width: 32, height: 1, background: "#1a1a1a" }} />
        <nav style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 50 }}>
          {items.map((item) => {
            const active = item.to === "/" ? currentPath === "/" : currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as any}
                style={{
                  height: "56px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderLeft: active ? "2px solid var(--color-gold)" : "2px solid transparent",
                  background: active ? "rgba(201,168,76,0.08)" : "transparent",
                  color: active ? "var(--color-gold)" : "#6b7280",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
              >
                {item.icon}
                <span style={{ marginTop: 4, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "flex",
        background: "var(--color-bg-primary)",
        borderTop: "1px solid var(--color-border)",
        height: "64px",
      }}
    >
      {items.map((item) => {
        const active = item.to === "/" ? currentPath === "/" : currentPath.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to as any}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderTop: active ? "2px solid var(--color-gold)" : "2px solid transparent",
              background: active ? "rgba(201,168,76,0.08)" : "transparent",
              color: active ? "var(--color-gold)" : "#6b7280",
              textDecoration: "none",
            }}
          >
            {item.icon}
            <span style={{ marginTop: 2, fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
