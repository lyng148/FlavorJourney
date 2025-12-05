import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFilterChange, onReset }) => {
  const { t } = useTranslation('search');

const FALLBACK_CATEGORIES = [];
const FALLBACK_REGIONS = [];

  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [regions, setRegions] = useState(FALLBACK_REGIONS);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [saltinessLevel, setSaltinessLevel] = useState(0);
  const [sweetnessLevel, setSweetnessLevel] = useState(0);
  const [sournessLevel, setSournessLevel] = useState(0);

  useEffect(() => {
    const normalizeList = (value) => {
      if (!Array.isArray(value)) return [];
      return value
        .map((item) => {
          if (!item || item === 'all') return null;
          const num = Number(item);
          return Number.isFinite(num) ? String(num) : null;
        })
        .filter(Boolean);
    };

    const convertedFilters = {
      ...filters,
      region: normalizeList(filters.region),
      category: normalizeList(filters.category),
      taste: Array.isArray(filters.taste) ? filters.taste : [],
    };

    setLocalFilters(convertedFilters);
    const nextSpiceLevel = Number(filters.spiciness_level);
    setSpiceLevel(Number.isFinite(nextSpiceLevel) ? nextSpiceLevel : 0);
    const nextSaltinessLevel = Number(filters.saltiness_level);
    setSaltinessLevel(Number.isFinite(nextSaltinessLevel) ? nextSaltinessLevel : 0);
    const nextSweetnessLevel = Number(filters.sweetness_level);
    setSweetnessLevel(Number.isFinite(nextSweetnessLevel) ? nextSweetnessLevel : 0);
    const nextSournessLevel = Number(filters.sourness_level);
    setSournessLevel(Number.isFinite(nextSournessLevel) ? nextSournessLevel : 0);
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
    const sanitizeIds = (list) =>
      Array.isArray(list)
        ? list
            .map((value) => {
              if (!value || value === 'all') return null;
              const num = Number(value);
              return Number.isFinite(num) ? String(num) : null;
            })
            .filter(Boolean)
        : [];

    const updatedFilters = {
      ...localFilters,
      region: sanitizeIds(localFilters.region),
      category: sanitizeIds(localFilters.category),
      spiciness_level: spiceLevel > 0 ? spiceLevel : undefined,
      saltiness_level: saltinessLevel > 0 ? saltinessLevel : undefined,
      sweetness_level: sweetnessLevel > 0 ? sweetnessLevel : undefined,
      sourness_level: sournessLevel > 0 ? sournessLevel : undefined,
      page: 1,
      limit: localFilters.limit || 20,
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
    setLocalFilters(updatedFilters);
  };

  const handleRegionSelect = (e) => {
    const regionId = e.target.value;
    const updatedFilters = {
      ...localFilters,
      region: regionId === 'all' ? [] : [regionId],
      page: 1,
    };
    setLocalFilters(updatedFilters);
  };

  const handleSpiceChange = (e) => {
    const level = Number(e.target.value);
    setSpiceLevel(level);
  };

  const handleSaltinessChange = (e) => {
    const level = Number(e.target.value);
    setSaltinessLevel(level);
  };

  const handleSweetnessChange = (e) => {
    const level = Number(e.target.value);
    setSweetnessLevel(level);
  };

  const handleSournessChange = (e) => {
    const level = Number(e.target.value);
    setSournessLevel(level);
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
          {t('filter_summary')}
        </button>
      </div>

      <div className="meta-taste-filter-container">
        {/* Left: Region and Category - Centered vertically */}
        <div className="meta-filters-left">
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
        </div>

        {/* Right: Taste Levels - 2x2 Grid */}
        <div className="taste-filters-grid">
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

          <div className="filter-field spice-field">
            <label>
              {t('taste.salty')}
              <span className="spice-value">
                {saltinessLevel === 0
                  ? t('saltiness_none')
                  : t('saltiness_selected', { level: saltinessLevel })}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={saltinessLevel}
              onChange={handleSaltinessChange}
            />
            <div className="spice-scale">
              {[0, 1, 2, 3, 4, 5].map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </div>

          <div className="filter-field spice-field">
            <label>
              {t('taste.sweet')}
              <span className="spice-value">
                {sweetnessLevel === 0
                  ? t('sweetness_none')
                  : t('sweetness_selected', { level: sweetnessLevel })}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={sweetnessLevel}
              onChange={handleSweetnessChange}
            />
            <div className="spice-scale">
              {[0, 1, 2, 3, 4, 5].map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </div>

          <div className="filter-field spice-field">
            <label>
              {t('taste.sour')}
              <span className="spice-value">
                {sournessLevel === 0
                  ? t('sourness_none')
                  : t('sourness_selected', { level: sournessLevel })}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={sournessLevel}
              onChange={handleSournessChange}
            />
            <div className="spice-scale">
              {[0, 1, 2, 3, 4, 5].map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
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
