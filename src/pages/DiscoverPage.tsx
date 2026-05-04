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

const sectionHeaderStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#f5f5f5",
  fontSize: 13,
  fontWeight: 600,
  padding: "24px 16px 12px 16px",
  margin: 0,
};

const scrollRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "0 16px 16px",
  overflowX: "auto",
};

function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => scroll(-1)}
        style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, background: "rgba(10,10,10,0.8)", border: "1px solid #333",
          color: "#c9a84c", width: 32, height: 32, borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, lineHeight: 1,
        }}
      >
        ‹
      </button>
      <div ref={ref} className="cinemap-scroll-row" style={scrollRowStyle}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        style={{
          position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, background: "rgba(10,10,10,0.8)", border: "1px solid #333",
          color: "#c9a84c", width: 32, height: 32, borderRadius: "50%",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, lineHeight: 1,
        }}
      >
        ›
      </button>
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
        .select("id, name, slug, image_url, location_type, film_count")
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
        .limit(6);
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
        .cinemap-line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <Suspense fallback={<div style={{ width: "100%", height: 240, background: "#1a1a1a" }} />}>
        <MiniMapPreview />
      </Suspense>

      {/* Section 1: Popular Locations */}
      <section>
        <h2 style={sectionHeaderStyle}>Populiarios lokacijos</h2>
        <ScrollRow>
          {(locations ?? []).map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => openLocation(loc.slug)}
              style={{
                width: 160,
                height: 200,
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
             <ImageWithFallback
  src={loc.image_url}
  alt={loc.name}
  fallbackType="location"
  width={160}
  height={200}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  }}
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
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  textAlign: "left",
                }}
              >
                {loc.name}
              </div>
            </button>
          ))}
          {locations && locations.length === 0 && (
            <div style={{ color: "#6b7280", fontSize: 13, padding: "8px 0" }}>
              Nėra lokacijų.
            </div>
          )}
        </ScrollRow>
      </section>

      {/* Section 2: Popular Films */}
      <section>
        <h2 style={sectionHeaderStyle}>Populiarus turinys</h2>
        <div className="cinemap-scroll-row" style={scrollRowStyle}>
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
                width: 120,
                flexShrink: 0,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 180,
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#1a1a1a",
                }}
              >
<ImageWithFallback
  src={
    film.poster_url
      ? `https://image.tmdb.org/t/p/w342${film.poster_url}`
      : null
  }
  alt={film.title_lt ?? ""}
  fallbackType="poster"
  width={120}
  height={180}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
  }}
/>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#f5f5f5",
                  marginTop: 6,
                  lineHeight: 1.3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 120,
                }}
              >
                {film.title_lt ?? ""}
              </div>
              {film.imdb_rating !== null && film.imdb_rating !== undefined && (
                <div style={{ fontSize: 11, color: "#c9a84c", marginTop: 2 }}>
                  ⭐ {Number(film.imdb_rating).toFixed(1)}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Section 3: Curated Routes */}
      <section>
        <h2 style={sectionHeaderStyle}>Kuruoti maršrutai</h2>
        <div className="cinemap-scroll-row" style={scrollRowStyle}>
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
                  width: 200,
                  height: 140,
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
                {col.cover_url && (
<ImageWithFallback
  src={col.cover_url}
  alt={col.title}
  fallbackType="location"
  width={200}
  height={140}
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  }}
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
                    padding: 8,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {col.title}
                </div>
              </button>
            ))
          ) : (
            <div
              style={{
                width: 200,
                height: 140,
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
              }}
            >
              Maršrutai bus pridėti netrukus
            </div>
          )}
        </div>
      </section>
    </main>
  );
}