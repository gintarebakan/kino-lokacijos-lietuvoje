//useLocationDetail.ts - enciklopedija
//Žemėlapyje atsirado taškas, vartotojas jį paspaudė
//reikia visų įmanomų detalių apie tą vietą

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface FilmTmdb {
  id: string;
  tmdb_id: number | null;
  title_lt: string | null;
  media_type: string | null;
  year: number | null;
  imdb_rating: number | null;
  imdb_url: string | null;
  poster_url: string | null;
  trailer_key: string | null;
  description: string | null;
  genre: string[] | null;
  director: string | null;
  actors: string[] | null;
}

export interface FilmLocation {
  id: string;
  fictional_name: string | null;
  scene_desc: string | null;
  scene_facts: string | null;
  scene_images: string[] | null;
  scene_significance: string | null;
  films_tmdb: FilmTmdb | null;
}

export interface LocationDetail {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  county: string | null;
  location_type: string | null;
  description: string | null;
  curator_notes: string | null;
  accessibility: string | null;
  image_url: string | null;
  official_website_url: string | null;
  street_view_url: string | null;
  coordinates: string | null;
  film_locations: FilmLocation[] | null;
}

//Nested Join iš Supabase surenka informaciją iš 3 skirtingų lentelių
//sukonstruoja gilų objektą Sidebar'ui/atskiram puslapiui
async function fetchLocationDetail(slug: string): Promise<LocationDetail | null> {
  const { data, error } = await supabase
    .from("locations_lt")
    .select(
      `id, name, slug, address, county, location_type, description, curator_notes, accessibility, image_url, official_website_url, street_view_url, coordinates,
      film_locations (
         id, fictional_name, scene_desc, scene_facts, scene_images, scene_significance,
         films_tmdb (
           id, tmdb_id, title_lt, media_type, year, imdb_rating, imdb_url, poster_url, trailer_key, description, genre, director, actors
         )
       )`,
    )
    //kai ieškojome lokacijų sąrašo, naudojome filtrus (.in(), .or()). čia mes ieškome tiksliai
    .eq("slug", slug) //stabdom paiešką kai randam tą ID(slug) įrašą, kuris atitinka vartotojo paspaustą
    .maybeSingle(); //jei nėra-null, ir ''vieta nerasta''

  if (error) throw error;
  return (data as unknown as LocationDetail) ?? null;
}

export function useLocationDetail(slug: string | null) {
  return useQuery({
    queryKey: ["location-detail", slug],
    queryFn: () => fetchLocationDetail(slug as string),
    enabled: !!slug, //hook'as miega kol vartotojas nepaspaudžia ant konkretaus žymeklio
    //5min
    staleTime: 5 * 60 * 1000,
  });
}
