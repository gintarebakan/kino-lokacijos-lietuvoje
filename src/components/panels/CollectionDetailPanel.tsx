import { useEffect, useState } from "react";
import { useMapStore } from "../../stores/mapStore";
import { useSavedStore } from "../../stores/savedStore";
import { useCollectionDetail } from "../../hooks/useCollectionDetail";

//----- Kompon entai

/**
 * mygtukas su hover efektu, naudojamas skydelio apačioje.
 */
function ActionIconButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 44,
        height: 44,
        background: "#1a1a1a",
        border: `1px solid ${hovered ? "#c9a84c" : "#222222"}`,
        borderRadius: 8,
        color: hovered ? "#c9a84c" : "#f5f5f5",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "border-color 160ms ease, color 160ms ease",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Google Maps nuorodos mygtukas atidaro maršrutą išorėje
 * Hover efektas, auksinė spalva.
 */
function MapsButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexGrow: 1,
        padding: "10px",
        background: "#1a1a1a",
        border: `1px solid ${hovered ? "#c9a84c" : "#222222"}`,
        borderRadius: 8,
        color: hovered ? "#c9a84c" : "#f5f5f5",
        textAlign: "center",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        display: "block",
        transition: "border-color 160ms ease, color 160ms ease",
      }}
    >
      {children}
    </a>
  );
}

//----- Pagrindinis komponentas

/**
 * Kuruoto maršruto (kolekcijos) detalių skydelis.
 * Rodomas paspaudus ant kolekcijos žemėlapyje arba DiscoverPage.
 *
 * Funkcijos:
 Rodo kolekcijos paveikslą, pavadinimą ir aprašymą
Sąrašas lokacijų su išsaugojimo galimybe
 Kviečia OpenRouteService API maršruto informacijai gauti
 Braižo maršruto liniją žemėlapyje
 Google Maps navigacijos nuoroda
Maršruto URL dalintis funkcija
 */
export default function CollectionDetailPanel() {
  const selectedCollectionId = useMapStore((s) => s.selectedCollectionId);
  const setSelectedCollection = useMapStore((s) => s.setSelectedCollection);
  const setRouteGeoJSON = useMapStore((s) => s.setRouteGeoJSON);
  const { addBookmark, isBookmarked, removeBookmark } = useSavedStore();
  const { data, isLoading, error } = useCollectionDetail(selectedCollectionId);

  // Maršruto informacija iš OpenRouteService (atstumas + trukmė)
  const [routeInfo, setRouteInfo] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  // Nukopijuota!
  const [copied, setCopied] = useState(false);

  //mobiliuose prietaisuose skydelis rodomas iš apačios
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
    function handler(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
  }, []);

  /**
 Nukopijuoja kolekcijos URL ir rodo patvirtinimo pranešimą 2 sekundes
   */
  const handleShare = async () => {
    const url = `${window.location.origin}/map?collection=${data?.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      //
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  // Rūšiuojame lokacijas pagal order_index ir filtruojame null reikšmes
  const sortedLocs = (data?.collection_locations ?? [])
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((cl) => cl.locations_lt)
    .filter(Boolean);

  /**
Kai kolekcijos duomenys įkeliami:
 nuo 2 ir daugiau lokacijų - kviečiamas OpenRouteService maršrutui
   Žemėlapis pritaikomas (fitBounds) kad matytų visas kolekcijos lokacijas
maršrutas valomas, jei lokacijų per mažai
   */
  useEffect(() => {
    if (!data) return;

    if (sortedLocs.length >= 2) {
      const coords = sortedLocs.map((l) => [l!.lng ?? 0, l!.lat ?? 0]);
      fetchRouteInfo(coords);

      // žemėlapio vaizdas pritaikomas, kad matytųsi visos lokacijos
      const map = useMapStore.getState().mapInstance;
      if (map) {
        const lngs = sortedLocs.map((l) => l!.lng ?? 0);
        const lats = sortedLocs.map((l) => l!.lat ?? 0);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ];
        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 400, right: 80 },
          maxZoom: 13,
          duration: 800,
        });
      }
    } else {
      // Per mažai lokacijų maršrutui, jį išvalome
      setRouteGeoJSON(null);
      setRouteInfo(null);
    }
  }, [data]);

  /**
Kviečiam OpenRouteService Directions API vairavimo maršrutui gauti.

Apskaičiuoja ir formatuoja atstumą (km) ir trukmę (val/min)
Išsaugo GeoJSON koordinates žemėlapio linijos braižymui
   *
   * @param coords - Lokacijų koordinatės [[lng, lat], ...]
   */
  const fetchRouteInfo = async (coords: number[][]) => {
    try {
      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_ORS_KEY}`,
          },
          body: JSON.stringify({ coordinates: coords }),
        },
      );
      const json = await res.json();

      // Formatuojame atstumą metrais -> kilometrais
      const distanceKm = (json.features[0].properties.summary.distance / 1000).toFixed(1);

      // Formatuojame trukmę sekundėmis -> val/min
      const durationMin = Math.round(json.features[0].properties.summary.duration / 60);
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      const durationStr = hours > 0 ? hours + "h " + mins + "min" : mins + "min";

      setRouteInfo(distanceKm + " km · " + durationStr);

      // Išsaugome GeoJSON koordinates žemėlapio maršruto linijos braižymui
      setRouteGeoJSON(json.features[0].geometry.coordinates);
    } catch {
      // API klaida - valome maršruto informaciją
      setRouteInfo(null);
      setRouteGeoJSON(null);
    }
  };

  // Uždaro skydelį ir valo maršruto duomenis
  const handleClose = () => {
    setSelectedCollection(null);
    setRouteGeoJSON(null);
    setRouteInfo(null);
  };

  // Tikrina ar visos kolekcijos lokacijos yra išsaugotos
  const allSaved =
    sortedLocs.length > 0 && sortedLocs.every((loc) => loc && isBookmarked(loc.slug));

  /**
 Išsaugo arba pašalina visas kolekcijos lokacijas iš vartotojo išsaugotų.
jei visos jau išsaugotos, pašalina visas. Kitaip išsaugo trūkstamas.
   */
  const handleSaveAll = () => {
    if (!data) return;
    if (allSaved) {
      sortedLocs.forEach((loc) => {
        if (loc) removeBookmark(loc.slug);
      });
    } else {
      sortedLocs.forEach((loc) => {
        if (loc && !isBookmarked(loc.slug)) {
          addBookmark({
            id: loc.slug,
            name: loc.name,
            image_url: loc.image_url ?? "",
            county: loc.county ?? "",
            lng: loc.lng ?? 0,
            lat: loc.lat ?? 0,
          });
        }
      });
    }
  };

  // Jei kolekcija nepasirinkta, skydelis nėrqa rodomas
  if (!selectedCollectionId) return null;

  // Google Maps maršruto URL su visomis lokacijomis kaip tarpiniais taškais
  const mapsUrl =
    "https://www.google.com/maps/dir/" +
    sortedLocs.map((l) => (l!.lat ?? 0) + "," + (l!.lng ?? 0)).join("/");

  //----- Stiliai

  const desktopStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 360,
    height: "100%",
    background: "#111111",
    borderRight: "1px solid #222222",
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  };

  const mobileStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 64,
    left: 0,
    right: 0,
    height: "80vh",
    background: "#111111",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 40,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  };

  //----- Render

  return (
    <aside style={isMobile ? mobileStyle : desktopStyle}>
      {/* Uždarymo mygtukas */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Uzdaryti"
        style={{
          position: "absolute",
          top: 12,
          right: 20,
          zIndex: 50,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid #222",
          color: "#f5f5f5",
          width: 32,
          height: 32,
          borderRadius: 999,
          fontSize: 18,
          cursor: "pointer",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✕
      </button>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && (
          <div style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>Kraunama...</div>
        )}
        {error && <div style={{ padding: 24, color: "#f87171", fontSize: 14 }}>Klaida.</div>}

        {data && (
          <>
            {/* Viršelio nuotrauka su gradientu */}
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                background: "#1a1a1a",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {data.cover_url && (
                <img
                  src={data.cover_url}
                  alt={data.title}
                  width={360}
                  height={202}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, transparent 50%, rgba(17,17,17,0.95) 100%)",
                }}
              />
            </div>

            <div style={{ padding: "16px 20px 24px" }}>
              {/* Kolekcijos tipo žyma */}
              <div
                style={{
                  fontSize: 10,
                  color: "#c9a84c",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                Kuruotas maršrutas
              </div>

              {/* Pavadinimas */}
              <h2
                style={{
                  margin: 0,
                  color: "#f5f5f5",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 22,
                  lineHeight: 1.25,
                }}
              >
                {data.title}
              </h2>

              {/* Aprašymas */}
              {data.description && (
                <p style={{ marginTop: 12, color: "#d1d5db", fontSize: 14, lineHeight: 1.55 }}>
                  {data.description}
                </p>
              )}

              {/* Išsaugoti visas lokacijas mygtukas */}
              <button
                type="button"
                onClick={handleSaveAll}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "10px",
                  background: allSaved ? "#c9a84c" : "transparent",
                  border: allSaved ? "none" : "1px solid #c9a84c",
                  borderRadius: 8,
                  color: allSaved ? "#0a0a0a" : "#c9a84c",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  transition: "all 0.2s ease",
                }}
              >
                {allSaved ? "Išsaugotos visos lokacijos" : "Išsaugoti visas lokacijas"}
              </button>

              {/* Lokacijų sąrašas */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 10,
                  }}
                >
                  Lokacijos ({sortedLocs.length})
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sortedLocs.map((loc, idx) => (
                    <div
                      key={loc!.slug}
                      className="cinemap-film-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#141414",
                        border: "1px solid #1f1f1f",
                        borderRadius: 10,
                        padding: 10,
                        cursor: "pointer",
                        transition: "background 0.15s ease, border-color 0.15s ease",
                      }}
                      onClick={() => {
                        // Paspaudus lokacijos eilutę pereinama prie jos žemėlapyje
                        // išsaugant aktyvią kolekciją kontekstui
                        useMapStore
                          .getState()
                          .openLocationFromCollection(loc!.slug, selectedCollectionId!);
                      }}
                    >
                      {/* Eilės numeris */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#c9a84c",
                          color: "#0a0a0a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Lokacijos miniatiūra */}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "#1a1a1a",
                        }}
                      >
                        {loc!.image_url && (
                          <img
                            src={loc!.image_url}
                            alt={loc!.name}
                            width={48}
                            height={48}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        )}
                      </div>

                      {/* Pavadinimas ir apskritis */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: "#f5f5f5",
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {loc!.name}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>
                          {loc!.county}
                        </div>
                      </div>

                      {/* Išsaugojimo žvaigždutė */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Neleidžiame paspaudimui plisti į lokacijos eilutę
                          if (isBookmarked(loc!.slug)) {
                            removeBookmark(loc!.slug);
                          } else {
                            addBookmark({
                              id: loc!.slug,
                              name: loc!.name,
                              image_url: loc!.image_url ?? "",
                              county: loc!.county ?? "",
                              lng: loc!.lng ?? 0,
                              lat: loc!.lat ?? 0,
                            });
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid " + (isBookmarked(loc!.slug) ? "#c9a84c" : "#374151"),
                          color: isBookmarked(loc!.slug) ? "#c9a84c" : "#6b7280",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 18,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {isBookmarked(loc!.slug) ? "★" : "☆"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maršruto informacija rodoma tik kai ORS API grąžina duomenis */}
              {routeInfo && (
                <div
                  style={{
                    marginTop: 20,
                    borderTop: "1px solid #222222",
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {/* Atstumas ir trukmė */}
                  <div style={{ color: "#c9a84c", fontSize: 14, fontWeight: 700 }}>{routeInfo}</div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Google Maps nuoroda su visomis stotelėmis */}
                    <MapsButton href={mapsUrl}>Nukreipti į Google Maps</MapsButton>

                    {/* Maršruto URL dalintis mygtukas */}
                    <div style={{ position: "relative" }}>
                      <ActionIconButton onClick={handleShare} ariaLabel="Dalintis">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="13" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="3" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                          <line
                            x1="4.5"
                            y1="7"
                            x2="11.5"
                            y2="4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="4.5"
                            y1="9"
                            x2="11.5"
                            y2="12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </ActionIconButton>

                      {/* nukopijuota! patvirtinimas */}
                      {copied && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 6px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#1a1a1a",
                            border: "1px solid #c9a84c",
                            color: "#c9a84c",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                          }}
                        >
                          Nukopijuota!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
