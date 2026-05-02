import React, { useState } from 'react';
import { Edit, Plus, X, Upload, Image as ImageIcon, Save, RotateCcw, Tag, IndianRupee, FileText, Hash, ArrowLeft } from 'lucide-react';
import { categories } from '../../../../customer/api/foodData';
import { createFoodItem, updateFoodItem, uploadFoodImage } from '../../../../customer/api/foodService';
import { useAdminRestaurant } from '../../../../shared/context/AdminRestaurantContext';
import { validateImageFile, optimizeImageForUpload } from '../../../../shared/utils/imageOptimization';

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

      // Update form data with optimized file but keep permanent image field clean
      setFormData({
        ...formData,
        imageFile: optimizedFile
      });


    } catch (error) {
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
      if (!formData.name || formData.price === '' || formData.price === null || formData.price === undefined || !formData.description) {
        throw new Error('Please fill all required fields');
      }

      // Sanitize current image to ensure no temporary blob URLs persist
      let imageUrl = formData.image && formData.image.startsWith('blob:') ? null : formData.image;

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
        tags: (tags || '').split(',').map(tag => tag.trim()).filter(tag => tag),
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
    <div className="min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3 flex-shrink-0 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors -ml-2"
        >
          <ArrowLeft size={20} className="text-gray-900" />
        </button>

        <div className="flex items-center flex-1">
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
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-0">
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Food Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="e.g. Margherita Pizza"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                >
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm resize-none"
                  placeholder="Describe the food item, e.g. 'Classic Italian pizza with fresh mozzarella and basil.'"
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-green-500" />
              Pricing & Discounts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type</label>
                <select
                  name="discounttype"
                  value={formData.discounttype || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                >
                  <option value="">No Discount</option>
                  {discountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.discounttype === 'Percentage' ? 'Discount (%)' : formData.discounttype === 'Fixed' ? 'Discount (₹)' : 'Discount Value'}
                </label>
                <input
                  type="number"
                  name="discountvalue"
                  value={formData.discountvalue}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="0"
                  min="0"
                  step={formData.discounttype === 'Percentage' ? '0.1' : '0.01'}
                  disabled={!formData.discounttype}
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-500" />
              Tags & Keywords
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="spicy, veg, bestseller (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma separated, e.g. 'spicy, veg, bestseller'
              </p>
              <p className="text-xs text-primary-500 mt-1">
                To feature an item in the <b>Bestseller</b> or <b>Recommendation</b> tabs, add the tags <b>bestseller</b> and/or <b>recommended</b>.
              </p>
            </div>
          </div>

          {/* Image Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              Food Image
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <label className="flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-xl cursor-pointer hover:bg-primary-100 transition-colors text-sm shadow-sm">
                <Upload className="w-5 h-5 mr-2" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={imageProcessing}
                  className="hidden"
                />
              </label>
              {(formData.image || imagePreview) && (
                <div className="relative">
                  <img
                    src={imagePreview || formData.image}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded-xl border border-gray-200 shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '', imageFile: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {!formData.image && !imagePreview && (
                <div className="text-center py-4 text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-sm">No image selected</p>
                </div>
              )}
              {imageProcessing && (
                <div className="flex items-center text-sm text-primary-600 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent mr-2"></div>
                  Optimizing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-white rounded-b-2xl shadow-sm">
          <button
            type="button"
            onClick={resetForm}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors shadow"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </button>
          <button
            type="submit"
            disabled={imageProcessing}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {editItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FoodItemForm;