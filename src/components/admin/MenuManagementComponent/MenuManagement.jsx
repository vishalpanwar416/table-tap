import React, { useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { categories } from '../../../api/foodData';
import FoodItemList from './FoodItemList';
import FoodItemForm from './FoodItemForm';
import CategoryFilter from './CategoryFilter';

const MenuManagement = ({ foodItems, fetchFoodItems, setLoading, setErrorMsg, setSuccessMsg, searchTerm }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'Snacks',
    discounttype: '',
    discountvalue: '',
    tags: '',
    image: '',
    imageFile: null
  });
  const [editItem, setEditItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [showForm, setShowForm] = useState(true);

  const handleEdit = useCallback((item) => {
    setEditItem(item);
    setFormData({
      ...item,
      price: item.price.toString(),
      discountvalue: item.discountvalue ? item.discountvalue.toString() : '',
      tags: item.tags?.join(', ') || '',
      imageFile: null
    });
    setShowForm(true);
    // Scroll to form on mobile
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category: 'Snacks',
      discounttype: '',
      discountvalue: '',
      tags: '',
      image: '',
      imageFile: null
    });
    setEditItem(null);
  }, []);

  // Filter food items based on search and category
  const filteredFoodItems = useMemo(() => {
    return foodItems.filter(item => {
      const matchesSearch = searchTerm ? 
        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))) : true;
      
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [foodItems, searchTerm, filterCategory]);

  return (
    <div className="h-full">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Form Section - Fixed height and scrollable */}
        <div className={`bg-white rounded-xl shadow-sm md:w-1/3 md:sticky md:top-0 md:h-[calc(100vh-200px)] md:overflow-y-auto ${showForm ? 'block' : 'hidden md:block'}`}>
          <FoodItemForm 
            formData={formData}
            setFormData={setFormData}
            editItem={editItem}
            setShowForm={setShowForm}
            showForm={showForm}
            resetForm={resetForm}
            setLoading={setLoading}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
            fetchFoodItems={fetchFoodItems}
          />
        </div>

        {/* Food Items List - Scrollable on desktop */}
        <div className="md:flex-1 md:overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">Food Items</h2>
              <div className="flex items-center space-x-2">
                <CategoryFilter 
                  filterCategory={filterCategory} 
                  setFilterCategory={setFilterCategory}
                  categories={categories}
                />
                <button 
                  className="md:hidden bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <FoodItemList 
              filteredFoodItems={filteredFoodItems} 
              handleEdit={handleEdit} 
              setLoading={setLoading}
              setErrorMsg={setErrorMsg}
              setSuccessMsg={setSuccessMsg}
              fetchFoodItems={fetchFoodItems}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;