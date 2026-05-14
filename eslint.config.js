// ESLint konfigūracija, kodo kokybės tikrinimo įrankis
// Naudojamas kūrimo metu klaidoms ir stiliaus neatitikimams aptikti

import js from "@eslint/js"; // Pagrindinės JavaScript taisyklės
import eslintPluginPrettier from "eslint-plugin-prettier/recommended"; // Prettier integravimas/kodo formatavimo tikrinimas
import globals from "globals"; // Naršyklės globalių kintamųjų apibrėžimai (window, document ir kt.)
import reactHooks from "eslint-plugin-react-hooks"; // React Hooks naudojimo taisyklių tikrinimas
import reactRefresh from "eslint-plugin-react-refresh"; // Vite hot-reload suderinamumo tikrinimas
import tseslint from "typescript-eslint"; // TypeScript palaikymas ESLint

export default tseslint.config(
  // Ignoruojami aplankai/netikrinamas sugeneruotas kodas
  { ignores: ["dist", ".output", ".vinxi"] },

  {
    // Praplečiamos rekomenduojamos JavaScript ir TypeScript taisyklės
    extends: [js.configs.recommended, ...tseslint.configs.recommended],

    // Taisyklės taikomos tik TypeScript failams
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: 2020, // ES2020 sintaksės palaikymas
      globals: globals.browser, // Naršyklės globalūs kintamieji (fetch, localStorage ir kt.)
    },

    plugins: {
      "react-hooks": reactHooks, // React Hooks taisyklių įskiepis
      "react-refresh": reactRefresh, // React Refresh (hot-reload) įskiepis
    },

    rules: {
      // Rekomenduojamos React Hooks taisyklės (pvz. useEffect priklausomybių tikrinimas)
      ...reactHooks.configs.recommended.rules,

      // Įspėjimas jei komponentas eksportuojamas - ne kaip pagrindinis Vite hot-reload reikalavimas
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Išjungta nepanaudotų kintamųjų klaida
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Prettier formatavimo taisyklės užtikrina vienodą kodo stilių
  eslintPluginPrettier,
);