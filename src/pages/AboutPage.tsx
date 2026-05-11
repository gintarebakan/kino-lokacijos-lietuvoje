export default function AboutPage() {
  return (
    <main
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        background: "#0a0a0a",
        paddingBottom: 80,
      }}
    >
      {/* Hero */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: 260,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px 40px",
          textAlign: "center",
          background: "linear-gradient(180deg, #111111 0%, #0a0a0a 100%)",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, serif",
            color: "#c9a84c",
            fontSize: 42,
            letterSpacing: "0.15em",
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          CM
        </div>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            color: "#f5f5f5",
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 12px",
            letterSpacing: "0.02em",
          }}
        >
          Apie <span style={{ color: "#c9a84c" }}>CineMap</span>
        </h1>
        <p
          style={{
            color: "#9ca3af",
            fontSize: 14,
            maxWidth: 480,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Interaktyvi Lietuvos kino lokacijų informacinė sistema — atraskite
          vietas, kuriose buvo kuriami jūsų mėgstami filmai ir serialai.
        </p>
      </section>

      {/* Stats */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          background: "#1a1a1a",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        {[
          { value: "200+", label: "Filmavimo lokacijų" },
          { value: "50+", label: "Filmų ir serialų" },
          { value: "5+", label: "Kurtuoti maršrutai" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#0a0a0a",
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "Georgia, serif",
                color: "#c9a84c",
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {stat.value}
            </div>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section style={{ padding: "32px 24px 24px" }}>
        <h2
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#f5f5f5",
            fontSize: 13,
            fontWeight: 600,
            margin: "0 0 16px",
          }}
        >
          Misija
        </h2>
        <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
          CineMap — tai informacinė sistema, skirta susieti kino gerbėjus su
          realaus pasaulio vietomis, kuriose buvo filmuojami jų mėgstami kūriniai.
          Mūsų tikslas — padėti žmonėms atrasti Lietuvos kino paveldą,
          planuoti keliones į filmavimo vietas ir geriau pažinti šalies
          kultūrinę geografiją per kino prizmę.
        </p>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "#1a1a1a", margin: "0 24px" }} />

      {/* Features */}
      <section style={{ padding: "32px 24px 24px" }}>
        <h2
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#f5f5f5",
            fontSize: 13,
            fontWeight: 600,
            margin: "0 0 20px",
          }}
        >
          Funkcijos
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              ),
              title: "Interaktyvus žemėlapis",
              desc: "Naršykite filmavimo lokacijas interaktyviame žemėlapyje su klasterizavimu ir filtravimo galimybėmis.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              ),
              title: "Išmani paieška",
              desc: "Ieškokite pagal filmo pavadinimą, lokacijos pavadinimą ar žanrą su fuzzy paieškos palaikymu.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
                </svg>
              ),
              title: "Kuruoti maršrutai",
              desc: "Sekite ekspertų sudarytus maršrutus po svarbiausias filmavimo vietas su navigacijos palaikymu.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "Išsaugoti mėgstamiausius",
              desc: "Išsaugokite įdomias lokacijas ir maršrutus, kad galėtumėte greitai juos rasti vėliau.",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                background: "#111111",
                border: "1px solid #1a1a1a",
                borderRadius: 12,
                padding: "16px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(201,168,76,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {feat.icon}
              </div>
              <div>
                <div style={{ color: "#f5f5f5", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {feat.title}
                </div>
                <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
                  {feat.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "#1a1a1a", margin: "0 24px" }} />

      {/* How it works */}
      <section style={{ padding: "32px 24px 24px" }}>
        <h2
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#f5f5f5",
            fontSize: 13,
            fontWeight: 600,
            margin: "0 0 20px",
          }}
        >
          Kaip naudotis
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { n: "1", title: "Ieškokite ir naršykite", desc: "Naudokite paiešką arba naršykite žemėlapį, kad rastumėte jus dominančius filmus ar lokacijas." },
            { n: "2", title: "Atraskite lokacijas", desc: "Spustelėkite ant žymeklių, kad sužinotumėte apie konkrečias filmavimo vietas ir jose filmuotus kūrinius." },
            { n: "3", title: "Planuokite kelionę", desc: "Naudokite kuruotus maršrutus ir navigacijos funkcijas, kad aplankytumėte vietas asmeniškai." },
          ].map((step) => (
            <div key={step.n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#c9a84c",
                  fontFamily: "Georgia, serif",
                  fontSize: 15,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {step.n}
              </div>
              <div>
                <div style={{ color: "#f5f5f5", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {step.title}
                </div>
                <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "#1a1a1a", margin: "0 24px" }} />

      {/* Tech stack */}
      <section style={{ padding: "32px 24px 0" }}>
        <h2
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#f5f5f5",
            fontSize: 13,
            fontWeight: 600,
            margin: "0 0 16px",
          }}
        >
          Techninė informacija
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["React", "TypeScript", "MapLibre GL JS", "Supabase", "PostGIS", "TanStack Query", "Vercel"].map((tech) => (
            <span
              key={tech}
              style={{
                background: "#111111",
                border: "1px solid #222",
                borderRadius: 6,
                padding: "4px 10px",
                color: "#9ca3af",
                fontSize: 12,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
