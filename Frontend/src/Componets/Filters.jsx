import React from "react";
import { useFilters } from "../Context/FilterContext";
import { useNavigate } from "react-router-dom";
 

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

  // Handle category change
  const onCategoryChange = (e) => {
    const selectedName = e.target.value;
    const category = categories.find((c) => c.name === selectedName);
    if (!category) return;

    setCurrentCategory(category);
    navigate(`/feed/latest/${category.name}/${currentDistrict.district}`);
  };

  // Handle district change
  const onDistrictChange = (e) => {
    const selectedDistrictName = e.target.value;
    const district = districts.find((d) => d.district === selectedDistrictName);
    if (!district) return;

    setCurrentDistrict(district);
    navigate(`/feed/latest/${currentCategory.name}/${district.district}`);
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
