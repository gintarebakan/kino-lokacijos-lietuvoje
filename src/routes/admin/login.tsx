import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Neteisingas el. paštas arba slaptažodis.");
      setLoading(false);
      return;
    }

navigate({ to: "/admin/locations" });
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#111111",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#111111",
        border: "1px solid #222222",
        borderRadius: 16,
        padding: 32,
      }}>
        <h1 style={{
          margin: "0 0 8px",
          color: "#c9a84c",
          fontFamily: "Georgia, serif",
          fontSize: 24,
        }}>
          CineMap TVS
        </h1>
        <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 14 }}>
          Turinio valdymo sistema
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              El. paštas
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#0a0a0a",
                border: "1px solid #222222",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#f5f5f5",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#c9a84c"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#222222"}
            />
          </div>

          <div>
            <label style={{ display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Slaptažodis
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#0a0a0a",
                border: "1px solid #222222",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#f5f5f5",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#c9a84c"}
              onBlur={(e) => e.currentTarget.style.borderColor = "#222222"}
            />
          </div>

          {error && (
            <div style={{ color: "#f87171", fontSize: 13, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8, padding: "10px 12px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "12px",
              background: loading ? "#6b7280" : "#c9a84c",
              border: "none",
              borderRadius: 8,
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.05em",
            }}
          >
            {loading ? "Jungiamasi..." : "Prisijungti"}
          </button>
        </form>
      </div>
    </div>
  );
}
