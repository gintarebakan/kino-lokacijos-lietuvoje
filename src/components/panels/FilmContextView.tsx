import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMapStore } from "../../stores/mapStore";
import { useLocationDetail } from "../../hooks/useLocationDetail";

// Bendras šriftas visam skydeliui
const PANEL_FONT = "Inter, system-ui, -apple-system, sans-serif";

//----- Scenų reikšmingumo konfigūracija

// Filmo scenos reikšmingumo lygio vizualiniai parametrai (spalvos, fono)
const SIGNIFICANCE_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; color: string }
> = {
  pagrindinė: {
    label: "Pagrindinė scena",
    bg: "rgba(201,168,76,0.2)",
    border: "#c9a84c",
    color: "#c9a84c",
  },
  svarbi: {
    label: "Svarbi scena",
    bg: "rgba(192,192,192,0.12)",
    border: "#c0c0c0",
    color: "#d1d5db",
  },
  epizodinė: {
    label: "Epizodinė scena",
    bg: "rgba(107,114,128,0.1)",
    border: "#374151",
    color: "#6b7280",
  },
};

// Normalizavimo žemėlapis
const SIGNIFICANCE_ALIASES: Record<string, string> = {
  pagrindine: "pagrindinė",
  epizodine: "epizodinė",
};

// Formatuoja media tipo kodą į lietuvišką pavadinimą
const formatMediaType = (type: string | null | undefined) => {
  if (type === "series") return "Serialas";
  if (type === "film") return "Filmas";
  return type ?? "";
};

/**
 * Sukuria scenos reikšmingumo žymos elementą. Grąžina null jei reikšmingumas nenurodytas arba neatpažintas.
 */
function significanceBadge(sig: string | null) {
  if (!sig) return null;
  const key = SIGNIFICANCE_ALIASES[sig] ?? sig;
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
        fontSize: 11,
        padding: "4px 10px",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

// ----- Pagrindinis komponentas

/**
 * Filmo kontekstas rodomas LocationDetailPanel viduje kai vartotojas paspaudžia ant konkretaus filmo lokacijos sąraše.
 *
 * Rodo:
Filmo posterį, pavadinimą, metus, žanrus
 Scenos reikšmingumą ir fiktyvų lokacijos pavadinimą
IMDb reitingą ir nuorodą
režisierių ir aktorius
filmo aprašymą
anonso mygtuką
scenos aprašymą ir nuotraukų karuselę su lightbox'u
Įdomius faktus
 */
export default function FilmContextView() {
  const selectedLocationId = useMapStore((s) => s.selectedLocationId);
  const selectedFilmId = useMapStore((s) => s.selectedFilmId);
  const selectedFilmLocationId = useMapStore((s) => s.selectedFilmLocationId);
  const setSelectedFilm = useMapStore((s) => s.setSelectedFilm);

  // Lokacijos detalūs duomenys su visais filmais
  const { data } = useLocationDetail(selectedLocationId);

  // Nuoroda į scenos nuotraukų karuselės konteinerį
  const carouselRef = useRef<HTMLDivElement>(null);

  // Lightbox būsena, kurios nuotraukos indeksas šiuo metu didinamas
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Ar šiuo metu rodomas anonsas
  const [showTrailer, setShowTrailer] = useState(false);

  // Randame aktyvų filmo-lokacijos ryšį pagal selectedFilmLocationId
  const filmLocation = data?.film_locations?.find((fl) => fl.id === selectedFilmLocationId) ?? null;
  const film = filmLocation?.films_tmdb ?? null;
  const sceneImages = filmLocation?.scene_images ?? null;

  // Klaviatūros valdymas lightbox'ui. Escape uždaro, rodyklės naršo
  useEffect(() => {
    if (!sceneImages) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((p) => (p !== null ? Math.min(sceneImages.length - 1, p + 1) : p));
      if (e.key === "ArrowLeft") setLightboxIndex((p) => (p !== null ? Math.max(0, p - 1) : p));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, sceneImages]);

  // Uždaro lightboxą kai pasikeičia aktyvus filmas
  useEffect(() => {
    setLightboxIndex(null);
  }, [selectedFilmId]);

  // Jei filmas nepasirinktas arba duomenys dar neįkeltinieko nerodome
  if (!selectedFilmId || !data) return null;

  const trailerKey = film?.trailer_key ?? null;
  const description = film?.description?.trim() || null;

  // Slinkimo funkcija scenos nuotraukų karuselei
  const scrollCarousel = (dir: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#111111",
        display: "flex",
        flexDirection: "column",
        // Įslinkimo animacija iš dešinės kai atidaromas filmo rodinys
        animation: "filmctx-slide 220ms ease",
        zIndex: 5,
        fontFamily: PANEL_FONT,
      }}
    >
      <style>{`
        @keyframes filmctx-slide {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .cinemap-scene-thumb { transition: opacity 0.15s ease; }
        .cinemap-scene-thumb:hover { opacity: 0.85; }
      `}</style>

      {/* Grįžimo mygtukas grąžina į lokacijos skydelį */}
      <button
        type="button"
        onClick={() => setSelectedFilm(null, null)}
        aria-label="Atgal"
        className="cinemap-btn-back"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 4L6 8L10 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Atgal
      </button>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Filmo posteris su gradientu apačioje */}
        <div
          className={film?.poster_url ? "" : "poster-fallback"}
          style={{
            width: "100%",
            aspectRatio: "2/3",
            maxHeight: 420,
            background: "#1a1a1a",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {film?.poster_url && (
            <img
              src={`https://image.tmdb.org/t/p/w500${film.poster_url}`}
              alt={film.title_lt ?? ""}
              width={360}
              height={540}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => {
                // Jei nuotrauka neįkeliama, pridedame fallback klasę
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.add("poster-fallback");
              }}
            />
          )}
          {/* Gradientas - sklandus perėjimas prie turinio žemiau */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, transparent 50%, rgba(12,12,12,0.95) 100%)",
            }}
          />
        </div>

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Media tipo žyma (FILMAS / SERIALAS) */}
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#c9a84c",
              marginBottom: 6,
            }}
          >
            {formatMediaType(film?.media_type) || "Filmas"}
          </div>

          {/* Filmo pavadinimas su metais */}
          <h2
            style={{
              margin: 0,
              color: "#f5f5f5",
              fontFamily: PANEL_FONT,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            {film?.title_lt ?? filmLocation?.fictional_name ?? "—"}
            {film?.year ? (
              <span style={{ color: "#9ca3af", fontWeight: 400, marginLeft: 8, fontSize: 16 }}>
                ({film.year})
              </span>
            ) : null}
          </h2>

          {/* Scenos reikšmingumo žyma */}
          {filmLocation?.scene_significance && (
            <div style={{ marginTop: 6, marginBottom: 10 }}>
              {significanceBadge(filmLocation.scene_significance)}
            </div>
          )}

          {/* Fiktyvus lokacijos pavadinimas, kai filmas lokaciją rodo kaip kitą vietą */}
          {filmLocation?.fictional_name && film?.title_lt && (
            <div style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic", marginTop: 6 }}>
              kaip „{filmLocation.fictional_name}"
            </div>
          )}

          {/* IMDb reitingas ir nuoroda */}
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {film?.imdb_rating != null && (
              <span style={{ fontSize: 13, color: "#c9a84c" }}>
                ★ {film.imdb_rating.toFixed(1)}
              </span>
            )}
            {film?.imdb_url && (
              <a
                href={film.imdb_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "#9ca3af" }}
              >
                IMDb
              </a>
            )}
          </div>

          {/* Žanrų žymos, kur rodomi tik pirmieji 3 */}
          {film?.genre && film.genre.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {film.genre.slice(0, 3).map((g) => (
                <span
                  key={g}
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #222222",
                    borderRadius: 10,
                    fontSize: 11,
                    color: "#9ca3af",
                    padding: "2px 8px",
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Režisierius */}
          {film?.director && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <span style={{ color: "#4b5563", marginRight: 6 }}>Režisierius</span>
              <span style={{ color: "#9ca3af" }}>{film.director}</span>
            </div>
          )}

          {/* Aktoriai,kur rodomi tik pirmieji 3 */}
          {film?.actors && film.actors.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 12 }}>
              <span style={{ color: "#4b5563", marginRight: 6 }}>Aktoriai</span>
              <span style={{ color: "#9ca3af" }}>{film.actors.slice(0, 3).join(", ")}</span>
            </div>
          )}

          {/* Filmo aprašymas */}
          {description && (
            <p
              style={{
                color: "#9ca3af",
                fontSize: 13,
                lineHeight: 1.6,
                marginTop: 12,
                marginBottom: 12,
              }}
            >
              {description}
            </p>
          )}

          {/* Anonso mygtukas atidaro YouTube modal per React portal */}
          {trailerKey ? (
            <button
              type="button"
              onClick={() => setShowTrailer(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, #c9a84c, #a8863a)",
                border: "none",
                borderRadius: 8,
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.05em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
                marginBottom: 12,
                fontFamily: PANEL_FONT,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2L14 8L4 14V2Z" />
              </svg>
              Anonsas
            </button>
          ) : (
            // Anonso mygtukas išjungtas kai trailer_key nėra DB
            <button
              type="button"
              disabled
              style={{
                width: "100%",
                padding: "12px",
                background: "#1a1a1a",
                border: "none",
                borderRadius: 8,
                color: "#6b7280",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.05em",
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
                marginBottom: 12,
                fontFamily: PANEL_FONT,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2L14 8L4 14V2Z" />
              </svg>
              Anonsas neprieinamas
            </button>
          )}

          {/* Scenos aprašymas šioje konkrečioje lokacijoje */}
          {filmLocation?.scene_desc && (
            <div style={{ marginTop: 22 }}>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#9ca3af",
                  fontWeight: 600,
                }}
              >
                Scena šioje vietoje
              </h3>
              <p style={{ margin: 0, color: "#d1d5db", fontSize: 13, lineHeight: 1.55 }}>
                {filmLocation.scene_desc}
              </p>
            </div>
          )}

          {/* Scenos nuotraukų karuselė su lightbox galimybe */}
          {sceneImages && sceneImages.length > 0 && (
            <div style={{ marginTop: 22, marginLeft: -20, marginRight: -20 }}>
              <h3
                style={{
                  margin: "0 20px 8px",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#9ca3af",
                  fontWeight: 600,
                }}
              >
                Kadrai iš scenos
              </h3>
              <div style={{ position: "relative" }}>
                {/* Horizontaliai slenkanti nuotraukų eilė */}
                <div
                  ref={carouselRef}
                  style={{
                    display: "flex",
                    gap: 8,
                    overflowX: "auto",
                    padding: "0 16px",
                    scrollbarWidth: "none",
                  }}
                >
                  {sceneImages.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Kadras ${i + 1}`}
                      width={140}
                      height={90}
                      className="cinemap-scene-thumb"
                      onClick={() => setLightboxIndex(i)} // Atidaro lightbox
                      style={{
                        width: 140,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ))}
                </div>

                {/* Karuselės navigacijos mygtukai rodomi tik kai daugiau nei 2 nuotraukos */}
                {sceneImages.length > 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => scrollCarousel(-1)}
                      aria-label="Ankstesnis"
                      style={{
                        position: "absolute",
                        left: 4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.65)",
                        border: "1px solid #222",
                        color: "#f5f5f5",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M10 4L6 8L10 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCarousel(1)}
                      aria-label="Kitas"
                      style={{
                        position: "absolute",
                        right: 4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.65)",
                        border: "1px solid #222",
                        color: "#f5f5f5",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M6 4L10 8L6 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Įdomūs faktai apie sceną */}
          {filmLocation?.scene_facts && (
            <div style={{ marginTop: 22 }}>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#9ca3af",
                  fontWeight: 600,
                }}
              >
                Įdomūs faktai
              </h3>
              <p style={{ margin: 0, color: "#d1d5db", fontSize: 13, lineHeight: 1.55 }}>
                {filmLocation.scene_facts}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Anonso modal renderinamas tiesiai į document.body per React portal,
          kad nepaveiktų skydelio overflow ir z-index */}
      {showTrailer &&
        trailerKey &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setShowTrailer(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => setShowTrailer(false)}
              aria-label="Uždaryti"
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "min(860px, 90vw)", aspectRatio: "16/9" }}
            >
              {/* autoplay=1 — vaizdo įrašas pradedamas automatiškai */}
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Lightbox modal rodo padidintą scenos nuotrauką su navigacija */}
      {lightboxIndex !== null &&
        sceneImages &&
        sceneImages[lightboxIndex] &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Uždarymo mygtukas */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              aria-label="Uždaryti"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 999,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Ankstesnė nuotrauka rodoma tik jei ne pirmoji */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((p) => (p !== null ? Math.max(0, p - 1) : p));
                }}
                aria-label="Ankstesnis"
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {/* Kita nuotrauka rodoma tik jei ne paskutinė */}
            {lightboxIndex < sceneImages.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((p) =>
                    p !== null ? Math.min(sceneImages.length - 1, p + 1) : p,
                  );
                }}
                aria-label="Kitas"
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            {/* Padidinta nuotrauka */}
            <img
              src={sceneImages[lightboxIndex]}
              alt={`Kadras ${lightboxIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 8,
                display: "block",
              }}
            />

            {/* Nuotraukos numeris iš viso skaičiaus */}
            <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 12, textAlign: "center" }}>
              {lightboxIndex + 1} / {sceneImages.length}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
