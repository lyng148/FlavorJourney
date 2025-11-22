import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Favorites.css";
import { useTranslation } from "react-i18next";

export default function Favorites() {
  const { t, i18n } = useTranslation("favorites");
  const { t: th } = useTranslation("homepage");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, spicy: 0, region: "-" });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const lang = localStorage.getItem("lang") || i18n.language || "vi";
      const token = localStorage.getItem("access_token") || "";
      try {
        // 1) Load favorites list
        const [resList, resStats] = await Promise.all([
          fetch(`${API_BASE}/favorites`, {
            headers: {
              "x-lang": lang,
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/favorites/statistics`, {
            headers: {
              "x-lang": lang,
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (!resList.ok) throw new Error("favorites list failed");
        const listJson = await resList.json();
        // API trả về [{ dish: {...}, created_at }]; map sang dish
        const mapped =
          Array.isArray(listJson) && listJson.length
            ? listJson.map((f) => f.dish || f)
            : [];
        setItems(mapped);

        // 2) Stats
        if (resStats.ok) {
          const s = await resStats.json();
          setStats({
            total: s?.total_favorites ?? mapped.length,
            spicy: s?.spicy_favorites_count ?? 0,
            region:
              (Array.isArray(s?.region_popularity) &&
                s.region_popularity[0]?.region) ||
              "-",
          });
        } else {
          setStats({ total: mapped.length, spicy: 0, region: "-" });
        }
      } catch {
        // If API fails, show empty state
        setItems([]);
        setStats({ total: 0, spicy: 0, region: "-" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [i18n.language]);

  const handleUnfavorite = async (dishId) => {
    const API_BASE =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const lang = localStorage.getItem("lang") || i18n.language || "vi";
    const token = localStorage.getItem("access_token") || "";
    try {
      const res = await fetch(`${API_BASE}/favorites/${dishId}`, {
        method: "DELETE",
        headers: { "x-lang": lang, Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("delete failed");
      // reload list
      const resList = await fetch(`${API_BASE}/favorites`, {
        headers: { "x-lang": lang, Authorization: `Bearer ${token}` },
      });
      const listJson = await resList.json();
      const mapped =
        Array.isArray(listJson) && listJson.length
          ? listJson.map((f) => f.dish || f)
          : [];
      setItems(mapped);
      setStats((s) => ({ ...s, total: mapped.length }));
    } catch {
      // ignore UI error for now
    }
  };

  return (
    <div className="fav-page">
      <div className="fav-header">
        <h2 style={{ margin: 0 }}>{t("title")}</h2>
        <span className="muted">{t("subtitle")}</span>
      </div>

      {loading ? (
        <div className="muted">{t("loading")}</div>
      ) : items.length === 0 ? (
        <div className="muted">{t("empty")}</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "20px",
            marginTop: "16px",
          }}
        >
          {items.map((dish) => (
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
                      i18n.language === "jp"
                        ? dish.name_japanese || dish.name_vietnamese
                        : dish.name_vietnamese || dish.name_japanese
                    }
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
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
                    <span>{th("noImage")}</span>
                  </div>
                )}
              </div>

              <h3 style={{ margin: "0 0 8px 0" }}>
                {i18n.language === "jp"
                  ? dish.name_japanese || dish.name_vietnamese
                  : dish.name_vietnamese || dish.name_japanese}
              </h3>

              <p
                style={{ margin: 0, color: "#666", fontSize: "0.9em", flex: 1 }}
              >
                {i18n.language === "jp"
                  ? dish.description_japanese ||
                    dish.description_vietnamese ||
                    ""
                  : dish.description_vietnamese ||
                    dish.description_japanese ||
                    ""}
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
                  onClick={() => handleUnfavorite(dish.id)}
                  title={t("removeFromFavorites")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#e74c3c",
                    fontSize: "18px",
                  }}
                >
                  ❤
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fav-stats">
        <div className="fav-stat">
          <div className="muted">{t("stats.savedCount")}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total} 件</div>
        </div>
        <div className="fav-stat">
          <div className="muted">{t("stats.spicyCount")}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.spicy} 件</div>
        </div>
        <div className="fav-stat">
          <div className="muted">{t("stats.popularRegion")}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{stats.region}</div>
        </div>
      </div>
    </div>
  );
}
