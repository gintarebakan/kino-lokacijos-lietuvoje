//useFilteredLocations - filterstore+supabase

import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Point } from "geojson";
import { supabase } from "../lib/supabase";
import type { LocationProperties } from "../types/locations";
import { useFilterStore } from "../stores/filterStore";

//Prieš pradedant siųsti užklausas į duomenų bazę,
//apsibrėžiame 5 skirtingus interface (brėžinius).

export type LocationsCollection = FeatureCollection<Point, LocationProperties>;

interface FilmTmdbLite {//paties filmo informacija
  id?: string;
  title_lt?: string | null;
  media_type: string | null;
  year: number | null;
  genre: string[] | null;
  imdb_rating: number | null;
  studio: string | null;
  poster_url?: string | null;
}

interface FilmLocationLite {//tarpinė lentelė - scene_signf+filmo tmdb
  scene_significance?: string | null;
  films_tmdb: FilmTmdbLite | null;
}

interface LocationRow {//geografinė lokacija
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

interface GeoRow {//locations_geojson View komponentui
  slug: string;
  lng: number;
  lat: number;
  name: string;
  location_type: string | null;
  image_url: string | null;
}

interface ActiveFilters {//FILTRO TAISYKLĖS
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

//NESTED JOINS
//funkcija fetchFiltered sukuria bazinę/tuščią užklausą
//nurodant duomenų bazei, kokio gylio informacijos mums reikės, kai rasime tinkamas lokacijas
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

//-----------------------------------------------server-side filtering
//Dabar kodas žiūri į filtrus

// pvz 1. Kodas mato, kad ["Vilniaus"].length >
  if (filters.selectedCounties.length > 0) {
    const countyFilters = filters.selectedCounties
      .map((c) => `county.ilike.${c.toLowerCase()} apskritis`)
      .join(",");


    query = query.or(countyFilters);
  }
//pvz 2. Prie užklausos priklijuojama sąlyga: ieškoti TIK Vilniaus apskrityje
  if (filters.selectedLocationTypes.length > 0) {
    query = query.in("location_type", filters.selectedLocationTypes);
  }
// pvz ... (lokacijos tipo filtras praleidžiamas, nes jis tuščias)

//išsiunčiam į DB
  const { data, error } = await query;
  if (error) throw error;

  //pvz 4. data dabar turi VISAS lokacijas, esančias tik Vilniaus apskrityje.

  let filtered = (data ?? []) as unknown as LocationRow[];


//---------------------------------------client-side filtering

//turime lokacijų sąrašą (pvz., 50 vietų) savo naršyklės atmintyje (filtered kintamajame).
//atrenkame per JS filtrus

//pvz 1. Kodas mato, kad ["Drama"].length > 0
  if (filters.selectedGenres.length > 0) {
    //pvz 2. Perrašome "filtered" sąrašą, palikdami tik tas lokacijas...
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some((fl) =>
        // ...kurių filmų žanrų sąraše yra "Drama"
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

//pvz 1. Kodas mato, kad yearFrom (1990) arba yearTo (2021) egzistuoja
  if (filters.yearFrom || filters.yearTo) {
    //pvz 2. Vėl filtruojame tą patį likusį 20 lokacijų sąrašą
    filtered = filtered.filter((loc) =>
      loc.film_locations?.some((fl) => {
        const year = fl.films_tmdb?.year;
        if (!year) return false;
        //pvz Jei filmas sukurtas prieš 1990 - išmetam (return false)
        if (filters.yearFrom && year < filters.yearFrom) return false;
        //pvz Jei filmas sukurtas po 2021 - išmetam (return false)
        if (filters.yearTo && year > filters.yearTo) return false;
        //pvz Jei tinka - paliekam
        return true;
      }),
    );
  }

//VIEW lentelė
//išfiltruojam sąrašą ir sužinom, lokacijų ID numerius (slugs), kurie atitinka filtrus
//kreipiamės į View komponentą koordinačių gavimui
//pvz 1. Ištraukiame 5 lokacijų ID numerius (slugs)
  const slugs = filtered.map((l) => l.slug).filter((s): s is string => !!s);

  if (slugs.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }
// susisiekiam su VIEW lentele ir išverčiam tik tų lokacijų koordinates iš PostGIS į skaičius
  const { data: geoData, error: geoError } = await supabase
    .from("locations_geojson")//PostGIS konvertavimas
    .select("slug, lng, lat, name, location_type, image_url")
    .in("slug", slugs);// Paduodame masyvą su 5 ID.

  if (geoError) throw geoError;
//MapLibre GL JS žemėlapis neskaito lentelių - reikia GeoJSON.
//[pvz] Pereiname per tas 5 lokacijas (geoData)
  const features = ((geoData ?? []) as GeoRow[])
    .filter((loc) => typeof loc.lng === "number" && typeof loc.lat === "number")
    .map((loc) => ({
      type: "Feature" as const,// MapLibre reikalauja
      geometry: {
        type: "Point" as const,
        coordinates: [loc.lng, loc.lat] as [number, number],// Įdedame koordinates
        //FeatureCollection sudeda koordinates ten, kur žemėlapis tikisi jas rasti (geometry)
      },
      properties: { //visą papildomą informaciją (pavadinimą, nuotrauką) įdedam į properties
        // Įdedame visą kitą info, kuri bus rodoma vartotojui paspaudus žymeklį
        id: loc.slug,
        name: loc.name,
        slug: loc.slug,
        location_type: loc.location_type ?? "",
        image_url: loc.image_url ?? undefined,
      },
    }));
// Grąžiname galutinį, paruoštą paketą atgal į React
  return { type: "FeatureCollection", features };
}
//----------------------------------------------jungimas
export function useFilteredLocations() { //jungiam filterStore kartu su Supabase
  // 1. Zustand paima naujus filtrus pvz:
  // selectedCounties: ["Vilniaus"], selectedGenres: ["Drama"], yearFrom: 1990, yearTo: 2021
  const filters = useFilterStore((s) => ({ //paimamae filtrus
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
    // 2. Kadangi filtras pasikeitė, TanStack Query sukuria naują paiešką
    queryKey: ["locations", "filtered", filters], //kiekvieną kartą, kai vartotojas patraukia reitingo slankiklį ar paspaudžia žanrą, šis raktas pasikeičia
    queryFn: () => fetchFiltered(filters), //TanStack Query tai pamato ir automatiškai iš naujo iškviečia paieškos funkciją
    enabled: hasActive,//dirba tik tada, kai yra bent vienas aktyvus filtras
    staleTime: 60 * 1000,
  });
}
