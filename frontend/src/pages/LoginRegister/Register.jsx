import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Removed requirement to agree to terms per user request
    if (password !== confirmPassword) {
      alert("パスワードが一致しません。");
      return;
    }
    setLoading(true);
    setError(null);
    const API_BASE =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const lang = localStorage.getItem("lang") || "vi";
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-lang": lang },
      body: JSON.stringify({ username, email, password, confirmPassword }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Register failed");
        }
        // optionally switch to login after successful register
        alert("登録成功しました。ログインしてください。");
        navigate("/login");
        if (onSwitchToLogin) onSwitchToLogin();
      })
      .catch((err) => {
        setError(err.message || "Network error");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="site-title">味の旅</h1>
        <h2 className="section-title">新規登録</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="label">ユーザー名</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

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

          <label className="label">パスワード確認</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {/* Terms agreement checkbox removed */}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "読み込み中..." : "登録"}
          </button>
          {error && <div className="form-error">{error}</div>}
          <p className="muted">既にアカウントをお持ちですか？</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/login")}
          >
            ログイン画面へ
          </button>
        </form>
      </div>
    </div>
  );
}
