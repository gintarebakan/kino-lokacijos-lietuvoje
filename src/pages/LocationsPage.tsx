import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { useMapStore } from "../stores/mapStore";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";

interface Location {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  location_type: string | null;
  county: string | null;
  film_count?: number | null;
}

function filmCountLabel(count: number): string {
  if (count === 1) return "1 filmas";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 10 || mod100 >= 20)) return `${count} filmai`;
  return `${count} filmų`;
}

function locationsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1 || (mod10 === 1 && mod100 !== 11)) {
    return `${count} filmavimo vieta Lietuvoje`;
  }
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} filmavimo vietos Lietuvoje`;
  }
  return `${count} filmavimo vietų Lietuvoje`;
}

export default function LocationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCounty, setFilterCounty] = useState("");

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["all-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations_by_film_count")
        .select("id, name, slug, image_url, location_type, county, film_count")
        .order("film_count", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Location[];
    },
  });

  const types = useMemo(() => {
    const set = new Set(
      locations.map((l) => l.location_type).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [locations]);

  const counties = useMemo(() => {
    const set = new Set(locations.map((l) => l.county).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [locations]);

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const matchSearch = !search || loc.name.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || loc.location_type === filterType;
      const matchCounty = !filterCounty || loc.county === filterCounty;
      return matchSearch && matchType && matchCounty;
    });
  }, [locations, search, filterType, filterCounty]);

  const openLocation = (slug: string | null) => {
    useMapStore.getState().setRouteGeoJSON(null);
    useMapStore.getState().setSelectedCollection(null);
    if (slug) {
      useMapStore.getState().setPendingLocation(slug);
      useMapStore.getState().setSelectedLocationFromDiscover(slug);
    }
    navigate({ to: "/map" });
  };

  return (
    <main
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        background: "#0a0a0a",
        paddingBottom: 80,
      }}
    >
      <style>{`
        .loc-card:hover .loc-overlay { opacity: 1 !important; }
        .loc-card:hover { transform: scale(1.02); }
        .loc-card { transition: transform 0.18s ease; }
        .loc-filter-btn { transition: all 0.15s; }
        .loc-filter-btn:hover { border-color: #c9a84c !important; color: #c9a84c !important; }
      `}</style>

      {/* Header */}
      <section
        style={{
          padding: "40px 24px 32px",
          borderBottom: "1px solid #1a1a1a",
          background: "linear-gradient(180deg, #111111 0%, #0a0a0a 100%)",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            color: "#f5f5f5",
            fontSize: 24,
            fontWeight: 700,
            margin: "0 0 4px",
          }}
        >
          Visos lokacijos
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>
          {locationsCountLabel(locations.length)}
        </p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 400, marginBottom: 16 }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Ieškoti lokacijos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#111111",
              border: "1px solid #222",
              borderRadius: 10,
              padding: "10px 12px 10px 36px",
              color: "#f5f5f5",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="loc-filter-btn"
            onClick={() => setFilterType("")}
            style={{
              background: filterType === "" ? "rgba(201,168,76,0.12)" : "transparent",
              border: `1px solid ${filterType === "" ? "#c9a84c" : "#2a2a2a"}`,
              borderRadius: 8,
              padding: "6px 12px",
              color: filterType === "" ? "#c9a84c" : "#6b7280",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: filterType === "" ? 600 : 400,
            }}
          >
            Visi tipai
          </button>

          {types.map((t) => (
            <button
              key={t}
              type="button"
              className="loc-filter-btn"
              onClick={() => setFilterType(t)}
              style={{
                background: filterType === t ? "rgba(201,168,76,0.12)" : "transparent",
                border: `1px solid ${filterType === t ? "#c9a84c" : "#2a2a2a"}`,
                borderRadius: 8,
                padding: "6px 12px",
                color: filterType === t ? "#c9a84c" : "#6b7280",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: filterType === t ? 600 : 400,
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}

          {counties.length > 0 && (
            <>
              <div style={{ width: 1, background: "#222", margin: "0 4px" }} />
              <select
                value={filterCounty}
                onChange={(e) => setFilterCounty(e.target.value)}
                style={{
                  background: filterCounty ? "rgba(201,168,76,0.08)" : "#111111",
                  border: `1px solid ${filterCounty ? "#c9a84c" : "#2a2a2a"}`,
                  borderRadius: 8,
                  padding: "6px 10px",
                  color: filterCounty ? "#c9a84c" : "#6b7280",
                  fontSize: 12,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">Visi rajonai</option>
                {counties.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {(filterType || filterCounty || search) && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>
              Rodoma: <strong style={{ color: "#c9a84c" }}>{filtered.length}</strong> lokacijų
            </span>
            <button
              type="button"
              onClick={() => { setSearch(""); setFilterType(""); setFilterCounty(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "#6b7280",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Išvalyti filtrus
            </button>
          </div>
        )}
      </section>

      {/* Grid */}
      <section style={{ padding: "24px 16px" }}>
        {isLoading && (
          <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: 40 }}>
            Kraunama…
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: 40 }}>
            Lokacijų nerasta.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="loc-card"
              onClick={() => openLocation(loc.slug)}
              style={{
                position: "relative",
                height: 200,
                borderRadius: 12,
                overflow: "hidden",
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: "#1a1a1a",
                textAlign: "left",
              }}
            >
              <ImageWithFallback
                src={loc.image_url}
                alt={loc.name}
                fallbackType="location"
                width={200}
                height={200}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                }}
              />

              <div
                className="loc-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(201,168,76,0.08)",
                  border: "2px solid rgba(201,168,76,0.4)",
                  borderRadius: 12,
                  opacity: 0,
                  transition: "opacity 0.18s",
                }}
              />

              {loc.film_count != null && loc.film_count > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(201,168,76,0.9)",
                    color: "#0a0a0a",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: "2px 7px",
                  }}
                >
                  {filmCountLabel(Number(loc.film_count))}
                </div>
              )}

              {loc.location_type && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: "rgba(0,0,0,0.65)",
                    color: "#9ca3af",
                    fontSize: 10,
                    borderRadius: 6,
                    padding: "2px 7px",
                    textTransform: "capitalize",
                  }}
                >
                  {loc.location_type}
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    lineHeight: 1.3,
                    marginBottom: 2,
                  }}
                >
                  {loc.name}
                </div>
                {loc.county && (
                  <div style={{ color: "#9ca3af", fontSize: 11 }}>
                    {loc.county}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}