import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viHomepage from "./locales/vi/homepage.json";
import jpHomepage from "./locales/jp/homepage.json";

import viSidebar from "./locales/vi/sidebar.json";
import jpSidebar from "./locales/jp/sidebar.json";

import viAdmin from "./locales/vi/admin.json";
import jpAdmin from "./locales/jp/admin.json";

import viFavorites from "./locales/vi/favorites.json";
import jpFavorites from "./locales/jp/favorites.json";

import viDishForm from "./locales/vi/dishForm.json";
import jpDishForm from "./locales/jp/dishForm.json";

import viSearch from "./locales/vi/search.json";
import jpSearch from "./locales/jp/search.json";

import viProfile from "./locales/vi/profile.json";
import jpProfile from "./locales/jp/profile.json";

import viChangePassword from "./locales/vi/change_password.json";
import jpChangePassword from "./locales/jp/change_password.json";
import viAiGenerator from "./locales/vi/ai_generator.json";
import jpAiGenerator from "./locales/jp/ai_generator.json";

const stored =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const initialLng = stored || "vi";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "vi",
  debug: false,
  defaultNS: "homepage",

  ns: [
    "homepage",
    "sidebar",
    "admin",
    "favorites",
    "dishForm",
    "search",
    "profile",
    "change_password",
    "ai_generator",
  ],

  resources: {
    vi: {
      homepage: viHomepage,
      sidebar: viSidebar,
      admin: viAdmin,
      favorites: viFavorites,
      dishForm: viDishForm,
      search: viSearch,
      profile: viProfile,
      change_password: viChangePassword,
      ai_generator: viAiGenerator,
    },
    jp: {
      homepage: jpHomepage,
      sidebar: jpSidebar,
      admin: jpAdmin,
      favorites: jpFavorites,
      dishForm: jpDishForm,
      search: jpSearch,
      profile: jpProfile,
      change_password: jpChangePassword,
      ai_generator: jpAiGenerator,
    },
  },

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
