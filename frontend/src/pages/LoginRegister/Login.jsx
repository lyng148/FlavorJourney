import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Login.css";

export default function Login({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [view, setView] = useState("login"); // 'login', 'forgot', 'reset'

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saveLogin, setSaveLogin] = useState(false);

  // Forgot state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState(null);

  // Reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const lang = localStorage.getItem("lang") || "vi";

  useEffect(() => {
    if (resetToken) {
      setView("reset");
    }
  }, [resetToken]);

  const handleLoginSubmit = async (e) => {
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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setForgotMessage(null);
    setLoading(true);
    try {
      console.log("Sending forgot password request for:", forgotEmail);
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lang": lang },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      console.log("Response from server:", data);

      if (!res.ok) {
        // Handle array of errors (e.g. from class-validator) or single message
        const msg = Array.isArray(data.message) 
          ? data.message.join(", ") 
          : (data.message || data.error || "Failed to send reset link");
        throw new Error(msg);
      }
      setForgotMessage("パスワード再設定リンクをメールに送信しました。受信トレイを確認してください。");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lang": lang },
        body: JSON.stringify({ token: resetToken, password: newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to reset password");
      }
      setResetMessage("パスワードが正常に変更されました。");
      setTimeout(() => {
        setView("login");
        navigate("/login"); // clear token from url
      }, 2000);
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const renderLogin = () => (
    <form className="login-form" onSubmit={handleLoginSubmit}>
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
        <a className="forgot" href="#" onClick={(e) => { e.preventDefault(); setView("forgot"); setError(null); }}>
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
  );

  const renderForgot = () => (
    <form className="login-form" onSubmit={handleForgotSubmit}>
      <p style={{ marginBottom: "1rem", color: "#555" }}>
        メールアドレスを入力してください。リセットリンクを送信します。
      </p>
      <label className="label">メールアドレス</label>
      <input
        className="input"
        type="email"
        value={forgotEmail}
        onChange={(e) => setForgotEmail(e.target.value)}
        required
      />
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "送信中..." : "送信"}
      </button>
      {forgotMessage && <div className="form-success" style={{ color: "green", marginTop: "10px" }}>{forgotMessage}</div>}
      {error && <div className="form-error">{error}</div>}
      
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <a href="#" className="forgot" onClick={(e) => { e.preventDefault(); setView("login"); setError(null); }}>
          ログインに戻る
        </a>
      </div>
    </form>
  );

  const renderReset = () => (
    <form className="login-form" onSubmit={handleResetSubmit}>
      <label className="label">新しいパスワード</label>
      <input
        className="input"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <label className="label">パスワード（確認）</label>
      <input
        className="input"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "処理中..." : "パスワードを変更"}
      </button>
      {resetMessage && <div className="form-success" style={{ color: "green", marginTop: "10px" }}>{resetMessage}</div>}
      {error && <div className="form-error">{error}</div>}
      
      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <a href="#" className="forgot" onClick={(e) => { e.preventDefault(); setView("login"); navigate("/login"); setError(null); }}>
          ログインに戻る
        </a>
      </div>
    </form>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="site-title">味の旅</h1>
        <h2 className="section-title">
          {view === "login" && "ログイン / 登録"}
          {view === "forgot" && "パスワードをお忘れですか？"}
          {view === "reset" && "パスワードの再設定"}
        </h2>

        {view === "login" && renderLogin()}
        {view === "forgot" && renderForgot()}
        {view === "reset" && renderReset()}
      </div>
    </div>
  );
}
