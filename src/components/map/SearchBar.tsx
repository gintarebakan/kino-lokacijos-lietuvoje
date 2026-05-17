//searchbar
// ═══════════════════════════════════════════════
// IMPORTAI
// ═══════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { useSearch, type SearchResult } from "../../hooks/useSearch"; // paieškos hook'as, kviečia supabase.rpc("search_all")
import { useMapStore } from "../../stores/mapStore"; // žemėlapio būsena, kad galėtume centruoti žemėlapį ir atidaryti skydelį
import { useLocations } from "../../hooks/useLocations"; // visos lokacijos GeoJSON, reikia koordinatėms kai pasirenkame lokaciją
import { useFilteredLocations } from "../../hooks/useFilteredLocations"; // filtruotos lokacijos, tik filtro santraukai rodyti (kiek rasta)
import { useGenres } from "../../hooks/useGenres"; // žanrų sąrašas iš DB, filtro "Žanras" pill'ams generuoti

import {
  useFilterStore,
  COUNTIES,
  // LOCATION_TYPES,
  MEDIA_TYPES,
  formatMediaType,
} from "../../stores/filterStore";

import { useLocationTypes } from "../../hooks/useLocationTypes";

interface PillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ═══════════════════════════════════════════════
// FILTRO MYGTUKAS
// ═══════════════════════════════════════════════
function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "rgba(201,168,76,0.15)" : "#1a1a1a", //aktyvus filtras bus auksinė spalva, neaktyvus - tamsus
        border: `1px solid ${active ? "#c9a84c" : "#222222"}`, //rėmelis keičiasi priklausomai nuo aktyvumo
        color: active ? "#c9a84c" : "#9ca3af",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#0a0a0a",
  border: "1px solid #222222",
  color: "#f5f5f5",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  display: "block",
};

// ═══════════════════════════════════════════════
// SEARCHBAR KOMPONENTAS
// ═══════════════════════════════════════════════
export default function SearchBar() {
  const [query, setQuery] = useState(""); //vartotojo įvestas tekstas paieškos lauke
  const [open, setOpen] = useState(false); //ar rodomas rezultatų dropdown
  const [filtersOpen, setFiltersOpen] = useState(false); //ar atidarytas filtrų skydelis
  const [mounted, setMounted] = useState(false); //React SSR apsauga, filtro būsena tikrinama tik po mount
  const [isMobile, setIsMobile] = useState(false); //responsive (mobiliuose prietaisuose slėpiame SearchBar kai atidarytas panel)
  const containerRef = useRef<HTMLDivElement>(null); //nuoroda į visą komponentą - reikia "klik lauke" aptikimui
  // ═══════════════════════════════════════════════
  // HOOK'AI
  // ═══════════════════════════════════════════════
  const { data: results, isLoading } = useSearch(query); //kviečia search_all per supabase.rpc()
  // results = [{ type: "location", title: "Trakų pilis", ... }, ...]
  const { data: locationsData } = useLocations(); //GeoJSON FeatureCollection - reikia koordinatėms
  // locationsData.features[i].geometry.coordinates = [lng, lat]
  const { data: filteredData } = useFilteredLocations();
  const filteredCount = filteredData?.features?.length ?? 0; //skaičius filtro santraukai: "Rastos lokacijos: 12"
  const { data: genres } = useGenres(); //žanrų sąrašas: ["Drama", "Komedija", "Trileris", ...]
  const locationTypes = useLocationTypes();
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);
  const mapInstance = useMapStore((s) => s.mapInstance);
  const selectedLocationId = useMapStore((s) => s.selectedLocationId);
  const selectedFilmId = useMapStore((s) => s.selectedFilmId);
  const selectedFilmDetailId = useMapStore((s) => s.selectedFilmDetailId);

  const filter = useFilterStore();
  const hasActive = mounted && filter.hasActiveFilters();

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  // ═══════════════════════════════════════════════
  // MOBILAUS SLĖPIMAS
  // ═══════════════════════════════════════════════
  const isPanelOpen =
    selectedLocationId !== null || selectedFilmId !== null || selectedFilmDetailId !== null;
  if (mounted && isMobile && isPanelOpen) return null; //mobiliame įrenginyje kai atidarytas informacinis skydelis
  //SearchBar visiškai išnyksta — ekrano nėra kur abu sutalpinti
  // ═══════════════════════════════════════════════
  // REZULTATO PASIRINKIMAS
  // ═══════════════════════════════════════════════
  const handlePick = (r: SearchResult) => {
    setOpen(false); //uždaro dropdown
    if (r.type === "location") {
      const slug = r.slug ?? r.id;
      setQuery(r.title); //užpildo paieškos laukelį pavadinimu
      // Randa lokacijos koordinates iš GeoJSON cache
      const feature = locationsData?.features.find((f) => f.properties.id === slug);
      if (feature && mapInstance) {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const forceZoom = useMapStore.getState().forceZoom;
        mapInstance.easeTo({
          center: [lng, lat], //centralizuoja žemėlapį
          zoom: forceZoom ?? Math.max(mapInstance.getZoom(), 13), //priartina (naudoja forceZoom jei nustatytas, kitaip ne mažiau 13)
          offset: [-160, 0], //pastumia į dešinę dėl skydelio
          duration: 700, //700ms animacija
        });
        // Clear forceZoom after applying
        if (forceZoom !== null) {
          useMapStore.getState().setForceZoom(null);
        }
      }
      setSelectedLocation(slug); //Zustand atidarys LocationPanel
      return;
    }
    if (r.type === "film") {
      setQuery(r.title);
      useMapStore.getState().setSelectedFilmDetail(r.id); //atidaro filmo detalių rodinį tiesiogiai (ne per lokaciją)
      return;
    }
  };

  const showResults = open && query.trim().length >= 2;
  // ═══════════════════════════════════════════════
  // FILTRO SANTRAUKA
  // ═══════════════════════════════════════════════
  const summaryParts: string[] = [];
  if (filter.selectedGenres.length) summaryParts.push(filter.selectedGenres.join(", ")); //["Drama", "Trileris"] į "Drama, Trileris"
  if (filter.selectedMediaTypes.length)
    summaryParts.push(filter.selectedMediaTypes.map(formatMediaType).join(", "));
  if (filter.studio.trim()) summaryParts.push(filter.studio.trim());
  if (filter.minRating > 0 || filter.maxRating < 10)
    summaryParts.push(`${filter.minRating.toFixed(1)}–${filter.maxRating.toFixed(1)} ⭐`); //"7.0–10.0 ⭐"
  // Galutinis rezultatas: "Rastos lokacijos: 5 · Drama · 7.0–10.0 ⭐ · Vilniaus"
  if (filter.yearFrom !== null || filter.yearTo !== null)
    summaryParts.push(`${filter.yearFrom ?? ""}–${filter.yearTo ?? ""}`);
  if (filter.selectedCounties.length) summaryParts.push(filter.selectedCounties.join(", "));
  if (filter.selectedLocationTypes.length)
    summaryParts.push(filter.selectedLocationTypes.join(", "));

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", top: 16, right: 16, width: 320, zIndex: 40 }}
    >
      <div
        style={{
          background: "#111111",
          border: "1px solid #222222",
          borderRadius: 12,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ieškoti lokacijų, filmų…"
          aria-label="Paieška"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f5f5f5",
            fontSize: 14,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Išvalyti"
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 2,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Filtrai toggle */}
      <button
        type="button"
        onClick={() => setFiltersOpen((v) => !v)}
        aria-expanded={filtersOpen}
        aria-controls="cinemap-filters-drawer"
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#111111",
          border: "1px solid #222222",
          borderRadius: 8,
          color: "#9ca3af",
          fontSize: 14,
          cursor: "pointer",
          width: "100%",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#c9a84c";
          e.currentTarget.style.color = "#f5f5f5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#222222";
          e.currentTarget.style.color = "#9ca3af";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="5" cy="4" r="1.5" fill="currentColor" />
          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="8" r="1.5" fill="currentColor" />
          <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="6" cy="12" r="1.5" fill="currentColor" />
        </svg>
        Filtrai
        <svg
          className="ml-auto transition-transform"
          style={{ transform: filtersOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {filtersOpen && (
        <div
          id="cinemap-filters-drawer"
          style={{
            marginTop: 8,
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: 12,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}
        >
          {/* ŽANRAS */}
          <div>
            <span style={labelStyle}>Žanras</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(genres ?? []).map((g) => (
                <Pill
                  key={g}
                  label={g}
                  active={filter.selectedGenres.includes(g)}
                  onClick={() => filter.toggleGenre(g)}
                />
              ))}
              {(!genres || genres.length === 0) && (
                <span style={{ fontSize: 12, color: "#6b7280" }}>Kraunama…</span>
              )}
            </div>
          </div>

          {/* TIPAS */}
          <div>
            <span style={labelStyle}>Tipas</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MEDIA_TYPES.map((m) => (
                <Pill
                  key={m.value}
                  label={m.label}
                  active={filter.selectedMediaTypes.includes(m.value)}
                  onClick={() => filter.toggleMediaType(m.value)}
                />
              ))}
            </div>
          </div>

          {/* ĮVERTINIMAS */}
          <div>
            <span style={labelStyle}>
              IMDb įvertinimas: {filter.minRating.toFixed(1)} – {filter.maxRating.toFixed(1)}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={filter.minRating}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  filter.setRatingRange(Math.min(v, filter.maxRating), filter.maxRating);
                }}
                style={{ flex: 1, accentColor: "#c9a84c" }}
              />
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={filter.maxRating}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  filter.setRatingRange(filter.minRating, Math.max(v, filter.minRating));
                }}
                style={{ flex: 1, accentColor: "#c9a84c" }}
              />
            </div>
          </div>

          {/* METAI */}
          <div>
            <span style={labelStyle}>Metai</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                min={1900}
                max={2100}
                placeholder="Nuo (1990)"
                value={filter.yearFrom ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return filter.setYearFrom(null);
                  if (/^\d{1,4}$/.test(v)) {
                    const n = Number(v);
                    if (v.length === 4) filter.setYearFrom(n);
                    else filter.setYearFrom(n);
                  }
                }}
                style={{ ...inputStyle, width: "50%" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c9a84c")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
              />
              <input
                type="number"
                min={1900}
                max={2100}
                placeholder="Iki (2024)"
                value={filter.yearTo ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return filter.setYearTo(null);
                  if (/^\d{1,4}$/.test(v)) {
                    filter.setYearTo(Number(v));
                  }
                }}
                style={{ ...inputStyle, width: "50%" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#c9a84c")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
              />
            </div>
          </div>

          {/* APSKRITIS */}
          <div>
            <span style={labelStyle}>Apskritis</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {COUNTIES.map((c) => (
                <Pill
                  key={c}
                  label={c}
                  active={filter.selectedCounties.includes(c)}
                  onClick={() => filter.toggleCounty(c)}
                />
              ))}
            </div>
          </div>

          {/* LOKACIJOS TIPAS */}
          <div>
            <span style={labelStyle}>Lokacijos tipas</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {locationTypes.map((t: string) => (
                <Pill
                  key={t}
                  label={capitalizeFirstLetter(t)}
                  active={filter.selectedLocationTypes.includes(t)}
                  onClick={() => filter.toggleLocationType(t)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filter summary */}
      {hasActive && (
        <div
          style={{
            marginTop: 8,
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 20,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "#c9a84c",
          }}
        >
          <span style={{ flex: 1, lineHeight: 1.4 }}>
            Pagal aktyvius filtrus rastos lokacijos: {filteredCount}
            {summaryParts.length > 0 && ` · ${summaryParts.join(" · ")}`}
          </span>
          <button
            type="button"
            onClick={() => filter.clearAllFilters()}
            aria-label="Išvalyti filtrus"
            style={{
              background: "transparent",
              border: "none",
              color: "#c9a84c",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 0,
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}

      {showResults && (
        <div
          role="listbox"
          style={{
            marginTop: 6,
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: 12,
            maxHeight: 360,
            overflowY: "auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          {isLoading && <div style={{ padding: 12, color: "#9ca3af", fontSize: 13 }}>Ieškoma…</div>}
          {!isLoading && (results?.length ?? 0) === 0 && (
            <div style={{ padding: 12, color: "#9ca3af", fontSize: 13 }}>Nieko nerasta</div>
          )}
          {!isLoading &&
            results?.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                role="option"
                onClick={() => handlePick(r)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid #1a1a1a",
                  textAlign: "left",
                  cursor: "pointer",
                  opacity: 1,
                  color: "#f5f5f5",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {r.image_url ? (
                  <img
                    src={
                      r.type === "film"
                        ? `https://image.tmdb.org/t/p/w92${r.image_url}` //filmams: TMDB CDN URL + poster_url (pvz. "/abc123.jpg")
                        : r.image_url //lokacijoms: pilnas Cloudinary URL
                    }
                    alt=""
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: "#1a1a1a",
                      flexShrink: 0,
                    }}
                  /> //placeholder jei nėra nuotraukos
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.title} //pavadinimas
                  </div>
                  {r.subtitle && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.subtitle} //lokacijai: apskritis, filmui: "2023 · Filmas"
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#c9a84c",
                    flexShrink: 0,
                  }}
                >
                  {r.type === "location"
                    ? "Lokacija"
                    : r.media_type === "tv" || r.media_type === "series"
                      ? "Serialas"
                      : "Filmas"}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}