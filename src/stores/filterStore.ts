// filterStore.ts - prisimena vartotojo pasirinktus filtrus (žanrus, metus, apskritis) 
// ir užtikrina, kad bet kuris komponentas (žemėlapis, sąrašas, paieškos laukelis) 
// galėtų paskaityti arba įrašyti. 

import { create } from "zustand";
import { persist } from "zustand/middleware";


export interface FilterState {
  selectedGenres: string[];
  selectedMediaTypes: string[];
  studio: string;
  minRating: number;
  maxRating: number;
  yearFrom: number | null;
  yearTo: number | null;
  selectedCounties: string[];
  selectedLocationTypes: string[];

  toggleGenre: (genre: string) => void;
  toggleMediaType: (type: string) => void;
  setStudio: (studio: string) => void;
  setRatingRange: (min: number, max: number) => void;
  setYearFrom: (year: number | null) => void;
  setYearTo: (year: number | null) => void;
  toggleCounty: (county: string) => void;
  toggleLocationType: (type: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: () => boolean;
}

const DEFAULTS = {
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

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      toggleGenre: (g) =>
        set((s) => ({ selectedGenres: toggle(s.selectedGenres, g) })),
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
      name: "cinemap-filters",
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
] as const;

// LOCATION_TYPES pašalintas — naudojamas dinamiškai iš DB per useLocationTypes hook

export const MEDIA_TYPES = [
  { value: "film", label: "Filmas" },
  { value: "series", label: "Serialas" },
] as const;

export const formatMediaType = (type: string) => {
  if (type === "series") return "Serialas";
  if (type === "film") return "Filmas";
  return type;
};