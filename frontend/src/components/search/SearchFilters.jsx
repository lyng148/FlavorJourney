import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SearchFilters.css';

const SearchFilters = ({ filters, onFilterChange, onReset }) => {
  const { t } = useTranslation('search');
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch categories và regions từ API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch(
          `${import.meta.env.VITE_API_URL}/categories`
        );
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData || []);

        // Fetch regions
        const regionsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/regions`
        );
        const regionsData = await regionsRes.json();
        setRegions(regionsData || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
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
    onFilterChange(localFilters);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleSortChange = (e) => {
    const sort = e.target.value;
    onFilterChange({ ...localFilters, sort, page: 1 });
  };

  const handleCategoryChange = (categoryId) => {
    const updated = localFilters.category.includes(categoryId)
      ? localFilters.category.filter(id => id !== categoryId)
      : [...localFilters.category, categoryId];
    
    onFilterChange({ ...localFilters, category: updated, page: 1 });
  };

  const handleRegionChange = (regionId) => {
    const updated = localFilters.region.includes(regionId)
      ? localFilters.region.filter(id => id !== regionId)
      : [...localFilters.region, regionId];
    
    onFilterChange({ ...localFilters, region: updated, page: 1 });
  };

  const handleTasteChange = (tasteValue) => {
    const updated = localFilters.taste.includes(tasteValue)
      ? localFilters.taste.filter(t => t !== tasteValue)
      : [...localFilters.taste, tasteValue];
    
    onFilterChange({ ...localFilters, taste: updated, page: 1 });
  };

  const tasteOptions = [
    { value: 'spicy', label: t('taste.spicy'), emoji: '🌶️' },
    { value: 'salty', label: t('taste.salty'), emoji: '🧂' },
    { value: 'sweet', label: t('taste.sweet'), emoji: '🍯' },
    { value: 'sour', label: t('taste.sour'), emoji: '🍋' },
  ];

  return (
    <div className="search-filters">
      {/* Search */}
      <div className="filter-group">
        <label className="filter-label">{t('search_label')}</label>
        <div className="search-input-group">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={localFilters.search}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            className="search-input"
          />
          <button onClick={handleSearchSubmit} className="search-btn">
            🔍
          </button>
        </div>
      </div>

      {/* Sort */}
      <div className="filter-group">
        <label className="filter-label">{t('sort_label')}</label>
        <select
          value={localFilters.sort}
          onChange={handleSortChange}
          className="filter-select"
        >
          <option value="latest">{t('sort.latest')}</option>
          <option value="popular">{t('sort.popular')}</option>
        </select>
      </div>

      {/* Category */}
      <div className="filter-group">
        <label className="filter-label">{t('category_label')}</label>
        {loadingOptions ? (
          <p className="loading-text">{t('loading')}</p>
        ) : (
          <div className="checkbox-group">
            {categories.map(cat => (
              <label key={cat.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={localFilters.category.includes(cat.id)}
                  onChange={() => handleCategoryChange(cat.id)}
                />
                <span>{cat.name_vietnamese || cat.name_japanese}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Region */}
      <div className="filter-group">
        <label className="filter-label">{t('region_label')}</label>
        {loadingOptions ? (
          <p className="loading-text">{t('loading')}</p>
        ) : (
          <div className="checkbox-group">
            {regions.map(reg => (
              <label key={reg.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={localFilters.region.includes(reg.id)}
                  onChange={() => handleRegionChange(reg.id)}
                />
                <span>{reg.name_vietnamese || reg.name_japanese}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Taste */}
      <div className="filter-group">
        <label className="filter-label">{t('taste_label')}</label>
        <div className="taste-options">
          {tasteOptions.map(taste => (
            <label key={taste.value} className="taste-item">
              <input
                type="checkbox"
                checked={localFilters.taste.includes(taste.value)}
                onChange={() => handleTasteChange(taste.value)}
              />
              <span className="taste-emoji">{taste.emoji}</span>
              <span className="taste-text">{taste.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button onClick={onReset} className="reset-btn">
        {t('reset_filters')}
      </button>
    </div>
  );
};

export default SearchFilters;
