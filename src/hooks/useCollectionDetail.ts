//useCollectionDetail - kolekcijos pavadinimas+kolekcijos vidus

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface CollectionDetail {
  //apsibrėžiame kolekcijos taisykles COLLECTIONS_CURATED
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  cover_url: string | null;
  is_route: boolean | null;
  collection_locations: CollectionLocation[]; //sarasas su paciomis lokacijomis
}

export interface CollectionLocation {
  //COLLECTION_LOCATIONS
  order_index: number | null;
  locations_lt: {
    //LOCATIONS_LT
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    county: string | null;
    lng: number | null;
    lat: number | null;
  } | null;
}

export function useCollectionDetail(id: string | null) {
  //funkciją, kuriai paduodame kolekcijos ID
  return useQuery<CollectionDetail | null>({
    //TanStack Query vykdo šią užduotį
    queryKey: ["collection-detail", id], //TanStack Query iš čia ims nepasenusius duomenis
    enabled: !!id, //jei nėra užklausos - nieko ir nedarom
    queryFn: async () => {
      //pradzia
      //1 paimame kolekcijų aprašymą

      const { data: collection, error: collErr } = await supabase
        .from("collections_curated") //ieskom ID iraso specifinio (paimam maršruto pavadinimą)
        .select("id, title, slug, description, cover_url, is_route")
        .eq("id", id as string)
        .single();
      if (collErr) throw collErr;

      //2 paimamae lokacijų eiliškumą
      const { data: clRows, error: clErr } = await supabase
        .from("collection_locations") //Kuri lokacija, kuriai kolekcijai priklauso, ir KELINTA ji yra sąraše (kiek čia lokacijų)
        .select("location_id, order_index")
        .eq("collection_id", id as string)
        .order("order_index", { ascending: true });
      if (clErr) throw clErr;

      if (!clRows || clRows.length === 0) {
        return { ...collection, collection_locations: [] } as CollectionDetail;
      }
      //paimamae pačias lokacijas
      const locationIds = clRows.map((r: any) => r.location_id);

      const { data: locs, error: locErr } = await supabase.rpc("get_locations_with_coords", {
        location_ids: locationIds,
      }); //supabase RPC - ištraukti lokaciją su koordinatėmis
      if (locErr) throw locErr;

      //surenkame ir atiduodame
      const collection_locations: CollectionLocation[] = clRows.map((cl: any) => ({
        order_index: cl.order_index, //atneštoms lokacijoms (locs) priskiriam jos eilės numerį
        locations_lt: locs?.find((l: any) => l.id === cl.location_id) ?? null,
      }));

      return { ...collection, collection_locations } as CollectionDetail; //įdedam tą sarašą į pačią pirmą kolekciją
    },
  });
}
//procesas užrakintas useCollectionDetail(id)
//const { data, isLoading } = useCollectionDetail("123");
