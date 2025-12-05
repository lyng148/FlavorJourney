import React from "react";
import { useTranslation } from "react-i18next";
import "./sidebar.css";
import { PiBowlFood } from "react-icons/pi";

export default function Sidebar({ active = "home", onNavigate, onLogout }) {
  const { t, i18n } = useTranslation("sidebar");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  const Item = ({ id, icon, label, onClick }) => (
    <div
      className={`fj-item ${active === id ? "active" : ""}`}
      onClick={onClick || (() => onNavigate && onNavigate(id))}
      role="button"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (onClick) {
            onClick();
          } else {
            onNavigate && onNavigate(id);
          }
        }
      }}
    >
      <span className="icon" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );

  return (
    <aside className="fj-sidebar">
      <div className="fj-brand">
        <span className="badge" aria-hidden>
          <PiBowlFood />
        </span>
        <span>{t("brand")}</span>
      </div>

      <nav className="fj-nav" aria-label="Sidebar Navigation">
        <Item
          id="home"
          label={t("home")}
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
        <Item
          id="search"
          label={t("search")}
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M20 20l-3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          }
        />
        <Item
          id="register"
          label={t("register")}
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        {!isAdmin && (
          <Item
            id="favorites"
            label={t("favorites")}
            icon={
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12.1 21.35 10 19.28C5.4 14.36 2 11.28 2 7.5 2 5 4 3 6.5 3 8.04 3 9.54 3.81 10.35 5.08 11.16 3.81 12.66 3 14.2 3 16.7 3 18.7 5 18.7 7.5c0 3.78-3.4 6.86-7.99 11.78l-1.61 2.07z" />
              </svg>
            }
          />
        )}

        <Item
          id="profile"
          label={t("profile")}
          icon={
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle
                cx="12"
                cy="8"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 20c1.5-3.5 5-5 8-5s6.5 1.5 8 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
        />

        {isAdmin && (
          <>
            <div style={{ margin: "1rem 0", borderTop: "1px solid #e5e7eb" }} />
            <Item
              id="dishApproval"
              label={t("dishApproval")}
              icon={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              }
            />
          </>
        )}
      </nav>

      <div className="fj-lang-switch">
        <button
          className={`lang-btn ${i18n.language === "vi" ? "active" : ""}`}
          onClick={() => {
            i18n.changeLanguage("vi");
            localStorage.setItem("lang", "vi");
          }}
          title={t("lang_vi")}
        >
          <img src="/vietnam_flag.svg" alt="VN" />
        </button>
        <button
          className={`lang-btn ${i18n.language === "jp" ? "active" : ""}`}
          onClick={() => {
            i18n.changeLanguage("jp");
            localStorage.setItem("lang", "jp");
          }}
          title={t("lang_jp")}
        >
          <img src="/japan_flag.png" alt="JP" />
        </button>
      </div>

      <div className="fj-spacer" />

      <div className="fj-footer">
        <div
          className="fj-item"
          onClick={() => onLogout && onLogout()}
          role="button"
          tabIndex={0}
          aria-label={t("logout")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onLogout && onLogout();
          }}
        >
          <span className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M10 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M14 12H3m0 0 3-3m-3 3 3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>{t("logout")}</span>
        </div>
      </div>
    </aside>
  );
}
