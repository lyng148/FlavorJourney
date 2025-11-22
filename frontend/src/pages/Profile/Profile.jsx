import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Profile.css";
import { CiCalendarDate } from "react-icons/ci";
import { GoPencil } from "react-icons/go";
import { FaRegEye } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { CiHeart } from "react-icons/ci";
import { FaChartLine } from "react-icons/fa6";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function Profile() {
  const { t, i18n } = useTranslation("profile");
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    location: "",
    email: "",
    birthday: "",
  });

  const currentLang = i18n.language;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
          navigate("/login");
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id || user.sub;

        // 1. Fetch Profile (User Info + Favorites + Consecutive Login)
        const profileRes = await fetch(`${API_URL}/users/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileRes.json();
        setProfile(profileData);

        // 2. Fetch Statistics (Total Views, Total Searches)
        // Note: getProfile gives us favorites count and consecutive login, 
        // but we still need total_views and total_searches from statistics API.
        const statsRes = await fetch(`${API_URL}/users/statistics`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "x-lang": currentLang,
          },
        });

        if (!statsRes.ok) throw new Error("Failed to fetch statistics");
        const statsData = await statsRes.json();
        setStats(statsData);

        // 3. Fetch Recent History
        const historyRes = await fetch(`${API_URL}/view-history/${userId}/recent?limit=4`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!historyRes.ok) throw new Error("Failed to fetch history");
        const historyData = await historyRes.json();
        setHistory(historyData.items || []);

      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, currentLang]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLang === "jp" ? "ja-JP" : "vi-VN", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDishName = (dish) => {
    if (currentLang === "jp") {
      return dish.name_japanese || dish.name_vietnamese;
    }
    return dish.name_vietnamese || dish.name_japanese;
  };

  const getCategoryName = (category) => {
    if (!category) return "";
    if (currentLang === "jp") {
      return category.name_japanese || category.name_vietnamese;
    }
    return category.name_vietnamese || category.name_japanese;
  };

  const handleEditClick = () => {
    setEditForm({
      location: profile?.location || "",
      email: profile?.email || "",
      birthday: profile?.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : "",
    });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) return;

      const user = JSON.parse(userStr);
      const userId = user.id || user.sub;

      const res = await fetch(`${API_URL}/users/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: Number(userId),
          ...editForm,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(t("error"));
    }
  };

  if (loading) {
    return <div className="loading-container">{t("loading")}</div>;
  }

  if (error) {
    return <div className="error">{t("error")}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{t("profile")}</h1>
      </div>

      <div className="profile-card">
        <div className="profile-info">
          <div className="profile-avatar">
            {profile?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h2>{profile?.username}</h2>
            <p>{profile?.email}</p>
            <p>{ profile?.birthday ? formatDate(profile.birthday) : "-"}</p>
            <p>{ profile?.location ? profile.location : "-"}</p>
            <div className="profile-meta">
              <span className="icon"><CiCalendarDate /></span>
              <span>{t("joinedDate")}: {formatDate(profile?.registration_date)}</span>
            </div>
          </div>
        </div>
        <button className="btn-edit" onClick={handleEditClick}>
          <span><GoPencil /></span>
          {t("edit")}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#3b82f6" }}><CiSearch /></div>
          <div className="stat-label">{t("totalReviews")}</div>
          {/* total_searches comes from stats API */}
          <div className="stat-value">{stats?.total_searches || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#10b981" }}><FaRegEye /></div>
          <div className="stat-label">{t("viewedDishes")}</div>
          {/* total_views comes from stats API */}
          <div className="stat-value">{stats?.total_views || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#ef4444" }}><CiHeart /></div>
          <div className="stat-label">{t("favorites")}</div>
          {/* Use data from getProfile if available, fallback to stats */}
          <div className="stat-value">
            {profile?.favoritedDishes?.numberOfDishes ?? stats?.total_favorites ?? 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: "#8b5cf6" }}><FaChartLine /></div>
          <div className="stat-label">{t("consecutiveLogin")}</div>
          {/* Use data from getProfile if available, fallback to stats */}
          <div className="stat-value">
            {profile?.consecutive_login_days ?? stats?.consecutive_login_days ?? 0}{t("days")}
          </div>
        </div>
      </div>

      <div className="recent-history-section">
        <h3>{t("recentViewedDishes")}</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">{t("noRecentDishes")}</p>
        ) : (
          <div className="history-grid">
            {history.map((item) => (
              <div
                key={item.id}
                className="history-card"
                onClick={() => navigate(`/dishes/${item.dish.id}`)}
              >
                <img
                  src={item.dish.image_url || "https://placehold.co/100x100?text=No+Image"}
                  alt={getDishName(item.dish)}
                  className="history-image"
                />
                <div className="history-info">
                  <div className="history-name">{getDishName(item.dish)}</div>
                  <div className="history-name-sub">
                    {currentLang === "jp" ? item.dish.name_vietnamese : item.dish.name_japanese}
                  </div>
                  <div className="history-tag">
                    {getCategoryName(item.dish.category)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t("editProfile")}</h2>
            <div className="form-group">
              <label>{t("location")}</label>
              <input
                type="text"
                name="location"
                value={editForm.location}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>{t("email")}</label>
              <input
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>{t("birthday")}</label>
              <input
                type="date"
                name="birthday"
                value={editForm.birthday}
                onChange={handleInputChange}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                {t("cancel")}
              </button>
              <button className="btn-save" onClick={handleSave}>
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
