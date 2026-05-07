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
import {
  createCircleMarker,
  createSelectedMarker,
  createClusterMarker,
} from "./markers";

const MAPTILER_KEY =
  import.meta.env.VITE_MAPTILER_KEY ?? import.meta.env.MAPTILER_KEY ?? "";
const STYLE_URLS: Record<LayerStyle, string> = {
  streets: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
  satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
};

interface LocationMarkerEntry {
  marker: maplibregl.Marker;
  props: LocationProperties;
  lngLat: [number, number];
}

export default function MapViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const clusterMarkersRef = useRef<maplibregl.Marker[]>([]);
  const locationMarkersRef = useRef<Map<string, LocationMarkerEntry>>(new Map());
  const clusterRef = useRef<Supercluster<LocationProperties> | null>(null);
  const clusterLoadedRef = useRef(false);
  const renderMarkersRef = useRef<(() => void) | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data: allLocationsData, isLoading: isLoadingAll, error: errorAll } =
    useLocations();
  const hasActiveFilters = useFilterStore((s) => s.hasActiveFilters)();
  const {
    data: filteredLocationsData,
    isLoading: isLoadingFiltered,
    error: errorFiltered,
  } = useFilteredLocations();

  //--------------------------------------------------------------------------
  const locationsData = hasActiveFilters
    ? filteredLocationsData
    : allLocationsData;
  const isLoading = hasActiveFilters ? isLoadingFiltered : isLoadingAll;
  const error = hasActiveFilters ? errorFiltered : errorAll;

  const layerStyle = useMapStore((s) => s.layerStyle);
  const setLayerStyle = useMapStore((s) => s.setLayerStyle);
  const selectedLocationId = useMapStore((s) => s.selectedLocationId);
  const pendingLocationSlug = useMapStore((s) => s.pendingLocationSlug);
  const routeGeoJSON = useMapStore((s) => s.routeGeoJSON);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const store = useMapStore.getState();
    const initialCenter = store.hasUserMoved ? store.center : DEFAULT_MAP_CENTER;
    const initialZoom = store.hasUserMoved ? store.zoom : DEFAULT_MAP_ZOOM;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URLS[store.layerStyle],
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    mapRef.current = map;
    store.setMap(map);

    const cluster = new Supercluster<LocationProperties>({
      radius: 60,
      maxZoom: 16,
    });
    clusterRef.current = cluster;

    const buildLocationElement = (
      props: LocationProperties,
      isBookmarked: boolean,
      isSelected: boolean,
    ): HTMLElement => {
      const el = isSelected
        ? createSelectedMarker()
        : createCircleMarker(isBookmarked);
      el.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        const m = mapRef.current;
        if (!m) return;
        const entry = locationMarkersRef.current.get(props.id);
        if (entry) {
          m.easeTo({
            center: entry.lngLat,
            offset: [-160, 0],
            duration: 500,
          });
        }
        const currentCollectionId = useMapStore.getState().selectedCollectionId;
if (currentCollectionId) {
  useMapStore.getState().setPreviousCollection(currentCollectionId);
}
useMapStore.getState().setSelectedLocationFromMap(props.id);
      });
      return el;
    };

    const renderMarkers = () => {
      if (!clusterLoadedRef.current) return;
      if (!mapRef.current || !clusterRef.current) return;
      const m = mapRef.current;

      // Clear cluster markers
      for (const marker of clusterMarkersRef.current) marker.remove();
      clusterMarkersRef.current = [];

      // Clear location markers
      for (const entry of locationMarkersRef.current.values()) entry.marker.remove();
      locationMarkersRef.current.clear();

      const bounds = m.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      const zoom = Math.round(m.getZoom());
      const features = clusterRef.current.getClusters(bbox, zoom);
      const state = useMapStore.getState();
      const savedIds = state.savedLocationIds;
      const selectedId = state.selectedLocationId;

      for (const feature of features) {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties as LocationProperties & {
          cluster?: boolean;
          point_count?: number;
          cluster_id?: number;
        };

        if (props.cluster) {
          const count = (feature as ClusterFeature<LocationProperties>).properties
            .point_count;
          const el = createClusterMarker(count);
          el.addEventListener("click", () => {
            // Cluster click → reset selection
            useMapStore.getState().setSelectedLocation(null);
            m.easeTo({
              center: [lng, lat],
              zoom: m.getZoom() + 2,
              duration: 500,
            });
          });
          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(m);
          clusterMarkersRef.current.push(marker);
        } else {
          const isBookmarked = savedIds.includes(props.id);
          const isSelected = selectedId === props.id;
          const el = buildLocationElement(props, isBookmarked, isSelected);
          const marker = new maplibregl.Marker({
            element: el,
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

    renderMarkersRef.current = renderMarkers;

    const handleMoveEnd = () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      useMapStore
        .getState()
        .setViewport(mapRef.current.getZoom(), [c.lng, c.lat]);
      // Note: we intentionally do NOT clear selectedLocationId here so the
      // detail panel stays open while the user pans/zooms around the marker.
      renderMarkers();
    };

    const handleZoomEnd = () => {
      if (!mapRef.current) return;
      const c = mapRef.current.getCenter();
      useMapStore
        .getState()
        .setViewport(mapRef.current.getZoom(), [c.lng, c.lat]);
      renderMarkers();
    };

    map.on("load", () => {
      if (store.hasUserMoved) {
        map.jumpTo({ center: store.center, zoom: store.zoom });
      }
      renderMarkers();
    });

    // Re-render on style swap
    map.on("styledata", () => {
      renderMarkers();
    });

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);

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
  }, []);

  // Load fetched locations into supercluster and re-render
  useEffect(() => {
    if (!locationsData || !clusterRef.current) return;
    clusterRef.current.load(
      locationsData.features as PointFeature<LocationProperties>[],
    );
    clusterLoadedRef.current = true;
    renderMarkersRef.current?.();
  }, [locationsData]);

  // Consume any pending location slug set before MapViewer mounted
  // (e.g. from DiscoverPage mini-map / cards). Pan to it and open the panel.
  // Subscribed via store selector so this effect re-runs whenever the pending
  // slug changes — even if locationsData is already cached and unchanged.
  useEffect(() => {
    const map = mapRef.current;
    if (!pendingLocationSlug) return;
    if (!map || !locationsData) return;

    const apply = () => {
      const feature = locationsData.features.find(
        (f) => f.properties.id === pendingLocationSlug,
      );
      if (!feature) {
        useMapStore.getState().setPendingLocation(null);
        return;
      }
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      map.easeTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 13),
        offset: [-160, 0],
        duration: 500,
      });
      useMapStore.getState().setSelectedLocation(pendingLocationSlug);
      useMapStore.getState().setPendingLocation(null);
    };

    if (map.loaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [pendingLocationSlug, locationsData]);

  // Handle layer style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
if (map.isStyleLoaded()) {
  map.setStyle(STYLE_URLS[layerStyle]);
} else {
  map.once("load", () => {
    map.setStyle(STYLE_URLS[layerStyle]);
  });
}
  }, [layerStyle]);

  // Draw route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    const SOURCE_ID = "cinemap-route";
    const LAYER_ID = "cinemap-route-line";

    const draw = () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

      if (!routeGeoJSON || routeGeoJSON.length < 2) return;

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: routeGeoJSON },
        },
      });
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

  // React to selection changes — swap marker elements without full re-render
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const savedIds = useMapStore.getState().savedLocationIds;

    const swap = (
      id: string,
      isSelected: boolean,
    ) => {
      const entry = locationMarkersRef.current.get(id);
      if (!entry) return;
      const isBookmarked = savedIds.includes(id);
      const newEl = isSelected
        ? createSelectedMarker()
        : createCircleMarker(isBookmarked);
      newEl.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        map.easeTo({
          center: entry.lngLat,
          offset: [-160, 0],
          duration: 500,
        });
        useMapStore.getState().setSelectedLocation(id);
      });
      // Remove old marker, create new one with proper anchor
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

    // Revert all non-selected markers that are currently in selected form is
    // implicitly handled by swapping only touched ids. Track via closure.
    // Simpler: revert every marker to circle, then promote the selected one.
    for (const [id, entry] of locationMarkersRef.current.entries()) {
      if (id === selectedLocationId) continue;
      // Only revert if currently in selected (teardrop) state — detect by size
      const el = entry.marker.getElement();
      if (el.style.width === "32px") {
        swap(id, false);
      }
    }

    if (selectedLocationId) {
      swap(selectedLocationId, true);
    }
  }, [selectedLocationId]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

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
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Loading spinner */}
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

      {/* Error toast */}
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

      {/* Zoom controls — stacked above geolocation */}
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
style={{ position: "absolute", bottom: 96, right: 75, zIndex: 10 }}      >
        −
      </button>

      {/* Geolocation */}
      <button
        type="button"
        onClick={handleGeolocate}
        aria-label="Mano vieta"
        className={`cinemap-geo-btn${isLocating ? " cinemap-geo-active" : ""}`}
style={{ position: "absolute", bottom: 94, right: 16, zIndex: 10 }}      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="3" fill="white" />
          <line x1="10" y1="2" x2="10" y2="6" stroke="white" strokeWidth="2" />
          <line x1="10" y1="14" x2="10" y2="18" stroke="white" strokeWidth="2" />
          <line x1="2" y1="10" x2="6" y2="10" stroke="white" strokeWidth="2" />
          <line x1="14" y1="10" x2="18" y2="10" stroke="white" strokeWidth="2" />
        </svg>
      </button>

      {/* Layer switcher */}
<div style={{ position: "absolute", right: 16, bottom: 46, zIndex: 10 }}>            <div
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
