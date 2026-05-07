//mapStore.ts - navigatorius, konteksto valdymas

import { create } from "zustand";
import type maplibregl from "maplibre-gl";
// importuojame Zustand ir MapLibre tipus

export type LayerStyle = "streets" | "satellite"; //žemėlapio stilius gali būti tik šie žodžiai

interface MapState { //griežtas brėžinys ką Navigatorius turi sekti
  mapInstance: maplibregl.Map | null;//Kai žemėlapis pirmą kartą užsikrauna, jis įdeda save į šį Zustand store (per funkciją setMap).
  //bet kuris mygtukas gali pasakyti: useMapStore.getState().mapInstance.flyTo({ center: [Vilnius] })
  //saugome variklį, kad galėtume jį valdyti iš bet kurio programėlės kampo.
  zoom: number;//ka dabar mato vartotojo akys
  center: [number, number];
  selectedLocationId: string | null;//Koks informacinis langas dabar atidarytas kairėje pusėje
  selectedFilmId: string | null;
  selectedFilmLocationId: string | null;
  savedLocationIds: string[];
  layerStyle: LayerStyle;
  hasUserMoved: boolean;
  pendingLocationSlug: string | null;
  selectedFilmDetailId: string | null;
  routeGeoJSON: number[][] | null;
  selectedCollectionId: string | null;
  previousCollectionId: string | null;//Iš kur vartotojas čia atėjo ir ar turime palikti nupieštą maršruto liniją?
  previousFilmDetailId: string | null;
  openLocationFromCollection: (locationSlug: string, collectionId: string) => void;


  setMap: (map: maplibregl.Map | null) => void;
  setViewport: (zoom: number, center: [number, number]) => void;
  setSelectedLocation: (id: string | null) => void;
  setSelectedLocationFromMap: (id: string | null) => void;
  setSelectedLocationFromDiscover: (id: string | null) => void;
  setSelectedFilm: (filmId: string | null, filmLocationId: string | null) => void;
  setSelectedFilmDetail: (id: string | null) => void;
  setSelectedCollection: (id: string | null) => void;
  setPreviousCollection: (id: string | null) => void;
  setPreviousFilmDetail: (id: string | null) => void;
  setRouteGeoJSON: (coords: number[][] | null) => void;
  toggleSaved: (id: string) => void;
  setSavedLocationIds: (ids: string[]) => void;
  setLayerStyle: (style: LayerStyle) => void;
  setPendingLocation: (slug: string | null) => void;
}

const DEFAULT_CENTER: [number, number] = [25.2797, 54.6872];
const DEFAULT_ZOOM = 7;

export const useMapStore = create<MapState>((set) => ({
  // State
  mapInstance: null,
  zoom: DEFAULT_ZOOM,
  center: DEFAULT_CENTER,
  selectedLocationId: null,
  selectedFilmId: null,
  selectedFilmLocationId: null,
  savedLocationIds: [],
  layerStyle: "streets",
  hasUserMoved: false,
  pendingLocationSlug: null,
  selectedFilmDetailId: null,
  routeGeoJSON: null,
  selectedCollectionId: null,
  previousCollectionId: null,
  previousFilmDetailId: null,

  // Map instance
  setMap: (map) => set({ mapInstance: map }),
  setViewport: (zoom, center) => set({ zoom, center, hasUserMoved: true }),

  // Location — generic (used internally)
  setSelectedLocation: (id) =>
    set({
      selectedLocationId: id,
      selectedFilmId: null,
      selectedFilmLocationId: null,
      selectedFilmDetailId: null,
      ...(id ? { selectedCollectionId: null } : {}),
    }),



  // Atėjimas iš Atradimų puslapio (viską panaikina):
  setSelectedLocationFromDiscover: (id) =>
    set({
      selectedLocationId: id,
      selectedFilmId: null,
      selectedFilmLocationId: null,
      selectedFilmDetailId: null,
      selectedCollectionId: null,
      previousCollectionId: null,
      routeGeoJSON: null,
    }),
    
  // Paspaudimas tiesiogiai žemėlapyje:
  setSelectedLocationFromMap: (id) =>
    set((state) => ({
      selectedLocationId: id,
      selectedFilmId: null,
      selectedFilmLocationId: null,
      selectedFilmDetailId: null,
      ...(id ? { selectedCollectionId: null } : {}),
      // Keep route only if coming from a collection context
      //Jei atidarome naują lokaciją, automatiškai uždarome atidarytas kolekcijas. Jei tik išvalome lokaciją, kolekcijų neliesti
      routeGeoJSON: state.previousCollectionId ? state.routeGeoJSON : null,
    })),

  // Film
  setSelectedFilm: (filmId, filmLocationId) =>
    set({ selectedFilmId: filmId, selectedFilmLocationId: filmLocationId }),

  setSelectedFilmDetail: (id) =>
    set({
      selectedFilmDetailId: id,
      ...(id ? {
        selectedLocationId: null,
      selectedFilmId: null,
      selectedFilmLocationId: null,
      selectedCollectionId: null,
      previousCollectionId: null,
      routeGeoJSON: null,
      } : {}),
    }),

  // Collection — opening sets state, closing clears route
  setSelectedCollection: (id) =>
    set({
      selectedCollectionId: id,
      ...(!id ? {
        routeGeoJSON: null,
        previousCollectionId: null,
      } : {}),
    }),
//Atidarymas iš Maršruto (Kolekcijos) sąrašo:
openLocationFromCollection: (locationSlug, collectionId) =>
  set({
    selectedLocationId: locationSlug,
    selectedCollectionId: null,
    previousCollectionId: collectionId,
    selectedFilmId: null,
    selectedFilmLocationId: null,
    selectedFilmDetailId: null,
    // routeGeoJSON intentionally NOT cleared
  }),
    
  setPreviousCollection: (id) => set({ previousCollectionId: id }),
  setPreviousFilmDetail: (id) => set({ previousFilmDetailId: id }),

  // Route
  setRouteGeoJSON: (coords) => set({ routeGeoJSON: coords }),

  // Išsaugoto mygtuko logika
  toggleSaved: (id) =>
    set((state) => ({
      savedLocationIds: state.savedLocationIds.includes(id)
        ? state.savedLocationIds.filter((s) => s !== id)
        : [...state.savedLocationIds, id],
    })),
    //Jei lokacijos ID jau yra išsaugotų sąraše (includes(id)), mes naudojame .filter(), kad sukurtume naują sąrašą be šio ID (nuimame PATIKIMĄ)
    //Jei jo ten nėra, mes paimame visus senus ID (...state.savedLocationIds) ir į sąrašo galą pridedame naują (uždedame PATIKIMĄ)
  setSavedLocationIds: (ids) => set({ savedLocationIds: ids }),

  // Layer
  setLayerStyle: (style) => set({ layerStyle: style }),

  // Pending
  setPendingLocation: (slug) => set({ pendingLocationSlug: slug }),
}));

export const DEFAULT_MAP_CENTER = DEFAULT_CENTER;
export const DEFAULT_MAP_ZOOM = DEFAULT_ZOOM;