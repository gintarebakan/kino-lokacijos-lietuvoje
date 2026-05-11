import { create } from "zustand";

// BEZ persist — saugome tik sesijos metu
interface CookieState {
  consent: "accepted" | "declined" | null;
  setConsent: (v: "accepted" | "declined") => void;
}

export const useCookieStore = create<CookieState>()((set) => ({
  consent: null,
  setConsent: (consent) => {
    set({ consent });
    // Tik jei sutiko — išsaugome localStorage
    if (consent === "accepted") {
      localStorage.setItem("cinemap-cookie-consent", "accepted");
    } else {
      localStorage.removeItem("cinemap-cookie-consent");
    }
  },
}));

// Inicializacija — patikrinti ar jau sutiko anksčiau
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("cinemap-cookie-consent");
  if (saved === "accepted") {
    useCookieStore.setState({ consent: "accepted" });
  }
}