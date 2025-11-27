import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AIIntroGenerator from "./ai-generator/AIIntroGenerator";
import "./DishDetail.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function DishDetail() {
  const { t, i18n } = useTranslation("admin");
  const { t: tf } = useTranslation("favorites");
  const { dishId } = useParams();
  const navigate = useNavigate();
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const viewHistorySaved = useRef(false);

  const currentLang = i18n.language;

  // Check if user is admin
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

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

        // Save view history once after fetching dish successfully
        if (!viewHistorySaved.current && data?.id) {
          viewHistorySaved.current = true;
          try {
            await fetch(`${API_URL}/view-history`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ dish_id: Number(data.id) }),
            });
          } catch (err) {
            console.error("Failed to save view history", err);
          }
        }

        // Check favorite state
        try {
          const lang = localStorage.getItem("lang") || i18n.language || "vi";
          const resFav = await fetch(`${API_URL}/favorites/check/${dishId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-lang": lang,
            },
          });
          if (resFav.ok) {
            const j = await resFav.json();
            setIsFavorite(!!j.isFavorite);
          }
        } catch {
          // ignore
        }
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

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }
    const lang = localStorage.getItem("lang") || i18n.language || "vi";
    setFavLoading(true);
    try {
      let res;
      if (isFavorite) {
        res = await fetch(`${API_URL}/favorites/${dishId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-lang": lang,
          },
        });
      } else {
        res = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-lang": lang,
          },
          body: JSON.stringify({ dishId: Number(dishId) }),
        });
      }
      if (res && res.ok) {
        setIsFavorite((v) => !v);
      }
    } catch {
      // ignore
    } finally {
      setFavLoading(false);
    }
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

  const getSpiceLevelText = (level) => {
    if (!level || level === 0)
      return currentLang === "jp" ? "辛くない" : "Không cay";
    if (level <= 1) return currentLang === "jp" ? "少し辛い" : "Hơi cay";
    if (level <= 2) return currentLang === "jp" ? "少し辛い" : "Hơi cay";
    if (level <= 3) return currentLang === "jp" ? "中辛" : "Vừa cay";
    return currentLang === "jp" ? "とても辛い" : "Rất cay";
  };

  const getSpiceStars = (level) => {
    const filled = level || 0;
    const empty = 5 - filled;
    return "★".repeat(filled) + "☆".repeat(empty);
  };

  const parseIngredients = (ingredients) => {
    if (!ingredients) return [];
    return ingredients
      .split(/[,;\n]/)
      .map((ing) => ing.trim())
      .filter((ing) => ing.length > 0);
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

  const favLabel = isFavorite
    ? tf("removeFromFavorites")
    : tf("addToFavorites");

  const ingredientsList = parseIngredients(dish.ingredients);

  return (
    <div className="dish-detail-page">
      {/* Back Button Header */}
      <div className="dish-detail-header">
        <button
          className="btn-back-to-search"
          onClick={() => navigate("/search")}
        >
          <span className="back-arrow">←</span>
          <span>
            {currentLang === "jp" ? "検索に戻る" : "Quay lại tìm kiếm"}
          </span>
        </button>
        {isAdmin && (
          <div className="admin-status-badge">
            <span className={`status-badge ${dish.status || "pending"}`}>
              {t(`dishApproval.${dish.status || "pending"}`)}
            </span>
          </div>
        )}
      </div>

      <div
        className={`dish-detail-layout ${
          dish.status !== "pending" ? "single-column" : ""
        }`}
      >
      <div className="dish-detail-layout">
        {/* LEFT COLUMN - Dish Info */}
        <div className="dish-detail-main">
          <div className="dish-info-wrapper">
            {/* Dish Image Card */}
            <div className="dish-section-card">
              <div className="dish-image-large">
                {dish.image_url ? (
                  <img
                    src={dish.image_url}
                    alt={getDishName(dish)}
                    className="dish-main-image"
                  />
                ) : (
                  <div className="no-image-large">
                    <span>{t("dishApproval.image")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="dish-section-card">
              <div className="dish-title-section">
                <h1 className="dish-name-primary">{getDishName(dish)}</h1>
                {(currentLang === "jp"
                  ? dish.name_vietnamese
                  : dish.name_japanese) && (
                  <h2 className="dish-name-secondary">
                    {currentLang === "jp"
                      ? dish.name_vietnamese
                      : dish.name_japanese}
                  </h2>
                )}
              </div>

              {getDescription(dish) && (
                <div
                  className="dish-description-content"
                  style={{ marginTop: 8 }}
                >
                  <p>{getDescription(dish)}</p>
                </div>
              )}
            </div>

            {/* Region + Category Card */}
            {(dish.region || dish.category) && (
              <div className="dish-section-card">
                <div className="dish-chips-grid">
                  {dish.region && (
                    <div className="dish-meta-card">
                      <span className="meta-label">
                        {currentLang === "jp" ? "地域" : "Khu vực"}
                      </span>
                      <span className="chip chip-orange">
                        {getRegionName(dish.region)}
                      </span>
                    </div>
                  )}

                  {dish.category && (
                    <div className="dish-meta-card">
                      <span className="meta-label">
                        {currentLang === "jp" ? "カテゴリー" : "Danh mục"}
                      </span>
                      <span className="chip chip-blue">
                        {getCategoryName(dish.category)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spice Level Card */}
            {dish.spiciness_level !== null &&
              dish.spiciness_level !== undefined && (
                <div className="dish-section-card">
                  <div className="spice-level-section">
                    <span className="spice-label">
                      {currentLang === "jp" ? "辛さレベル" : "Mức độ cay"}
                    </span>
                    <span className="spice-badge">
                      {getSpiceLevelText(dish.spiciness_level)}{" "}
                      {getSpiceStars(dish.spiciness_level)}
                    </span>
                  </div>
                </div>
              )}

            {/* Ingredients Card */}
            {ingredientsList.length > 0 && (
              <div className="dish-section-card">
                <div className="ingredients-section">
                  <span className="ingredients-label">
                    {currentLang === "jp" ? "主な材料" : "Nguyên liệu chính"}
                  </span>
                  <div className="ingredients-tags">
                    {ingredientsList.map((ingredient, index) => (
                      <span key={index} className="ingredient-tag">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Favorite Button Card */}
            {!isAdmin && (
              <div className="dish-section-card">
                <button
                  className={`btn-favorite ${isFavorite ? "active" : ""}`}
                  disabled={favLoading}
                  onClick={handleToggleFavorite}
                >
                  <span className="favorite-icon">
                    {isFavorite ? "❤" : "♡"}
                  </span>
                  <span>{favLabel}</span>
                </button>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && dish.status === "pending" && (
              <div className="dish-section-card">
                <div className="approval-actions">
                  <button
                    className="btn btn-reject"
                    onClick={handleRejectClick}
                  >
                    {t("dishApproval.reject")}
                  </button>
                  <button className="btn btn-approve" onClick={handleApprove}>
                    {t("dishApproval.approve")}
                  </button>
                </div>
              </div>
            )}

            {/* Rejection Reason (Admin only) */}
            {isAdmin && dish.status === "rejected" && dish.rejection_reason && (
              <div className="dish-section-card">
                <div className="rejection-section">
                  <div className="info-group">
                    <span className="info-label">
                      {t("dishApproval.rejectionReason")}
                    </span>
                    <span className="info-value">{dish.rejection_reason}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - AI Generator - Only show for pending dishes */}
        {dish.status === "pending" && (
          <div className="ai-panel-wrapper">
            <AIIntroGenerator dish={dish} />
          </div>
        )}
        {/* RIGHT COLUMN - AI Generator */}
        <div className="ai-panel-wrapper">
          <AIIntroGenerator dish={dish} />
        </div>
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
