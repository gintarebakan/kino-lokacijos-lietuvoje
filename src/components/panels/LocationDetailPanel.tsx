import { useEffect, useState } from "react";
import { useMapStore } from "../../stores/mapStore";
import { useSavedStore } from "../../stores/savedStore";
import { useLocationDetail } from "../../hooks/useLocationDetail";
import FilmContextView from "./FilmContextView";

const SIGNIFICANCE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; color: string }
> = {
  svarbi: {
    label: "Svarbi",
    bg: "rgba(201,168,76,0.15)",
    border: "#c9a84c",
    color: "#c9a84c",
  },
  pagrindinė: {
    label: "Pagrindinė",
    bg: "rgba(156,163,175,0.15)",
    border: "#6b7280",
    color: "#9ca3af",
  },
  epizodinė: {
    label: "Epizodė",
    bg: "rgba(107,114,128,0.1)",
    border: "#374151",
    color: "#6b7280",
  },
};

const SIGNIFICANCE_ALIASES: Record<string, string> = {
  pagrindine: "pagrindinė",
  epizodine: "epizodinė",
};

function SignificanceBadge({ sig }: { sig: string | null }) {
  if (!sig) return null;
  const key = SIGNIFICANCE_ALIASES[sig] ?? sig;
  const c = SIGNIFICANCE_CONFIG[key];
  if (!c) return null;
  return (
    <span
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color,
        borderRadius: 10,
        fontSize: 10,
        padding: "2px 8px",
        marginLeft: 6,
        whiteSpace: "nowrap",
        display: "inline-block",
        verticalAlign: "middle",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

function ActionIconButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="cinemap-action-btn"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 36,
        height: 36,
        background: "#1a1a1a",
        border: `1px solid ${hovered ? "#c9a84c" : "#222222"}`,
        borderRadius: 8,
        color: hovered ? "#c9a84c" : "#f5f5f5",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "border-color 160ms ease, color 160ms ease",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function buildMapsUrl(coordinates: unknown, name: string, address?: string | null): string {
  if (coordinates) {
    try {
      const geo =
        typeof coordinates === "string"
          ? (JSON.parse(coordinates) as { coordinates: [number, number] })
          : (coordinates as { coordinates: [number, number] });
      if (
        geo?.coordinates &&
        typeof geo.coordinates[0] === "number" &&
        typeof geo.coordinates[1] === "number"
      ) {
        return `https://www.google.com/maps?q=${geo.coordinates[1]},${geo.coordinates[0]}`;
      }
    } catch {
      // fall through
    }
  }
  const query = [name, address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function LocationDetailPanel() {
  const selectedLocationId = useMapStore((s) => s.selectedLocationId);
  const setSelectedLocation = useMapStore((s) => s.setSelectedLocation);
  const setSelectedFilm = useMapStore((s) => s.setSelectedFilm);
  const selectedFilmId = useMapStore((s) => s.selectedFilmId);
  const previousCollectionId = useMapStore((s) => s.previousCollectionId);
  const setPreviousCollection = useMapStore((s) => s.setPreviousCollection);
  const setSelectedCollection = useMapStore((s) => s.setSelectedCollection);
  const previousFilmDetailId = useMapStore((s) => s.previousFilmDetailId);
  const setPreviousFilmDetail = useMapStore((s) => s.setPreviousFilmDetail);
  const setSelectedFilmDetail = useMapStore((s) => s.setSelectedFilmDetail);
  const { addBookmark, removeBookmark, isBookmarked } = useSavedStore();
  const { data, isLoading, error } = useLocationDetail(selectedLocationId);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const isOpen = !!selectedLocationId;

  const handleShare = async () => {
    if (!data) return;
    const url = `${window.location.origin}/map?location=${data.slug}`;
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const desktopStyle: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, width: 360, height: "100%",
    background: "transparent",
    borderRight: "1px solid #222222",
    zIndex: 30, display: "flex", flexDirection: "column", overflow: "hidden",
  };

  const mobileStyle: React.CSSProperties = {
    position: "fixed", bottom: 64, left: 0, right: 0, height: "70vh",
    background: "transparent",
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    zIndex: 40, display: "flex", flexDirection: "column", overflow: "hidden",
    boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
  };

  return (
    <aside aria-hidden={!isOpen} style={isMobile ? mobileStyle : desktopStyle}>
      {/* Back to collection */}
      {previousCollectionId && (
        <button type="button"
          onClick={() => {
            const prevId = previousCollectionId;
            setPreviousCollection(null);
            setSelectedLocation(null);
            setSelectedCollection(prevId);
          }}
          style={{
            position: "absolute", top: 12, left: 12, zIndex: 50,
            background: "rgba(0,0,0,0.6)", border: "1px solid #222",
            color: "#c9a84c", height: 32, borderRadius: 999, fontSize: 12,
            cursor: "pointer", lineHeight: 1, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            padding: "0 10px", gap: 4, fontWeight: 600,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atgal
        </button>
      )}

      {/* Back to film detail */}
      {previousFilmDetailId && (
        <button type="button"
          onClick={() => {
            const prevId = previousFilmDetailId;
            setPreviousFilmDetail(null);
            setSelectedLocation(null);
            setSelectedFilmDetail(prevId);
          }}
          style={{
            position: "absolute", top: previousCollectionId ? 50 : 12, left: 12, zIndex: 50,
            background: "rgba(0,0,0,0.6)", border: "1px solid #222",
            color: "#c9a84c", height: 32, borderRadius: 999, fontSize: 12,
            cursor: "pointer", lineHeight: 1, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
            padding: "0 10px", gap: 4, fontWeight: 600,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atgal
        </button>
      )}

      {/* Close button */}
      <button type="button" onClick={() => setSelectedLocation(null)} aria-label="Uždaryti"
        style={{
          position: "absolute", top: 12, right: 20, zIndex: 50,
          background: "rgba(0,0,0,0.6)", border: "1px solid #222", color: "#f5f5f5",
          width: isMobile ? 36 : 32, height: isMobile ? 36 : 32,
          borderRadius: 999, fontSize: isMobile ? 20 : 18, cursor: "pointer",
          lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>

      {/* Scrollable content */}
      <div 
        className="flex-1 cinemap-scroll-area"
        style={{ 
          overflowY: "auto",
          background: "#0c0c0c",
          WebkitOverflowScrolling: "touch"
        }}
      >
        <div style={{ background: "#0c0c0c", minHeight: "100%" }}>
          {isLoading && <div style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>Kraunama…</div>}
          {error && !isLoading && <div style={{ padding: 24, color: "#f87171", fontSize: 14 }}>Nepavyko įkelti informacijos.</div>}
          {!isLoading && !error && !data && selectedLocationId && <div style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>Lokacija nerasta.</div>}

          {data && (
            <div style={{ background: "#0c0c0c" }}>
            {/* Hero image */}
            <div style={{ width: "100%", aspectRatio: "16/10", background: "#1a1a1a", position: "relative" }}>
              {data.image_url ? (
                <img src={data.image_url} alt={data.name} width={360} height={225}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : null}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(12,12,12,0.95) 100%)" }} />
            </div>

            <div style={{ padding: "16px 20px 96px", background: "#0c0c0c" }}>
              {data.location_type && (
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#c9a84c", marginBottom: 6 }}>
                  {data.location_type}
                </div>
              )}

              <h2 style={{ margin: 0, color: "#f5f5f5", fontFamily: "Georgia, serif", fontSize: 22, lineHeight: 1.25 }}>
                {data.name}
              </h2>

              {(data.address || data.county) && (
                <div style={{ marginTop: 6, color: "#9ca3af", fontSize: 13 }}>
                  {[data.address, data.county].filter(Boolean).join(" · ")}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button type="button"
                  onClick={() => {
                    if (isBookmarked(data.slug)) {
                      removeBookmark(data.slug);
                    } else {
                      const coords = data.coordinates
                        ? (data.coordinates as unknown as { coordinates: number[] }).coordinates
                        : [0, 0];
                      addBookmark({ id: data.slug, name: data.name, image_url: data.image_url ?? "", county: data.county ?? "", lng: coords[0] ?? 0, lat: coords[1] ?? 0 });
                    }
                  }}
                  style={{
                    flex: 1,
                    background: isBookmarked(data.slug) ? "#c9a84c" : "transparent",
                    color: isBookmarked(data.slug) ? "#0a0a0a" : "#c9a84c",
                    border: "1px solid #c9a84c", borderRadius: 8, padding: "8px 12px",
                    fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer",
                  }}
                >
                  {isBookmarked(data.slug) ? "Išsaugota" : "Išsaugoti"}
                </button>
                {data.official_website_url && (
                  <a href={data.official_website_url} target="_blank" rel="noopener noreferrer"
                    style={{
                      flex: 1, background: "transparent", color: "#f5f5f5",
                      border: "1px solid #333", borderRadius: 8, padding: "8px 12px",
                      fontSize: 12, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.08em", textAlign: "center", textDecoration: "none",
                    }}
                  >Tinklapis</a>
                )}
              </div>

              {data.street_view_url && (
                <a href={data.street_view_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", marginTop: 8, color: "#9ca3af", fontSize: 12, textDecoration: "underline" }}>
                  Žiūrėti Street View →
                </a>
              )}

              {data.description && (
                <p style={{ marginTop: 18, color: "#d1d5db", fontSize: 14, lineHeight: 1.55 }}>
                  {data.description}
                </p>
              )}

              {data.curator_notes && (
                <Section title="Kuratoriaus pastabos">
                  <p style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{data.curator_notes}</p>
                </Section>
              )}

              {data.accessibility && (
                <Section title="Pasiekiamumas">
                  <p style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.55, margin: 0 }}>{data.accessibility}</p>
                </Section>
              )}

              {data.film_locations && data.film_locations.length > 0 && (
                <Section title="Kūriniuose">
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {data.film_locations.map((fl) => {
                      const film = fl.films_tmdb;
                      const filmId = film?.id ?? null;
                      return (
                        <div key={fl.id} role="button" tabIndex={0}
                          onClick={() => { if (filmId) setSelectedFilm(filmId, fl.id); }}
                          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && filmId) { e.preventDefault(); setSelectedFilm(filmId, fl.id); } }}
                          className="cinemap-film-row"
                          style={{ display: "flex", gap: 12, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 10, padding: 10, cursor: filmId ? "pointer" : "default", transition: "background 160ms ease, border-color 160ms ease", alignItems: "stretch" }}
                        >
                          <div className={film?.poster_url ? "" : "poster-fallback"}
                            style={{ width: 56, height: 84, background: "#1a1a1a", borderRadius: 6, flexShrink: 0, overflow: "hidden" }}>
                            {film?.poster_url ? (
                              <img src={`https://image.tmdb.org/t/p/w92${film.poster_url}`} alt={film.title_lt ?? ""} width={56} height={84}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement?.classList.add("poster-fallback"); }} />
                            ) : null}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ color: "#f5f5f5", fontSize: 14, fontWeight: 600 }}>
                              {film?.title_lt ?? fl.fictional_name ?? "—"}
                              {film?.year ? <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 6 }}>({film.year})</span> : null}
                            </div>
                            {fl.fictional_name && film?.title_lt && (
                              <div style={{ color: "#9ca3af", fontSize: 11, fontStyle: "italic", marginTop: 2 }}>kaip „{fl.fictional_name}"</div>
                            )}
                            {fl.scene_desc && (
                              <p style={{ margin: "6px 0 0", color: "#d1d5db", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {fl.scene_desc}
                              </p>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                              {film?.imdb_rating != null && <span style={{ fontSize: 11, color: "#c9a84c" }}>★ {film.imdb_rating.toFixed(1)}</span>}
                              {film?.genre?.slice(0, 2).map((g) => (
                                <span key={g} style={{ background: "#1a1a1a", border: "1px solid #222222", borderRadius: 8, fontSize: 10, color: "#6b7280", padding: "1px 6px" }}>{g}</span>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", color: "#6b7280", flexShrink: 0 }} aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      {data && (
        <div style={{ borderTop: "1px solid #222222", background: "#111111", padding: "12px 16px", display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <ActionIconButton onClick={handleShare} ariaLabel="Dalintis">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="3" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                <line x1="4.5" y1="7" x2="11.5" y2="4" stroke="currentColor" strokeWidth="1.5" />
                <line x1="4.5" y1="9" x2="11.5" y2="12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </ActionIconButton>
            {copied && (
              <div role="status" style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #c9a84c", color: "#c9a84c", borderRadius: 6, padding: "4px 8px", fontSize: 11, whiteSpace: "nowrap", pointerEvents: "none" }}>
                Nukopijuota!
              </div>
            )}
          </div>
          <ActionIconButton onClick={() => window.open(buildMapsUrl(data.coordinates, data.name, data.address), "_blank")} ariaLabel="Nukreipti į Google Maps">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </ActionIconButton>
          {data.street_view_url && (
            <ActionIconButton onClick={() => window.open(data.street_view_url!, "_blank")} ariaLabel="Street View">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </ActionIconButton>
          )}
          {data.official_website_url && (
            <ActionIconButton onClick={() => window.open(data.official_website_url!, "_blank")} ariaLabel="Tinklapis">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 2C8 2 6 5 6 8C6 11 8 14 8 14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 2C8 2 10 5 10 8C10 11 8 14 8 14" stroke="currentColor" strokeWidth="1.5" />
                <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </ActionIconButton>
          )}
        </div>
      )}

      {selectedFilmId && <FilmContextView />}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9ca3af", fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}