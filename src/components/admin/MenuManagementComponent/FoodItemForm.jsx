import React, { useState } from 'react';
import { Edit, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
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
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
      
      {/* Form - Scrollable */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 space-y-4 overflow-y-auto">
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
            <div className="space-y-3">
              {/* File Input */}
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={imageProcessing}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 file:text-orange-700
                    hover:file:bg-orange-100 disabled:opacity-50"
                />
                {imageProcessing && (
                  <div className="flex items-center text-sm text-orange-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent mr-2"></div>
                    Optimizing...
                  </div>
                )}
              </div>

              {/* Image Preview - Fixed Height */}
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md bg-gray-50">
                {(formData.image || imagePreview) ? (
                  <div className="relative">
                    <img 
                      src={imagePreview || formData.image} 
                      alt="Preview" 
                      className="h-24 w-24 object-cover rounded-md border border-gray-200"
                    />
                    {formData.imageFile && (
                      <div className="absolute top-1 right-1 bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded-full">
                        ✓
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs">No image selected</p>
                  </div>
                )}
              </div>

              {/* Image Info */}
              {formData.imageFile && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="flex items-center">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Optimized for WebP format
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons - Fixed at Bottom */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={imageProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50"
          >
            {editItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodItemForm;