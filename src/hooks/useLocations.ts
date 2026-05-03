import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Point } from "geojson";
import { supabase } from "../lib/supabase";
import type { LocationProperties } from "../types/locations";

export type LocationsCollection = FeatureCollection<Point, LocationProperties>;

interface LocationRow {
  id: string;
  name: string;
  slug: string | null;
  county: string | null;
  location_type: string | null;
  image_url: string | null;
  lng: number;
  lat: number;
}

async function fetchLocationsGeoJson(): Promise<LocationsCollection> {
  const { data, error } = await supabase
    .from("locations_geojson")
    .select("id, name, slug, county, location_type, image_url, lng, lat");

  if (error) throw error;

  const rows = (data ?? []) as LocationRow[];

  return {
    type: "FeatureCollection",
    features: rows
      .filter(
        (loc) =>
          typeof loc.lng === "number" &&
          typeof loc.lat === "number" &&
          !!loc.slug,
      )
      .map((loc) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [loc.lng, loc.lat],
        },
        properties: {
          // Use slug as the canonical id so map selection state matches what
          // LocationDetailPanel queries by (locations_lt.slug).
          id: loc.slug as string,
          name: loc.name,
          slug: loc.slug ?? undefined,
          county: loc.county ?? undefined,
          location_type: loc.location_type ?? "",
          image_url: loc.image_url ?? undefined,
        },
      })),
  };
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations", "geojson"],
    queryFn: fetchLocationsGeoJson,
    staleTime: 5 * 60 * 1000,
  });
}
