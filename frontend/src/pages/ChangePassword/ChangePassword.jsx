import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./ChangePassword.css";

export default function ChangePassword() {
  const { t } = useTranslation("change_password");
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const lang = localStorage.getItem("lang") || "vi";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError(t("error_login"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-lang": lang,
        },
        body: JSON.stringify({
          oldPassword,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message)
          ? data.message.join(", ")
          : (data.message || data.error || t("error_generic"));
        throw new Error(msg);
      }

      setMessage(t("success"));
      setOldPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h2 className="section-title">{t("change_password")}</h2>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form className="change-password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">{t("old_password")}</label>
            <input
              type="password"
              className="input"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="label">{t("new_password")}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t("confirm_password")}</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? t("submitting") : t("submit_btn")}
          </button>
        </form>
      </div>
    </div>
  );
}
