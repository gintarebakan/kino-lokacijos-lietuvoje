import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

async function fetchGenres(): Promise<string[]> {
  const { data, error } = await supabase.from("films_tmdb").select("genre");
  if (error) throw error;
  const all = (data ?? []).flatMap(
    (row: { genre: string[] | null }) => row.genre ?? [],
  );
  return [...new Set(all)].filter(Boolean).sort();
}

export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
    staleTime: 60 * 60 * 1000,
  });
}
