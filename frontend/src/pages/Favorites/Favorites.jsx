import { useEffect, useState } from "react";
import "./Favorites.css";
import { useTranslation } from "react-i18next";

export default function Favorites() {
  const { t, i18n } = useTranslation("favorites");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const lang = localStorage.getItem("lang") || i18n.language || "vi";
      try {
        const res = await fetch(`${API_BASE}/profile/me`, {
          headers: { "x-lang": lang },
          credentials: "include",
        });
        if (!res.ok) throw new Error("fail");
        const data = await res.json();
        const list = data?.favoritedDishes?.dishes || [];
        setItems(list);
      } catch {
        // Fallback demo data if API not ready
        setItems([
          {
            id: 1,
            name_japanese: "生春巻き",
            name_vietnamese: "Gỏi cuốn",
            image_url:
              "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
            description_vietnamese:
              "Bánh tráng cuốn tôm thịt, rau sống và nước chấm đậm đà.",
          },
          {
            id: 2,
            name_japanese: "バインセオ",
            name_vietnamese: "Bánh xèo",
            image_url:
              "https://images.unsplash.com/photo-1611042553484-d61f84d21450?q=80&w=1200&auto=format&fit=crop",
            description_vietnamese:
              "Vỏ giòn rụm, nhân tôm thịt giá, ăn kèm rau sống và nước mắm chua ngọt.",
          },
          {
            id: 3,
            name_japanese: "カフェスアダー",
            name_vietnamese: "Cà phê sữa đá",
            image_url:
              "https://images.unsplash.com/photo-1517702145080-e4d8b1b8145e?q=80&w=1200&auto=format&fit=crop",
            description_vietnamese:
              "Cà phê đậm vị cùng sữa đặc béo ngậy, thơm ngon khó cưỡng.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [i18n.language]);

  return (
    <div className="fav-page">
      <div className="fav-header">
        <h2 style={{ margin: 0 }}>{t("title")}</h2>
        <span className="muted">{t("subtitle")}</span>
      </div>

      {loading ? (
        <div className="muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="muted">{t("empty")}</div>
      ) : (
        <div className="fav-grid">
          {items.map((dish) => (
            <div className="fav-card" key={dish.id}>
              <img
                src={dish.image_url}
                alt={dish.name_vietnamese || dish.name_japanese}
              />
              <div className="body">
                <div className="title">
                  {dish.name_vietnamese || dish.name_japanese}
                </div>
                <div className="desc">
                  {dish.description_vietnamese ||
                    dish.description_japanese ||
                    ""}
                </div>
              </div>
              <div className="footer">
                <button className="btn-secondary">{t("viewDetails")}</button>
                <div className="muted">❤</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fav-stats">
        <div className="fav-stat">
          <div className="muted">{t("stats.savedCount")}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{items.length} 件</div>
        </div>
        <div className="fav-stat">
          <div className="muted">{t("stats.spicyCount")}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>0 件</div>
        </div>
        <div className="fav-stat">
          <div className="muted">{t("stats.popularRegion")}</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>南部</div>
        </div>
      </div>
    </div>
  );
}
