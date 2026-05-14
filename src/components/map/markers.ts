/**
MapLibre custom markers naudojimui.
Ikonos SVG formatu inline.
 */

export type MarkerTier = "gold" | "gray";

// Teardropo (selected žymekliui) formos SVG
const TEARDROP_PATH =
  "M16 0C7.163 0 0 7.163 0 16c0 9.5 13 22.5 15.2 24.4a1.2 1.2 0 0 0 1.6 0C19 38.5 32 25.5 32 16 32 7.163 24.837 0 16 0z";

/**
 * vizualinis akcentas selected žymeklio viduje.
 *
 * @param size  - Ikono dydis pikseliais
 * @param color - Ikono spalva
 */
function makeFilmReel(size: number, color: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");

  // Išorinis žiedas
  const outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  outer.setAttribute("cx", "12");
  outer.setAttribute("cy", "12");
  outer.setAttribute("r", "10");
  outer.setAttribute("stroke", color);
  outer.setAttribute("stroke-width", "1.5");
  svg.appendChild(outer);

  // Vidinis žiedas
  const inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  inner.setAttribute("cx", "12");
  inner.setAttribute("cy", "12");
  inner.setAttribute("r", "3");
  inner.setAttribute("fill", color);
  svg.appendChild(inner);

  // 6 angos viduje tolygiai išdėstytos 60° intervalais aplink centrą
  const slotPositions = [0, 60, 120, 180, 240, 300];
  for (const angle of slotPositions) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "11");
    rect.setAttribute("y", "5");
    rect.setAttribute("width", "2");
    rect.setAttribute("height", "3");
    rect.setAttribute("rx", "0.5");
    rect.setAttribute("fill", color);
    rect.setAttribute("transform", `rotate(${angle} 12 12)`);
    svg.appendChild(rect);
  }

  return svg;
}

/**
 * Apskrito žymeklio HTML elementas (24×24 px).
 * Naudojamas nepasirinktoms lokacijoms žemėlapyje.
 *
 * Spalvos:
 * Išsaugota lokacija -> raudona (#e53e3e)
 * Įprasta lokacija  -> auksinė (#c9a84c)
 *
 * @param isBookmarked - Ar lokacija yra vartotojo išsaugotų sąraše
 */
export function createCircleMarker(isBookmarked: boolean): HTMLElement {
  const el = document.createElement("div");
  const fill = isBookmarked ? "#e53e3e" : "#c9a84c";
  el.style.width = "24px";
  el.style.height = "24px";
  el.style.background = fill;
  el.style.border = "2px solid rgba(0,0,0,0.3)";
  el.style.borderRadius = "50%";
  el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
  el.style.cursor = "pointer";
  el.style.boxSizing = "border-box";
  return el;
}

/**
 * Pasirinktos lokacijos tapimas į teardropo formos žymeklį (32×40 px).
 * Visada auksinės spalvos nepriklausomai nuo išsaugojimo būsenos.
 *
 * MapViewer.tsx naudoja šio žymeklio plotį (32px) kaip identifikatorių nustatant ar žymeklis yra selected būsenoje
 */
export function createSelectedMarker(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cursor = "pointer";
  wrapper.style.position = "relative";
  wrapper.style.display = "block";
  wrapper.style.lineHeight = "0";
  wrapper.style.width = "32px"; // <-------------------------------------------
  wrapper.style.height = "40px";

  // Teardropo SVG forma
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "32");
  svg.setAttribute("height", "40");
  svg.setAttribute("viewBox", "0 0 32 40");
  svg.style.filter = "drop-shadow(0 2px 6px rgba(0,0,0,0.5))";
  svg.style.display = "block";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", TEARDROP_PATH);
  path.setAttribute("fill", "#c9a84c");
  svg.appendChild(path);
  wrapper.appendChild(svg);

  // Centruota ikona skirta teardropo vduje
  const reel = makeFilmReel(12, "#000000");
  reel.style.position = "absolute";
  reel.style.top = "8px";
  reel.style.left = "10px";
  wrapper.appendChild(reel);

  return wrapper;
}

/**
 * Klasterio žymeklis, kuris rodo kelių artimų lokacijų skaičių.
 * Dydis dinamiškai didėja priklausomai nuo taškų skaičiaus:
 * mažiau 10 taškų  -> 40×40 px, šriftas 13px
 * nuo 10–49 taškų -> 52×52 px, šriftas 15px
 * nuo ir daugiau 50 taškų  -> 64×64 px, šriftas 17px
 *
 * @param pointCount - Klasteryje esančių lokacijų skaičius
 */
export function createClusterMarker(pointCount: number): HTMLElement {
  const el = document.createElement("div");

  // Dydis priklauso nuo taškų kiekio,kuo didesni klasteriai,tuo ryškesni
  let size = 40;
  let fontSize = 13;
  if (pointCount >= 50) {
    size = 64;
    fontSize = 17;
  } else if (pointCount >= 10) {
    size = 52;
    fontSize = 15;
  }

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.background = "rgba(201,168,76,0.85)";
  el.style.border = "2px solid #c9a84c";
  el.style.borderRadius = "50%";
  el.style.color = "#0a0a0a";
  el.style.fontWeight = "700";
  el.style.fontSize = `${fontSize}px`;
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.cursor = "pointer";
  el.style.fontFamily = "Inter, sans-serif";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";

  // Rodomas taškų skaičius klasterio centre
  el.textContent = String(pointCount);

  return el;
}
