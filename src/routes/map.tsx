import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const MapPage = lazy(() => import("../pages/MapPage"));

export const Route = createFileRoute("/map")({
  component: MapRoute,
});

function MapRoute() {
  return (
    <Suspense
      fallback={<div className="w-full h-full" style={{ background: "var(--color-bg-primary)" }} />}
    >
      <MapPage />
    </Suspense>
  );
}
