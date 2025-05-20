import React, { useState } from 'react';
import { Edit, Trash2, Plus, X, ChevronUp, ChevronDown, Search, Tag } from 'lucide-react';
import { categories } from '../foodData';
import { createFoodItem, updateFoodItem, deleteFoodItem, uploadFoodImage } from '../../api/foodService';

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        image: URL.createObjectURL(file)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (!formData.name || !formData.price || !formData.description) {
        throw new Error('Please fill all required fields');
      }
  
      let imageUrl = formData.image;
      
      // If we have a new image file to upload
      if (formData.imageFile) {
        // Upload the image first
        imageUrl = await uploadFoodImage(formData.imageFile);
      } else if (editItem && !formData.image) {
        // If editing and image was removed
        imageUrl = null;
      }
  
      // Prepare the data for Supabase
      const { imageFile, tags, price, discountvalue, ...rest } = formData;
      const foodItemData = {
        ...rest,
        price: parseFloat(price),
        discountvalue: discountvalue ? parseFloat(discountvalue) : null,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        image: imageUrl
      };

  
      // Remove any undefined or null values that might cause issues
      Object.keys(foodItemData).forEach(key => {
        if (foodItemData[key] === undefined || foodItemData[key] === '') {
          delete foodItemData[key];
        }
      });
  
      if (editItem) {
        await updateFoodItem(editItem.id, foodItemData);
        setSuccessMsg('Food item updated successfully!');
      } else {
        await createFoodItem(foodItemData);
        setSuccessMsg('Food item added successfully!');
      }
  
      await fetchFoodItems();
      resetForm();
      
    } catch (error) {
      setErrorMsg(error.message || 'Failed to save food item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
  };

  const handleEdit = (item) => {
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
  };

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

  const filteredFoodItems = foodItems.filter(item => {
    const matchesSearch = searchTerm ? 
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))) : true;
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate discounted price
  const calculateDiscountedPrice = (price, discountType, discountValue) => {
    if (!discountType || !discountValue) return price;
    
    if (discountType === 'Percentage') {
      return price - (price * (discountValue / 100));
    } else if (discountType === 'Fixed') {
      return Math.max(0, price - discountValue);
    }
    return price;
  };

  // Discount type options
  const discountTypes = ['Percentage', 'Fixed'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Form Section */}
        <div className={`bg-white p-6 rounded-xl shadow-sm md:w-1/3 ${showForm ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              {editItem ? (
                <>
                  <Edit className="w-5 h-5 mr-2 text-orange-500" />
                  Edit Food Item
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2 text-green-500" />
                  Add New Food Item
                </>
              )}
            </h2>
            <button 
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="md:hidden p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Food item name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Describe the food item"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  name="discounttype"
                  value={formData.discounttype || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">No Discount</option>
                  {discountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.discounttype === 'Percentage' ? 'Discount (%)' : formData.discounttype === 'Fixed' ? 'Discount (₹)' : 'Discount Value'}
                </label>
                <input
                  type="number"
                  name="discountvalue"
                  value={formData.discountvalue}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step={formData.discounttype === 'Percentage' ? '0.1' : '0.01'}
                  disabled={!formData.discounttype}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="spicy, veg, bestseller (comma separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100"
                />
                {formData.image && (
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="h-10 w-10 object-cover rounded-md"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
              >
                {editItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>

        {/* Food Items List */}
        <div className="md:flex-1">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">Food Items</h2>
              <div className="flex items-center space-x-2">
                <select
                  className="p-2 border rounded focus:ring-2 focus:ring-orange-500"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button 
                  className="md:hidden bg-orange-500 text-white p-2 rounded-md hover:bg-orange-600 transition-colors"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {filteredFoodItems.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No food items found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFoodItems.map(item => {
                  const discountedPrice = calculateDiscountedPrice(
                    item.price,
                    item.discounttype,
                    item.discountvalue
                  );
                  
                  return (
                    <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex">
                        <div className="w-24 h-24 bg-gray-100">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                            <div className="text-right">
                              {item.discounttype && item.discountvalue ? (
                                <div>
                                  <span className="text-gray-400 text-xs line-through mr-1">₹{item.price.toFixed(2)}</span>
                                  <span className="text-orange-500 font-semibold">₹{discountedPrice.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span className="text-orange-500 font-semibold">₹{item.price.toFixed(2)}</span>
                              )}
                              
                              {item.discounttype && item.discountvalue > 0 && (
                                <div className="flex items-center text-xs text-green-600 mt-1">
                                  <Tag size={12} className="mr-1" />
                                  {item.discounttype === 'Percentage' 
                                    ? `${item.discountvalue}% off` 
                                    : `₹${item.discountvalue} off`
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                          <div className="flex justify-between items-center mt-2">
                            <div>
                              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                {item.category}
                              </span>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {item.tags.slice(0, 2).map((tag, idx) => (
                                    <span key={idx} className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {item.tags.length > 2 && (
                                    <span className="text-xs text-gray-500">+{item.tags.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;