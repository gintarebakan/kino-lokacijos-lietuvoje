import { createFileRoute, useNavigate, Outlet, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";



const NAV_ITEMS = [
  { to: "/admin/locations", label: "Lokacijos" },
  { to: "/admin/films", label: "Filmai" },
  { to: "/admin/film-locations", label: "Filmo lokacijos" },
  { to: "/admin/collections", label: "Kolekcijos" },
  { to: "/admin/collection-locations", label: "Kolekciju lokacijos" },
];

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate({ to: "/admin/login" });
      } else {
        setAuthed(true);
      }
      setChecking(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  if (checking) return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#c9a84c", fontSize: 14 }}>Kraunama…</div>
    </div>
  );

  if (!authed) return null;

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0a", display: "flex" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: "#111111",
        borderRight: "1px solid #222222",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100dvh",
      }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ color: "#c9a84c", fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700 }}>CineMap</div>
          <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Administravimas</div>
        </div>
        <div style={{ width: "100%", height: 1, background: "#222222" }} />
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: "block",
                  padding: "10px 12px",
                  borderRadius: 8,
                  color: active ? "#c9a84c" : "#9ca3af",
                  background: active ? "rgba(201,168,76,0.1)" : "transparent",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  marginBottom: 2,
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px 8px 24px" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "transparent",
              border: "1px solid #222222",
              borderRadius: 8,
              color: "#6b7280",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Atsijungti
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 220, padding: 32, overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
