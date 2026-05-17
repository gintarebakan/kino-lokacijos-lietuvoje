import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import Supercluster from "supercluster";
import type { ClusterFeature, PointFeature } from "supercluster";
import {
  useMapStore,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  type LayerStyle,
} from "../../stores/mapStore";
import type { LocationProperties } from "../../types/locations";
import { useLocations } from "../../hooks/useLocations";
import { useFilteredLocations } from "../../hooks/useFilteredLocations";
import { useFilterStore } from "../../stores/filterStore";
import { createCircleMarker, createSelectedMarker, createClusterMarker } from "./markers";

//-----Konfigūracija
// MapTiler API raktas iš .env kintamųjų
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? import.meta.env.MAPTILER_KEY ?? "";

// Žemėlapio stilių URL'ai (gatvių ir palydovinis)
const STYLE_URLS: Record<LayerStyle, string> = {
  streets: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
};

//-----Tipai
// Vienos lokacijos žymeklio įrašas = saugo marker objektą, savybes ir koordinates
interface LocationMarkerEntry {
  marker: maplibregl.Marker;
  props: LocationProperties;
  lngLat: [number, number];
}

//------Komponentas
export default function MapViewer() {
  // DOM nuoroda į žemėlapio konteinerį
  const containerRef = useRef<HTMLDivElement>(null);
  // MapLibre žemėlapio instancija. Saugoma kaip ref, ne state, nes neturėtų triggerinti re-renderių
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Klasterių žymeklių sąrašas reikalingas jų pašalinimui prieš kiekvieną perrenderinimą
  const clusterMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Lokacijų žymeklių žemėlapis (slug -> marker + metadata) — leidžia greitai rasti konkretų žymeklį pagal ID
  const locationMarkersRef = useRef<Map<string, LocationMarkerEntry>>(new Map());

  // Supercluster atlieka geografinį taškų klasterizavimą
  const clusterRef = useRef<Supercluster<LocationProperties> | null>(null);

  // Vėliavėlė = ar duomenys jau įkelti į Supercluster ir galima renderinti
  const clusterLoadedRef = useRef(false);

  // renderMarkers funkcijos ref'as išsprendžia stale closure problemą
  const renderMarkersRef = useRef<(() => void) | null>(null);

  // Geolokacijos mygtukas — ar šiuo metu vyksta vietos nustatymas
  const [isLocating, setIsLocating] = useState(false);

  // ----- Duomenų užklausos

  // Visos lokacijos (be filtrų) naudojamos, kai filtrai neaktyvūs
  const { data: allLocationsData, isLoading: isLoadingAll, error: errorAll } = useLocations();

  // Tikrina ar šiuo metu yra bent vienas aktyvus filtras
  const hasActiveFilters = useFilterStore((s) => s.hasActiveFilters)();

  // Filtruotos lokacijos yra naudojamos tik kai filtrai aktyvūs
  const {
    data: filteredLocationsData,
    isLoading: isLoadingFiltered,
    error: errorFiltered,
  } = useFilteredLocations();

  // Dinamiškai parenkamas duomenų šaltinis: filtruotas arba pilnas sąrašas
  const locationsData = hasActiveFilters ? filteredLocationsData : allLocationsData;
  const isLoading = hasActiveFilters ? isLoadingFiltered : isLoadingAll;
  const error = hasActiveFilters ? errorFiltered : errorAll;

  // Žemėlapio būsena iš Zustand store
  const layerStyle = useMapStore((s) => s.layerStyle);
  const setLayerStyle = useMapStore((s) => s.setLayerStyle);
  const selectedLocationId = useMapStore((s) => s.selectedLocationId);

  // Laukiantis lokacijos slug'as, nustatomas kitų puslapių (DiscoverPage ir kt.), navigacijos metu, kad žemėlapis žinotų kur skristi atsidaręs
  const pendingLocationSlug = useMapStore((s) => s.pendingLocationSlug);

  // GeoJSON linijos duomenys maršruto braižymui
  const routeGeoJSON = useMapStore((s) => s.routeGeoJSON);

  //-----Žemėlapio inicializavimas

  useEffect(() => {
    // Inicializuojame tik vieną kartą, jei konteineris arba žemėlapis jau yra, išeiname
    if (!containerRef.current || mapRef.current) return;

    const store = useMapStore.getState();

    // Atkuriame paskutinę poziciją jei vartotojas anksčiau jau judėjo žemėlapyje
    const initialCenter = store.hasUserMoved ? store.center : DEFAULT_MAP_CENTER;
    const initialZoom = store.hasUserMoved ? store.zoom : DEFAULT_MAP_ZOOM;

    // Sukuriame MapLibre GL JS žemėlapio instanciją
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URLS[store.layerStyle],
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      renderWorldCopies: false, // Neleidžiame žemėlapiui kartotis horizontaliai
    });

    // Pridedame nuorodą
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    // Išsaugome žemėlapio instanciją refe ir Zustand store
    mapRef.current = map;
    store.setMap(map);

    // Inicializuojame Supercluster
    // radius: pikselių spindulys klasterio formavimui
    // maxZoom: maksimalus zoom lygis, iki kurio veikia klasterizavimas
    const cluster = new Supercluster<LocationProperties>({
      radius: 60,
      maxZoom: 16,
    });
    clusterRef.current = cluster;

    // Sukuria lokacijos žymeklio HTML elementą ir priskiria paspaudimo įvykį
    const buildLocationElement = (
      props: LocationProperties,
      isBookmarked: boolean,
      isSelected: boolean,
    ): HTMLElement => {
      // Pasirenkame žymeklio tipą: selected arba paprastas apskritimas
      const el = isSelected ? createSelectedMarker() : createCircleMarker(isBookmarked);

      el.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation(); // Neleidžiame eventui plisti į žemėlapį
        const m = mapRef.current;
        if (!m) return;

        // Sklandžiai perkeliame žemėlapį į paspaustos lokacijos koordinates
        const entry = locationMarkersRef.current.get(props.id);
        if (entry) {
          m.easeTo({
            center: entry.lngLat,
            offset: [-160, 0], // Pastumimas į dešinę dėl informacinio skydelio
            duration: 500,
          });
        }

        // Išsaugome aktyvią kolekciją prieš atidarant lokacijos skydelį,
        // kad vėliau galima būtų grįžti atgal
        const currentCollectionId = useMapStore.getState().selectedCollectionId;
        if (currentCollectionId) {
          useMapStore.getState().setPreviousCollection(currentCollectionId);
        }

        // Nustatome pasirinktą lokaciją, tai atidaro LocationDetailPanel
        useMapStore.getState().setSelectedLocationFromMap(props.id);
      });

      return el;
    };

    // Pagrindinis žymeklių renderinimo metodas = valymas + perrenderinimas
    const renderMarkers = () => {
      if (!clusterLoadedRef.current) return; // Dar neįkelti duomenys
      if (!mapRef.current || !clusterRef.current) return;

      const m = mapRef.current;

      // Pašaliname visus senus klasterių žymeklius
      for (const marker of clusterMarkersRef.current) marker.remove();
      clusterMarkersRef.current = [];

      // Pašaliname visus senus lokacijų žymeklius
      for (const entry of locationMarkersRef.current.values()) entry.marker.remove();
      locationMarkersRef.current.clear();

      // Gauname dabartinio vaizdo ribas žemėlapio koordinatėmis
      const bounds = m.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      // Supercluster naudoja sveikųjų skaičių zoom lygius
      const zoom = Math.round(m.getZoom());

      // Gauname matomus taškus/klasterius dabartiniame vaizde
      const features = clusterRef.current.getClusters(bbox, zoom);

      const state = useMapStore.getState();
      const savedIds = state.savedLocationIds; // Išsaugotų lokacijų ID
      const selectedId = state.selectedLocationId; // Šiuo metu atvertos lokacijos ID

      for (const feature of features) {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties as LocationProperties & {
          cluster?: boolean;
          point_count?: number;
          cluster_id?: number;
        };

        if (props.cluster) {
          // ----- Klasterio žymeklis
          const count = (feature as ClusterFeature<LocationProperties>).properties.point_count;
          const el = createClusterMarker(count);

          el.addEventListener("click", () => {
            // Paspaudus klasterį išvalome selekciją ir priartinama
            useMapStore.getState().setSelectedLocation(null);
            m.easeTo({
              center: [lng, lat],
              zoom: m.getZoom() + 2,
              duration: 500,
            });
          });

          const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m);
          clusterMarkersRef.current.push(marker);
        } else {
          // ----- Lokacijos žymeklis
          const isBookmarked = savedIds.includes(props.id);
          const isSelected = selectedId === props.id;
          const el = buildLocationElement(props, isBookmarked, isSelected);

          const marker = new maplibregl.Marker({
            element: el,
            // Selected žymeklis (teardropo formos) turi apačioję anchorą, kad smaigalys rodytų tiksliai į koordinatę
            anchor: isSelected ? "bottom" : "center",
          })
            .setLngLat([lng, lat])
            .addTo(m);

          locationMarkersRef.current.set(props.id, {
            marker,
            props,
            lngLat: [lng, lat],
          });
        }
      }
    };

    // Išsaugome renderMarkers refe, tai leidžia event handler'iams visada naudoti naujausią funkciją be stale closure problemos
    renderMarkersRef.current = renderMarkers;

    // Išsaugome poziciją Zustand store ir iš naujo renderiname žymeklius po kiekvieno judėjimo
    const handleMoveEnd = () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      useMapStore.getState().setViewport(mapRef.current.getZoom(), [c.lng, c.lat]);
      renderMarkers();
    };

    const handleZoomEnd = () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      useMapStore.getState().setViewport(mapRef.current.getZoom(), [c.lng, c.lat]);
      renderMarkers();
    };

    // Pradinis renderinimas po žemėlapio įkėlimo
    map.on("load", () => {
      if (store.hasUserMoved) {
        map.jumpTo({ center: store.center, zoom: store.zoom });
      }
      renderMarkers();
    });

    // Perrenderinamas ir po stiliaus keitimo (gatvės <> palydovas)
    map.on("styledata", () => {
      renderMarkers();
    });

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);

    // su Cleanup pašaliname žymeklius ir žemėlapį kai komponentas unmountinamas
    return () => {
      for (const marker of clusterMarkersRef.current) marker.remove();
      clusterMarkersRef.current = [];
      for (const entry of locationMarkersRef.current.values()) entry.marker.remove();
      locationMarkersRef.current.clear();
      renderMarkersRef.current = null;
      clusterLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
      useMapStore.getState().setMap(null);
    };
  }, []); // Paleidžiama tik vieną kartą/žemėlapis inicializuojamas vieną kartą

  // ----- Lokacijų įkėlimas į Supercluster
  useEffect(() => {
    if (!locationsData || !clusterRef.current) return;

    // Įkeliame GeoJSON taškus į Supercluster ir aktyvuojame renderinimą
    clusterRef.current.load(locationsData.features as PointFeature<LocationProperties>[]);
    clusterLoadedRef.current = true;
    renderMarkersRef.current?.();
  }, [locationsData]);

  // ----- Laukiančio lokacijos slug apdorojimas

  // Vykdoma kai kitas puslapis (DiscoverPage ir kt.) nustato pendingLocationSlug
  // randa lokaciją GeoJSON duomenyse, skrenda prie jos ir atidaro skydelį
  useEffect(() => {
    const map = mapRef.current;
    if (!pendingLocationSlug) return;
    if (!map || !locationsData) return;

    const apply = () => {
      // Ieškome lokacijos pagal slug'ą
      const feature = locationsData.features.find((f) => f.properties.id === pendingLocationSlug);

      if (!feature) {
        // jei lokacija nerasta, valome pending state'ą
        useMapStore.getState().setPendingLocation(null);
        return;
      }

      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const forceZoom = useMapStore.getState().forceZoom;

      // Sklandžiai perkeliame žemėlapį į lokacijos koordinates
      map.easeTo({
        center: [lng, lat],
        zoom: forceZoom ?? Math.max(map.getZoom(), 13), // Naudoja forceZoom jei nustatytas, kitaip ne mažiau nei 13
        offset: [-160, 0], // Pastumimas dėl informacinio skydelio
        duration: 500,
      });

      // Atidarome lokacijos skydelį ir valome pending state
      useMapStore.getState().setSelectedLocation(pendingLocationSlug);
      useMapStore.getState().setPendingLocation(null);
      
      // Išvalome forceZoom po panaudojimo
      if (forceZoom !== null) {
        useMapStore.getState().setForceZoom(null);
      }
    };

    // Jei žemėlapis jau įkeltas, vykdome iš karto, kitaip laukiame
    if (map.loaded()) apply();
    else map.once("load", apply);
  }, [pendingLocationSlug, locationsData]);

  // -----Stiliaus keitimas

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Keičiame stilių tik kai žemėlapis pilnai įkeltas
    if (map.isStyleLoaded()) {
      map.setStyle(STYLE_URLS[layerStyle]);
    } else {
      map.once("load", () => {
        map.setStyle(STYLE_URLS[layerStyle]);
      });
    }
  }, [layerStyle]);

  // ----- Maršruto linijos braižymas

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    const SOURCE_ID = "cinemap-route";
    const LAYER_ID = "cinemap-route-line";

    const draw = () => {
      // Pirmiausia pašaliname seną maršrutą jei egzistavo
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

      // Jei nėra maršruto duomenų arba per mažai taškų nieko ir nebraižome
      if (!routeGeoJSON || routeGeoJSON.length < 2) return;

      // Pridedame GeoJSON šaltinį su linijos koordinatėmis
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: routeGeoJSON },
        },
      });

      // Braižome punktyrinę violetinę liniją
      map.addLayer({
        id: LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#8b5cf6",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });
    };

    if (map.loaded()) draw();
    else map.once("load", draw);
  }, [routeGeoJSON]);

  // -----Selekcijos keitimas
  // Keičia žymeklio vizualinį stilių kai pasirenkama/atrenama lokacija be viso žymeklių sąrašo perrenderinimo (optimizacija)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const savedIds = useMapStore.getState().savedLocationIds;

    const swap = (id: string, isSelected: boolean) => {
      const entry = locationMarkersRef.current.get(id);
      if (!entry) return;
      const isBookmarked = savedIds.includes(id);

      // Sukuriame naują žymeklio elementą atitinkamo tipo
      const newEl = isSelected ? createSelectedMarker() : createCircleMarker(isBookmarked);

      newEl.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        map.easeTo({ center: entry.lngLat, offset: [-160, 0], duration: 500 });
        useMapStore.getState().setSelectedLocation(id);
      });

      // Pašaliname seną žymeklį ir pridedame naują
      entry.marker.remove();
      const newMarker = new maplibregl.Marker({
        element: newEl,
        anchor: isSelected ? "bottom" : "center",
      })
        .setLngLat(entry.lngLat)
        .addTo(map);

      locationMarkersRef.current.set(id, {
        marker: newMarker,
        props: entry.props,
        lngLat: entry.lngLat,
      });
    };

    // Grąžiname visus žymeklius į paprastą formą:
    // selected žymeklį atpažįstame pagal elemento plotį (32px = createSelectedMarker)
    for (const [id, entry] of locationMarkersRef.current.entries()) {
      if (id === selectedLocationId) continue;
      const el = entry.marker.getElement();
      if (el.style.width === "32px") {
        swap(id, false);
      }
    }

    // Pakeliame pasirinktą žymeklį į selected formą
    if (selectedLocationId) {
      swap(selectedLocationId, true);
    }
  }, [selectedLocationId]);

  // -----Pagalbinės funkcijos

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  // Geolokacija: nustato vartotojo poziciją ir skrenda prie jos
  const handleGeolocate = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.easeTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          duration: 800,
        });
        setIsLocating(false);
      },
      () => setIsLocating(false), // Klaidos atveju tiesiog išjungiame indikatorių
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ----- Render

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Žemėlapio konteineris: MapLibre GL JS čia injektuoja canvas elementą */}
      <div
        ref={containerRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      />

      {/* Lokacijų krovimo indikatorius */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "rgba(17,17,17,0.9)",
            border: "1px solid #222",
            borderRadius: 999,
            padding: "8px 16px",
            color: "#c9a84c",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          role="status"
          aria-live="polite"
        >
          <span
            style={{
              width: 12,
              height: 12,
              border: "2px solid #c9a84c",
              borderTopColor: "transparent",
              borderRadius: "50%",
              display: "inline-block",
              animation: "cinemap-spin 0.8s linear infinite",
            }}
          />
          Kraunamos lokacijos…
        </div>
      )}

      {/* Klaidos pranešimas */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "rgba(120,30,30,0.95)",
            border: "1px solid #5a1a1a",
            borderRadius: 8,
            padding: "10px 16px",
            color: "#fff",
            fontSize: 13,
            maxWidth: 360,
            textAlign: "center",
          }}
          role="alert"
        >
          Nepavyko įkelti lokacijų. Bandykite vėliau.
        </div>
      )}

      <style>{`@keyframes cinemap-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Priartinimo mygtukai */}
      <button
        type="button"
        onClick={handleZoomIn}
        aria-label="Priartinti"
        className="cinemap-zoom-btn"
        style={{ position: "absolute", bottom: 96, right: 120, zIndex: 10 }}
      >
        +
      </button>
      <button
        type="button"
        onClick={handleZoomOut}
        aria-label="Atitolinti"
        className="cinemap-zoom-btn"
        style={{ position: "absolute", bottom: 96, right: 75, zIndex: 10 }}
      >
        −
      </button>

      {/* Geolokacijos mygtukas: aktyvuoja animaciją */}
      <button
        type="button"
        onClick={handleGeolocate}
        aria-label="Mano vieta"
        className={`cinemap-geo-btn${isLocating ? " cinemap-geo-active" : ""}`}
        style={{ position: "absolute", bottom: 94, right: 16, zIndex: 10 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="3" fill="white" />
          <line x1="10" y1="2" x2="10" y2="6" stroke="white" strokeWidth="2" />
          <line x1="10" y1="14" x2="10" y2="18" stroke="white" strokeWidth="2" />
          <line x1="2" y1="10" x2="6" y2="10" stroke="white" strokeWidth="2" />
          <line x1="14" y1="10" x2="18" y2="10" stroke="white" strokeWidth="2" />
        </svg>
      </button>

      {/* Stiliaus perjungiklis: gatvių ir palydovinis vaizdas */}
      <div style={{ position: "absolute", right: 16, bottom: 46, zIndex: 10 }}>
        <div
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: 20,
            padding: 3,
            display: "inline-flex",
            gap: 2,
          }}
        >
          {(["streets", "satellite"] as const).map((s) => {
            const active = layerStyle === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setLayerStyle(s)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 16,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  background: active ? "#c9a84c" : "transparent",
                  color: active ? "#0a0a0a" : "#9ca3af",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "#9ca3af";
                }}
              >
                {s === "streets" ? "Gatvės" : "Palydovas"}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}