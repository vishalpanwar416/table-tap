import React, { useState } from 'react';
import { Edit, Plus, X, Upload, Image as ImageIcon, Save, RotateCcw, Tag, DollarSign, FileText, Hash } from 'lucide-react';
import { categories } from '../../../api/foodData';
import { createFoodItem, updateFoodItem, uploadFoodImage } from '../../../api/foodService';
import { useAdminRestaurant } from '../../../context/AdminRestaurantContext';
import { validateImageFile, optimizeImageForUpload } from '../../../utils/imageOptimization';

const FoodItemForm = ({ 
  formData, 
  setFormData, 
  editItem, 
  showForm, 
  setShowForm, 
  resetForm, 
  setLoading, 
  setErrorMsg, 
  setSuccessMsg, 
  fetchFoodItems 
}) => {
  const { userRestaurantId } = useAdminRestaurant();
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImageProcessing(true);
      setErrorMsg('');

      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        setErrorMsg(validation.errors.join(', '));
        return;
      }

      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Optimize image
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
        format: 'webp'
      });

      // Update form data with optimized file
      setFormData({
        ...formData,
        imageFile: optimizedFile,
        image: previewUrl
      });

      console.log(`Image optimized: ${file.size} -> ${optimizedFile.size} bytes (${Math.round((1 - optimizedFile.size / file.size) * 100)}% reduction)`);

    } catch (error) {
      console.error('Error processing image:', error);
      setErrorMsg('Failed to process image. Please try again.');
    } finally {
      setImageProcessing(false);
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
        // Upload the optimized image
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
        image: imageUrl,
        restaurant_id: userRestaurantId
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

  // Discount type options
  const discountTypes = ['Percentage', 'Fixed'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0 border-b border-gray-100">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${editItem ? 'bg-blue-100' : 'bg-green-100'}`}>
            {editItem ? (
              <Edit className="w-5 h-5 text-blue-600" />
            ) : (
              <Plus className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editItem ? 'Edit Food Item' : 'Add New Food Item'}
            </h2>
            <p className="text-xs text-gray-500">
              {editItem ? 'Update the food item details' : 'Create a new food item for your menu'}
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-0">
          {/* Basic Information Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-orange-500" />
              Basic Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="Enter food item name"
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  placeholder="Describe the food item..."
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-500" />
              Pricing & Discounts
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    name="discounttype"
                    value={formData.discounttype || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="0"
                    min="0"
                    step={formData.discounttype === 'Percentage' ? '0.1' : '0.01'}
                    disabled={!formData.discounttype}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <Tag className="w-4 h-4 mr-2 text-purple-500" />
              Tags & Keywords
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="spicy, veg, bestseller (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Add tags to help customers find this item</p>
            </div>
          </div>

          {/* Image Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2 text-blue-500" />
              Food Image
            </h3>
            
            <div className="space-y-3">
              {/* File Input */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors text-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={imageProcessing}
                    className="hidden"
                  />
                </label>
                {imageProcessing && (
                  <div className="flex items-center text-sm text-orange-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2"></div>
                    Optimizing...
                  </div>
                )}
              </div>

              {/* Image Preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 bg-gray-50">
                {(formData.image || imagePreview) ? (
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img 
                        src={imagePreview || formData.image} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                      />
                      {formData.imageFile && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Image Preview</p>
                      <p className="text-xs text-gray-500">Image will be optimized for better performance</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                    <p className="text-sm text-gray-500">No image selected</p>
                    <p className="text-xs text-gray-400">Upload an image to make your item more appealing</p>
                  </div>
                )}
              </div>

              {/* Image Info */}
              {formData.imageFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                  <div className="flex items-center text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Image optimized and ready for upload
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            type="submit"
            disabled={imageProcessing}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {editItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodItemForm;