import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./DishDetail.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function DishDetail() {
  const { t, i18n } = useTranslation("admin");
  const { dishId } = useParams();
  const navigate = useNavigate();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const currentLang = i18n.language;

  useEffect(() => {
    const fetchDishDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_URL}/dishes/${dishId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate("/login");
            return;
          }
          throw new Error("Failed to fetch dish details");
        }

        const data = await response.json();
        setDish(data);
      } catch (err) {
        console.error("Error fetching dish details:", err);
        setError(t("dishApproval.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchDishDetail();
  }, [dishId, navigate, t]);

  const handleApprove = async () => {
    if (!window.confirm(t("dishApproval.confirmApprove"))) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/dishes/${dishId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve dish");
      }

      alert(t("dishApproval.approveSuccess"));
      navigate("/");
    } catch (err) {
      console.error("Error approving dish:", err);
      alert(t("dishApproval.approveFailed"));
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert(t("dishApproval.enterRejectionReason"));
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/dishes/${dishId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject dish");
      }

      alert(t("dishApproval.rejectSuccess"));
      navigate("/");
    } catch (err) {
      console.error("Error rejecting dish:", err);
      alert(t("dishApproval.rejectFailed"));
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectionReason("");
  };

  const getDishName = (dish) => {
    if (currentLang === "jp") {
      return dish.name_japanese || dish.name_vietnamese;
    }
    return dish.name_vietnamese || dish.name_japanese;
  };

  const getDescription = (dish) => {
    if (currentLang === "jp") {
      return dish.description_japanese || dish.description_vietnamese;
    }
    return dish.description_vietnamese || dish.description_japanese;
  };

  const getCategoryName = (category) => {
    if (!category) return "-";
    if (currentLang === "jp") {
      return category.name_japanese || category.name_vietnamese;
    }
    return category.name_vietnamese || category.name_japanese;
  };

  const getRegionName = (region) => {
    if (!region) return "-";
    if (currentLang === "jp") {
      return region.name_japanese || region.name_vietnamese;
    }
    return region.name_vietnamese || region.name_japanese;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString(currentLang === "jp" ? "ja-JP" : "vi-VN");
  };

  const getTasteLevelWidth = (level) => {
    if (!level) return "0%";
    return `${(level / 5) * 100}%`;
  };

  if (loading) {
    return (
      <div className="dish-detail-page">
        <div className="loading">{t("dishApproval.loading")}</div>
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="dish-detail-page">
        <div className="error">{error || t("dishApproval.error")}</div>
        <button className="btn-back" onClick={() => navigate("/")}>
          {t("dishApproval.back")}
        </button>
      </div>
    );
  }

  return (
    <div className="dish-detail-page">
      <div className="dish-detail-header">
        <h1>{t("dishApproval.dishDetails")}</h1>
        <button className="btn-back" onClick={() => navigate("/")}>
          {t("dishApproval.back")}
        </button>
      </div>

      <div className="dish-detail-container">
        <div className="dish-status-section">
          <span className="info-label">{t("dishApproval.status")}:</span>
          <span className={`status-badge ${dish.status || "pending"}`}>
            {t(`dishApproval.${dish.status || "pending"}`)}
          </span>
        </div>

        <div className="dish-content">
          <div className="dish-image-section">
            {dish.image_url ? (
              <img
                src={dish.image_url}
                alt={getDishName(dish)}
                className="dish-detail-image"
              />
            ) : (
              <div className="no-image">{t("dishApproval.image")}</div>
            )}
          </div>

          <div className="dish-info-section">
            <div className="info-group">
              <span className="info-label">
                {t("dishApproval.nameJapanese")}
              </span>
              <span className="info-value">{dish.name_japanese || "-"}</span>
            </div>

            <div className="info-group">
              <span className="info-label">
                {t("dishApproval.nameVietnamese")}
              </span>
              <span className="info-value">{dish.name_vietnamese || "-"}</span>
            </div>

            <div className="info-group">
              <span className="info-label">{t("dishApproval.nameRomaji")}</span>
              <span className="info-value">{dish.name_romaji || "-"}</span>
            </div>

            <div className="info-group">
              <span className="info-label">{t("dishApproval.category")}</span>
              <span className="info-value">
                {getCategoryName(dish.category)}
              </span>
            </div>

            <div className="info-group">
              <span className="info-label">{t("dishApproval.region")}</span>
              <span className="info-value">{getRegionName(dish.region)}</span>
            </div>

            <div className="info-group">
              <span className="info-label">
                {t("dishApproval.submittedBy")}
              </span>
              <span className="info-value">
                {dish.submitted_id?.username || "-"}
              </span>
            </div>

            <div className="info-group">
              <span className="info-label">
                {t("dishApproval.submittedAt")}
              </span>
              <span className="info-value">
                {formatDate(dish.submitted_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="dish-info-section" style={{ marginTop: "2rem" }}>
          <div className="info-group">
            <span className="info-label">
              {currentLang === "jp"
                ? t("dishApproval.descriptionJapanese")
                : t("dishApproval.descriptionVietnamese")}
            </span>
            <span className="info-value">
              {getDescription(dish) || <span className="empty">-</span>}
            </span>
          </div>

          <div className="info-group">
            <span className="info-label">{t("dishApproval.ingredients")}</span>
            <span className="info-value">
              {dish.ingredients || <span className="empty">-</span>}
            </span>
          </div>

          <div className="info-group">
            <span className="info-label">{t("dishApproval.howToEat")}</span>
            <span className="info-value">
              {dish.how_to_eat || <span className="empty">-</span>}
            </span>
          </div>

          <div className="info-group">
            <span className="info-label">
              {currentLang === "jp" ? "味レベル" : "Mức độ hương vị"}
            </span>
            <div className="taste-levels">
              <div className="taste-item">
                <span>{t("dishApproval.spiciness")}</span>
                <div className="taste-level-bar">
                  <div
                    className="taste-level-fill"
                    style={{ width: getTasteLevelWidth(dish.spiciness_level) }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {dish.spiciness_level || 0}/5
                </span>
              </div>

              <div className="taste-item">
                <span>{t("dishApproval.saltiness")}</span>
                <div className="taste-level-bar">
                  <div
                    className="taste-level-fill"
                    style={{ width: getTasteLevelWidth(dish.saltiness_level) }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {dish.saltiness_level || 0}/5
                </span>
              </div>

              <div className="taste-item">
                <span>{t("dishApproval.sweetness")}</span>
                <div className="taste-level-bar">
                  <div
                    className="taste-level-fill"
                    style={{ width: getTasteLevelWidth(dish.sweetness_level) }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {dish.sweetness_level || 0}/5
                </span>
              </div>

              <div className="taste-item">
                <span>{t("dishApproval.sourness")}</span>
                <div className="taste-level-bar">
                  <div
                    className="taste-level-fill"
                    style={{ width: getTasteLevelWidth(dish.sourness_level) }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {dish.sourness_level || 0}/5
                </span>
              </div>
            </div>
          </div>

          {dish.status === "rejected" && dish.rejection_reason && (
            <div className="rejection-section">
              <div className="info-group">
                <span className="info-label">
                  {t("dishApproval.rejectionReason")}
                </span>
                <span className="info-value">{dish.rejection_reason}</span>
              </div>
            </div>
          )}

          {dish.reviewed_by && (
            <>
              <div className="info-group">
                <span className="info-label">
                  {t("dishApproval.reviewedAt")}
                </span>
                <span className="info-value">
                  {formatDate(dish.reviewed_at)}
                </span>
              </div>
            </>
          )}
        </div>

        {dish.status === "pending" && (
          <div className="approval-actions">
            <button className="btn btn-reject" onClick={handleRejectClick}>
              {t("dishApproval.reject")}
            </button>
            <button className="btn btn-approve" onClick={handleApprove}>
              {t("dishApproval.approve")}
            </button>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={handleRejectCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("dishApproval.rejectionReason")}</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("dishApproval.enterRejectionReason")}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleRejectCancel}>
                {t("dishApproval.cancel")}
              </button>
              <button className="btn btn-reject" onClick={handleRejectConfirm}>
                {t("dishApproval.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DishDetail;
