import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMapStore } from "./mapStore";

export interface SavedLocation {
  id: string;
  name: string;
  image_url: string;
  county: string;
  lng: number;
  lat: number;
}

interface SavedState {
  bookmarks: SavedLocation[];
  routeLocations: SavedLocation[];
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

      addBookmark: (loc) => {
        const already = get().bookmarks.find((b) => b.id === loc.id);
        if (already) return;
        const next = [...get().bookmarks, loc];
        set({ bookmarks: next });
        useMapStore.getState().setSavedLocationIds(next.map((b) => b.id));
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

      reorderRoute: (fromIdx, toIdx) => {
        const arr = [...get().routeLocations];
        const [moved] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, moved);
        set({ routeLocations: arr });
      },

      clearRoute: () => set({ routeLocations: [] }),
    }),
    {
      name: "cinemap-saved",
    }
  )
);