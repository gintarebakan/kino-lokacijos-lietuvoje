import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../lib/supabase";
import { useMapStore } from "../stores/mapStore";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";

interface Film {
  id: string;
  title_lt: string | null;
  title_orig: string | null;
  media_type: string | null;
  year: number | null;
  genre: string[] | null;
  imdb_rating: number | null;
  poster_url: string | null;
}

const MEDIA_TYPE_OPTIONS = [
  { value: "", label: "Visi" },
  { value: "film", label: "Filmai" },
  { value: "series", label: "Serialai" },
];

function filmsCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (count === 1) return "1 filmas ir serialas įamžintas Lietuvoje";
  if (mod10 >= 2 && mod10 <= 9 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} filmai ir serialai įamžinti Lietuvoje`;
  }
  return `${count} filmų ir serialų įamžintų Lietuvoje`;
}

export default function FilmsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterYearFrom, setFilterYearFrom] = useState("");
  const [filterYearTo, setFilterYearTo] = useState("");
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState<"rating" | "year">("rating");

  const { data: films = [], isLoading } = useQuery<Film[]>({
    queryKey: ["all-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films_tmdb")
        .select("id, title_lt, title_orig, media_type, year, genre, imdb_rating, poster_url")
        .order("imdb_rating", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Film[];
    },
  });

  const genres = useMemo(() => {
    const set = new Set<string>();
    films.forEach((f) => f.genre?.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [films]);

  const filtered = useMemo(() => {
    let result = films.filter((f) => {
      const matchSearch =
        !search ||
        f.title_lt?.toLowerCase().includes(search.toLowerCase()) ||
        f.title_orig?.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || f.media_type === filterType;
      const matchGenre = !filterGenre || f.genre?.includes(filterGenre);
      const matchYearFrom = !filterYearFrom || (f.year ?? 0) >= Number(filterYearFrom);
      const matchYearTo = !filterYearTo || (f.year ?? 9999) <= Number(filterYearTo);
      const matchRating = !filterRating || (f.imdb_rating ?? 0) >= filterRating;
      return matchSearch && matchType && matchGenre && matchYearFrom && matchYearTo && matchRating;
    });

    if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.imdb_rating ?? 0) - (a.imdb_rating ?? 0));
    } else {
      result = [...result].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    }
    return result;
  }, [films, search, filterType, filterGenre, filterYearFrom, filterYearTo, filterRating, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterGenre("");
    setFilterYearFrom("");
    setFilterYearTo("");
    setFilterRating(0);
  };

  const hasFilters =
    search || filterType || filterGenre || filterYearFrom || filterYearTo || filterRating > 0;

  const openFilm = (id: string) => {
    useMapStore.getState().setRouteGeoJSON(null);
    useMapStore.getState().setSelectedCollection(null);
    useMapStore.getState().setSelectedFilmDetail(id);
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
        .film-card:hover .film-overlay { opacity: 1 !important; }
        .film-card:hover { transform: scale(1.02); }
        .film-card { transition: transform 0.18s ease; }
        .film-filter-btn { transition: all 0.15s; }
        .film-filter-btn:hover { border-color: #c9a84c !important; color: #c9a84c !important; }
      `}</style>

      {/* Header */}
      <section
        style={{
          padding: "40px 24px 28px",
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
          Visas turinys
        </h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 20px" }}>
          {filmsCountLabel(films.length)}
        </p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 400, marginBottom: 16 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Ieškoti filmo ar serialo..."
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

        {/* Media type filter */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {MEDIA_TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              className="film-filter-btn"
              onClick={() => setFilterType(t.value)}
              style={{
                background: filterType === t.value ? "rgba(201,168,76,0.12)" : "transparent",
                border: `1px solid ${filterType === t.value ? "#c9a84c" : "#2a2a2a"}`,
                borderRadius: 8,
                padding: "6px 14px",
                color: filterType === t.value ? "#c9a84c" : "#6b7280",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: filterType === t.value ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}

          <div style={{ width: 1, background: "#222", margin: "0 4px" }} />

          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            style={{
              background: filterGenre ? "rgba(201,168,76,0.08)" : "#111111",
              border: `1px solid ${filterGenre ? "#c9a84c" : "#2a2a2a"}`,
              borderRadius: 8,
              padding: "6px 10px",
              color: filterGenre ? "#c9a84c" : "#6b7280",
              fontSize: 12,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">Visi žanrai</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <div style={{ width: 1, background: "#222", margin: "0 4px" }} />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "rating" | "year")}
            style={{
              background: "#111111",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: "6px 10px",
              color: "#6b7280",
              fontSize: 12,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="rating">Reitingas ↓</option>
            <option value="year">Metai ↓</option>
          </select>
        </div>

        {/* Year + rating row */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="number"
            placeholder="Nuo metų"
            value={filterYearFrom}
            onChange={(e) => setFilterYearFrom(e.target.value)}
            style={{
              background: "#111111",
              border: `1px solid ${filterYearFrom ? "#c9a84c" : "#2a2a2a"}`,
              borderRadius: 8,
              padding: "6px 10px",
              color: filterYearFrom ? "#c9a84c" : "#6b7280",
              fontSize: 12,
              outline: "none",
              width: 100,
            }}
          />
          <input
            type="number"
            placeholder="Iki metų"
            value={filterYearTo}
            onChange={(e) => setFilterYearTo(e.target.value)}
            style={{
              background: "#111111",
              border: `1px solid ${filterYearTo ? "#c9a84c" : "#2a2a2a"}`,
              borderRadius: 8,
              padding: "6px 10px",
              color: filterYearTo ? "#c9a84c" : "#6b7280",
              fontSize: 12,
              outline: "none",
              width: 100,
            }}
          />

          <div style={{ width: 1, background: "#222", margin: "0 4px" }} />

          <span
            style={{
              color: "#6b7280",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            IMDb ≥
          </span>
          {[0, 6, 7, 7.5, 8].map((r) => (
            <button
              key={r}
              type="button"
              className="film-filter-btn"
              onClick={() => setFilterRating(r)}
              style={{
                background: filterRating === r ? "rgba(201,168,76,0.12)" : "transparent",
                border: `1px solid ${filterRating === r ? "#c9a84c" : "#2a2a2a"}`,
                borderRadius: 8,
                padding: "6px 10px",
                color: filterRating === r ? "#c9a84c" : "#6b7280",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: filterRating === r ? 600 : 400,
              }}
            >
              {r === 0 ? "Visi" : `${r}+`}
            </button>
          ))}
        </div>

        {hasFilters && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>
              Rodoma: <strong style={{ color: "#c9a84c" }}>{filtered.length}</strong> kūrinių
            </span>
            <button
              type="button"
              onClick={clearFilters}
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
            Kūrinių nerasta.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((film) => (
            <button
              key={film.id}
              type="button"
              className="film-card"
              onClick={() => openFilm(film.id)}
              style={{
                position: "relative",
                background: "#1a1a1a",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "2/3", position: "relative" }}>
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
                <div
                  className="film-overlay"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(201,168,76,0.08)",
                    border: "2px solid rgba(201,168,76,0.4)",
                    borderRadius: 10,
                    opacity: 0,
                    transition: "opacity 0.18s",
                  }}
                />
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
              </div>
              <div style={{ padding: "8px 8px 10px" }}>
                <div
                  style={
                    {
                      color: "#f5f5f5",
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      marginBottom: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    } as React.CSSProperties
                  }
                >
                  {film.title_lt ?? film.title_orig ?? "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {film.imdb_rating != null && (
                    <span style={{ color: "#c9a84c", fontSize: 11, fontWeight: 700 }}>
                      ⭐ {Number(film.imdb_rating).toFixed(1)}
                    </span>
                  )}
                  {film.year && <span style={{ color: "#6b7280", fontSize: 11 }}>{film.year}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
