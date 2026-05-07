import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/admin/collection-locations")({
  component: AdminCollectionLocations,
});

interface CollectionLocation {
  id: string;
  collection_id: string | null;
  location_id: string | null;
  order_index: number | null;
  collections_curated: { title: string } | { title: string }[] | null;
  locations_lt: { name: string } | { name: string }[] | null;
}

const EMPTY = {
  collection_id: "", location_id: "", order_index: "0",
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

export default function AdminCollectionLocations() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CollectionLocation | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [filterCollection, setFilterCollection] = useState("");

  const { data: collectionLocations, isLoading } = useQuery({
    queryKey: ["admin-collection-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_locations")
        .select("id,collection_id,location_id,order_index,collections_curated(title),locations_lt(name)")
        .order("collection_id")
        .order("order_index");
      if (error) throw error;
      return data as CollectionLocation[];
    },
  });

  const { data: collections } = useQuery({
    queryKey: ["admin-collections-select"],
    queryFn: async () => {
      const { data } = await supabase.from("collections_curated").select("id,title").order("title");
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
        collection_id: form.collection_id || null,
        location_id: form.location_id || null,
        order_index: form.order_index ? Number(form.order_index) : 0,
      };
      if (editing) {
        const { error } = await supabase.from("collection_locations").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collection_locations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collection-locations"] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collection_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-collection-locations"] }),
  });

  const openEdit = (cl: CollectionLocation) => {
    setEditing(cl);
    setCreating(false);
    setForm({
      collection_id: cl.collection_id ?? "",
      location_id: cl.location_id ?? "",
      order_index: cl.order_index?.toString() ?? "0",
    });
  };

  const filtered = (collectionLocations ?? []).filter(cl =>
    !filterCollection || cl.collection_id === filterCollection
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontFamily: "Georgia, serif" }}>Kolekcijų lokacijos</h1>
        <button type="button" onClick={() => { setEditing(null); setCreating(true); setForm(EMPTY); }} style={{ background: "#c9a84c", border: "none", borderRadius: 8, padding: "10px 20px", color: "#0a0a0a", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Pridėti
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Filtruoti pagal kolekciją</label>
        <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)} style={{ ...inputStyle, maxWidth: 320 }}>
          <option value="">— Visos kolekcijos —</option>
          {(collections ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {isLoading && <div style={{ color: "#9ca3af" }}>Kraunama…</div>}

      {(editing || creating) && (
        <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 20px", color: "#c9a84c", fontSize: 16 }}>
            {editing ? "Redaguoti" : "Nauja kolekcijos lokacija"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Kolekcija</label>
              <select value={form.collection_id} onChange={e => setForm(p => ({ ...p, collection_id: e.target.value }))} style={inputStyle}>
                <option value="">— Pasirinkti —</option>
                {(collections ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lokacija</label>
              <select value={form.location_id} onChange={e => setForm(p => ({ ...p, location_id: e.target.value }))} style={inputStyle}>
                <option value="">— Pasirinkti —</option>
                {(locations ?? []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Eiliškumas</label>
              <input type="number" style={inputStyle} value={form.order_index} onChange={e => setForm(p => ({ ...p, order_index: e.target.value }))} />
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

      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              {["Kolekcija", "Lokacija", "Eiliškumas", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((cl) => (
              <tr key={cl.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "12px 16px", color: "#f5f5f5", fontSize: 13 }}>{(Array.isArray(cl.locations_lt) ? cl.locations_lt[0]?.name : cl.locations_lt?.name) ?? "—"}
</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{cl.locations_lt?.name ?? "—"}</td>
                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>{cl.order_index ?? 0}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => openEdit(cl)} style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#c9a84c", fontSize: 12, cursor: "pointer" }}>Redaguoti</button>
                    <button type="button" onClick={() => { if (confirm("Ištrinti?")) remove.mutate(cl.id); }} style={{ background: "transparent", border: "1px solid #333", borderRadius: 6, padding: "4px 10px", color: "#f87171", fontSize: 12, cursor: "pointer" }}>Ištrinti</button>
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
