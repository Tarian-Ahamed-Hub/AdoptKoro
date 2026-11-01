import React from "react";
import { useFilters } from "../Context/FilterContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function FeedFilters() {
  const {
    categories,
    districts,
    currentCategory,
    currentDistrict,
    setCurrentCategory,
    setCurrentDistrict,
  } = useFilters();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  // On the nearest page, stay on it: the page refetches from the filter context.
  const isNearest = pathname.startsWith("/feed/posts/nearest");

  const onCategoryChange = (e) => {
    const category = categories.find((c) => c.name === e.target.value);
    if (!category) return;

    setCurrentCategory(category);
    if (!isNearest) {
      navigate(`/feed/latest/${category.name}/${currentDistrict.district}`);
    }
  };

  const onDistrictChange = (e) => {
    const district = districts.find((d) => d.district === e.target.value);
    if (!district) return;

    setCurrentDistrict(district);
    if (!isNearest) {
      navigate(`/feed/latest/${currentCategory.name}/${district.district}`);
    }
  };

  return (
    <div className="feed-filters-container">
      <select
        className="feed-filter-select"
        value={currentCategory.name}
        onChange={onCategoryChange}
      >
        {categories.map((cat) => (
          <option key={cat._id} value={cat.name}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        className="feed-filter-select"
        value={currentDistrict.district}
        onChange={onDistrictChange}
      >
        {districts.map((dist) => (
          <option key={dist._id} value={dist.district}>
            {dist.district}
          </option>
        ))}
      </select>
    </div>
  );
}