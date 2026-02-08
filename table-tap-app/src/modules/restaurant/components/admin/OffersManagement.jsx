import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, X, Edit, Trash2, Check, ShoppingBag, Eye, AlertCircle, Package, DollarSign, Percent, IndianRupee } from 'lucide-react';
import { createOffer, updateOffer, deleteOffer, getAllOffers, setCarouselOffer, getRestaurantOffers, getCarouselOffers, getRestaurantCarouselOffers, getRestaurantOfferStats } from '../../../customer/api/offerService';
import { getAllFoodItems, getRestaurantFoodItems } from '../../../customer/api/foodService';
import { useAdminRestaurant } from '../../../shared/context/AdminRestaurantContext';

const OffersManagement = ({ setLoading, setErrorMsg, setSuccessMsg }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOffer, setEditingOffer] = useState(null);
  const [carouselOffers, setCarouselOffers] = useState([]);
  const [viewingOffer, setViewingOffer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    discounted_price: 0,
    image: '',
    imageFile: null,
    items: [],
    is_carousel: false
  });

  const { userRestaurantId } = useAdminRestaurant();

  // Load data with error handling
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Use restaurant-specific functions if restaurant ID is available
      let items, offerData;

      if (userRestaurantId) {
        [items, offerData] = await Promise.all([
          getRestaurantFoodItems(userRestaurantId),
          getRestaurantOffers(userRestaurantId)
        ]);
      } else {
        [items, offerData] = await Promise.all([
          getAllFoodItems(),
          getAllOffers()
        ]);
      }

      // Filter valid items
      const validItems = items.filter(item => item.id && item.name);
      const validOffers = offerData.filter(offer => offer.id);

      setFoodItems(validItems);
      setOffers(validOffers);

      // Identify carousel offers
      const carouselItems = validOffers.filter(offer => offer.is_carousel);
      setCarouselOffers(carouselItems);
    } catch (error) {
      setErrorMsg('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setErrorMsg, userRestaurantId]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image file size should be less than 5MB');
        return;
      }

      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);

      setFormData(prev => ({
        ...prev,
        imageFile: file,
        image: blobUrl
      }));
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      if (formData.image && formData.image.startsWith('blob:')) {
        URL.revokeObjectURL(formData.image);
      }
    };
  }, []);

  // Clean up blob URL when form data changes
  useEffect(() => {
    const currentImage = formData.image;

    return () => {
      if (currentImage && currentImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage);
      }
    };
  }, [formData.image]);

  // Calculate price based on selected items
  useEffect(() => {
    if (selectedItems.length > 0) {
      const totalPrice = selectedItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + price;
      }, 0);

      setFormData(prev => ({
        ...prev,
        price: totalPrice,
        discounted_price: prev.discounted_price || (totalPrice * 0.9) // Keep existing discount or default 10%
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        price: 0,
        discounted_price: 0
      }));
    }
  }, [selectedItems]);

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);

      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const removeSelectedItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsUpdating(true);

      // Validation
      if (!formData.name.trim()) {
        throw new Error('Offer name is required');
      }

      if (!formData.description.trim()) {
        throw new Error('Offer description is required');
      }

      if (selectedItems.length === 0) {
        throw new Error('Please select at least one item for this offer');
      }

      if (parseFloat(formData.discounted_price) <= 0) {
        throw new Error('Discounted price must be greater than 0');
      }

      if (parseFloat(formData.discounted_price) >= parseFloat(formData.price)) {
        throw new Error('Discounted price must be less than original price');
      }

      // Check carousel limit
      if (formData.is_carousel && !editingOffer) {
        if (carouselOffers.length >= 3) {
          throw new Error('Maximum 3 offers can be added to carousel. Please remove one first.');
        }
      }

      // Prepare data for submission
      const offerData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discounted_price: parseFloat(formData.discounted_price),
        items: selectedItems.map(item => item.id),
        image: formData.image || null,
        is_carousel: formData.is_carousel,
        restaurant_id: userRestaurantId // Add restaurant_id
      };

      if (editingOffer) {
        await updateOffer(editingOffer.id, offerData);
        setSuccessMsg('Offer updated successfully!');
      } else {
        await createOffer(offerData);
        setSuccessMsg('Offer created successfully!');
      }

      // Refresh data
      await loadData();

      // Reset form
      resetForm();
      setShowForm(false);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to save offer');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      discounted_price: 0,
      image: '',
      imageFile: null,
      items: [],
      is_carousel: false
    });
    setSelectedItems([]);
    setEditingOffer(null);
    setShowItemSelector(false);
  };

  const handleEditOffer = (offer) => {
    try {
      // Find the selected food items safely
      const offerItems = (offer.items || [])
        .map(itemId => foodItems.find(food => food.id === itemId))
        .filter(Boolean);

      setEditingOffer(offer);
      setSelectedItems(offerItems);
      setFormData({
        name: offer.name || '',
        description: offer.description || '',
        price: parseFloat(offer.price) || 0,
        discounted_price: parseFloat(offer.discounted_price) || 0,
        image: offer.image || '',
        imageFile: null,
        is_carousel: Boolean(offer.is_carousel)
      });
      setShowForm(true);
      setViewingOffer(null);
    } catch (error) {
      setErrorMsg('Failed to load offer for editing');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteOffer(offerId);
        await loadData();
        setSuccessMsg('Offer deleted successfully!');
        setViewingOffer(null);
      } catch (error) {
        setErrorMsg('Failed to delete offer: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCarouselStatus = async (offer) => {
    try {
      setLoading(true);

      // Check carousel limit when adding
      if (!offer.is_carousel && carouselOffers.length >= 3) {
        throw new Error('Maximum 3 offers can be added to carousel. Please remove one first.');
      }

      await setCarouselOffer(offer.id, !offer.is_carousel);
      await loadData();

      setSuccessMsg(`Offer ${!offer.is_carousel ? 'added to' : 'removed from'} carousel successfully!`);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to update carousel status');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoodItems = foodItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    );
  });

  const calculateSavings = (original, discounted) => {
    if (original <= 0) return { amount: 0, percentage: 0 };
    const amount = original - discounted;
    const percentage = ((amount / original) * 100);
    return { amount, percentage };
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      // Use restaurant-specific function if restaurant ID is available
      let data;
      if (userRestaurantId) {
        data = await getRestaurantOffers(userRestaurantId);
      } else {
        data = await getAllOffers();
      }

      setOffers(data || []);
    } catch (error) {
      setErrorMsg('Failed to load offers: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            {/* Removed redundant title */}
            <p className="text-sm text-gray-600 mt-1">
              Manage special offers and promotional deals for your customers
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Create New Offer
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Offers</p>
                <p className="text-2xl font-bold text-blue-800">{offers.length}</p>
              </div>
              <Package className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Carousel Offers</p>
                <p className="text-2xl font-bold text-green-800">{carouselOffers.length}/3</p>
              </div>
              <ShoppingBag className="text-green-500" size={24} />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Avg. Discount</p>
                <p className="text-2xl font-bold text-orange-800">
                  {offers.length > 0
                    ? Math.round(offers.reduce((sum, offer) => {
                      const savings = calculateSavings(offer.price, offer.discounted_price);
                      return sum + savings.percentage;
                    }, 0) / offers.length)
                    : 0}%
                </p>
              </div>
              <Percent className="text-orange-500" size={24} />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Total Savings</p>
                <p className="text-2xl font-bold text-orange-800">
                  ₹{offers.reduce((sum, offer) => {
                    const savings = calculateSavings(offer.price, offer.discounted_price);
                    return sum + savings.amount;
                  }, 0).toFixed(0)}
                </p>
              </div>
              <IndianRupee className="text-orange-500" size={24} />
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="E.g., Family Combo, Student Special"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Brief description of the offer"
                    required
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-100 text-gray-600"
                      placeholder="0.00"
                      readOnly
                    />
                    <span className="absolute right-3 top-3 text-sm text-gray-500">Auto-calculated</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discounted Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discounted_price"
                    value={formData.discounted_price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Savings
                  </label>
                  <div className="w-full border border-gray-200 rounded-md shadow-sm p-3 bg-green-50">
                    {formData.price > 0 && formData.discounted_price > 0 ? (
                      <>
                        <div className="text-green-700 font-medium">
                          ₹{(formData.price - formData.discounted_price).toFixed(2)}
                        </div>
                        <div className="text-sm text-green-600">
                          ({(((formData.price - formData.discounted_price) / formData.price) * 100).toFixed(1)}% off)
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500">₹0.00 (0%)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Image
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-50 file:text-orange-700
                      hover:file:bg-orange-100 cursor-pointer"
                  />
                  {formData.image && (
                    <div className="relative">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '', imageFile: null }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>

              {/* Items Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Included Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowItemSelector(!showItemSelector)}
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    {showItemSelector ? 'Done Selecting' : 'Add/Remove Items'}
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Package className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-gray-500">No items selected</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add/Remove Items" to select products</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.category} • ₹{parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="text-sm text-gray-600 mt-2">
                      Total: {selectedItems.length} items • ₹{selectedItems.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Item Selector */}
              {showItemSelector && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search items by name, description, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {filteredFoodItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package size={24} className="mx-auto mb-2 text-gray-400" />
                        No items found
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredFoodItems.map(item => {
                          const isSelected = selectedItems.some(selected => selected.id === item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleItemSelection(item)}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                                  ? 'bg-orange-100 border-2 border-orange-300'
                                  : 'hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-gray-500">
                                  {item.category} • ₹{parseFloat(item.price).toFixed(2)}
                                </div>
                              </div>
                              {isSelected && (
                                <Check size={16} className="text-orange-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Carousel Option */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_carousel"
                  checked={formData.is_carousel}
                  onChange={handleInputChange}
                  name="is_carousel"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_carousel" className="flex-1 text-sm text-gray-700">
                  <div className="font-medium">Add to Main Carousel</div>
                  <div className="text-xs text-gray-500">
                    Display this offer prominently on the home page ({carouselOffers.length}/3 slots used)
                  </div>
                </label>
                {carouselOffers.length >= 3 && !editingOffer && (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Carousel Offers Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Featured Carousel Offers</h3>
            <span className="text-sm text-gray-500">
              {carouselOffers.length}/3 slots used
            </span>
          </div>

          {carouselOffers.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <ShoppingBag size={24} className="mx-auto text-blue-400 mb-2" />
              <p className="text-blue-700 font-medium">No carousel offers yet</p>
              <p className="text-sm text-blue-600 mt-1">
                Create an offer and enable "Add to Main Carousel" to display it prominently
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {carouselOffers.map(offer => {
                const savings = calculateSavings(offer.price, offer.discounted_price);
                return (
                  <div key={offer.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {offer.image ? (
                      <div className="aspect-[2/1] bg-gray-100">
                        <img
                          src={offer.image}
                          alt={offer.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[2/1] bg-gradient-to-br from-orange-500 to-orange-600 text-white flex flex-col justify-center items-center p-4">
                        <p className="text-lg font-medium text-center">{offer.name}</p>
                        <p className="text-3xl font-bold mt-2">
                          {savings.percentage.toFixed(0)}% OFF
                        </p>
                      </div>
                    )}

                    <div className="p-4">
                      <h4 className="font-medium text-gray-800 mb-1">{offer.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{offer.description}</p>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="line-through text-gray-400 text-sm mr-2">
                            ₹{parseFloat(offer.price).toFixed(2)}
                          </span>
                          <span className="text-orange-600 font-semibold text-lg">
                            ₹{parseFloat(offer.discounted_price).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => setViewingOffer(offer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => toggleCarouselStatus(offer)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove from carousel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All Offers Section */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-800">All Offers</h3>
          {offers.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              No offers available. Click "Create New Offer" to add your first offer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(offer => {
                const savings = calculateSavings(offer.price, offer.discounted_price);
                return (
                  <div key={offer.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                        {offer.image ? (
                          <img
                            src={offer.image}
                            alt={offer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-600 text-white text-xl font-bold">
                            {savings.percentage.toFixed(0)}%
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-800">{offer.name}</h3>
                          <div className="text-right">
                            <span className="text-gray-400 text-xs line-through mr-1">
                              ₹{parseFloat(offer.price).toFixed(2)}
                            </span>
                            <span className="text-orange-500 font-semibold">
                              ₹{parseFloat(offer.discounted_price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1 mt-1">{offer.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center text-xs">
                            <Tag size={12} className="mr-1 text-green-600" />
                            <span className="text-green-600">
                              {savings.percentage.toFixed(0)}% off
                            </span>
                            {offer.is_carousel && (
                              <span className="ml-2 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                                Carousel
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setViewingOffer(offer)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            {!offer.is_carousel && carouselOffers.length < 3 && (
                              <button
                                onClick={() => toggleCarouselStatus(offer)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Add to carousel"
                              >
                                <ShoppingBag size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditOffer(offer)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteOffer(offer.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
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

      {/* Offer Details Modal */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setViewingOffer(null)}
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center">
              {viewingOffer.image ? (
                <img
                  src={viewingOffer.image}
                  alt={viewingOffer.name}
                  className="w-40 h-40 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-orange-100 text-orange-600 text-4xl font-bold rounded-lg mb-4">
                  {calculateSavings(viewingOffer.price, viewingOffer.discounted_price).percentage.toFixed(0)}%
                </div>
              )}
              <h2 className="text-2xl font-bold mb-2">{viewingOffer.name}</h2>
              <p className="text-gray-600 mb-2 text-center">{viewingOffer.description}</p>
              <div className="flex items-center gap-4 mb-4">
                <span className="line-through text-gray-400 text-lg">
                  ₹{parseFloat(viewingOffer.price).toFixed(2)}
                </span>
                <span className="text-orange-600 font-bold text-2xl">
                  ₹{parseFloat(viewingOffer.discounted_price).toFixed(2)}
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                  Save ₹{(viewingOffer.price - viewingOffer.discounted_price).toFixed(2)}
                </span>
              </div>
              <div className="w-full">
                <h4 className="font-medium mb-2">Included Items:</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  {(viewingOffer.items || []).map(itemId => {
                    const item = foodItems.find(f => f.id === itemId);
                    return item ? (
                      <li key={item.id}>
                        {item.name} <span className="text-gray-500 text-xs">({item.category})</span>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
              <div className="flex justify-end w-full mt-6">
                <button
                  onClick={() => setViewingOffer(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersManagement;