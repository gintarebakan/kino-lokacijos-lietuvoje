//savedStore.ts - vartotojo mėgstamiausių vietų išsaugojimas ir asmeninio maršruto planavimas.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMapStore } from "./mapStore";

export interface SavedLocation {//griežta taisyklė, nusakanti, kaip atrodo išsaugota lokacija.
  id: string;
  name: string;
  image_url: string;
  county: string;
  lng: number;
  lat: number;
}

interface SavedState {
  bookmarks: SavedLocation[];//vietos, kurias vartotojas pažymėjo
  routeLocations: SavedLocation[];//vietos, kurios tampa maršrutu
  addBookmark: (loc: SavedLocation) => void;
  removeBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
  addToRoute: (slug: string) => void;
  removeFromRoute: (slug: string) => void;
  reorderRoute: (fromIdx: number, toIdx: number) => void;
  clearRoute: () => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      routeLocations: [],

      addBookmark: (loc) => { //Pirmiausia patikriname, ar tokia lokacija jau nėra sąraše, kad netyčia nepridėtume dviejų vienodų
        const already = get().bookmarks.find((b) => b.id === loc.id);
        if (already) return;// Apsauga nuo dublikatų
        const next = [...get().bookmarks, loc];
        set({ bookmarks: next });

        useMapStore.getState().setSavedLocationIds(next.map((b) => b.id));
        //vietą pridėta į favoritus. Paimk visų favoritų ID sąrašą ir nuspalvink žymeklius žemėlapyje raudona
      },

      removeBookmark: (slug) => {
        const next = get().bookmarks.filter((b) => b.id !== slug);
        set({ bookmarks: next });
        useMapStore.getState().setSavedLocationIds(next.map((b) => b.id));
      },

      isBookmarked: (slug) => get().bookmarks.some((b) => b.id === slug),

      addToRoute: (slug) => {
        const loc = get().bookmarks.find((b) => b.id === slug);
        if (!loc) return;
        const already = get().routeLocations.find((r) => r.id === slug);
        if (already) return;
        set({ routeLocations: [...get().routeLocations, loc] });
      },

      removeFromRoute: (slug) => {
        set({
          routeLocations: get().routeLocations.filter((r) => r.id !== slug),
        });
      },

      reorderRoute: (fromIdx, toIdx) => { //funkcija specialiai sukurta tempti ir paleisti interaktyvumui
        const arr = [...get().routeLocations];
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);//splice iškerpa tą elementą ir įklijuoja kitur
        set({ routeLocations: arr });
      },

      clearRoute: () => set({ routeLocations: [] }),
    }),
    {
      name: "cinemap-saved",//Šis kodas garantuoja, kad visas bookmarks ir routeLocations sąrašas bus įrašytas į naršyklės Local Storage
    }
  )
);