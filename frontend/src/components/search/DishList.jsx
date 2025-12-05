import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './DishList.css';

const DishList = ({ dishes }) => {
  const { t } = useTranslation('search');
  const navigate = useNavigate();

  return (
    <div className="dish-list">
      {dishes.map(dish => (
        <div
          key={dish.id}
          className="dish-card"
        >
          {/* Dish Image */}
          <div className="dish-image-container">
            {dish.image_url ? (
              <img
                src={dish.image_url}
                alt={dish.name_vietnamese}
                className="dish-image"
              />
            ) : (
              <div className="dish-image-placeholder">
                <span>🍽️</span>
              </div>
            )}
            
            {/* View count badge */}
            <div className="view-count-badge">
              👁️ {dish.view_count || 0}
            </div>
          </div>

          {/* Dish Info */}
          <div className="dish-info">
            <h3 className="dish-name">
              {dish.name_vietnamese}
              {dish.name_japanese && (
                <span className="dish-name-jp">({dish.name_japanese})</span>
              )}
            </h3>

            {dish.description_vietnamese && (
              <p className="dish-description">
                {dish.description_vietnamese.substring(0, 100)}
                {dish.description_vietnamese.length > 100 ? '...' : ''}
              </p>
            )}

            {/* Category and Region */}
            <div className="dish-meta">
              {dish.category && (
                <span className="meta-tag category-tag">
                  📂 {dish.category.name_vietnamese}
                </span>
              )}
              {dish.region && (
                <span className="meta-tag region-tag">
                  📍 {dish.region.name_vietnamese}
                </span>
              )}
            </div>

            {/* Taste Levels */}
            {(dish.spiciness_level || dish.saltiness_level || 
              dish.sweetness_level || dish.sourness_level) && (
              <div className="taste-levels">
                {dish.spiciness_level > 0 && (
                  <div className="taste-bar">
                    <span className="taste-label">🌶️</span>
                    <div className="taste-meter">
                      <div 
                        className="taste-fill spicy"
                        style={{ width: `${(dish.spiciness_level / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {dish.saltiness_level > 0 && (
                  <div className="taste-bar">
                    <span className="taste-label">🧂</span>
                    <div className="taste-meter">
                      <div 
                        className="taste-fill salty"
                        style={{ width: `${(dish.saltiness_level / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {dish.sweetness_level > 0 && (
                  <div className="taste-bar">
                    <span className="taste-label">🍯</span>
                    <div className="taste-meter">
                      <div 
                        className="taste-fill sweet"
                        style={{ width: `${(dish.sweetness_level / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {dish.sourness_level > 0 && (
                  <div className="taste-bar">
                    <span className="taste-label">🍋</span>
                    <div className="taste-meter">
                      <div 
                        className="taste-fill sour"
                        style={{ width: `${(dish.sourness_level / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submitted by */}
            {dish.submitted_id && (
              <div className="submitted-by">
                <small>👤 {t('submitted_by', { user: dish.submitted_id.username })}</small>
              </div>
            )}

            {/* Action Buttons */}
            <div className="dish-actions">
              <button
                className="btn-view-details"
                onClick={() => navigate(`/dishes/${dish.id}`)}
              >
                {t('viewDetails')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DishList;
