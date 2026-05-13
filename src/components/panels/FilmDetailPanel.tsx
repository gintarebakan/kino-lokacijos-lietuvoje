import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "../../lib/supabase";
import { useMapStore } from "../../stores/mapStore";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import { createPortal } from "react-dom";

interface FilmRow {
  id: string;
  tmdb_id: number | null;
  title_lt: string | null;
  media_type: string | null;
  year: number | null;
  imdb_rating: number | null;
  imdb_url: string | null;
  poster_url: string | null;
  trailer_key: string | null;
  description: string | null;
  genre: string[] | null;
  director: string | null;
  actors: string[] | null;
}

interface LocationRef {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  county: string | null;
  location_type: string | null;
}

interface FilmLocationRow {
  id: string;
  scene_significance: string | null;
  fictional_name: string | null;
  scene_desc: string | null;
  scene_images: string[] | null;
  scene_facts: string | null;
  locations_lt: LocationRef | null;
}

interface FilmDetailData {
  film: FilmRow | null;
  locations: FilmLocationRow[];
}

const SIGNIFICANCE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; color: string; order: number }
> = {
  pagrindinė: {
    label: "Pagrindinė",
    bg: "rgba(201,168,76,0.2)",
    border: "#c9a84c",
    color: "#c9a84c",
    order: 0,
  },
  svarbi: {
    label: "Svarbi",
    bg: "rgba(192,192,192,0.12)",
    border: "#c0c0c0",
    color: "#d1d5db",
    order: 1,
  },
  epizodinė: {
    label: "Epizodinė",
    bg: "rgba(107,114,128,0.1)",
    border: "#374151",
    color: "#6b7280",
    order: 2,
  },
};

const SIGNIFICANCE_ALIASES: Record<string, string> = {
  pagrindine: "pagrindinė",
  epizodine: "epizodinė",
};

function normalizeSig(sig: string | null): string | null {
  if (!sig) return null;
  return SIGNIFICANCE_ALIASES[sig] ?? sig;
}

function SignificanceBadge({ sig }: { sig: string | null }) {
  const key = normalizeSig(sig);
  if (!key) return null;
  const c = SIGNIFICANCE_CONFIG[key];
  if (!c) return null;
  return (
    <span
      style={{
        display: "inline-block",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        borderRadius: 999,
        fontSize: 10,
        padding: "2px 8px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

const formatMediaType = (type: string | null | undefined) => {
  if (type === "series") return "SERIALAS";
  if (type === "film") return "FILMAS";
  return (type ?? "").toUpperCase();
};

// Bendras šriftas visam panelui
const PANEL_FONT = "Inter, system-ui, -apple-system, sans-serif";

export default function FilmDetailPanel() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const selectedFilmDetailId = useMapStore((s) => s.selectedFilmDetailId);
  const setSelectedFilmDetail = useMapStore((s) => s.setSelectedFilmDetail);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { data, isLoading, error } = useQuery<FilmDetailData>({
    queryKey: ["film-detail", selectedFilmDetailId],
    enabled: !!selectedFilmDetailId,
    queryFn: async () => {
      const { data: film, error: filmErr } = await supabase
        .from("films_tmdb")
        .select(
          "id, tmdb_id, title_lt, media_type, year, imdb_rating, imdb_url, poster_url, trailer_key, description, genre, director, actors",
        )
        .eq("id", selectedFilmDetailId as string)
        .single();
      if (filmErr) throw filmErr;

      const { data: filmLocs, error: locErr } = await supabase
        .from("film_locations")
        .select(
          `id, scene_significance, fictional_name, scene_desc, scene_images, scene_facts,
           locations_lt(id, name, slug, image_url, county, location_type)`,
        )
        .eq("film_id", selectedFilmDetailId as string);
      if (locErr) throw locErr;

      return {
        film: (film as unknown as FilmRow) ?? null,
        locations: (filmLocs as unknown as FilmLocationRow[]) ?? [],
      };
    },
  });

  if (!selectedFilmDetailId) return null;

  const desktopStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 360,
    height: "100%",
    background: "#111111",
    borderRight: "1px solid #222222",
    zIndex: 30,
    overflowY: "auto",
    fontFamily: PANEL_FONT,
  };

  const mobileStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 64,
    left: 0,
    right: 0,
    height: "80vh",
    background: "#111111",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 40,
    overflowY: "auto",
    boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
    fontFamily: PANEL_FONT,
  };

  const film = data?.film ?? null;
  const trailerKey = film?.trailer_key ?? null;

  const sortedLocations = [...(data?.locations ?? [])].sort((a, b) => {
    const aKey = normalizeSig(a.scene_significance);
    const bKey = normalizeSig(b.scene_significance);
    const aOrder = aKey && SIGNIFICANCE_CONFIG[aKey] ? SIGNIFICANCE_CONFIG[aKey].order : 99;
    const bOrder = bKey && SIGNIFICANCE_CONFIG[bKey] ? SIGNIFICANCE_CONFIG[bKey].order : 99;
    return aOrder - bOrder;
  });

  const handleLocationClick = (slug: string | null) => {
    if (!slug) return;
    useMapStore.getState().setPreviousFilmDetail(selectedFilmDetailId);
    setSelectedFilmDetail(null);
    if (routeLocation.pathname !== "/map") {
      navigate({ to: "/map" });
    }
    setTimeout(() => {
      useMapStore.getState().setPendingLocation(slug);
      useMapStore.getState().setSelectedLocation(slug);
    }, 100);
  };

  return (
    <aside style={isMobile ? mobileStyle : desktopStyle} aria-label="Filmo informacija">
      {/* Poster hero */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 220,
          background: "#1a1a1a",
          overflow: "hidden",
        }}
      >
        <ImageWithFallback
          src={film?.poster_url ? `https://image.tmdb.org/t/p/w500${film.poster_url}` : null}
          alt={film?.title_lt ?? ""}
          fallbackType="poster"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", display: "block" }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, #111111, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <button
          type="button"
          onClick={() => setSelectedFilmDetail(null)}
          aria-label="Uždaryti"
          style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32,
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
            color: "#f5f5f5", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isLoading && <div style={{ padding: 16, color: "#9ca3af", fontSize: 14 }}>Kraunama…</div>}
      {error && !isLoading && (
        <div style={{ padding: 16, color: "#f87171", fontSize: 14 }}>Nepavyko įkelti informacijos.</div>
      )}

      {film && (
        <>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              {formatMediaType(film.media_type) || "FILMAS"}
            </div>
            <h2 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>
              {film.title_lt ?? "—"}
              {film.year ? (
                <span style={{ color: "#6b7280", fontSize: 15, fontWeight: 400, marginLeft: 8 }}>
                  ({film.year})
                </span>
              ) : null}
            </h2>

            {film.genre && film.genre.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {film.genre.slice(0, 3).map((g) => (
                  <span key={g} style={{ background: "#1a1a1a", border: "1px solid #222222", borderRadius: 10, fontSize: 11, color: "#9ca3af", padding: "2px 8px" }}>
                    {g}
                  </span>
                ))}
              </div>
            )}

            {(film.imdb_rating != null || film.imdb_url) && (
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                {film.imdb_rating != null && (
                  <span style={{ fontSize: 13, color: "#c9a84c", fontWeight: 600 }}>
                    ⭐ {film.imdb_rating.toFixed(1)}
                  </span>
                )}
                {film.imdb_url && (
                  <a
                    href={film.imdb_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", background: "#f5c518", color: "#0a0a0a", borderRadius: 4, padding: "2px 6px", textDecoration: "none" }}
                  >
                    IMDb
                  </a>
                )}
              </div>
            )}

            {film.director && (
              <div style={{ marginTop: 10, fontSize: 12 }}>
                <span style={{ color: "#4b5563", marginRight: 6 }}>Režisierius</span>
                <span style={{ color: "#9ca3af" }}>{film.director}</span>
              </div>
            )}

            {film.actors && film.actors.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 12 }}>
                <span style={{ color: "#4b5563", marginRight: 6 }}>Aktoriai</span>
                <span style={{ color: "#9ca3af" }}>{film.actors.slice(0, 3).join(", ")}</span>
              </div>
            )}

            {film.description && (
              <p style={{ marginTop: 14, marginBottom: 0, color: "#9ca3af", fontSize: 13, lineHeight: 1.6 }}>
                {film.description}
              </p>
            )}

            {trailerKey ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  style={{
                    marginTop: 16, width: "100%", padding: "12px",
                    background: "linear-gradient(135deg, #c9a84c, #a8863a)",
                    border: "none", borderRadius: 8, color: "#0a0a0a",
                    fontWeight: 700, fontSize: 14, letterSpacing: "0.05em",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    fontFamily: PANEL_FONT,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M4 2L14 8L4 14V2Z" />
                  </svg>
                  Anonsas
                </button>

                {showTrailer && typeof document !== "undefined" &&
                  createPortal(
                    <div
                      onClick={() => setShowTrailer(false)}
                      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <button
                        type="button"
                        onClick={() => setShowTrailer(false)}
                        aria-label="Uždaryti"
                        style={{ position: "absolute", top: 20, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        ×
                      </button>
                      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(860px, 90vw)", aspectRatio: "16/9" }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
                        />
                      </div>
                    </div>,
                    document.body,
                  )
                }
              </>
            ) : (
              <button
                type="button"
                disabled
                style={{
                  marginTop: 16, width: "100%", padding: "12px",
                  background: "#1a1a1a", border: "none", borderRadius: 8,
                  color: "#6b7280", fontWeight: 700, fontSize: 14,
                  letterSpacing: "0.05em", cursor: "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: PANEL_FONT,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M4 2L14 8L4 14V2Z" />
                </svg>
                Anonsas neprieinamas
              </button>
            )}
          </div>

          {sortedLocations.length > 0 && (
            <section>
              <h3 style={{ margin: 0, padding: "16px 16px 8px", fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                Filmavimo lokacijos
              </h3>
              <ul style={{ listStyle: "none", margin: 0, padding: "0 8px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
                {sortedLocations.map((fl) => {
                  const loc = fl.locations_lt;
                  const slug = loc?.slug ?? null;
                  return (
                    <li key={fl.id}>
                      <button
                        type="button"
                        onClick={() => handleLocationClick(slug)}
                        disabled={!slug}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          background: "transparent", border: "none", padding: "8px",
                          borderRadius: 8, cursor: slug ? "pointer" : "default",
                          textAlign: "left", color: "#f5f5f5", transition: "background 160ms ease",
                          fontFamily: PANEL_FONT,
                        }}
                        onMouseEnter={(e) => { if (slug) e.currentTarget.style.background = "#1a1a1a"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#1a1a1a" }}>
                          <ImageWithFallback
                            src={loc?.image_url}
                            alt={loc?.name ?? ""}
                            fallbackType="location"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {loc?.name ?? "—"}
                          </div>
                          {fl.fictional_name && (
                            <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              kaip „{fl.fictional_name}"
                            </div>
                          )}
                          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <SignificanceBadge sig={fl.scene_significance} />
                            {loc?.location_type && (
                              <span style={{ fontSize: 10, color: "#9ca3af", background: "#1a1a1a", border: "1px solid #2a2a2a", padding: "2px 6px", borderRadius: 6 }}>
                                {loc.location_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: "#6b7280", flexShrink: 0 }}>
                          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </aside>
  );
}