import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./RegisterDish.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function RegisterDish() {
  const { t, i18n } = useTranslation("dishForm");
  const [form, setForm] = useState({
    nameJp: "",
    nameVi: "",
    description: "",
    region: "",
    category: "",
    ingredients: "",
    spiciness: 0,
    image: null
  });
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch categories và regions từ API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const [categoriesRes, regionsRes] = await Promise.all([
          fetch(`${API_BASE}/categories`, { headers }),
          fetch(`${API_BASE}/regions`, { headers })
        ]);

        const categoriesData = await categoriesRes.json();
        const regionsData = await regionsRes.json();

        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setRegions(Array.isArray(regionsData) ? regionsData : []);
      } catch (err) {
        console.error("Error fetching options:", err);
        setCategories([]);
        setRegions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, image: null }));
      setPreview("");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setStatus({
        type: "error",
        message: t("upload_error_size", { defaultValue: "File quá lớn (tối đa 5MB)" })
      });
      return;
    }

    setForm((prev) => ({ ...prev, image: file }));
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const uploadImage = async (file) => {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("image", file);

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/upload/dish-image`, {
      method: "POST",
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    const data = await response.json();
    return data.image_url || data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      let imageUrl = "";

      // Upload image first if exists
      if (form.image) {
        imageUrl = await uploadImage(form.image);
      }

      // Prepare dish data
      const dishData = {
        name_japanese: form.nameJp,
        name_vietnamese: form.nameVi || form.nameJp,
        description_vietnamese: form.description,
        description_japanese: form.description,
        region_id: form.region ? Number(form.region) : null,
        category_id: form.category ? Number(form.category) : null,
        ingredients: form.ingredients || "",
        spiciness_level: Number(form.spiciness),
        image_url: imageUrl
      };

      // Submit dish
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        "x-lang": i18n.language || "vi"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/dishes`, {
        method: "POST",
        headers,
        body: JSON.stringify(dishData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || t("submit_error", { defaultValue: "Gửi món ăn thất bại" }));
      }

      setStatus({
        type: "success",
        message: t("submit_success", { defaultValue: "Đã gửi món ăn thành công!" })
      });

      // Reset form after success
      setTimeout(() => {
        handleReset();
      }, 2000);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || t("submit_error", { defaultValue: "Gửi món ăn thất bại" })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      nameJp: "",
      nameVi: "",
      description: "",
      region: "",
      category: "",
      ingredients: "",
      spiciness: 0,
      image: null
    });
    setPreview("");
    setStatus(null);
  };

  const getOptionLabel = (option) => {
    if (i18n.language === "jp") {
      return option.name_japanese || option.name_vietnamese || "";
    }
    return option.name_vietnamese || option.name_japanese || "";
  };

  return (
    <div className="register-page">
      <header className="register-hero">
        <p className="register-eyebrow">味の旅 · Flavor Journey</p>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </header>

      <form className="register-card" onSubmit={handleSubmit}>
        <section className="upload-block">
          <label>{t("upload_label")}</label>
          <div className="upload-dropzone">
            {preview ? (
              <img src={preview} alt="preview" className="preview-image" />
            ) : (
              <div className="upload-placeholder">
                <span aria-hidden>📷</span>
                <p>{t("upload_hint")}</p>
                <small>{t("upload_support")}</small>
              </div>
            )}
            <input
              id="dish-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
        </section>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="nameJp">{t("name_jp_label")} *</label>
            <input
              id="nameJp"
              name="nameJp"
              value={form.nameJp}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-field">
            <label htmlFor="nameVi">{t("name_vi_label")}</label>
            <input
              id="nameVi"
              name="nameVi"
              value={form.nameVi}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="description">{t("description_label")} *</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder={t("description_placeholder")}
            value={form.description}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-grid two-columns">
          <div className="form-field">
            <label htmlFor="region">{t("region_label")} *</label>
            {loadingOptions ? (
              <select disabled>
                <option>{t("loading", { defaultValue: "Đang tải..." })}</option>
              </select>
            ) : (
              <select
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{t("region_placeholder")}</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {getOptionLabel(region)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="category">{t("category_label")} *</label>
            {loadingOptions ? (
              <select disabled>
                <option>{t("loading", { defaultValue: "Đang tải..." })}</option>
              </select>
            ) : (
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{t("category_placeholder")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getOptionLabel(category)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="ingredients">{t("ingredients_label")}</label>
          <textarea
            id="ingredients"
            name="ingredients"
            rows={3}
            placeholder={t("ingredients_placeholder")}
            value={form.ingredients}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label htmlFor="spiciness">
            {t("spice_label")}: <strong>{form.spiciness}</strong>/5
          </label>
          <input
            type="range"
            id="spiciness"
            name="spiciness"
            min="0"
            max="5"
            step="1"
            value={form.spiciness}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        {status && (
          <div className={`status-banner ${status.type}`}>
            <p>{status.message}</p>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="ghost" onClick={handleReset} disabled={loading}>
            {t("reset")}
          </button>
          <button type="submit" disabled={loading}>
            {loading ? t("submitting", { defaultValue: "Đang gửi..." }) : t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

