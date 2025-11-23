import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SearchFilters from '../components/search/SearchFilters';
import DishList from '../components/search/DishList';
import Pagination from '../components/search/Pagination';
import '../components/search/Search.css';

const INITIAL_FILTERS = {
  search: '',
  category: [],
  region: [],
  taste: [],
  sort: 'latest',
  page: 1,
  limit: 20,
};

const Search = () => {
  const { t } = useTranslation('search');
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // State cho filters
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Fetch dishes từ API
  const fetchDishes = async (filterParams) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      if (filterParams.search) queryParams.append('search', filterParams.search);
      if (filterParams.sort) queryParams.append('sort', filterParams.sort);
      queryParams.append('page', String(filterParams.page || 1));
      queryParams.append('limit', String(filterParams.limit || 20));

      // Thêm category - chỉ gửi nếu là array và có giá trị hợp lệ
      if (Array.isArray(filterParams.category)) {
        filterParams.category
          .filter(cat => cat && cat !== 'all' && typeof cat === 'string')
          .forEach(cat => {
            queryParams.append('category', cat);
          });
      }

      // Thêm region - chỉ gửi nếu là array và có giá trị hợp lệ
      if (Array.isArray(filterParams.region)) {
        filterParams.region
          .filter(reg => reg && reg !== 'all' && typeof reg === 'string')
          .forEach(reg => {
            queryParams.append('region', reg);
          });
      }

      // Thêm taste - chỉ gửi nếu là array và có giá trị hợp lệ
      if (Array.isArray(filterParams.taste)) {
        filterParams.taste
          .filter(t => t && typeof t === 'string')
          .forEach(t => {
            queryParams.append('taste', t);
          });
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `${apiUrl}/dishes?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setDishes(data.data || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || 1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching dishes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi filters thay đổi
  useEffect(() => {
    if (!hasSearched) return;
    fetchDishes(filters);
  }, [filters, hasSearched]);

  const handleFilterChange = (newFilters) => {
    setHasSearched(true);
    setFilters({
      ...newFilters,
      page: 1, // Reset về trang 1 khi thay đổi filter
    });
  };

  const handleSortChange = (sort) => {
    setHasSearched(true);
    setFilters((prev) => ({
      ...prev,
      sort,
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    if (!hasSearched) return;
    setFilters({
      ...filters,
      page,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setHasSearched(false);
    setFilters(INITIAL_FILTERS);
    setDishes([]);
    setError(null);
    setTotalPages(1);
    setCurrentPage(1);
  };

  return (
    <div className="search-page">
      <section className="search-hero">
        <div>
          <p className="hero-eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
        <div className="hero-actions">
          <p className="hero-tip">{t('hero_tip')}</p>
        </div>
      </section>

      <section className="search-controls">
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />
      </section>

      <section className="search-results">
        <div className="results-toolbar">
          <div>
            <p className="results-count">
              {hasSearched
                ? t('results_found', { count: dishes.length })
                : t('start_search_prompt')}
            </p>
            {hasSearched && (
              <p className="results-sub">
                {t('page_info', {
                  current: currentPage,
                  total: totalPages,
                })}
              </p>
            )}
          </div>
          <div className="sort-control">
            <label htmlFor="sort-select">{t('sort_label')}</label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="latest">{t('sort.latest')}</option>
              <option value="popular">{t('sort.popular')}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>
              {t('error')}: {error}
            </p>
          </div>
        )}

        {!hasSearched ? (
          <div className="no-results-card">
            <p>
              {t('start_search_prompt')}
            </p>
          </div>
        ) : loading ? (
          <div className="loading-card">
            <p>{t('loading')}</p>
          </div>
        ) : dishes.length === 0 ? (
          <div className="no-results-card">
            <p>{t('no_results')}</p>
          </div>
        ) : (
          <>
            <DishList dishes={dishes} />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Search;
