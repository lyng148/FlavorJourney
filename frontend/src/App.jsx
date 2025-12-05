import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/LoginRegister/Login";
import Register from "./pages/LoginRegister/Register";
import Home from "./pages/Home/Home";
// Fixed imports
import DishApproval from "./pages/DishApproval";
import DishDetail from "./pages/DishDetail";
import RegisterDish from "./pages/RegisterDish/RegisterDish";
import Search from "./pages/Search";
import ChangePassword from "./pages/ChangePassword/ChangePassword";
import "./App.css";
import Sidebar from "./components/sidebar/sidebar";
import Favorites from "./pages/Favorites/Favorites";
import Profile from "./pages/Profile/Profile";
import MySubmissions from "./pages/MySubmissions/MySubmissions";

// ============= SHARED COMPONENTS =============

// Layout wrapper với sidebar
function AppLayout({ children, active }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavigate = (id) => {
    const routes = {
      home: "/home",
      search: "/search",
      register: "/register-dish",
      favorites: "/favorites",
      profile: "/profile",
      dishApproval: "/dish-approval",
    };

    if (routes[id]) {
      navigate(routes[id]);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        active={active}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
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

// ============= PROTECTED ROUTE =============

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Protected admin route
function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

// ============= MAIN APP =============

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== PROTECTED USER ROUTES ===== */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppLayout active="home">
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <AppLayout active="search">
                <Search />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-dish"
          element={
            <ProtectedRoute>
              <AppLayout active="register">
                <RegisterDish />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <AppLayout active="favorites">
                <Favorites />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout active="profile">
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-submissions"
          element={
            <ProtectedRoute>
              <AppLayout active="mySubmissions">
                <MySubmissions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <AppLayout active="profile">
                <ChangePassword />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path="/dish-approval"
          element={
            <AdminProtectedRoute>
              <AppLayout active="dishApproval">
                <DishApproval />
              </AppLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ===== DISH DETAIL ROUTES ===== */}
        <Route
          path="/dishes/:dishId"
          element={
            <ProtectedRoute>
              <AppLayout active="home">
                <DishDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dishes/:dishId"
          element={
            <AdminProtectedRoute>
              <AppLayout active="dishApproval">
                <DishDetail />
              </AppLayout>
            </AdminProtectedRoute>
          }
        />

        {/* ===== DEFAULT REDIRECT ===== */}
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
