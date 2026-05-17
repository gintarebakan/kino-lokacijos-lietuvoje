import { lazy, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { useMapStore } from "../stores/mapStore";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";

const MiniMapPreview = lazy(() => import("../components/map/MiniMapPreview"));

interface PopularLocation {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  location_type: string | null;
  film_count: number | null;
  county: string | null;
}

function filmCountLabel(count: number): string {
  if (count === 1) return "1 filmas";
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} filmai`;
  }
  return `${count} filmų`;
}

interface PopularFilm {
  id: string;
  title_lt: string | null;
  poster_url: string | null;
  imdb_rating: number | null;
  media_type: string | null;
  year: number | null;
}

interface CuratedCollection {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  is_route: boolean | null;
}

const scrollRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "0 16px 16px",
  overflowX: "auto",
  cursor: "grab",
  userSelect: "none",
};

// Drag scroll — be strėlyčių
function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (ref.current?.offsetLeft ?? 0);
    scrollLeft.current = ref.current?.scrollLeft ?? 0;
    if (ref.current) ref.current.style.cursor = "grabbing";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (ref.current?.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.2;
    if (ref.current) ref.current.scrollLeft = scrollLeft.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (ref.current) ref.current.style.cursor = "grab";
  };

  return (
    <div
      ref={ref}
      className="cinemap-scroll-row"
      style={scrollRowStyle}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  linkTo,
  navigate,
}: {
  title: string;
  description: string;
  linkTo: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div style={{ padding: "24px 16px 8px" }}>
      <button
        type="button"
        onClick={() => navigate({ to: linkTo as any })}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "#c9a84c",
          fontSize: 15,
          fontWeight: 700,
          margin: "0 0 8px",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {title}
        <span style={{ fontSize: 16, opacity: 0.7 }}>›</span>
      </button>
      <p style={{ color: "#6b7280", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();

  const { data: locations } = useQuery<PopularLocation[]>({
    queryKey: ["popular-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations_by_film_count")
        .select("id, name, slug, image_url, location_type, film_count, county")
        .limit(10);
      if (error) throw error;
      return (data ?? []) as PopularLocation[];
    },
  });

  const { data: films } = useQuery<PopularFilm[]>({
    queryKey: ["popular-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films_tmdb")
        .select("id, title_lt, poster_url, imdb_rating, media_type, year")
        .order("imdb_rating", { ascending: false, nullsFirst: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as PopularFilm[];
    },
  });

  const { data: collections } = useQuery<CuratedCollection[]>({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections_curated")
        .select("id, title, description, cover_url, is_route")
        .limit(10);
      if (error) throw error;
      return (data ?? []) as CuratedCollection[];
    },
  });

  const openLocation = (slug: string | null) => {
    navigate({ to: "/map" });
    useMapStore.getState().setSelectedLocationFromDiscover(null);
    useMapStore.getState().setRouteGeoJSON(null);
    if (slug) {
      setTimeout(() => {
        useMapStore.getState().setPendingLocation(slug);
        useMapStore.getState().setSelectedLocationFromDiscover(slug);
      }, 150);
    }
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
        .cinemap-scroll-row::-webkit-scrollbar { display: none; }
        .cinemap-scroll-row { scrollbar-width: none; }
      `}</style>

      <Suspense fallback={<div style={{ width: "100%", height: 240, background: "#1a1a1a" }} />}>
        <MiniMapPreview />
      </Suspense>

      {/* Section 1: Popular Locations */}
      <section>
        <SectionHeader
          title="Populiarios lokacijos"
          description="Filmavimo vietos Lietuvoje, kurios dažniausiai įamžintos ekrane. Atraskite lokacijas, kuriose buvo kuriami filmai ir serialai."
          linkTo="/locations"
          navigate={navigate}
        />
        <ScrollRow>
          {(locations ?? []).map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => openLocation(loc.slug)}
              style={{
                width: 160,
                borderRadius: 12,
                overflow: "hidden",
                flexShrink: 0,
                position: "relative",
                border: "none",
                padding: 0,
                cursor: "pointer",
                background: "#1a1a1a",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "2/3", position: "relative" }}>
                <ImageWithFallback
                  src={loc.image_url}
                  alt={loc.name}
                  fallbackType="location"
                  width={160}
                  height={240}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 50%)",
                  }}
                />
                {loc.film_count !== null && loc.film_count !== undefined && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(201,168,76,0.9)",
                      color: "#0a0a0a",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 8,
                      padding: "2px 8px",
                    }}
                  >
                    {filmCountLabel(Number(loc.film_count))}
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 8,
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      textAlign: "left",
                      lineHeight: 1.3,
                    }}
                  >
                    {loc.name}
                  </div>
                  {loc.county && (
                    <div
                      style={{
                        color: "#9ca3af",
                        fontSize: 11,
                        textAlign: "left",
                        marginTop: 2,
                      }}
                    >
                      {loc.county.charAt(0).toUpperCase() + loc.county.slice(1).toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
          {locations && locations.length === 0 && (
            <div style={{ color: "#6b7280", fontSize: 13, padding: "8px 0" }}>Nėra lokacijų.</div>
          )}
        </ScrollRow>
      </section>

      {/* Section 2: Popular Films */}
      <section>
        <SectionHeader
          title="Populiarus turinys"
          description="Geriausiai įvertinti kino projektai, kurių scenoms filmuoti buvo pasirinktos Lietuvos lokacijos. Atraskite, kur buvo kuriami jūsų mėgstami filmai ir serialai."
          linkTo="/films"
          navigate={navigate}
        />
        <ScrollRow>
          {(films ?? []).map((film) => (
            <button
              key={film.id}
              type="button"
              onClick={() => {
                useMapStore.getState().setRouteGeoJSON(null);
                useMapStore.getState().setPreviousCollection(null);
                useMapStore.getState().setSelectedFilmDetail(film.id);
                navigate({ to: "/map" });
              }}
              style={{
                width: 160,
                height: 240,
                flexShrink: 0,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <ImageWithFallback
                src={film.poster_url ? `https://image.tmdb.org/t/p/w342${film.poster_url}` : null}
                alt={film.title_lt ?? ""}
                fallbackType="poster"
                width={160}
                height={240}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                  display: "block",
                }}
              />
              {/* Gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 50%)",
                }}
              />
              {/* Media type badge */}
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  background:
                    film.media_type === "series" ? "rgba(99,102,241,0.85)" : "rgba(0,0,0,0.65)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  borderRadius: 5,
                  padding: "2px 6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {film.media_type === "series" ? "Serialas" : "Filmas"}
              </div>
              {/* Title, rating, year overlay at bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 8,
                }}
              >
                <div
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {film.title_lt ?? ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {film.imdb_rating !== null && film.imdb_rating !== undefined && (
                    <span style={{ color: "#c9a84c", fontSize: 11, fontWeight: 700 }}>
                      ⭐ {Number(film.imdb_rating).toFixed(1)}
                    </span>
                  )}
                  {film.year && <span style={{ color: "#9ca3af", fontSize: 11 }}>{film.year}</span>}
                </div>
              </div>
            </button>
          ))}
        </ScrollRow>
      </section>

      {/* Section 3: Kino maršrutai */}
      <section>
        <SectionHeader
          title="Kino maršrutai"
          description="Iš anksto paruošti maršrutai po svarbiausias Lietuvos filmavimo vietas. Nesvarbu, esate kino entuziastas ar keliautojas - pajuskite istorijas, kurios slepiasi kiekvienoje scenoje."
          linkTo="/map"
          navigate={navigate}
        />
        <ScrollRow>
          {collections && collections.length > 0 ? (
            collections.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => {
                  useMapStore.getState().setSelectedCollection(col.id);
                  navigate({ to: "/map" });
                }}
                style={{
                  width: 332,
                  cursor: "pointer",
                  background: "transparent",
                  padding: 0,
                  border: "none",
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <div style={{ width: "100%", aspectRatio: "2/3", position: "relative" }}>
                  {col.cover_url && (
                    <ImageWithFallback
                      src={col.cover_url}
                      alt={col.title}
                      fallbackType="location"
                      width={332}
                      height={498}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: 12,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {col.title}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div
              style={{
                width: 332,
                borderRadius: 12,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1a1a1a, #111111)",
                color: "#6b7280",
                fontSize: 13,
                textAlign: "center",
                padding: 12,
                aspectRatio: "2/3",
              }}
            >
              Maršrutai bus pridėti netrukus
            </div>
          )}
        </ScrollRow>
      </section>
    </main>
  );
}