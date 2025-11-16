import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";
import { useTranslation } from "react-i18next";

function Home({ onReturnToLogin }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { t, i18n } = useTranslation("common");
  const [lang, setLang] = useState(
    localStorage.getItem("lang") || i18n.language || "vi"
  );

  const name =
    user.username || user.email || (lang === "jp" ? "ユーザー" : "Người dùng");

  const handleChangeLang = (e) => {
    const value = e.target.value;
    setLang(value);
    localStorage.setItem("lang", value);
    i18n.changeLanguage(value);
  };

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <label htmlFor="lang-select" style={{ fontWeight: 600 }}>
          {t("home.language")}:
        </label>
        <select id="lang-select" value={lang} onChange={handleChangeLang}>
          <option value="vi">{t("home.lang_vi")}</option>
          <option value="jp">{t("home.lang_jp")}</option>
        </select>
      </div>
      <h1>{t("home.welcome", { name })}</h1>
      <p>{t("home.loggedIn")}</p>
      <div style={{ marginTop: 16 }}>
        <button
          className="btn-secondary"
          onClick={() => onReturnToLogin && onReturnToLogin()}
        >
          {t("home.backToLogin")}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState(() =>
    localStorage.getItem("access_token") ? "home" : "login"
  );

  useEffect(() => {
    // If user logs in (access_token set), switch to home
    const onStorage = () => {
      if (localStorage.getItem("access_token")) setMode("home");
      else setMode("login");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Logout removed per request: Home no longer shows logout and app will keep token until user clears it

  const handleReturnToLogin = () => {
    // client-only: clear token/user from localStorage and show login
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setMode("login");
  };

  return (
    <>
      {mode === "login" && (
        <Login
          onSwitchToRegister={() => setMode("register")}
          onLoginSuccess={() => setMode("home")}
        />
      )}
      {mode === "register" && (
        <Register onSwitchToLogin={() => setMode("login")} />
      )}
      {mode === "home" && <Home onReturnToLogin={handleReturnToLogin} />}
    </>
  );
}

export default App;
