//iš duomenų bazės, 
//peržiūrėti visus filmų įmanomus žanrus ir atspausdinti vieną sąrašą vartotojo filtrui

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

async function fetchGenres(): Promise<string[]> {
  //Užuot atsisiuntus visą filmų informaciją imam vieną stulpelį – genre
  const { data, error } = await supabase.from("films_tmdb").select("genre");
  if (error) throw error;
  const all = (data ?? []).flatMap( //.flatMap ištraukia visus žanrus iš vidinių masyvų ir pateikia vieną ilgą tekstą
    (row: { genre: string[] | null }) => row.genre ?? [],
  );
  return [...new Set(all)].filter(Boolean).sort();//new Set(all) JS funkcija, kuri automatiškai ištrina visus dublikatus
}//.filter(Boolean) saugiklis, kuris išmeta visokias šiukšles
//.sort() surikiuojam nuo A iki Z

//ilgesnis podėliavimas - 1h
//Hook'as vieną kartą parsisiunčia žanrų sąrašą ir nebetrukdo duomenų bazės
export function useGenres() {
  return useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
    staleTime: 60 * 60 * 1000,
  });
}
