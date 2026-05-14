import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMapStore } from "../stores/mapStore";
import { supabase } from "../lib/supabase";
import CollectionDetailPanel from "../components/panels/CollectionDetailPanel";

export const Route = createFileRoute("/route/$slug")({
  component: RouteSharePage,
});

function RouteSharePage() {
  const { slug } = Route.useParams();
  const setSelectedCollection = useMapStore((s) => s.setSelectedCollection);

  useEffect(() => {
    // Resolve slug → id, then set in mapStore
    supabase
      .from("collections_curated")
      .select("id")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data) setSelectedCollection(data.id);
      });
  }, [slug]);

  return (
    <div style={{ display: "flex", height: "100dvh" }}>
      <CollectionDetailPanel />
    </div>
  );
}
