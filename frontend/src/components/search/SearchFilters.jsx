import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFilterChange, onReset }) => {
  const { t } = useTranslation('search');

  const FALLBACK_CATEGORIES = [
    { id: 'street-food', name_vietnamese: 'Ăn vặt', name_japanese: '屋台グルメ' },
    { id: 'noodle', name_vietnamese: 'Mì/Phở', name_japanese: '麺料理' },
    { id: 'drink', name_vietnamese: 'Đồ uống', name_japanese: '飲み物' },
  ];

  const FALLBACK_REGIONS = [
    { id: 'north', name_vietnamese: 'Miền Bắc', name_japanese: '北部' },
    { id: 'central', name_vietnamese: 'Miền Trung', name_japanese: '中部' },
    { id: 'south', name_vietnamese: 'Miền Nam', name_japanese: '南部' },
  ];

  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [regions, setRegions] = useState(FALLBACK_REGIONS);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState(0);

  useEffect(() => {
    setLocalFilters(filters);
    // Khi filters thay đổi từ bên ngoài (ví dụ reset), cập nhật spiceLevel
    const hasSpicy = filters.taste.includes('spicy');
    if (!hasSpicy) {
      setSpiceLevel(0);
    }
    // Nếu có spicy, giữ nguyên spiceLevel hiện tại (không reset về 3)
  }, [filters]);

  // Fetch categories và regions từ API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const [categoriesRes, regionsRes] = await Promise.all([
          fetch(`${apiUrl}/categories`),
          fetch(`${apiUrl}/regions`),
        ]);

        const normalize = (payload) => {
          if (Array.isArray(payload)) return payload;
          if (payload?.data && Array.isArray(payload.data)) return payload.data;
          return null;
        };

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const parsed = normalize(categoriesData);
          if (parsed) setCategories(parsed);
        } else {
          setOptionsError(true);
        }

        if (regionsRes.ok) {
          const regionsData = await regionsRes.json();
          const parsed = normalize(regionsData);
          if (parsed) setRegions(parsed);
        } else {
          setOptionsError(true);
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
        setOptionsError(true);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handleSearchChange = (e) => {
    const search = e.target.value;
    setLocalFilters({ ...localFilters, search });
  };

  const handleSearchSubmit = () => {
    // Khi submit, cập nhật taste filter dựa trên spiceLevel
    // Backend hiện tại chỉ check >= 3, nên chỉ gửi 'spicy' khi level >= 3
    const withoutSpicy = localFilters.taste.filter((taste) => taste !== 'spicy');
    const updatedFilters = {
      ...localFilters,
      taste: spiceLevel >= 3 ? [...withoutSpicy, 'spicy'] : withoutSpicy,
      page: 1,
    };
    onFilterChange(updatedFilters);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleCategorySelect = (e) => {
    const categoryId = e.target.value;
    const updatedFilters = {
      ...localFilters,
      category: categoryId === 'all' ? [] : [categoryId],
      page: 1,
    };
    // Chỉ update local state, không gọi API ngay
    setLocalFilters(updatedFilters);
  };

  const handleRegionSelect = (e) => {
    const regionId = e.target.value;
    const updatedFilters = {
      ...localFilters,
      region: regionId === 'all' ? [] : [regionId],
      page: 1,
    };
    // Chỉ update local state, không gọi API ngay
    setLocalFilters(updatedFilters);
  };

  const handleSpiceChange = (e) => {
    const level = Number(e.target.value);
    setSpiceLevel(level);
    // Chỉ update local state, không gọi API ngay
    // Taste filter sẽ được apply khi bấm nút "Áp dụng bộ lọc"
  };

  const selectedRegion =
    localFilters.region[0] !== undefined
      ? String(localFilters.region[0])
      : 'all';
  const selectedCategory =
    localFilters.category[0] !== undefined
      ? String(localFilters.category[0])
      : 'all';

  return (
    <div className="search-filters">
      <div className="search-headline">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={localFilters.search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyPress}
          />
          <button type="button" onClick={handleSearchSubmit}>
            {t('search_cta')}
          </button>
        </div>
        <button type="button" className="filter-summary" onClick={handleSearchSubmit}>
          {t('Áp dụng bộ lọc')}
        </button>
      </div>

      <div className="filter-grid">
        <div className="filter-field">
          <label>{t('region_label')}</label>
          {loadingOptions ? (
            <p className="loading-text">{t('loading')}</p>
          ) : (
            <>
              <select value={selectedRegion} onChange={handleRegionSelect}>
                <option value="all">{t('all_regions')}</option>
                {Array.isArray(regions) &&
                  regions.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name_vietnamese || reg.name_japanese}
                    </option>
                  ))}
              </select>
              {optionsError && (
                <small className="options-warning">{t('options_fallback')}</small>
              )}
            </>
          )}
        </div>

        <div className="filter-field">
          <label>{t('category_label')}</label>
          {loadingOptions ? (
            <p className="loading-text">{t('loading')}</p>
          ) : (
            <>
              <select value={selectedCategory} onChange={handleCategorySelect}>
                <option value="all">{t('all_categories')}</option>
                {Array.isArray(categories) &&
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_vietnamese || cat.name_japanese}
                    </option>
                  ))}
              </select>
              {optionsError && (
                <small className="options-warning">{t('options_fallback')}</small>
              )}
            </>
          )}
        </div>

        <div className="filter-field spice-field">
          <label>
            {t('taste.spicy')}
            <span className="spice-value">
              {spiceLevel === 0
                ? t('spice_none')
                : t('spice_selected', { level: spiceLevel })}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={spiceLevel}
            onChange={handleSpiceChange}
          />
          <div className="spice-scale">
            {[0, 1, 2, 3, 4, 5].map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-actions">
        <button type="button" className="reset-btn" onClick={onReset}>
          {t('reset_filters')}
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
