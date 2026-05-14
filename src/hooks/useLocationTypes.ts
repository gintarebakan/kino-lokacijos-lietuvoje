// useLocationTypes.ts
// Dinamiškai gauna unikalius location_type iš DB
// Naudojamas SearchBar filtro "Lokacijos tipas" sekcijai

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useLocationTypes(): string[] {
  const { data } = useQuery<string[]>({
    queryKey: ["location-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations_lt")
        .select("location_type")
        .not("location_type", "is", null);
      if (error) throw error;
      const unique = Array.from(
        new Set(
          (data ?? []).map((r: { location_type: string }) => r.location_type).filter(Boolean),
        ),
      ).sort() as string[];
      return unique;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
  return data ?? [];
}
