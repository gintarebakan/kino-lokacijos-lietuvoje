import { Outlet, Link, createRootRouteWithContext, useLocation } from "@tanstack/react-router";
import { type QueryClient } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense } from "react";

import { AppSidebar } from "../components/AppSidebar";
import MapViewer from "../components/map/MapViewer";
import SearchBar from "../components/map/SearchBar";
import LocationDetailPanel from "../components/panels/LocationDetailPanel";
import FilmDetailPanel from "../components/panels/FilmDetailPanel";
import CollectionDetailPanel from "../components/panels/CollectionDetailPanel";

const SavedPageDirect = lazy(() => import("../pages/SavedPage"));

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "var(--color-bg-primary)" }}>
      <div style={{ maxWidth: 448, textAlign: "center" }}>
        <h1 style={{ color: "var(--color-gold)", fontFamily: "Georgia, serif", fontSize: "5rem" }}>404</h1>
        <h2 style={{ marginTop: 16, fontSize: "1.25rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Puslapis nerastas
        </h2>
        <p style={{ marginTop: 8, fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Puslapis neegzistuoja arba buvo perkeltas.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, padding: "8px 16px", fontSize: "0.875rem", fontWeight: 500, background: "var(--color-gold)", color: "var(--color-bg-primary)", textDecoration: "none" }}>
            I pradzia
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const location = useLocation();
  const isMapRoute = location.pathname === "/map";
  const isSavedRoute = location.pathname === "/saved";
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const contentStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: isDesktop ? 72 : 0,
    right: 0,
    bottom: isDesktop ? 0 : 64,
    overflow: "hidden",
  };

  return (
    <div style={{ width: "100%", height: "100dvh", background: "var(--color-bg-primary)" }}>
      <AppSidebar />
      <div style={contentStyle}>

        {/* Persistent map layer — visible on /map and /saved */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          visibility: (isMapRoute || isSavedRoute) ? "visible" : "hidden",
          pointerEvents: (isMapRoute || isSavedRoute) ? "auto" : "none",
          zIndex: (isMapRoute || isSavedRoute) ? 1 : 0,
        }}>
          <MapViewer />
          {isMapRoute && <SearchBar />}
          {isMapRoute && <LocationDetailPanel />}
          {isMapRoute && <FilmDetailPanel />}
          {isMapRoute && <CollectionDetailPanel />}
        </div>

        {/* SavedPage sidebar overlay on /saved */}
        {isSavedRoute && (
          <Suspense fallback={null}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 360, zIndex: 30, background: "#0a0a0a", borderRight: "1px solid #222222" }}>
              <SavedPageDirect />
            </div>
          </Suspense>
        )}

        {/* Other routes — Atradimai etc */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          visibility: (isMapRoute || isSavedRoute) ? "hidden" : "visible",
          zIndex: (isMapRoute || isSavedRoute) ? 0 : 2,
          overflowY: "auto",
          overflowX: "hidden",
        }}>
          <Outlet />
        </div>

      </div>
    </div>
  );
}
