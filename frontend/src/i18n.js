import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import viHomepage from "./locales/vi/homepage.json";
import jpHomepage from "./locales/jp/homepage.json";
import viSidebar from "./locales/vi/sidebar.json";
import jpSidebar from "./locales/jp/sidebar.json";
import viDishForm from "./locales/vi/dishForm.json";
import jpDishForm from "./locales/jp/dishForm.json";

const stored =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const initialLng = stored || "vi";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "vi",
  debug: false,
  defaultNS: "homepage",
  ns: ["homepage", "sidebar", "dishForm"],
  resources: {
    vi: { homepage: viHomepage, sidebar: viSidebar, dishForm: viDishForm },
    jp: { homepage: jpHomepage, sidebar: jpSidebar, dishForm: jpDishForm },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
