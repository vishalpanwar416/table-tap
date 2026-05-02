import React, { useState, useCallback, useMemo } from 'react';
import { Plus, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { categories } from '../../../../customer/api/foodData';
import FoodItemList from './FoodItemList';
import FoodItemForm from './FoodItemForm';
import CategoryFilter from './CategoryFilter';

const GRID_OPTIONS = [2, 3, 4];

const MenuManagement = ({ foodItems, fetchFoodItems, setLoading, setErrorMsg, setSuccessMsg, searchTerm }) => {
  const [gridColumns, setGridColumns] = useState(3);
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
  const [showForm, setShowForm] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);

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
    setLeftPanelCollapsed(false); // Expand left panel so form is visible when editing
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

      let matchesCategory = true;
      if (filterCategory === 'All') {
        matchesCategory = true;
      } else if (filterCategory === 'Recommended' || filterCategory === 'Bestseller') {
        matchesCategory = item.tags && item.tags.some(tag => tag.toLowerCase() === filterCategory.toLowerCase());
      } else {
        matchesCategory = item.category === filterCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [foodItems, searchTerm, filterCategory]);

  return (
    <div className="h-full">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Left panel: Add Food Item form – collapsible on desktop */}
        <div
          className={`flex flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden md:relative bg-white md:bg-transparent ${showForm ? 'w-full block border-b border-gray-200 md:border-none mb-4 md:mb-0' : 'hidden md:block'
            } ${leftPanelCollapsed ? 'md:w-0 md:border-none' : 'md:w-1/3'}`}
        >
          <div className="flex w-full h-auto md:h-[calc(100vh-200px)]">
            {/* Form content */}
            <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm md:rounded-r-none md:sticky md:top-0 md:overflow-y-auto md:h-full">
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
            {/* Collapse / Expand arrow button – visible on desktop; on mobile only when collapsed */}
            <button
              type="button"
              onClick={() => setLeftPanelCollapsed((c) => !c)}
              className={`flex-shrink-0 items-center justify-center w-12 h-14 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-200 shadow-sm transition-colors ${leftPanelCollapsed ? 'hidden' : 'border-l-0 rounded-r-xl hidden md:flex'
                }`}
              title="Collapse Add Food Item"
              aria-label="Collapse form"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 hover:text-orange-600" />
            </button>
          </div>
        </div>

        {/* Food Items List - Scrollable on desktop */}
        <div className="md:flex-1 md:min-w-0 md:overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 min-w-0">
                  <CategoryFilter
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                    categories={categories}
                  />
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="Items per row">
                  <LayoutGrid className="w-4 h-4 text-gray-500 hidden sm:block mr-1" aria-hidden />
                  {GRID_OPTIONS.map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setGridColumns(cols)}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${gridColumns === cols
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      title={`${cols} items per row`}
                      aria-pressed={gridColumns === cols}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
                {/* Desktop Add Button (visible when collapsed) */}
                <button
                  className={`hidden md:flex flex-shrink-0 items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 transition-colors shadow-sm ${!leftPanelCollapsed ? 'opacity-0 pointer-events-none w-0 px-0 overflow-hidden' : ''}`}
                  onClick={() => {
                    setLeftPanelCollapsed(false);
                    setEditItem(null); // Reset to add mode
                    resetForm();
                  }}
                >
                  <Plus size={18} />
                  <span className="whitespace-nowrap font-medium">Add New Food Item</span>
                </button>
                <button
                  className="md:hidden flex-shrink-0 flex items-center gap-1.5 bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} />
                  <span className="text-sm font-medium hidden sm:inline">Add Item</span>
                </button>
              </div>
            </div>

            <FoodItemList
              filteredFoodItems={filteredFoodItems}
              gridColumns={gridColumns}
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