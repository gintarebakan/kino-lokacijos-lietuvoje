import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/admin/collection-locations")({
  component: AdminCollectionLocations,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface CollectionLocation {
  id: string;
  collection_id: string | null;
  location_id: string | null;
  order_index: number | null;
  collections_curated: { title: string } | null;
  locations_lt: { name: string } | null;
}

interface Collection {
  id: string;
  title: string;
}

interface Location {
  id: string;
  name: string;
}

interface AddRow {
  location_id: string;
  order_index: string;
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid #222",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#f5f5f5",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#9ca3af",
  fontSize: 11,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminCollectionLocations() {
  const qc = useQueryClient();
  const [filterCollection, setFilterCollection] = useState("");
  const [addingToCollection, setAddingToCollection] = useState("");
  const [addRows, setAddRows] = useState<AddRow[]>([{ location_id: "", order_index: "0" }]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderValue, setEditingOrderValue] = useState("");

  // ── Queries ──────────────────────────────────────────────────────────────────

  const { data: collectionLocations = [], isLoading } = useQuery({
    queryKey: ["admin-collection-locations"],
    queryFn: async (): Promise<CollectionLocation[]> => {
      const { data, error } = await supabase
        .from("collection_locations")
        .select(`
          id,
          collection_id,
          location_id,
          order_index,
          collections_curated!fk_collection ( title ),
          locations_lt!fk_location ( name )
        `)
        .order("collection_id", { ascending: true })
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Normalise: PostgREST may return array OR object depending on version
      return (data ?? []).map((row: any) => ({
        ...row,
        collections_curated: Array.isArray(row.collections_curated)
          ? (row.collections_curated[0] ?? null)
          : row.collections_curated,
        locations_lt: Array.isArray(row.locations_lt)
          ? (row.locations_lt[0] ?? null)
          : row.locations_lt,
      }));
    },
  });

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["admin-collections-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections_curated")
        .select("id,title")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["admin-locations-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations_lt")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const bulkAdd = useMutation({
    mutationFn: async () => {
      const validRows = addRows.filter((r) => r.location_id);
      if (!addingToCollection || validRows.length === 0)
        throw new Error("Pasirinkite kolekciją ir bent vieną lokaciją.");

      const payload = validRows.map((r) => ({
        collection_id: addingToCollection,
        location_id: r.location_id,
        order_index: Number(r.order_index) || 0,
      }));

      // upsert — tyliai praleidžia jau egzistuojančias (collection_id, location_id) poras
      const { error } = await supabase
        .from("collection_locations")
        .upsert(payload, {
          onConflict: "collection_id,location_id",
          ignoreDuplicates: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collection-locations"] });
      setAddRows([{ location_id: "", order_index: "0" }]);
      setAddingToCollection("");
    },
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, order_index }: { id: string; order_index: number }) => {
      const { error } = await supabase
        .from("collection_locations")
        .update({ order_index })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collection-locations"] });
      setEditingOrderId(null);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collection_locations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-collection-locations"] }),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const filtered = collectionLocations
    .filter((cl) => !filterCollection || cl.collection_id === filterCollection)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const updateRow = (idx: number, field: keyof AddRow, value: string) =>
    setAddRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const addNewRow = () =>
    setAddRows((prev) => [...prev, { location_id: "", order_index: String(prev.length) }]);

  const removeRow = (idx: number) =>
    setAddRows((prev) => prev.filter((_, i) => i !== idx));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: "#f5f5f5", fontSize: 22, fontFamily: "Georgia, serif" }}>
          Kolekcijų lokacijos
        </h1>
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {collectionLocations.length} įrašų iš viso
        </span>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Filtruoti pagal kolekciją</label>
        <select
          value={filterCollection}
          onChange={(e) => setFilterCollection(e.target.value)}
          style={{ ...inputStyle, maxWidth: 320 }}
        >
          <option value="">— Visos kolekcijos —</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Add form */}
      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 16px", color: "#c9a84c", fontSize: 15 }}>
          Pridėti lokacijas į kolekciją
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Kolekcija <span style={{ color: "#f87171" }}>*</span>
          </label>
          <select
            value={addingToCollection}
            onChange={(e) => setAddingToCollection(e.target.value)}
            style={{ ...inputStyle, maxWidth: 400 }}
          >
            <option value="">— Pasirinkti —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 40px", gap: 8, marginBottom: 4 }}>
          <span style={labelStyle}>Lokacija</span>
          <span style={labelStyle}>Eiliškumas</span>
          <span />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {addRows.map((row, idx) => (
            <div
              key={idx}
              style={{ display: "grid", gridTemplateColumns: "1fr 120px 40px", gap: 8, alignItems: "center" }}
            >
              <select
                value={row.location_id}
                onChange={(e) => updateRow(idx, "location_id", e.target.value)}
                style={inputStyle}
              >
                <option value="">— Pasirinkti lokaciją —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                value={row.order_index}
                onChange={(e) => updateRow(idx, "order_index", e.target.value)}
                style={inputStyle}
              />

              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={addRows.length === 1}
                style={{
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: 6,
                  color: "#f87171",
                  fontSize: 16,
                  cursor: addRows.length === 1 ? "not-allowed" : "pointer",
                  height: 36,
                  width: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addNewRow}
          style={{
            background: "transparent",
            border: "1px dashed #444",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#9ca3af",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          + Pridėti dar vieną lokaciją
        </button>

        {bulkAdd.isError && (
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>
            {(bulkAdd.error as Error)?.message ?? "Klaida išsaugant."}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => bulkAdd.mutate()}
            disabled={bulkAdd.isPending}
            style={{
              background: "#c9a84c",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              opacity: bulkAdd.isPending ? 0.7 : 1,
            }}
          >
            {bulkAdd.isPending ? "Saugoma…" : "Išsaugoti"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAddRows([{ location_id: "", order_index: "0" }]);
              setAddingToCollection("");
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
            Išvalyti
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading && <div style={{ color: "#9ca3af", marginBottom: 16 }}>Kraunama…</div>}

      <div style={{ background: "#111111", border: "1px solid #222", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #222" }}>
              {["#", "Lokacija", "Kolekcija", "Eiliškumas", ""].map((h) => (
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
            {filtered.map((cl, idx) => (
              <tr key={cl.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12, width: 40 }}>
                  {idx + 1}
                </td>

                <td style={{ padding: "12px 16px", color: "#f5f5f5", fontSize: 13 }}>
                  {cl.locations_lt?.name ?? "—"}
                </td>

                <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 13 }}>
                  {cl.collections_curated?.title
                    ?? collections.find((c) => c.id === cl.collection_id)?.title
                    ?? "—"}
                </td>

                <td style={{ padding: "12px 16px", width: 140 }}>
                  {editingOrderId === cl.id ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        type="number"
                        min={0}
                        value={editingOrderValue}
                        onChange={(e) => setEditingOrderValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            updateOrder.mutate({ id: cl.id, order_index: Number(editingOrderValue) });
                          if (e.key === "Escape") setEditingOrderId(null);
                        }}
                        autoFocus
                        style={{ ...inputStyle, width: 60, padding: "4px 8px" }}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateOrder.mutate({ id: cl.id, order_index: Number(editingOrderValue) })
                        }
                        style={{
                          background: "#c9a84c",
                          border: "none",
                          borderRadius: 4,
                          padding: "4px 8px",
                          color: "#0a0a0a",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOrderId(null)}
                        style={{
                          background: "transparent",
                          border: "1px solid #333",
                          borderRadius: 4,
                          padding: "4px 8px",
                          color: "#9ca3af",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrderId(cl.id);
                        setEditingOrderValue(cl.order_index?.toString() ?? "0");
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #2a2a2a",
                        borderRadius: 6,
                        padding: "4px 10px",
                        color: "#c9a84c",
                        fontSize: 13,
                        cursor: "pointer",
                        minWidth: 40,
                      }}
                    >
                      {cl.order_index ?? 0}
                    </button>
                  )}
                </td>

                <td style={{ padding: "12px 16px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Ištrinti šį įrašą?")) remove.mutate(cl.id);
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 24, color: "#6b7280", fontSize: 13, textAlign: "center" }}>
            {filterCollection
              ? "Pasirinktoje kolekcijoje įrašų nerasta."
              : "Įrašų nerasta."}
          </div>
        )}
      </div>
    </div>
  );
}
