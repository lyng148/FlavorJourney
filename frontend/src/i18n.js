import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import viHomepage from "./locales/vi/homepage.json";
import jpHomepage from "./locales/jp/homepage.json";
import viSidebar from "./locales/vi/sidebar.json";
import jpSidebar from "./locales/jp/sidebar.json";
import viFavorites from "./locales/vi/favorites.json";
import jpFavorites from "./locales/jp/favorites.json";

const stored =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const initialLng = stored || "vi";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "vi",
  debug: false,
  defaultNS: "homepage",
  ns: ["homepage", "sidebar", "favorites"],
  resources: {
    vi: { homepage: viHomepage, sidebar: viSidebar, favorites: viFavorites },
    jp: { homepage: jpHomepage, sidebar: jpSidebar, favorites: jpFavorites },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
