import { useState, useEffect } from "react";
import { useSavedStore } from "../stores/savedStore";
import { useMapStore } from "../stores/mapStore";
import { useNavigate } from "@tanstack/react-router";

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState("saved");
const [dragIdx, setDragIdx] = useState<number | null>(null);
const [overIdx, setOverIdx] = useState<number | null>(null);
  const { bookmarks, routeLocations, removeBookmark, addToRoute, removeFromRoute, reorderRoute } = useSavedStore();
  const navigate = useNavigate();
  const setPendingLocation = useMapStore((s) => s.setPendingLocation);
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);

const handleLocationClick = (id: string) => {
    setPendingLocation(id);
    setSelectedLocation(id);
    navigate({ to: "/map" });
  };

const mapsUrl = "https://www.google.com/maps/dir/" + routeLocations.map((l) => l.lat + "," + l.lng).join("/");
  const [travelMode, setTravelMode] = useState<"walking" | "driving">("driving");
  const [routeInfo, setRouteInfo] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);


function decodePolyline(encoded: string): number[][] {
  const coords: number[][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}

const fetchRoute = async () => {
  if (routeLocations.length < 2) return;
  setRouteLoading(true);
  try {
    const isWalking = travelMode === "walking";
    const profile = isWalking ? "foot-walking" : "driving-car";
    const coords = routeLocations.map((l) => [l.lng, l.lat]);

    const url = isWalking
      ? `https://api.openrouteservice.org/v2/directions/${profile}/geojson`
      : `https://api.openrouteservice.org/v2/directions/${profile}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_ORS_KEY}`,
      },
      body: JSON.stringify({ coordinates: coords }),
    });

    const data = await res.json();

    let distanceKm: string;
    let durationMin: number;
    let routeCoords: number[][];

    if (isWalking) {
      // GeoJSON response
      distanceKm = (data.features[0].properties.summary.distance / 1000).toFixed(1);
      durationMin = Math.round(data.features[0].properties.summary.duration / 60);
      routeCoords = data.features[0].geometry.coordinates;
    } else {
      // Encoded polyline response
      distanceKm = (data.routes[0].summary.distance / 1000).toFixed(1);
      durationMin = Math.round(data.routes[0].summary.duration / 60);
      routeCoords = decodePolyline(data.routes[0].geometry);
    }

    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

    setRouteInfo(`${distanceKm} km · ${durationStr}`);
    useMapStore.getState().setRouteGeoJSON(routeCoords);

  } catch {
    setRouteInfo("Atstumas negalimas");
  }
  setRouteLoading(false);
};

  useEffect(() => {
    if (routeLocations.length >= 2) fetchRoute();
    else { setRouteInfo(null); useMapStore.getState().setRouteGeoJSON(null); }
  }, [routeLocations, travelMode]);

const tabStyle = (tab: string) => ({
      flex: 1, padding: "12px 0", background: "transparent", border: "none",
    borderBottom: activeTab === tab ? "2px solid #c9a84c" : "2px solid transparent",
    color: activeTab === tab ? "#c9a84c" : "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer",
  });

  return (
    <main style={{ width: "100%", height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #222222" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #222222", flexShrink: 0 }}>
        <button type="button" style={tabStyle("saved")} onClick={() => setActiveTab("saved")}>Issaugota ({bookmarks.length})</button>
        <button type="button" style={tabStyle("route")} onClick={() => setActiveTab("route")}>Marsrutas ({routeLocations.length})</button>
      </div>

      {activeTab === "saved" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {bookmarks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12 }}>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Nera issaugotu lokaciju</p>
            </div>
          ) : (
            bookmarks.map((loc) => (
              <div key={loc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#1a1a1a", cursor: "pointer" }} onClick={() => handleLocationClick(loc.id)}>
                  {loc.image_url ? <img src={loc.image_url} alt={loc.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => handleLocationClick(loc.id)}>
                  <div style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 14 }}>{loc.name}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{loc.county}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => addToRoute(loc.id)} style={{ background: "transparent", border: "1px solid #c9a84c", color: "#c9a84c", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Marsrutas</button>
                  <button type="button" onClick={() => removeBookmark(loc.id)} style={{ background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>Istrinti</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "route" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {routeLocations.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 12 }}>
                <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Marsrutas tuscias</p>
              </div>
            ) : (
              routeLocations.map((loc, idx) => (
                <div key={loc.id} draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
                  onDrop={() => { if (dragIdx !== null && dragIdx !== idx) reorderRoute(dragIdx, idx); setDragIdx(null); setOverIdx(null); }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid #1a1a1a", background: overIdx === idx ? "rgba(201,168,76,0.08)" : "transparent" }}>
                   <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "4px 2px", cursor: "grab", flexShrink: 0 }}>
                    <div style={{ width: 16, height: 2, background: "#4b5563", borderRadius: 1 }} />
                    <div style={{ width: 16, height: 2, background: "#4b5563", borderRadius: 1 }} />
                    <div style={{ width: 16, height: 2, background: "#4b5563", borderRadius: 1 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600 }}>{loc.name}</div>
                    <div style={{ color: "#6b7280", fontSize: 11 }}>{loc.county}</div>
                  </div>
                  <button type="button" onClick={() => removeFromRoute(loc.id)} style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 18, padding: 4 }}>x</button>
                </div>
              ))
            )}
          </div>
          {routeLocations.length >= 2 && (
            <div style={{ borderTop: "1px solid #222222", background: "#0a0a0a", padding: "12px 16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {(["driving", "walking"] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => setTravelMode(mode)} style={{ flex: 1, padding: "6px 0", borderRadius: 16, fontSize: 12, fontWeight: 600, background: travelMode === mode ? "#c9a84c" : "#1a1a1a", color: travelMode === mode ? "#0a0a0a" : "#9ca3af", border: "none", cursor: "pointer" }}>
                    {mode === "driving" ? "Automobiliu" : "Pesciomis"}
                  </button>
                ))}
              </div>
              {routeLoading && <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center" }}>Skaiciuojama...</div>}
              {routeInfo && !routeLoading && <div style={{ color: "#c9a84c", fontSize: 13, textAlign: "center", fontWeight: 600 }}>{routeInfo}</div>}
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", width: "100%", padding: "10px", background: "#1a1a1a", border: "1px solid #222222", borderRadius: 8, color: "#f5f5f5", textAlign: "center", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                Eksportuoti i Google Maps
              </a>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
