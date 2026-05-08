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
  curator_notes: string | null;
  accessibility: string | null;
}

interface LocationForm {
  name: string;
  slug: string;
  address: string;
  county: string;
  location_type: string;
  description: string;
  image_url: string;
  official_website_url: string;
  curator_notes: string;
  accessibility: string;
  lat: string;
  lng: string;
}

const EMPTY: LocationForm = {
  name: "", slug: "", address: "", county: "", location_type: "",
  description: "", image_url: "", official_website_url: "",
  curator_notes: "", accessibility: "", lat: "", lng: "",
};

const COUNTIES = [
  "vilniaus apskritis",
  "kauno apskritis",
  "klaipėdos apskritis",
  "šiaulių apskritis",
  "panevėžio apskritis",
  "alytaus apskritis",
  "marijampolės apskritis",
  "telšių apskritis",
  "utenos apskritis",
  "tauragės apskritis",
];

const LOCATION_TYPES = [
  "pilis",
  "bažnyčia",
  "dvaras",
  "rūmai",
  "aikštė",
  "gatvė",
  "parkas",
  "gamtos objektas",
  "interjeras",
  "fasadas",
  "kalejimas",
  "architektūra",
  "kita",
];

const ACCESSIBILITY_OPTIONS = [
  "vieša",
  "privati",
  "iš dalies vieša",
  "mokama",
  "uždara",
];

const inputStyle = {
  width: "100%", background: "#0a0a0a", border: "1px solid #222",
  borderRadius: 8, padding: "8px 12px", color: "#f5f5f5",
  fontSize: 13, outline: "none", boxSizing: "border-box" as const,
};

const labelStyle = {
  display: "block", color: "#9ca3af", fontSize: 11,
  marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.08em",
};

const required = <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>;

export default function AdminLocations() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Location | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<LocationForm>(EMPTY);
  const [search, setSearch] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: locations, isLoading } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations_lt")
        .select("id,name,slug,address,county,location_type,description,image_url,official_website_url,curator_notes,accessibility")
        .order("name");
      if (error) throw error;
      return data as Location[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { lat, lng, ...rest } = form;

      const payload: Record<string, string | null> = {
        name: rest.name || null,
        slug: rest.slug || null,
        address: rest.address || null,
        county: rest.county || null,
        location_type: rest.location_type || null,
        description: rest.description || null,
        image_url: rest.image_url || null,
        official_website_url: rest.official_website_url || null,
        curator_notes: rest.curator_notes || null,
        accessibility: rest.accessibility || null,
      };

      if (editing) {
        const { error } = await supabase
          .from("locations_lt")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;

        if (lat && lng) {
          const { error: coordErr } = await supabase.rpc("update_location_coordinates", {
            p_id: editing.id,
            p_lat: parseFloat(lat),
            p_lng: parseFloat(lng),
          });
          if (coordErr) throw coordErr;
        }
      } else {
        const { error: coordInsertErr } = await supabase.rpc("insert_location_with_coordinates", {
          p_name: payload.name,
          p_slug: payload.slug,
          p_address: payload.address,
          p_county: payload.county,
          p_location_type: payload.location_type,
          p_description: payload.description,
          p_image_url: payload.image_url,
          p_official_website_url: payload.official_website_url,
          p_curator_notes: payload.curator_notes,
          p_accessibility: payload.accessibility,
          p_lat: parseFloat(lat),
          p_lng: parseFloat(lng),
        });
        if (coordInsertErr) throw coordInsertErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-locations"] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
      setValidationError(null);
    },
  });

  const handleSave = () => {
    setValidationError(null);
    if (!form.name.trim()) { setValidationError("Pavadinimas privalomas."); return; }
    if (!form.slug.trim()) { setValidationError("Slug privalomas."); return; }
    if (creating && (!form.lat.trim() || !form.lng.trim())) {
      setValidationError("Koordinatės privalomos kuriant naują lokaciją.");
      return;
    }
    save.mutate();
  };

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
    setValidationError(null);
    setForm({
      name: loc.name ?? "",
      slug: loc.slug ?? "",
      address: loc.address ?? "",
      county: loc.county ?? "",
      location_type: loc.location_type ?? "",
      description: loc.description ?? "",
      image_url: loc.image_url ?? "",
      official_website_url: loc.official_website_url ?? "",
      curator_notes: loc.curator_notes ?? "",
      accessibility: loc.accessibility ?? "",
      lat: "",
      lng: "",
    });
  };

  const sel = (key: keyof LocationForm, label: string, options: string[]) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        style={inputStyle}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      >
        <option value="">— Pasirinkti —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const f = (key: keyof LocationForm, label: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontFamily: "Georgia, serif" }}>Lokacijos</h1>
        <button type="button" onClick={() => { setEditing(null); setCreating(true); setForm(EMPTY); setValidationError(null); }}
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
            {editing ? "Redaguoti lokaciją" : "Nauja lokacija"}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Name — required */}
            <div>
              <label style={labelStyle}>Pavadinimas {required}</label>
              <input style={inputStyle} value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            {/* Slug — required */}
            <div>
              <label style={labelStyle}>Slug {required}</label>
              <input style={inputStyle} value={form.slug}
                onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
            </div>

            {f("address", "Adresas")}
            {sel("county", "Apskritis", COUNTIES)}
            {sel("location_type", "Lokacijos tipas", LOCATION_TYPES)}
            {f("image_url", "Nuotraukos URL")}
            {f("official_website_url", "Oficialus tinklapis")}
            {sel("accessibility", "Pasiekiamumas", ACCESSIBILITY_OPTIONS)}
          </div>

          {/* Coordinates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ ...labelStyle, color: "#c9a84c" }}>
                Platuma / Latitude
                {creating && <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>}
                {editing && <span style={{ color: "#6b7280", fontWeight: 400, marginLeft: 6 }}>(palikti tuščią — nekeisti)</span>}
              </label>
              <input style={inputStyle} placeholder="pvz. 54.6872"
                value={form.lat} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "#c9a84c" }}>
                Ilguma / Longitude
                {creating && <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>}
                {editing && <span style={{ color: "#6b7280", fontWeight: 400, marginLeft: 6 }}>(palikti tuščią — nekeisti)</span>}
              </label>
              <input style={inputStyle} placeholder="pvz. 25.2797"
                value={form.lng} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={labelStyle}>Aprašymas</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={4} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>Kuratoriaus pastabos</label>
              <textarea value={form.curator_notes} onChange={e => setForm(p => ({ ...p, curator_notes: e.target.value }))}
                rows={4} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>

          {(validationError || save.isError) && (
            <div style={{ color: "#f87171", fontSize: 13, marginTop: 8 }}>
              {validationError ?? (save.error as Error)?.message ?? "Klaida išsaugant."}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" onClick={handleSave} disabled={save.isPending}
              style={{ background: "#c9a84c", border: "none", borderRadius: 8, padding: "10px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {save.isPending ? "Saugoma…" : "Išsaugoti"}
            </button>
            <button type="button" onClick={() => { setEditing(null); setCreating(false); setValidationError(null); }}
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
                    <button type="button" onClick={() => openEdit(loc)}
                      style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#c9a84c", fontSize: 12, cursor: "pointer" }}>Redaguoti</button>
                    <button type="button" onClick={() => { if (confirm("Ištrinti?")) remove.mutate(loc.id); }}
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
