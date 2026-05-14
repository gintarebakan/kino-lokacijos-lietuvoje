import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/admin/film-locations")({
  component: AdminFilmLocations,
});

interface FilmLocation {
  id: string;
  film_id: string | null;
  location_id: string | null;
  fictional_name: string | null;
  scene_desc: string | null;
  scene_significance: string | null;
  scene_facts: string | null;
  scene_images: string[] | null;
  films_tmdb: { title_lt: string | null }[] | null;
  locations_lt: { name: string }[] | null;
}

const EMPTY = {
  film_id: "",
  location_id: "",
  fictional_name: "",
  scene_desc: "",
  scene_significance: "",
  scene_facts: "",
  scene_images: "",
};

const inputStyle = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid #222",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#f5f5f5",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block",
  color: "#9ca3af",
  fontSize: 11,
  marginBottom: 4,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

export default function AdminFilmLocations() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<FilmLocation | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const { data: filmLocations, isLoading } = useQuery({
    queryKey: ["admin-film-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("film_locations")
        .select(
          "id,film_id,location_id,fictional_name,scene_desc,scene_significance,scene_facts,scene_images,films_tmdb(title_lt),locations_lt(name)",
        )
        .order("id");
      if (error) throw error;
      return data as FilmLocation[];
    },
  });

  const { data: films } = useQuery({
    queryKey: ["admin-films-select"],
    queryFn: async () => {
      const { data } = await supabase.from("films_tmdb").select("id,title_lt").order("title_lt");
      return data ?? [];
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["admin-locations-select"],
    queryFn: async () => {
      const { data } = await supabase.from("locations_lt").select("id,name").order("name");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        film_id: form.film_id || null,
        location_id: form.location_id || null,
        fictional_name: form.fictional_name || null,
        scene_desc: form.scene_desc || null,
        scene_significance: form.scene_significance || null,
        scene_facts: form.scene_facts || null,
        scene_images: form.scene_images
          ? form.scene_images
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      };
      if (editing) {
        const { error } = await supabase
          .from("film_locations")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("film_locations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-film-locations"] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("film_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-film-locations"] }),
  });

  const openEdit = (fl: FilmLocation) => {
    setEditing(fl);
    setCreating(false);
    setForm({
      film_id: fl.film_id ?? "",
      location_id: fl.location_id ?? "",
      fictional_name: fl.fictional_name ?? "",
      scene_desc: fl.scene_desc ?? "",
      scene_significance: fl.scene_significance ?? "",
      scene_facts: fl.scene_facts ?? "",
      scene_images: fl.scene_images?.join("\n") ?? "",
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontFamily: "Georgia, serif" }}>
          Filmo lokacijos
        </h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
            setForm(EMPTY);
          }}
          style={{
            background: "#c9a84c",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#0a0a0a",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + Pridėti
        </button>
      </div>

      {isLoading && <div style={{ color: "#9ca3af" }}>Kraunama…</div>}

      {(editing || creating) && (
        <div
          style={{
            background: "#111111",
            border: "1px solid #222",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: "0 0 20px", color: "#c9a84c", fontSize: 16 }}>
            {editing ? "Redaguoti" : "Nauja filmo lokacija"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Filmas</label>
              <select
                value={form.film_id}
                onChange={(e) => setForm((p) => ({ ...p, film_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">— Pasirinkti —</option>
                {(films ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title_lt ?? f.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lokacija</label>
              <select
                value={form.location_id}
                onChange={(e) => setForm((p) => ({ ...p, location_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">— Pasirinkti —</option>
                {(locations ?? []).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fiktyvus pavadinimas</label>
              <input
                style={inputStyle}
                value={form.fictional_name}
                onChange={(e) => setForm((p) => ({ ...p, fictional_name: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Scenos svarba</label>
              <select
                value={form.scene_significance}
                onChange={(e) => setForm((p) => ({ ...p, scene_significance: e.target.value }))}
                style={inputStyle}
              >
                <option value="">— Pasirinkti —</option>
                <option value="pagrindinė">Pagrindinė</option>
                <option value="svarbi">Svarbi</option>
                <option value="epizodinė">Epizodinė</option>
              </select>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}
          >
            <div>
              <label style={labelStyle}>Scenos aprašymas</label>
              <textarea
                value={form.scene_desc}
                onChange={(e) => setForm((p) => ({ ...p, scene_desc: e.target.value }))}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Įdomūs faktai</label>
              <textarea
                value={form.scene_facts}
                onChange={(e) => setForm((p) => ({ ...p, scene_facts: e.target.value }))}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Scenos nuotraukos (URL per eilutę)</label>
              <textarea
                value={form.scene_images}
                onChange={(e) => setForm((p) => ({ ...p, scene_images: e.target.value }))}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="https://...&#10;https://..."
              />
            </div>
          </div>
          {save.isError && (
            <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>Klaida išsaugant.</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              style={{
                background: "#c9a84c",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {save.isPending ? "Saugoma…" : "Išsaugoti"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
              style={{
                background: "transparent",
                border: "1px solid #333",
                borderRadius: 8,
                padding: "10px 20px",
                color: "#9ca3af",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Atšaukti
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: "#111111",
          border: "1px solid #222",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              {["Filmas", "Lokacija", "Fiktyvus pavadinimas", "Svarba", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#6b7280",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(filmLocations ?? []).map((fl) => (
              <tr key={fl.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "12px 16px", color: "#f5f5f5", fontSize: 13 }}>
                  {fl.films_tmdb?.[0]?.title_lt ?? fl.film_id ?? "—"}
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>
                  {fl.locations_lt?.[0]?.name ?? fl.location_id ?? "—"}
                </td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>
                  {fl.fictional_name ?? "—"}
                </td>
                <td style={{ padding: "12px 16px", color: "#c9a84c", fontSize: 13 }}>
                  {fl.scene_significance ?? "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => openEdit(fl)}
                      style={{
                        background: "transparent",
                        border: "1px solid #333",
                        borderRadius: 6,
                        padding: "4px 10px",
                        color: "#c9a84c",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Redaguoti
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Ištrinti?")) remove.mutate(fl.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #333",
                        borderRadius: 6,
                        padding: "4px 10px",
                        color: "#f87171",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Ištrinti
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(filmLocations ?? []).length === 0 && !isLoading && (
          <div style={{ padding: 24, color: "#6b7280", fontSize: 13, textAlign: "center" }}>
            Įrašų nerasta.
          </div>
        )}
      </div>
    </div>
  );
}
