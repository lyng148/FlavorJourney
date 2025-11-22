import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { t, i18n } = useTranslation("homepage");
  const { t: tf } = useTranslation("favorites");
  const navigate = useNavigate();

  // Use i18n.language directly instead of local state
  const lang = i18n.language;

  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_BASE}/dishes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch dishes");
        }
        const data = await response.json();
        setDishes(data.data);

        // Load current favorites to render heart state
        const langHeader = i18n.language || "vi";
        const favRes = await fetch(`${API_BASE}/favorites`, {
          headers: { Authorization: `Bearer ${token}`, "x-lang": langHeader },
        });
        if (favRes.ok) {
          const favList = await favRes.json();
          const ids = new Set(
            (Array.isArray(favList) ? favList : []).map(
              (f) => f?.dish?.id ?? f?.id
            )
          );
          setFavoriteIds(ids);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, [API_BASE, navigate, i18n.language]); // Add i18n.language dependency to refetch/re-render if needed

  const handleToggleFavorite = async (dishId) => {
    const token = localStorage.getItem("access_token") || "";
    const langHeader = i18n.language || "vi";
    try {
      if (favoriteIds.has(dishId)) {
        const res = await fetch(`${API_BASE}/favorites/${dishId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-lang": langHeader,
          },
        });
        if (!res.ok) throw new Error("delete favorite failed");
        const next = new Set(favoriteIds);
        next.delete(dishId);
        setFavoriteIds(next);
      } else {
        const res = await fetch(`${API_BASE}/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-lang": langHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dishId }),
        });
        if (!res.ok) throw new Error("add favorite failed");
        const next = new Set(favoriteIds);
        next.add(dishId);
        setFavoriteIds(next);
      }
    } catch (e) {
      // ignore UI error
    }
  };

  return (
    <>
      {/* Language switcher removed from here */}
      <div style={{ marginTop: 24 }}>
        <h2>{t("dishList")}</h2>
        {loading && <p>{t("loading")}</p>}
        {error && (
          <p style={{ color: "red" }}>
            {t("error")}: {error}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "16px",
          }}
        >
          {dishes.map((dish) => (
            <div
              key={dish.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "200px",
                  borderRadius: "4px",
                  marginBottom: "12px",
                  overflow: "hidden",
                  backgroundColor: "#f0f0f0",
                }}
              >
                {dish.image_url ? (
                  <img
                    src={dish.image_url}
                    alt={
                      lang === "vi" ? dish.name_vietnamese : dish.name_japanese
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentElement.style.backgroundColor = "#f0f0f0";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999",
                    }}
                  >
                    <span>{t("noImage")}</span>
                  </div>
                )}
              </div>
              <h3 style={{ margin: "0 0 8px 0" }}>
                {lang === "vi" ? dish.name_vietnamese : dish.name_japanese}
              </h3>
              <p
                style={{ margin: 0, color: "#666", fontSize: "0.9em", flex: 1 }}
              >
                {lang === "vi"
                  ? dish.description_vietnamese
                  : dish.description_japanese}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "12px",
                }}
              >
                <button
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#e07a3f",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/dishes/${dish.id}`)}
                >
                  {t("viewDetails")}
                </button>
                <button
                  onClick={() => handleToggleFavorite(dish.id)}
                  title={
                    favoriteIds.has(dish.id)
                      ? tf("removeFromFavorites")
                      : tf("addToFavorites")
                  }
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "18px",
                    color: favoriteIds.has(dish.id) ? "#e74c3c" : "#999",
                  }}
                >
                  {favoriteIds.has(dish.id) ? "❤" : "♡"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
