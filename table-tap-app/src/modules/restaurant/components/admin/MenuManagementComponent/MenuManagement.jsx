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
  const [showForm, setShowForm] = useState(true);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

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

      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [foodItems, searchTerm, filterCategory]);

  return (
    <div className="h-full">
      <div className="flex flex-col md:flex-row gap-4 h-full">
        {/* Left panel: Add Food Item form – collapsible on desktop */}
        <div
          className={`flex flex-shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden ${
            leftPanelCollapsed ? 'w-12 md:w-12' : 'w-full md:w-1/3'
          } ${showForm ? 'block' : 'hidden md:block'}`}
        >
          <div className="flex w-full h-full md:h-[calc(100vh-200px)]">
            {/* Form content – hidden when collapsed */}
            {!leftPanelCollapsed && (
              <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm md:rounded-r-none md:sticky md:top-0 overflow-y-auto">
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
            )}
            {/* Collapse / Expand arrow button – visible on desktop; on mobile only when collapsed */}
            <button
              type="button"
              onClick={() => setLeftPanelCollapsed((c) => !c)}
              className={`flex-shrink-0 items-center justify-center w-12 h-14 bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-200 shadow-sm transition-colors ${
                leftPanelCollapsed ? 'flex rounded-xl border-l border-gray-200' : 'border-l-0 rounded-r-xl hidden md:flex'
              }`}
              title={leftPanelCollapsed ? 'Expand Add Food Item' : 'Collapse Add Food Item'}
              aria-label={leftPanelCollapsed ? 'Expand form' : 'Collapse form'}
            >
              {leftPanelCollapsed ? (
                <ChevronRight className="w-5 h-5 text-orange-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600 hover:text-orange-600" />
              )}
            </button>
          </div>
        </div>

        {/* Food Items List - Scrollable on desktop */}
        <div className="md:flex-1 md:min-w-0 md:overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryFilter
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  categories={categories}
                />
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="Items per row">
                  <LayoutGrid className="w-4 h-4 text-gray-500 mr-1" aria-hidden />
                  {GRID_OPTIONS.map((cols) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setGridColumns(cols)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        gridColumns === cols
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