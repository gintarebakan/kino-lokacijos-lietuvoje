// filterStore.ts - prisimena vartotojo pasirinktus filtrus (žanrus, metus, apskritis) 
// ir užtikrina, kad bet kuris komponentas (žemėlapis, sąrašas, paieškos laukelis) 
// galėtų paskaityti arba įrašyti. 

import { create } from "zustand"; //  funkciją create sukurs globalią būseną
import { persist } from "zustand/middleware"; // išlaikymo įrankis, išsaugo duomenis net uždarius naršyklę. 


export interface FilterState { //apibrėžama struktūra (kuria dalinamės viešai)
  selectedGenres: string[]; // kokius duomenis turi atsiminti
  selectedMediaTypes: string[]; // 'film' | 'series'
  studio: string;
  minRating: number;
  maxRating: number;
  yearFrom: number | null;
  yearTo: number | null;
  selectedCounties: string[];
  selectedLocationTypes: string[];

  toggleGenre: (genre: string) => void;//ir kokius veiksmus apibrėžta struktūra moka atlikti
  toggleMediaType: (type: string) => void;//funkcija priima tekstą ir negrąžina nieko
  setStudio: (studio: string) => void;
  setRatingRange: (min: number, max: number) => void;
  setYearFrom: (year: number | null) => void;
  setYearTo: (year: number | null) => void;
  toggleCounty: (county: string) => void;
  toggleLocationType: (type: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: () => boolean;
}

const DEFAULTS = { //apsibrėžiame, kaip atrodo tuščia, neliesta filtrų būsena
  selectedGenres: [] as string[],
  selectedMediaTypes: [] as string[],
  studio: "",
  minRating: 0,
  maxRating: 10,
  yearFrom: null as number | null,
  yearTo: null as number | null,
  selectedCounties: [] as string[],
  selectedLocationTypes: [] as string[],
};

const toggle = (arr: string[], v: string) => //gaunamas sąrašas arr ir nauja reikšmė - v
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];//ar reikšmė jau sąraše?
  //jei taip - vartotojas nori filtrą išjungti, naudojame .filter, kad išmestumę reikšmę iš sąrašo
  //jei ne - vartotojas nori įjungti filtrą, paimame seną sąrašą ...arr ir į galą pridedame naują reikšmę v

export const useFilterStore = create<FilterState>()( //sukūriame Store (saugyklą)
  persist(
    (set, get) => ({ //zustand įrankiai
      ...DEFAULTS,//pirmą kartą užpildoma tuščiomis/pradinėmis reikšmėmis
      toggleGenre: (g) =>
        set((s) => ({ selectedGenres: toggle(s.selectedGenres, g) })),
      //set komanda skirta pakeisti duomenis, paimame seną būseną (s) ir užsetiname naują masyvą, naudodami toggle jungiklį
      toggleMediaType: (t) =>
        set((s) => ({ selectedMediaTypes: toggle(s.selectedMediaTypes, t) })),
      setStudio: (studio) => set({ studio }),
      setRatingRange: (minRating, maxRating) => set({ minRating, maxRating }),
      setYearFrom: (yearFrom) => set({ yearFrom }),
      setYearTo: (yearTo) => set({ yearTo }),
      toggleCounty: (c) =>
        set((s) => ({ selectedCounties: toggle(s.selectedCounties, c) })),
      toggleLocationType: (t) =>
        set((s) => ({
          selectedLocationTypes: toggle(s.selectedLocationTypes, t),
        })),
      clearAllFilters: () => set({ ...DEFAULTS }),
      hasActiveFilters: () => {
        const s = get();
        //get komanda skirta pažiūrėti kas dabar užrašyta. Tik nuskaitom dabartinius duomenis get() 
        // ir ar nor vienas filtras aktyvus - grąžina true/false
        return (
          s.selectedGenres.length > 0 ||
          s.selectedMediaTypes.length > 0 ||
          s.studio.trim().length > 0 ||
          s.minRating > 0 ||
          s.maxRating < 10 ||
          s.yearFrom !== null ||
          s.yearTo !== null ||
          s.selectedCounties.length > 0 ||
          s.selectedLocationTypes.length > 0
        );
      },
    }),
    {
      
      name: "cinemap-filters",//importuotas persist įrankis, šiuo pavadinimu local storage bus saugomi šie duomenys
      partialize: (s) => ({
        selectedGenres: s.selectedGenres,
        selectedMediaTypes: s.selectedMediaTypes,
        studio: s.studio,
        minRating: s.minRating,
        maxRating: s.maxRating,
        yearFrom: s.yearFrom,
        yearTo: s.yearTo,
        selectedCounties: s.selectedCounties,
        selectedLocationTypes: s.selectedLocationTypes,
      }),
    },
  ),
);

export const COUNTIES = [
  "Vilniaus",
  "Kauno",
  "Klaipėdos",
  "Šiaulių",
  "Panevėžio",
  "Alytaus",
  "Marijampolės",
  "Telšių",
  "Utenos",
  "Tauragės",
] as const;//sąrašas yra nekintamas, per čia koreguojam reikšmes

export const LOCATION_TYPES = [
  "dvaras",
  "rūmai",
  "pilis",
  "gatvė",
  "aikštė",
  "parkas",
  "miškas",
  "kalėjimas",
  "bažnyčia",
  "muziejus",
  "interjeras",
  "architektūra",
] as const;

export const MEDIA_TYPES = [  //kokio tipo turinį galima filtruoti, pasirinkimai
  { value: "film", label: "Filmas" },//react paims masyvą, pereis per jį ciklą .map() ir automatiškai nupieš tiek mygtukų, kiek elementų
  { value: "series", label: "Serialas" },
] as const;

export const formatMediaType = (type: string) => { //paima vieną žodį, patikrina jį per if sąlygas ir grąžina lietuvišką žodį
  if (type === "series") return "Serialas";
  if (type === "film") return "Filmas";
  return type;
};
