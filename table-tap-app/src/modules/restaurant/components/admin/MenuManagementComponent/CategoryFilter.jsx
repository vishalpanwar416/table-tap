import React from 'react';

const CategoryFilter = ({ filterCategory, setFilterCategory, categories }) => {
  return (
    <select
      className="p-2 border rounded focus:ring-2 focus:ring-orange-500"
      value={filterCategory}
      onChange={(e) => setFilterCategory(e.target.value)}
      aria-label="Filter by category"
    >
      <option value="All">All Categories</option>
      {categories.map(category => (
        <option key={category.name} value={category.name}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default React.memo(CategoryFilter);