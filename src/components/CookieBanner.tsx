if (consent !== "accepted" && consent !== null) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0a0a0a",
      zIndex: 9999, display: "flex", alignItems: "center",
      justifyContent: "center", textAlign: "center", padding: 24,
    }}>
      <div>
        <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 16 }}>
          Norint naudotis svetaine, būtina sutikti su slapukų naudojimu.
        </p>
        <button
          type="button"
          onClick={() => setConsent("accepted")}
          style={{
            background: "#c9a84c", border: "none", borderRadius: 8,
            padding: "10px 24px", color: "#0a0a0a", fontWeight: 700,
            fontSize: 13, cursor: "pointer",
          }}
        >
          Sutinku
        </button>
      </div>
    </div>
  );
}