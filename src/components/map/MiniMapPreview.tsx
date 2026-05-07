import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "@tanstack/react-router";
import {
  useMapStore,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "../../stores/mapStore";
import { useLocations } from "../../hooks/useLocations";
import { createCircleMarker } from "./markers";

const MAPTILER_KEY =
  import.meta.env.VITE_MAPTILER_KEY ?? import.meta.env.MAPTILER_KEY ?? "";
const STYLE_URL = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`;

export default function MiniMapPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const navigate = useNavigate();
  const { data: locationsData } = useLocations();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const store = useMapStore.getState();
    const center = store.hasUserMoved ? store.center : DEFAULT_MAP_CENTER;
    const zoom = store.hasUserMoved ? store.zoom : DEFAULT_MAP_ZOOM;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center,
      zoom,
      attributionControl: false,
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

    return () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !locationsData) return;

    const renderMarkers = () => {
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      for (const feature of locationsData.features) {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties;
        const el = createCircleMarker(false);

        //tiltas į pagrindinį
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

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    };

    if (map.loaded()) {
      renderMarkers();
    } else {
      map.on("load", renderMarkers);
    }
  }, [locationsData, navigate]);

  return (
    <div
      style={{
        width: "100%",
        height: 240,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}