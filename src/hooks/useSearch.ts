//useSearch.ts

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface SearchResult {
  type: "location" | "film"; //grupuojam į du tipus
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  slug: string | null;
  media_type?: string;
}

async function searchAll(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { data, error } = await supabase.rpc("search_all", { query: trimmed });//tekstinės paieškos variklis
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}

//150 milisekundžių (delay)
//keliaujam į db rezultatus gauti
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useSearch(query: string) {
  const trimmed = query.trim();
  const debounced = useDebounced(trimmed, 150);
  return useQuery({
    queryKey: ["search", debounced],
    queryFn: () => searchAll(debounced),
    enabled: debounced.length >= 2,//bent 2 raidės
    staleTime: 30 * 1000, //kaip greitai rezultatas bus primintas
  });
}
