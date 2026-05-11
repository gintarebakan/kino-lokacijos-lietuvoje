import { useCookieStore } from "../stores/cookieStore";

export function CookieBanner() {
  const { consent, setConsent } = useCookieStore();
  if (consent !== null) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 9999, background: "#111111",
      borderTop: "1px solid #222", padding: "16px 24px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <p style={{ color: "#9ca3af", fontSize: 13, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
        Mūsų svetainė naudoja slapukus (cookies). Šie slapukai naudojami statistikos ir
        rinkodaros tikslais. Jei sutinkate su šiems tikslams naudojamais slapukais,
        spauskite „Sutinku" ir toliau naudokitės svetaine.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setConsent("accepted")}
          style={{
            background: "#c9a84c", border: "none", borderRadius: 8,
            padding: "8px 20px", color: "#0a0a0a", fontWeight: 700,
            fontSize: 13, cursor: "pointer",
          }}
        >
          Sutinku
        </button>
        <button
          type="button"
          onClick={() => setConsent("declined")}
          style={{
            background: "transparent", border: "1px solid #333",
            borderRadius: 8, padding: "8px 16px", color: "#6b7280",
            fontSize: 13, cursor: "pointer",
          }}
        >
          Atmesti
        </button>
      </div>
    </div>
  );
}