import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Point } from "geojson";
import { supabase } from "../lib/supabase";
import type { LocationProperties } from "../types/locations";
import { useFilterStore } from "../stores/filterStore";

export type LocationsCollection = FeatureCollection<Point, LocationProperties>;

interface FilmTmdbLite {
  id?: string;
  title_lt?: string | null;
  media_type: string | null;
  year: number | null;
  genre: string[] | null;
  imdb_rating: number | null;
  studio: string | null;
  poster_url?: string | null;
}

interface FilmLocationLite {
  scene_significance?: string | null;
  films_tmdb: FilmTmdbLite | null;
}

interface LocationRow {
  id: string;
  name: string;
  slug: string | null;
  county: string | null;
  location_type: string | null;
  image_url: string | null;
  official_website_url?: string | null;
  street_view_url?: string | null;
  film_locations: FilmLocationLite[] | null;
}

interface GeoRow {
  slug: string;
  lng: number;
  lat: number;
  name: string;
  location_type: string | null;
  image_url: string | null;
}

interface ActiveFilters {
  selectedGenres: string[];
  selectedMediaTypes: string[];
  studio: string;
  minRating: number;
  maxRating: number;
  yearFrom: number | null;
  yearTo: number | null;
  selectedCounties: string[];
  selectedLocationTypes: string[];
}

async function fetchFiltered(
  filters: ActiveFilters,
): Promise<LocationsCollection> {
  let query = supabase.from("locations_lt").select(
    `id, name, slug, county, location_type,
       image_url, official_website_url, street_view_url,
       film_locations(
         scene_significance,
         films_tmdb(
           id, title_lt, media_type, year, genre,
           imdb_rating, studio, poster_url
         )
       )`,
  );

  if (filters.selectedCounties.length > 0) {
    const countyFilters = filters.selectedCounties
      .map((c) => `county.ilike.${c.toLowerCase()} apskritis`)
      .join(",");
    query = query.or(countyFilters);
  }

  if (filters.selectedLocationTypes.length > 0) {
    query = query.in("location_type", filters.selectedLocationTypes);
  }

  const { data, error } = await query;
  if (error) throw error;

  let filtered = (data ?? []) as unknown as LocationRow[];

  if (filters.selectedGenres.length > 0) {
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some((fl) =>
        fl.films_tmdb?.genre?.some((g) => filters.selectedGenres.includes(g)),
      ),
    );
  }

  if (filters.selectedMediaTypes.length > 0) {
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some(
        (fl) =>
          !!fl.films_tmdb?.media_type &&
          filters.selectedMediaTypes.includes(fl.films_tmdb.media_type),
      ),
    );
  }

  if (filters.studio.trim()) {
    const studioLower = filters.studio.toLowerCase();
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some((fl) =>
        fl.films_tmdb?.studio?.toLowerCase().includes(studioLower),
      ),
    );
  }

  if (filters.minRating > 0 || filters.maxRating < 10) {
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some((fl) => {
        const r = fl.films_tmdb?.imdb_rating;
        if (r == null) return false;
        return r >= filters.minRating && r <= filters.maxRating;
      }),
    );
  }

  if (filters.yearFrom || filters.yearTo) {
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some((fl) => {
        const year = fl.films_tmdb?.year;
        if (!year) return false;
        if (filters.yearFrom && year < filters.yearFrom) return false;
        if (filters.yearTo && year > filters.yearTo) return false;
        return true;
      }),
    );
  }

  const slugs = filtered.map((l) => l.slug).filter((s): s is string => !!s);

  if (slugs.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const { data: geoData, error: geoError } = await supabase
    .from("locations_geojson")
    .select("slug, lng, lat, name, location_type, image_url")
    .in("slug", slugs);

  if (geoError) throw geoError;

  const features = ((geoData ?? []) as GeoRow[])
    .filter((loc) => typeof loc.lng === "number" && typeof loc.lat === "number")
    .map((loc) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [loc.lng, loc.lat] as [number, number],
      },
      properties: {
        id: loc.slug,
        name: loc.name,
        slug: loc.slug,
        location_type: loc.location_type ?? "",
        image_url: loc.image_url ?? undefined,
      },
    }));

  return { type: "FeatureCollection", features };
}

export function useFilteredLocations() {
  const filters = useFilterStore((s) => ({
    selectedGenres: s.selectedGenres,
    selectedMediaTypes: s.selectedMediaTypes,
    studio: s.studio,
    minRating: s.minRating,
    maxRating: s.maxRating,
    yearFrom: s.yearFrom,
    yearTo: s.yearTo,
    selectedCounties: s.selectedCounties,
    selectedLocationTypes: s.selectedLocationTypes,
  }));
  const hasActive = useFilterStore((s) => s.hasActiveFilters)();

  return useQuery({
    queryKey: ["locations", "filtered", filters],
    queryFn: () => fetchFiltered(filters),
    enabled: hasActive,
    staleTime: 60 * 1000,
  });
}
