import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/admin/locations")({
  component: AdminLocations,
});

interface Location {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  county: string | null;
  location_type: string | null;
  description: string | null;
  image_url: string | null;
  official_website_url: string | null;
  street_view_url: string | null;
  curator_notes: string | null;
  accessibility: string | null;
}

const EMPTY: Omit<Location, "id"> = {
  name: "", slug: "", address: "", county: "", location_type: "",
  description: "", image_url: "", official_website_url: "",
  street_view_url: "", curator_notes: "", accessibility: "",
};

const inputStyle = {
  width: "100%", background: "#0a0a0a", border: "1px solid #222",
  borderRadius: 8, padding: "8px 12px", color: "#f5f5f5",
  fontSize: 13, outline: "none", boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block", color: "#9ca3af", fontSize: 11,
  marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.08em",
};

export default function AdminLocations() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<Location, "id">>(EMPTY);
  const [search, setSearch] = useState("");

  const { data: locations, isLoading } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations_lt")
        .select("id,name,slug,address,county,location_type,description,image_url,official_website_url,street_view_url,curator_notes,accessibility")
        .order("name");
      if (error) throw error;
      return data as Location[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("locations_lt").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("locations_lt").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-locations"] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations_lt").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-locations"] }),
  });

  const filtered = (locations ?? []).filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.county ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setCreating(false);
    const { id, ...rest } = loc;
    setForm(rest);
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(EMPTY);
  };

  const f = (key: keyof typeof EMPTY) => (
    <div>
      <label style={labelStyle}>{key}</label>
      <input
        style={inputStyle}
        value={(form[key] as string) ?? ""}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontFamily: "Georgia, serif" }}>Lokacijos</h1>
        <button type="button" onClick={openCreate} style={{ background: "#c9a84c", border: "none", borderRadius: 8, padding: "10px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Pridėti
        </button>
      </div>

      <input
        placeholder="Ieškoti..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: 16, maxWidth: 320 }}
      />

      {isLoading && <div style={{ color: "#9ca3af" }}>Kraunama…</div>}

      {/* Form panel */}
      {(editing || creating) && (
        <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 20px", color: "#c9a84c", fontSize: 16 }}>
            {editing ? "Redaguoti lokaciją" : "Nauja lokacija"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {f("name")}{f("slug")}{f("address")}{f("county")}
            {f("location_type")}{f("image_url")}{f("official_website_url")}{f("street_view_url")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>description</label>
              <textarea value={form.description ?? ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>curator_notes</label>
              <textarea value={form.curator_notes ?? ""} onChange={e => setForm(p => ({ ...p, curator_notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>accessibility</label>
              <textarea value={form.accessibility ?? ""} onChange={e => setForm(p => ({ ...p, accessibility: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          {save.isError && <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>Klaida išsaugant.</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" onClick={() => save.mutate()} disabled={save.isPending} style={{ background: "#c9a84c", border: "none", borderRadius: 8, padding: "10px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {save.isPending ? "Saugoma…" : "Išsaugoti"}
            </button>
            <button type="button" onClick={() => { setEditing(null); setCreating(false); }} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, padding: "10px 20px", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>
              Atšaukti
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              {["Pavadinimas", "Apskritis", "Tipas", "Slug", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((loc) => (
              <tr key={loc.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "12px 16px", color: "#f5f5f5", fontSize: 13 }}>{loc.name}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{loc.county ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{loc.location_type ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>{loc.slug ?? "—"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => openEdit(loc)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#c9a84c", fontSize: 12, cursor: "pointer" }}>Redaguoti</button>
                    <button type="button" onClick={() => { if (confirm("Ištrinti?")) remove.mutate(loc.id); }} style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#f87171", fontSize: 12, cursor: "pointer" }}>Ištrinti</button>
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
