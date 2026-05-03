import { create } from "zustand";
import type maplibregl from "maplibre-gl";

export type LayerStyle = "streets" | "satellite";

interface MapState {
  mapInstance: maplibregl.Map | null;
  zoom: number;
  center: [number, number];
  selectedLocationId: string | null;
  selectedFilmId: string | null;
  selectedFilmLocationId: string | null;
  savedLocationIds: string[];
  layerStyle: LayerStyle;
  hasUserMoved: boolean;
  pendingLocationSlug: string | null;
  selectedFilmDetailId: string | null;
  routeGeoJSON: number[][] | null;
  selectedCollectionId: string | null;
  previousCollectionId: string | null;
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

  // Location — clicked from map marker (keeps route line)
  setSelectedLocationFromMap: (id) =>
    set((state) => ({
      selectedLocationId: id,
      selectedFilmId: null,
      selectedFilmLocationId: null,
      selectedFilmDetailId: null,
      ...(id ? { selectedCollectionId: null } : {}),
      // Keep route only if coming from a collection context
      routeGeoJSON: state.previousCollectionId ? state.routeGeoJSON : null,
    })),

  // Location — clicked from Discover page (clears everything)
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

  // Saved
  toggleSaved: (id) =>
    set((state) => ({
      savedLocationIds: state.savedLocationIds.includes(id)
        ? state.savedLocationIds.filter((s) => s !== id)
        : [...state.savedLocationIds, id],
    })),
  setSavedLocationIds: (ids) => set({ savedLocationIds: ids }),

  // Layer
  setLayerStyle: (style) => set({ layerStyle: style }),

  // Pending
  setPendingLocation: (slug) => set({ pendingLocationSlug: slug }),
}));

export const DEFAULT_MAP_CENTER = DEFAULT_CENTER;
export const DEFAULT_MAP_ZOOM = DEFAULT_ZOOM;