import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./DishApproval.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function DishApproval() {
  const { t, i18n } = useTranslation("admin");
  const navigate = useNavigate();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const limit = 10;

  const currentLang = i18n.language;

  const fetchDishes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      // Build URL - omit status parameter when fetching all dishes
      const statusParam = currentStatus === "all" ? "" : `status=${currentStatus}&`;
      const url = `${API_URL}/dishes/admin/dish-submissions?${statusParam}page=${page}&limit=${limit}`;
      const response = await fetch(url, {
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
        throw new Error("Failed to fetch dishes");
      }

      const data = await response.json();
      setDishes(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching dishes:", err);
      setError(t("dishApproval.error"));
    } finally {
      setLoading(false);
    }
  }, [currentStatus, page, limit, navigate, t]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleStatusChange = (status) => {
    setCurrentStatus(status);
    setPage(1);
  };

  const handleViewDetails = (dishId) => {
    navigate(`/admin/dishes/${dishId}`);
  };

  const handleApproveClick = (dishId) => {
    setSelectedDishId(dishId);
    setShowApproveModal(true);
  };

  const handleApproveCancel = () => {
    setShowApproveModal(false);
    setSelectedDishId(null);
  };

  const handleApproveConfirm = async () => {
    if (!selectedDishId) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/dishes/${selectedDishId}`, {
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

      toast.success(t("dishApproval.approveSuccess"));
      setShowApproveModal(false);
      setSelectedDishId(null);
      fetchDishes();
    } catch (err) {
      console.error("Error approving dish:", err);
      toast.error(t("dishApproval.approveFailed"));
    }
  };

  const handleRejectClick = (dishId) => {
    setSelectedDishId(dishId);
    setShowRejectModal(true);
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setSelectedDishId(null);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t("dishApproval.enterRejectionReason"));
      return;
    }

    if (!selectedDishId) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/dishes/${selectedDishId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject dish");
      }

      toast.success(t("dishApproval.rejectSuccess"));
      setShowRejectModal(false);
      setSelectedDishId(null);
      setRejectionReason("");
      fetchDishes();
    } catch (err) {
      console.error("Error rejecting dish:", err);
      toast.error(t("dishApproval.rejectFailed"));
    }
  };

  const getDishName = (dish) => {
    if (currentLang === "jp") {
      return dish.name_japanese || dish.name_vietnamese;
    }
    return dish.name_vietnamese || dish.name_japanese;
  };

  const getDishNameSecondary = (dish) => {
    if (currentLang === "jp") {
      return dish.name_vietnamese;
    }
    return dish.name_japanese;
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
    return date.toLocaleDateString(currentLang === "jp" ? "ja-JP" : "vi-VN");
  };

  return (
    <div className="dish-approval-page">
      <div className="dish-approval-header">
        <h1>{t("dishApproval.title")}</h1>

        <div className="status-tabs">
          <button
            className={`status-tab ${currentStatus === "all" ? "active" : ""
              }`}
            onClick={() => handleStatusChange("all")}
          >
            {t("dishApproval.allDishes")}
          </button>
          <button
            className={`status-tab ${currentStatus === "pending" ? "active" : ""
              }`}
            onClick={() => handleStatusChange("pending")}
          >
            {t("dishApproval.pendingList")}
          </button>
          <button
            className={`status-tab ${currentStatus === "approved" ? "active" : ""
              }`}
            onClick={() => handleStatusChange("approved")}
          >
            {t("dishApproval.approvedList")}
          </button>
          <button
            className={`status-tab ${currentStatus === "rejected" ? "active" : ""
              }`}
            onClick={() => handleStatusChange("rejected")}
          >
            {t("dishApproval.rejectedList")}
          </button>
        </div>
      </div>

      {loading && <div className="loading">{t("dishApproval.loading")}</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && dishes.length === 0 && (
        <div className="no-dishes">{t("dishApproval.noDishes")}</div>
      )}

      {!loading && !error && dishes.length > 0 && (
        <>
          <div className="dishes-table-container">
            <table className="dishes-table">
              <thead>
                <tr>
                  <th>{t("dishApproval.image")}</th>
                  <th>{t("dishApproval.dishName")}</th>
                  <th>{t("dishApproval.category")}</th>
                  <th>{t("dishApproval.region")}</th>
                  <th>{t("dishApproval.submittedBy")}</th>
                  <th>{t("dishApproval.submittedAt")}</th>
                  <th>{t("dishApproval.status")}</th>
                  <th>{t("dishApproval.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((dish) => (
                  <tr key={dish.id}>
                    <td>
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={getDishName(dish)}
                          className="dish-image"
                        />
                      ) : (
                        <div
                          className="dish-image"
                          style={{ backgroundColor: "#e5e7eb" }}
                        ></div>
                      )}
                    </td>
                    <td>
                      <div className="dish-name">{getDishName(dish)}</div>
                      <div className="dish-name-secondary">
                        {getDishNameSecondary(dish)}
                      </div>
                    </td>
                    <td>{getCategoryName(dish.category)}</td>
                    <td>{getRegionName(dish.region)}</td>
                    <td>{dish.submitted_id?.username || "-"}</td>
                    <td>{formatDate(dish.submitted_at)}</td>
                    <td>
                      <span
                        className={`status-badge ${dish.status || "pending"}`}
                      >
                        {t(`dishApproval.${dish.status || "pending"}`)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-view"
                          onClick={() => handleViewDetails(dish.id)}
                        >
                          {t("dishApproval.view")}
                        </button>
                        {currentStatus === "pending" && (
                          <>
                            <button
                              className="btn btn-approve"
                              onClick={() => handleApproveClick(dish.id)}
                            >
                              {t("dishApproval.approve")}
                            </button>
                            <button
                              className="btn btn-reject"
                              onClick={() => handleRejectClick(dish.id)}
                            >
                              {t("dishApproval.reject")}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ←
              </button>
              <span>
                {t("dishApproval.page")} {page} {t("dishApproval.of")}{" "}
                {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {showApproveModal && (
        <div className="modal-overlay" onClick={handleApproveCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("dishApproval.confirmApprove")}</h3>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleApproveCancel}>
                {t("dishApproval.cancel")}
              </button>
              <button className="btn btn-approve" onClick={handleApproveConfirm}>
                {t("dishApproval.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default DishApproval;
