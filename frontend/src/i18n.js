import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import viHomepage from "./locales/vi/homepage.json";
import jpHomepage from "./locales/jp/homepage.json";
import viSidebar from "./locales/vi/sidebar.json";
import jpSidebar from "./locales/jp/sidebar.json";
import viDishForm from "./locales/vi/dishForm.json";
import jpDishForm from "./locales/jp/dishForm.json";
import viAdmin from "./locales/vi/admin.json";
import jpAdmin from "./locales/jp/admin.json";
import viSearch from "./locales/vi/search.json";
import jpSearch from "./locales/jp/search.json";

const stored =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const initialLng = stored || "vi";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "vi",
  debug: false,
  defaultNS: "homepage",
  ns: ["homepage", "sidebar", "dishForm", "admin", "search"],
  resources: {
    vi: { homepage: viHomepage, sidebar: viSidebar, dishForm: viDishForm, admin: viAdmin, search: viSearch },
    jp: { homepage: jpHomepage, sidebar: jpSidebar, dishForm: jpDishForm, admin: jpAdmin, search: jpSearch },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
