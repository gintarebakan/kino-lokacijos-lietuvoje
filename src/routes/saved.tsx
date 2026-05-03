import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const SavedPage = lazy(() => import("../pages/SavedPage"));

export const Route = createFileRoute("/saved")({
  component: SavedRoute,
});

function SavedRoute() {
  return (
    <Suspense fallback={<div className="w-full h-full" style={{ background: "var(--color-bg-primary)" }} />}>
      <SavedPage />
    </Suspense>
  );
}