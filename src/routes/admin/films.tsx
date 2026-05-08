import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/admin/films")({
  component: AdminFilms,
});

interface Film {
  id: string;
  title_lt: string | null;
  title_orig: string | null;
  media_type: string | null;
  year: number | null;
  imdb_rating: number | null;
  imdb_url: string | null;
  poster_url: string | null;
  trailer_key: string | null;
  description: string | null;
  director: string | null;
  genre: string[] | null;
  actors: string[] | null;
  tmdb_id: number | null;
}

const EMPTY = {
  title_lt: "", title_orig: "", media_type: "film", year: "",
  imdb_rating: "", imdb_url: "", poster_url: "", trailer_key: "",
  description: "", director: "", genre: "", actors: "", tmdb_id: "",
};

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY;

const inputStyle = {
  width: "100%", background: "#0a0a0a", border: "1px solid #222",
  borderRadius: 8, padding: "8px 12px", color: "#f5f5f5",
  fontSize: 13, outline: "none", boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block", color: "#9ca3af", fontSize: 11,
  marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.08em",
};

export default function AdminFilms() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Film | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [search, setSearch] = useState("");
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState<string | null>(null);

  const { data: films, isLoading } = useQuery({
    queryKey: ["admin-films"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films_tmdb")
        .select("id,title_lt,title_orig,media_type,year,imdb_rating,imdb_url,poster_url,trailer_key,description,director,genre,actors,tmdb_id")
        .order("title_lt");
      if (error) throw error;
      return data as Film[];
    },
  });

  const fetchFromTMDB = async () => {
    if (!form.tmdb_id.trim()) {
      setTmdbError("Įveskite TMDB ID pirmiau.");
      return;
    }
    setTmdbLoading(true);
    setTmdbError(null);

    try {
      const mediaType = form.media_type === "series" ? "tv" : "movie";
      const id = form.tmdb_id.trim();

      // Fetch main data
      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_KEY}&language=lt-LT&append_to_response=credits,videos,external_ids`
      );
      if (!res.ok) throw new Error("TMDB ID nerastas.");
      const data = await res.json();

      // Extract director
      const director = (data.credits?.crew ?? [])
        .filter((c: { job: string }) => c.job === "Director")
        .map((c: { name: string }) => c.name)
        .slice(0, 2)
        .join(", ");

      // Extract actors
      const actors = (data.credits?.cast ?? [])
        .slice(0, 5)
        .map((c: { name: string }) => c.name)
        .join(", ");

      // Extract genres
      const genre = (data.genres ?? [])
        .map((g: { name: string }) => g.name)
        .join(", ");

      // Extract trailer
      const trailer = (data.videos?.results ?? [])
        .find((v: { type: string; site: string }) => v.type === "Trailer" && v.site === "YouTube");

      // Extract year
      const releaseDate = data.release_date || data.first_air_date || "";
      const year = releaseDate ? releaseDate.split("-")[0] : "";

      // Extract IMDB
      const imdbId = data.external_ids?.imdb_id ?? "";

      // Title — use Lithuanian if available, fallback to original
      const titleLt = data.title || data.name || "";
      const titleOrig = data.original_title || data.original_name || "";

      setForm(p => ({
        ...p,
        title_lt: titleLt || p.title_lt,
        title_orig: titleOrig || p.title_orig,
        year: year || p.year,
        description: data.overview || p.description,
        poster_url: data.poster_path || p.poster_url,
        trailer_key: trailer?.key || p.trailer_key,
        director: director || p.director,
        actors: actors || p.actors,
        genre: genre || p.genre,
        imdb_url: imdbId ? `https://www.imdb.com/title/${imdbId}/` : p.imdb_url,
        imdb_rating: data.vote_average ? data.vote_average.toFixed(1) : p.imdb_rating,
      }));
    } catch (e) {
      setTmdbError((e as Error).message ?? "Klaida gaunant duomenis iš TMDB.");
    }

    setTmdbLoading(false);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title_lt: form.title_lt || null,
        title_orig: form.title_orig || null,
        media_type: form.media_type || null,
        year: form.year ? Number(form.year) : null,
        imdb_rating: form.imdb_rating ? Number(form.imdb_rating) : null,
        imdb_url: form.imdb_url || null,
        poster_url: form.poster_url || null,
        trailer_key: form.trailer_key || null,
        description: form.description || null,
        director: form.director || null,
        genre: form.genre ? form.genre.split(",").map(s => s.trim()).filter(Boolean) : null,
        actors: form.actors ? form.actors.split(",").map(s => s.trim()).filter(Boolean) : null,
        tmdb_id: form.tmdb_id ? Number(form.tmdb_id) : null,
      };
      if (editing) {
        const { error } = await supabase.from("films_tmdb").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("films_tmdb").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-films"] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
      setTmdbError(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("films_tmdb").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-films"] }),
  });

  const filtered = (films ?? []).filter(f =>
    (f.title_lt ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (f.title_orig ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (film: Film) => {
    setEditing(film);
    setCreating(false);
    setTmdbError(null);
    setForm({
      title_lt: film.title_lt ?? "",
      title_orig: film.title_orig ?? "",
      media_type: film.media_type ?? "film",
      year: film.year?.toString() ?? "",
      imdb_rating: film.imdb_rating?.toString() ?? "",
      imdb_url: film.imdb_url ?? "",
      poster_url: film.poster_url ?? "",
      trailer_key: film.trailer_key ?? "",
      description: film.description ?? "",
      director: film.director ?? "",
      genre: film.genre?.join(", ") ?? "",
      actors: film.actors?.join(", ") ?? "",
      tmdb_id: film.tmdb_id?.toString() ?? "",
    });
  };

  const f = (key: keyof typeof EMPTY, label: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontFamily: "Georgia, serif" }}>Filmai</h1>
        <button type="button" onClick={() => { setEditing(null); setCreating(true); setForm(EMPTY); setTmdbError(null); }}
          style={{ background: "#c9a84c", border: "none", borderRadius: 8, padding: "10px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Pridėti
        </button>
      </div>

      <input placeholder="Ieškoti..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16, maxWidth: 320 }} />

      {isLoading && <div style={{ color: "#9ca3af" }}>Kraunama…</div>}

      {(editing || creating) && (
        <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 20px", color: "#c9a84c", fontSize: 16 }}>
            {editing ? "Redaguoti filmą" : "Naujas filmas"}
          </h2>

          {/* TMDB auto-fill row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>TMDB ID</label>
              <input style={inputStyle} placeholder="pvz. 550" value={form.tmdb_id}
                onChange={e => setForm(p => ({ ...p, tmdb_id: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Tipas</label>
              <select value={form.media_type} onChange={e => setForm(p => ({ ...p, media_type: e.target.value }))} style={{ ...inputStyle, width: "auto", minWidth: 140 }}>
                <option value="film">Filmas</option>
                <option value="series">Serialas</option>
              </select>
            </div>
            <button type="button" onClick={fetchFromTMDB} disabled={tmdbLoading}
              style={{ background: "#1a1a1a", border: "1px solid #c9a84c", borderRadius: 8, padding: "9px 16px", color: "#c9a84c", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {tmdbLoading ? "Kraunama…" : "⟳ Užpildyti iš TMDB"}
            </button>
          </div>

          {tmdbError && (
            <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "8px 12px" }}>
              {tmdbError}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {f("title_lt", "Pavadinimas (LT)")}
            {f("title_orig", "Originalus pavadinimas")}
            {f("year", "Metai")}
            {f("imdb_rating", "IMDb reitingas")}
            {f("imdb_url", "IMDb URL")}
            {f("poster_url", "Plakato URL (TMDB kelias)")}
            {f("trailer_key", "YouTube trailer key")}
            {f("director", "Režisierius")}
            {f("genre", "Žanrai (per kablelį)")}
            {f("actors", "Aktoriai (per kablelį)")}
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Aprašymas</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {save.isError && (
            <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>Klaida išsaugant.</div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" onClick={() => save.mutate()} disabled={save.isPending}
              style={{ background: "#c9a84c", border: "none", borderRadius: 8, padding: "10px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {save.isPending ? "Saugoma…" : "Išsaugoti"}
            </button>
            <button type="button" onClick={() => { setEditing(null); setCreating(false); setTmdbError(null); }}
              style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, padding: "10px 20px", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>
              Atšaukti
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              {["Pavadinimas", "Tipas", "Metai", "IMDb", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((film) => (
              <tr key={film.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "12px 16px", color: "#f5f5f5", fontSize: 13 }}>{film.title_lt ?? film.title_orig ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{film.media_type ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{film.year ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#c9a84c", fontSize: 13 }}>{film.imdb_rating ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => openEdit(film)}
                      style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#c9a84c", fontSize: 12, cursor: "pointer" }}>Redaguoti</button>
                    <button type="button" onClick={() => { if (confirm("Ištrinti?")) remove.mutate(film.id); }}
                      style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#f87171", fontSize: 12, cursor: "pointer" }}>Ištrinti</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div style={{ padding: 24, color: "#6b7280", fontSize: 13, textAlign: "center" }}>Įrašų nerasta.</div>
        )}
      </div>
    </div>
  );
}
