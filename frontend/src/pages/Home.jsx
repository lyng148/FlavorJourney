import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Home() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { t, i18n } = useTranslation("homepage");
  const navigate = useNavigate();
  const [lang, setLang] = useState(
    localStorage.getItem("lang") || i18n.language || "vi"
  );
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const name =
    user.username || user.email || (lang === "jp" ? "ユーザー" : "Người dùng");

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/dishes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch dishes");
        }
        const data = await response.json();
        setDishes(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDishes();
  }, []);

  const handleChangeLang = (e) => {
    const value = e.target.value;
    setLang(value);
    localStorage.setItem("lang", value);
    i18n.changeLanguage(value);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <label htmlFor="lang-select" style={{ fontWeight: 600 }}>
          {t("language")}:
        </label>
        <select id="lang-select" value={lang} onChange={handleChangeLang}>
          <option value="vi">{t("lang_vi")}</option>
          <option value="jp">{t("lang_jp")}</option>
        </select>
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>{t("dishList")}</h2>
        {loading && <p>{t("loading")}</p>}
        {error && <p style={{ color: 'red' }}>{t("error")}: {error}</p>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '16px' }}>
          {dishes.map((dish) => (
            <div key={dish.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%', height: '200px', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                {dish.image_url ? (
                  <img 
                    src={dish.image_url} 
                    alt={lang === 'vi' ? dish.name_vietnamese : dish.name_japanese} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.style.backgroundColor = '#f0f0f0';
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>{lang === 'vi' ? dish.name_vietnamese : dish.name_japanese}</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9em', flex: 1 }}>
                {lang === 'vi' ? dish.description_vietnamese : dish.description_japanese}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn-secondary" onClick={handleLogout}>
          {t("backToLogin")}
        </button>
      </div>
    </>
  );
}

export default Home;
