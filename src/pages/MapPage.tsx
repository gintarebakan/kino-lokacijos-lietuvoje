import { useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { useMapStore } from "../stores/mapStore";
import { supabase } from "../lib/supabase";

export default function MapPage() {
  const search = useSearch({ from: "/map" });

  useEffect(() => {
    const s = search as Record<string, string>;

    if (s.location) {
      useMapStore.getState().setPendingLocation(s.location);
      useMapStore.getState().setSelectedLocation(s.location);
    }

    if (s.collection) {
      supabase
        .from("collections_curated")
        .select("id")
        .eq("slug", s.collection)
        .single()
        .then(({ data }) => {
          if (data) useMapStore.getState().setSelectedCollection(data.id);
        });
    }
  }, []);

  return null;
}
