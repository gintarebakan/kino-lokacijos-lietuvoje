import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const DiscoverPage = lazy(() => import("../pages/DiscoverPage"));

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Suspense fallback={<div className="w-full h-full" style={{ background: "var(--color-bg-primary)" }} />}>
      <DiscoverPage />
    </Suspense>
  );
}