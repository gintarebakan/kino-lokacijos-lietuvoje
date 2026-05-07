// supabase.ts
//Vienintelis Supabase kliento egzempliorius visame projekte. Sukuriamas vieną kartą ir eksportuojamas kaip supabase konstanta.
//Reikalingas, nes kiekvienas hook'as (useLocations, useSearch, useLocationDetail, etc) turi kviesti Supabase.

import { createClient } from "@supabase/supabase-js";//funkcija, kuri sukurs klientą (užmegs ryšį)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;//nuskaitome adresą
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;//ir leidimą
//kad galėtume pasiekti savo Supabase duomenų bazę
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}//patikra, jei nors vieno trūksta (url+leidimo) metamas error

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
//ištrauktas adresas ir raktas atiduodamas createClient įrankiui,
//kuris sukuria gyvą ryšio kanalą - viešą kintamąjį supabase.