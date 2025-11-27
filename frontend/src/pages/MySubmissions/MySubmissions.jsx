import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./MySubmissions.css";
import { MdRestaurantMenu } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function MySubmissions() {
  const { t, i18n } = useTranslation("mySubmissions");
  const navigate = useNavigate();
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submissionsStats, setSubmissionsStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentLang = i18n.language;

  useEffect(() => {
    const fetchSubmissions = async () => {
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

        const submissionsRes = await fetch(`${API_URL}/dishes/my-submissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!submissionsRes.ok) {
          throw new Error("Failed to fetch submissions");
        }

        const submissionsData = await submissionsRes.json();
        const submissionsList = Array.isArray(submissionsData)
          ? submissionsData
          : [];

        // Đảm bảo chỉ hiển thị món ăn của user hiện tại (double-check)
        const filteredSubmissions = submissionsList.filter(
          (dish) => dish.submitted_by === userId
        );

        // Tính toán thống kê
        const stats = {
          total: filteredSubmissions.length,
          approved: filteredSubmissions.filter((d) => d.status === "approved")
            .length,
          pending: filteredSubmissions.filter((d) => d.status === "pending")
            .length,
          rejected: filteredSubmissions.filter((d) => d.status === "rejected")
            .length,
        };

        setSubmissionsStats(stats);
        setMySubmissions(filteredSubmissions);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLang === "jp" ? "ja-JP" : "vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  const getRegionName = (region) => {
    if (!region) return "";
    if (currentLang === "jp") {
      return region.name_japanese || region.name_vietnamese;
    }
    return region.name_vietnamese || region.name_japanese;
  };

  const getStatusLabel = (status) => {
    if (currentLang === "jp") {
      const statusMap = {
        pending: "審査中",
        approved: "承認済み",
        rejected: "却下",
      };
      return statusMap[status] || status;
    }
    const statusMap = {
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      rejected: "Đã từ chối",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status || "pending"}`;
  };

  if (loading) {
    return (
      <div className="my-submissions-page">
        <div className="loading-container">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-submissions-page">
        <div className="error">{t("error")}</div>
      </div>
    );
  }

  return (
    <div className="my-submissions-page">
      <div className="submissions-page-header">
        <h1>{t("title")}</h1>
        <p className="subtitle">{t("subtitle")}</p>
      </div>

      <div className="submissions-overview-section">
        <h2>{t("overview")}</h2>
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="overview-stat-icon" style={{ color: "#3b82f6" }}>
              <MdRestaurantMenu size={24} />
            </div>
            <div className="overview-stat-content">
              <div className="overview-stat-label">{t("totalSubmissions")}</div>
              <div className="overview-stat-value">
                {submissionsStats.total}
              </div>
            </div>
          </div>

          <div className="overview-stat-card">
            <div className="overview-stat-icon" style={{ color: "#10b981" }}>
              <span className="status-indicator status-approved"></span>
            </div>
            <div className="overview-stat-content">
              <div className="overview-stat-label">{t("approved")}</div>
              <div className="overview-stat-value">
                {submissionsStats.approved}
              </div>
            </div>
          </div>

          <div className="overview-stat-card">
            <div className="overview-stat-icon" style={{ color: "#f59e0b" }}>
              <span className="status-indicator status-pending"></span>
            </div>
            <div className="overview-stat-content">
              <div className="overview-stat-label">{t("pending")}</div>
              <div className="overview-stat-value">
                {submissionsStats.pending}
              </div>
            </div>
          </div>

          <div className="overview-stat-card">
            <div className="overview-stat-icon" style={{ color: "#ef4444" }}>
              <span className="status-indicator status-rejected"></span>
            </div>
            <div className="overview-stat-content">
              <div className="overview-stat-label">{t("rejected")}</div>
              <div className="overview-stat-value">
                {submissionsStats.rejected}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="submissions-list-section">
        <h2>{t("submissionsList")}</h2>
        {mySubmissions.length === 0 ? (
          <div className="empty-state">
            <MdRestaurantMenu size={64} style={{ color: "#9ca3af" }} />
            <p className="empty-text">{t("noSubmissions")}</p>
          </div>
        ) : (
          <div className="submissions-grid">
            {mySubmissions.map((dish) => (
              <div
                key={dish.id}
                className="submission-card"
                onClick={() => navigate(`/dishes/${dish.id}`)}
              >
                <div className="submission-image-container">
                  {dish.image_url ? (
                    <img
                      src={dish.image_url}
                      alt={getDishName(dish)}
                      className="submission-image"
                    />
                  ) : (
                    <div className="submission-image-placeholder">
                      <MdRestaurantMenu size={32} />
                    </div>
                  )}
                </div>
                <div className="submission-info">
                  <div className="submission-header">
                    <div className="submission-name">{getDishName(dish)}</div>
                    <span className={getStatusClass(dish.status)}>
                      {getStatusLabel(dish.status)}
                    </span>
                  </div>
                  <div className="submission-name-sub">
                    {currentLang === "jp"
                      ? dish.name_vietnamese
                      : dish.name_japanese}
                  </div>
                  <div className="submission-meta">
                    {dish.category && (
                      <span className="submission-tag">
                        {getCategoryName(dish.category)}
                      </span>
                    )}
                    {dish.region && (
                      <span className="submission-tag">
                        {getRegionName(dish.region)}
                      </span>
                    )}
                  </div>
                  <div className="submission-date">
                    {t("submittedAt")}: {formatDate(dish.submitted_at)}
                  </div>
                  {dish.status === "rejected" && dish.rejection_reason && (
                    <div className="rejection-reason">
                      <strong>{t("rejectionReason")}:</strong>{" "}
                      {dish.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MySubmissions;
