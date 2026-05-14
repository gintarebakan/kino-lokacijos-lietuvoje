import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "@tanstack/react-router";
import { useMapStore, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../../stores/mapStore";
import { useLocations } from "../../hooks/useLocations";
import { createCircleMarker } from "./markers";

// ----- Konfigūracija

// MapTiler API raktas
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? import.meta.env.MAPTILER_KEY ?? "";

// Naudojamas tik tamsus gatvių stilius
const STYLE_URL = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`;

// ----- Komponentas

/**
rodomas DiscoverPage viršuje. Atlieka dvi funkcijas:
Vizualiai parodo lokacijų pasiskirstymą Lietuvoje
 Paspaudus ant žymeklio - pereinama į pagrindinį žemėlapį ir atidaromas tos lokacijos informacinis skydelis
 */
export default function MiniMapPreview() {
  // DOM nuoroda į žemėlapio konteinerį
  const containerRef = useRef<HTMLDivElement>(null);

  // MapLibre žemėlapis
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Žymeklių sąrašas reikalingas jų pašalinimui prieš perrenderinimą
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const navigate = useNavigate();

  // Visos lokacijos GeoJSON formatu iš Supabase
  const { data: locationsData } = useLocations();

  // ----- Žemėlapio inicializavimas

  useEffect(() => {
    //Inicializuojame tik vieną kartą
    if (!containerRef.current || mapRef.current) return;

    const store = useMapStore.getState();

    //Atkuriame paskutinę žemėlapio poziciją
    const center = store.hasUserMoved ? store.center : DEFAULT_MAP_CENTER;
    const zoom = store.hasUserMoved ? store.zoom : DEFAULT_MAP_ZOOM;

    //Sukuriame pilnai interaktyvų mini žemėlapį
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center,
      zoom,
      attributionControl: false,
      //Mini žemėlapis funcionalus
      dragPan: true,
      scrollZoom: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      keyboard: true,
      dragRotate: true,
      boxZoom: true,
      interactive: true,
    });

    mapRef.current = map;

    // Cleanup dalyje pašaliname žymeklius ir žemėlapį kai komponentas unmountinamas
    return () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []); // Paleidžiama tik vieną kartą

  // ----- Žymeklių renderinimas

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !locationsData) return;

    const renderMarkers = () => {
      // Pašaliname senus žymeklius prieš kuriant naujus
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];

      //Sukuriame žymeklį kiekvienai lokacijai
      for (const feature of locationsData.features) {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties;

        // Mini žemėlapio žymekliai visada auksini (ne raudoni), išsaugojimo būsena čia nereikšminga
        const el = createCircleMarker(false);

        // Paspaudus ant žymeklio, keliaujame į pagrindinį žemėlapį:
        // 1. /map puslapis
        // 2. aktyvus maršrutas/kolekcija išvaloma
        // 3. su 150ms vėlavimu nustatome slugą ir laukiame kol MapViewer suspės inicializuotis ir apdoroti pending stateą
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          navigate({ to: "/map" });
          useMapStore.getState().setRouteGeoJSON(null);
          useMapStore.getState().setPreviousCollection(null);

          if (props.id) {
            const slug = props.id;
            setTimeout(() => {
              useMapStore.getState().setPendingLocation(slug);
              useMapStore.getState().setSelectedLocationFromDiscover(slug);
            }, 150);
          }
        });

        const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

        markersRef.current.push(marker);
      }
    };

    //Renderiname iš karto jei žemėlapis įkeltas, kitaip laukiame load
    if (map.loaded()) {
      renderMarkers();
    } else {
      map.on("load", renderMarkers);
    }
  }, [locationsData, navigate]); // Paleidžiama kai pasikeičia lokacijų duomenys

  // ----- Render
  return (
    <div
      style={{
        width: "100%",
        height: 240,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Žemėlapio konteineris */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
