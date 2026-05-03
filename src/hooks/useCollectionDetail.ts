import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface CollectionDetail {
  id: string;
  title: string;
  slug: string | null;  // ← add this
  description: string | null;
  cover_url: string | null;
  is_route: boolean | null;
  collection_locations: CollectionLocation[];
}

export interface CollectionLocation {
  order_index: number | null;
  locations_lt: {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    county: string | null;
    lng: number | null;
    lat: number | null;
  } | null;
}

export interface CollectionDetail {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_route: boolean | null;
  collection_locations: CollectionLocation[];
}

export function useCollectionDetail(id: string | null) {
  return useQuery<CollectionDetail | null>({
    queryKey: ["collection-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: collection, error: collErr } = await supabase
        .from("collections_curated")
        .select("id, title, slug, description, cover_url, is_route")
        .eq("id", id as string)
        .single();
      if (collErr) throw collErr;

      const { data: clRows, error: clErr } = await supabase
        .from("collection_locations")
        .select("location_id, order_index")
        .eq("collection_id", id as string)
        .order("order_index", { ascending: true });
      if (clErr) throw clErr;

      if (!clRows || clRows.length === 0) {
        return { ...collection, collection_locations: [] } as CollectionDetail;
      }

      const locationIds = clRows.map((r: any) => r.location_id);

      const { data: locs, error: locErr } = await supabase
        .rpc("get_locations_with_coords", { location_ids: locationIds });
      if (locErr) throw locErr;

      const collection_locations: CollectionLocation[] = clRows.map((cl: any) => ({
        order_index: cl.order_index,
        locations_lt: locs?.find((l: any) => l.id === cl.location_id) ?? null,
      }));

      return { ...collection, collection_locations } as CollectionDetail;
    },
  });
}