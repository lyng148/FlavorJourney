import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import viHomepage from "./locales/vi/homepage.json";
import jpHomepage from "./locales/jp/homepage.json";

const stored =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const initialLng = stored || "vi";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "vi",
  debug: false,
  defaultNS: "homepage",
  ns: ["homepage"],
  resources: {
    vi: { homepage: viHomepage },
    jp: { homepage: jpHomepage },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
