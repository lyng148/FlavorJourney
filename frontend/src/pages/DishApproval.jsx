import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

      const url = `${API_URL}/dishes/admin/dish-submissions?status=${currentStatus}&page=${page}&limit=${limit}`;
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

  const handleApprove = async (dishId) => {
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
      fetchDishes();
    } catch (err) {
      console.error("Error approving dish:", err);
      alert(t("dishApproval.approveFailed"));
    }
  };

  const handleReject = async (dishId) => {
    const reason = prompt(t("dishApproval.enterRejectionReason"));
    if (!reason) return;

    if (!window.confirm(t("dishApproval.confirmReject"))) {
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
          rejection_reason: reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject dish");
      }

      alert(t("dishApproval.rejectSuccess"));
      fetchDishes();
    } catch (err) {
      console.error("Error rejecting dish:", err);
      alert(t("dishApproval.rejectFailed"));
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
            className={`status-tab ${
              currentStatus === "pending" ? "active" : ""
            }`}
            onClick={() => handleStatusChange("pending")}
          >
            {t("dishApproval.pendingList")}
          </button>
          <button
            className={`status-tab ${
              currentStatus === "approved" ? "active" : ""
            }`}
            onClick={() => handleStatusChange("approved")}
          >
            {t("dishApproval.approvedList")}
          </button>
          <button
            className={`status-tab ${
              currentStatus === "rejected" ? "active" : ""
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
                              onClick={() => handleApprove(dish.id)}
                            >
                              {t("dishApproval.approve")}
                            </button>
                            <button
                              className="btn btn-reject"
                              onClick={() => handleReject(dish.id)}
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
    </div>
  );
}

export default DishApproval;
