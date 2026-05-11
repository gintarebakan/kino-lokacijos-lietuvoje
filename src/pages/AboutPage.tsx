import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export default function AboutPage() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["about-stats"],
    queryFn: async () => {
      const [loc, films, routes] = await Promise.all([
        supabase.from("locations_lt").select("id", { count: "exact", head: true }),
        supabase.from("films_tmdb").select("id", { count: "exact", head: true }),
        supabase.from("collections_curated").select("id", { count: "exact", head: true }),
      ]);
      return {
        locations: loc.count ?? 0,
        films: films.count ?? 0,
        routes: routes.count ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

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
      {/* ── Hero ── */}
      <section
        style={{
          width: "100%",
          padding: "64px 24px 48px",
          textAlign: "center",
          background: "linear-gradient(180deg, #111111 0%, #0a0a0a 100%)",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            color: "#f5f5f5",
            fontSize: 30,
            fontWeight: 700,
            margin: "0 0 16px",
            letterSpacing: "0.02em",
          }}
        >
          Apie{" "}
          <span style={{ color: "#c9a84c" }}>KinoLokacijosLietuvoje</span>
        </h1>
        <p
          style={{
            color: "#9ca3af",
            fontSize: 14,
            maxWidth: 900,
            lineHeight: 1.8,
            margin: "0 auto",
          }}
        >
          Interaktyvi internetinė informacinė sistema Lietuvoje filmuotų
          kino projektų lokacijų vizualizavimui ir paieškai.
        </p>
      </section>

      {/* ── Stats ── */}
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
          { value: stats?.locations, label: "Filmavimo lokacijų" },
          { value: stats?.films,     label: "Filmų ir serialų" },
          { value: stats?.routes,    label: "Kino maršrutai" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{ background: "#0a0a0a", padding: "28px 16px", textAlign: "center" }}
          >
            <div
              style={{
                fontFamily: "Georgia, serif",
                color: "#c9a84c",
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              {stat.value != null ? (
                <>
                  {stat.value}
                  <span style={{ fontSize: 20, opacity: 0.7 }}>+</span>
                </>
              ) : (
                <span style={{ fontSize: 20, opacity: 0.4 }}>…</span>
              )}
            </div>
            <div style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* ── Kontekstas ── */}
      <section style={{ padding: "48px 48px", maxWidth: 900, margin: "0 auto" }}>
        <p style={labelStyle}>Kontekstas</p>
        <p style={{ ...bodyText, textAlign: "center" }}>
          Kino industrija ir audiovizualinių projektų gamyba yra neatsiejama šiuolaikinės
          kultūros dalis, turinti tiesioginę įtaką regionų ekonominiam aktyvumui bei turizmo
          plėtrai. Šis reiškinys —{" "}
          <span style={{ color: "#c9a84c" }}>kino turizmas</span> — transformuoja filmavimo
          lokacijas į savarankiškus traukos objektus. Lietuvos kontekste informacija apie
          šalyje filmuotus projektus yra išskaidyta skirtinguose registruose ir šaltiniuose —
          šie nėra orientuoti į tikslią geografinę lokacijų analizę.
        </p>
      </section>

      <div style={fullDivider} />

      {/* ── Tikslas ── */}
      <section style={{ padding: "48px 48px", maxWidth: 900, margin: "0 auto" }}>
        <p style={labelStyle}>Tikslas</p>
        <p style={{ ...bodyText, textAlign: "center" }}>
          Realizuoti interaktyvią internetinę informacinę sistemą Lietuvoje filmuotų kino
          projektų lokacijų vizualizavimui ir paieškai, skirtą susieti kino gerbėjus su
          realaus pasaulio vietomis, kuriose buvo filmuojami jų mėgstami kūriniai. Padėti
          žmonėms atrasti Lietuvos kino paveldą, planuoti keliones į filmavimo vietas ir
          geriau pažinti šalies kultūrinę geografiją per kino prizmę.
        </p>
      </section>

      <div style={fullDivider} />

      {/* ── Funkcijos ── */}
      <section style={{ padding: "48px 24px" }}>
        <p style={labelStyle}>Funkcijos</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              ),
              title: "Interaktyvus žemėlapis",
              desc: "Klasterizuotos lokacijos su filtravimo galimybėmis.",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              ),
              title: "Hibridinė paieška",
              desc: "Fuzzy paieška pagal filmą, lokaciją ar žanrą.",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3" />
                </svg>
              ),
              title: "Kino maršrutai",
              desc: "Sisteminiai kino maršrutai su navigacijos palaikymu.",
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "Išsaugoti mėgstamiausius",
              desc: "Greita prieiga prie išsaugotų lokacijų ir maršrutų.",
            },
          ].map((feat) => (
            <div
              key={feat.title}
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                borderRadius: 14,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(201,168,76,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                {feat.icon}
              </div>
              <div style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {feat.title}
              </div>
              <div style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.6 }}>
                {feat.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={fullDivider} />

      {/* ── Kaip naudotis ── */}
      <section style={{ padding: "48px 24px" }}>
        <p style={labelStyle}>Kaip naudotis</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            maxWidth: 680,
            margin: "0 auto",
          }}
        >
          {[
            {
              n: "1",
              title: "Ieškokite ir naršykite",
              desc: "Naudokite paiešką arba naršykite žemėlapį, kad rastumėte jus dominančius filmus ar lokacijas.",
            },
            {
              n: "2",
              title: "Atraskite lokacijas",
              desc: "Spustelėkite ant žymeklių, kad sužinotumėte apie filmavimo vietas ir jose filmuotus kūrinius.",
            },
            {
              n: "3",
              title: "Planuokite kelionę",
              desc: "Naudokite kino maršrutus ir navigacijos funkcijas, kad aplankytumėte vietas asmeniškai.",
            },
          ].map((step) => (
            <div key={step.n} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#c9a84c",
                  fontFamily: "Georgia, serif",
                  fontSize: 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                {step.n}
              </div>
              <div style={{ color: "#f5f5f5", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {step.title}
              </div>
              <div style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.6 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={fullDivider} />

      {/* ── Naujumas ── */}
      <section style={{ padding: "48px 48px", maxWidth: 900, margin: "0 auto" }}>
        <p style={labelStyle}>Naujumas ir vertė</p>
        <p style={{ ...bodyText, textAlign: "center" }}>
          Sistema grindžiama fragmentuotų Lietuvos kino lokacijų duomenų apjungimu ir šių
          lokacijų intelektualiu kuravimų. Pirmą kartą nacionaliniu lygmeniu susisteminama
          Lietuvos kino paveldo geografinė informacija, dinamiškai siejant lokalius istorinius
          duomenis su globalia kino metaduomenų baze{" "}
          <span style={{ color: "#c9a84c" }}>TMDB API</span>.
        </p>
        <p style={{ ...bodyText, textAlign: "center", marginTop: 16 }}>
          Sukurta sistema leidžia vizualizuoti sudėtingus ryšius tarp kino lokacijų, filmų ir
          jų istorinio konteksto. Suprojektuota architektūra yra universali — jos principai
          gali būti pritaikomi kuriant kultūros paveldo sklaidos sprendimus kituose regionuose.
        </p>
      </section>

      <div style={fullDivider} />

      {/* ── CTA ── */}
      <section
        style={{
          margin: "0 16px",
          borderRadius: 16,
          background: "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)",
          border: "1px solid rgba(201,168,76,0.2)",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "Georgia, serif",
            color: "#f5f5f5",
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 12px",
          }}
        >
          Pradėkite tyrinėti
        </h2>
        <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          Atraskite Lietuvos kino paveldą — realias vietas, kuriose gimė jūsų mėgstami filmai.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/map" })}
            style={{
              background: "#c9a84c",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            Atidaryti žemėlapį
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            style={{
              background: "transparent",
              border: "1px solid #333",
              borderRadius: 10,
              padding: "12px 24px",
              color: "#9ca3af",
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            Naršyti turinį
          </button>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section style={{ padding: "48px 48px 0", textAlign: "center" }}>
        <p style={labelStyle}>Techninė informacija</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 900, margin: "0 auto" }}>
          {[
            "React", "TypeScript", "Vite", "MapLibre GL JS", "Supercluster",
            "MapTiler", "Zustand", "TanStack Query", "TanStack Router",
            "Supabase", "PostGIS", "pg_trgm", "TMDB API", "OpenRouteService", "Vercel",
          ].map((tech) => (
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

// ── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#c9a84c",
  fontSize: 11,
  fontWeight: 600,
  textAlign: "center",
  marginBottom: 24,
};

const bodyText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 14,
  lineHeight: 1.9,
  margin: 0,
};

const fullDivider: React.CSSProperties = {
  height: 1,
  background: "#1a1a1a",
};