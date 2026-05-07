//useLocations.ts - kiek iš viso LT turi tų taškų

import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Point } from "geojson";
import { supabase } from "../lib/supabase";
import type { LocationProperties } from "../types/locations";

export type LocationsCollection = FeatureCollection<Point, LocationProperties>;
//LocationRow yra taisyklė, aprašanti, kokie duomenys atkeliaus iš duomenų bazės
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
//paima duomenis iš Supabase ir juos perpakuoja žemėlapiui.
async function fetchLocationsGeoJson(): Promise<LocationsCollection> {//sukurs standartinį žemėlapio taškų rinkinį
  //kreipiamės į duomenų bazę
  const { data, error } = await supabase
    .from("locations_geojson") //imame iš View lentelės
    .select("id, name, slug, county, location_type, image_url, lng, lat");

  if (error) throw error;

  const rows = (data ?? []) as LocationRow[];

  //^ paprašėme duomenų bazės atsiųsti visus Lietuvos taškus. 
  // Grįžta paprastas sąrašas (lentelė).

  return {
    type: "FeatureCollection", //taškų nurodyta kolekcija
    features: rows
    //saugiklis - filtravimas, išmeta lokacijas jei neturi koordinačių
      .filter(
        (loc) =>
          typeof loc.lng === "number" &&
          typeof loc.lat === "number" &&
          !!loc.slug,
      )
      //map - iš db eilutės suformuoja GeoJSON objektą
      .map((loc) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [loc.lng, loc.lat],
          //įdedame koordinates ten, kur žemėlapis jų ieško
        },
        properties: {//likusi informacija
         
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
    queryKey: ["locations", "geojson"],//užvadinam
    queryFn: fetchLocationsGeoJson, //kviečiam ankstesnę f-ją
    staleTime: 5 * 60 * 1000,
  });
}
