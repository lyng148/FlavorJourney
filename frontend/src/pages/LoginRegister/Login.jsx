import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveLogin, setSaveLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const lang = localStorage.getItem("lang") || "vi";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lang": lang },
        body: JSON.stringify({ email, password, saveLoginInfo: !!saveLogin }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message || data?.error || "Login failed";
        setError(msg);
        setLoading(false);
        return;
      }

      // expected: { access_token, user, redirectTo }
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user || {}));

        // Always navigate to home page after login
        navigate("/");

        // Call onLoginSuccess for any additional logic
        if (onLoginSuccess && typeof onLoginSuccess === "function") {
          onLoginSuccess();
        }
      } else {
        setError("Login succeeded but no token returned");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="site-title">味の旅</h1>
        <h2 className="section-title">ログイン / 登録</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="label">メールアドレス</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="label">パスワード</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="row-between">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={saveLogin}
                onChange={(e) => setSaveLogin(e.target.checked)}
              />
              <span>ログイン状態を保持する</span>
            </label>
            <a className="forgot" href="#">
              パスワードをお忘れですか？
            </a>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "読み込み中..." : "ログイン"}
          </button>
          {error && <div className="form-error">{error}</div>}

          <p className="muted">まだアカウントがありませんか？</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/register")}
          >
            新規登録
          </button>
        </form>
      </div>
    </div>
  );
}
