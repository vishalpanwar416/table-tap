import React from 'react';
import { Edit, Plus, X } from 'lucide-react';
import { categories } from '../../foodData';
import { createFoodItem, updateFoodItem, uploadFoodImage } from '../../../api/foodService';
import { useAdminRestaurant } from '../../../context/AdminRestaurantContext';

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
    <>
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
    </>
  );
};

export default FoodItemForm;