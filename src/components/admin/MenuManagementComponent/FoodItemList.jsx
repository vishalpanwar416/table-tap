import React from 'react';
import FoodItemCard from './FoodtemsCard';
import { deleteFoodItem, toggleFoodItemActive } from '../../../api/foodService';

const FoodItemList = ({ 
  filteredFoodItems, 
  handleEdit, 
  setLoading, 
  setErrorMsg, 
  setSuccessMsg, 
  fetchFoodItems 
}) => {
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setLoading(true);
        await deleteFoodItem(id);
        await fetchFoodItems();
        setSuccessMsg('Food item deleted successfully!');
      } catch (error) {
        setErrorMsg('Failed to delete food item: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (filteredFoodItems.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No food items found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredFoodItems.map(item => (
        <FoodItemCard 
          key={item.id}
          item={item}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          fetchFoodItems={fetchFoodItems}
        />
      ))}
    </div>
  );
};

export default FoodItemList;