import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./i18n";

const lang = localStorage.getItem("lang") || "vi";
if (!localStorage.getItem("lang")) {
  localStorage.setItem("lang", lang);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
