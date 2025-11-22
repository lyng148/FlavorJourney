import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/LoginRegister/Login";
import Register from "./pages/LoginRegister/Register";
import Home from "./pages/Home/Home";
// Fixed imports
import DishApproval from "./pages/DishApproval";
import DishDetail from "./pages/DishDetail";
import "./App.css";
import { useTranslation } from "react-i18next";
import Sidebar from "./components/sidebar/sidebar";

// ============= SHARED COMPONENTS =============

// Layout wrapper với sidebar
function AppLayout({ children, active, onNavigate, onLogout }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active={active} onNavigate={onNavigate} onLogout={onLogout} />
      <main
        style={{
          flex: 1,
          padding: active === "dishApproval" ? 0 : 24,
          textAlign: "left",
        }}
      >
        {children}
      </main>
    </div>
  );
}

// ============= USER HOME =============

function UserHome() {
  const navigate = useNavigate();
  const [active, setActive] = useState("home");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderContent = () => {
    switch (active) {
      case "search":
        return (
          <>
            <h1>検索</h1>
            <p>こちらで料理や場所を検索できます。（デモ）</p>
          </>
        );
      case "register":
        return (
          <>
            <h1>登録</h1>
            <p>新しい投稿やレストランを登録します。（デモ）</p>
          </>
        );
      case "favorites":
        return (
          <>
            <h1>お気に入り</h1>
            <p>あなたのお気に入りを表示します。（デモ）</p>
          </>
        );
      case "profile":
        return (
          <>
            <h1>プロフィール</h1>
            <p>プロフィール情報を編集します。（デモ）</p>
          </>
        );
      case "home":
      default:
        return <Home />;
    }
  };

  return (
    <AppLayout
      active={active}
      onNavigate={(id) => setActive(id)}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppLayout>
  );
}

// ============= ADMIN HOME =============

function AdminHome() {
  const navigate = useNavigate();
  const [active, setActive] = useState("home");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderContent = () => {
    switch (active) {
      case "dishApproval":
        return <DishApproval />;
      case "search":
        return (
          <>
            <h1>検索</h1>
            <p>こちらで料理や場所を検索できます。（デモ）</p>
          </>
        );
      case "register":
        return (
          <>
            <h1>登録</h1>
            <p>新しい投稿やレストランを登録します。（デモ）</p>
          </>
        );
      case "favorites":
        return (
          <>
            <h1>お気に入り</h1>
            <p>あなたのお気に入りを表示します。（デモ）</p>
          </>
        );
      case "profile":
        return (
          <>
            <h1>プロフィール</h1>
            <p>プロフィール情報を編集します。（デモ）</p>
          </>
        );
      case "home":
      default:
        return <Home />;
    }
  };

  return (
    <AppLayout
      active={active}
      onNavigate={(id) => setActive(id)}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppLayout>
  );
}

// ============= ROUTE COMPONENTS =============

// Home route selector - chọn UserHome hoặc AdminHome
function HomeRouter() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Admin thì hiển thị AdminHome, user thường hiển thị UserHome
  return user.role === "admin" ? <AdminHome /> : <UserHome />;
}

// Protected admin route
function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Layout cho admin detail pages
function AdminDetailLayout({ children }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("dishApproval");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AppLayout
      active={active}
      onNavigate={(id) => {
        if (id === "dishApproval") {
          navigate("/");
        } else {
          navigate("/");
        }
      }}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
}

// Layout cho user detail pages
function DetailLayout({ children }) {
  const navigate = useNavigate();
  const [active, setActive] = useState("home");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AppLayout
      active={active}
      onNavigate={(id) => {
        navigate("/");
      }}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
}

// ============= MAIN APP =============

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== SHARED HOME ROUTE (USER + ADMIN) ===== */}
        <Route path="/" element={<HomeRouter />} />

        <Route
          path="/dishes/:dishId"
          element={
            <DetailLayout>
              <DishDetail />
            </DetailLayout>
          }
        />

        {/* ===== ADMIN-ONLY ROUTES ===== */}
        <Route
          path="/admin/dishes/:dishId"
          element={
            <AdminProtectedRoute>
              <AdminDetailLayout>
                <DishDetail />
              </AdminDetailLayout>
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;