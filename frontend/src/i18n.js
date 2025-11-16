import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import viCommon from "./locales/vi/common.json";
import jpCommon from "./locales/jp/common.json";

const stored =
  typeof window !== "undefined" ? localStorage.getItem("lang") : null;
const initialLng = stored || "vi";

i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: "vi",
  debug: false,
  defaultNS: "common",
  ns: ["common"],
  resources: {
    vi: { common: viCommon },
    jp: { common: jpCommon },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
