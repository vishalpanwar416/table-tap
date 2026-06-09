import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tag,
  Plus,
  X,
  Edit,
  Trash2,
  Check,
  ShoppingBag,
  Eye,
  AlertCircle,
  Package,
  Percent,
  IndianRupee,
} from 'lucide-react';
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getAllOffers,
  setCarouselOffer,
  getRestaurantOffers,
} from '../../../customer/api/offerService';
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
  // When loading an existing offer for editing we set selectedItems, which
  // would otherwise trigger the price-recompute effect and clobber the offer's
  // saved price/discount. This skips that one recompute; genuine item
  // add/remove afterwards still recomputes normally.
  const skipPriceRecalcRef = useRef(false);
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
    is_carousel: false,
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
          getRestaurantOffers(userRestaurantId),
        ]);
      } else {
        [items, offerData] = await Promise.all([getAllFoodItems(), getAllOffers()]);
      }

      // Filter valid items
      const validItems = items.filter((item) => item.id && item.name);
      const validOffers = offerData.filter((offer) => offer.id);

      setFoodItems(validItems);
      setOffers(validOffers);

      // Identify carousel offers
      const carouselItems = validOffers.filter((offer) => offer.is_carousel);
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        image: blobUrl,
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
    // Skip the recompute triggered by loading an existing offer for editing,
    // so its saved price/discount are preserved.
    if (skipPriceRecalcRef.current) {
      skipPriceRecalcRef.current = false;
      return;
    }
    if (selectedItems.length > 0) {
      const totalPrice = selectedItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + price;
      }, 0);

      setFormData((prev) => ({
        ...prev,
        price: totalPrice,
        discounted_price: prev.discounted_price || totalPrice * 0.9, // Keep existing discount or default 10%
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        price: 0,
        discounted_price: 0,
      }));
    }
  }, [selectedItems]);

  const handleAddItem = (item) => {
    setSelectedItems((prev) => [...prev, item]);
  };

  const removeSelectedItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
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
        items: selectedItems.map((item) => item.id),
        image: formData.image || null,
        is_carousel: formData.is_carousel,
        restaurant_id: userRestaurantId, // Add restaurant_id
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
      is_carousel: false,
    });
    setSelectedItems([]);
    setEditingOffer(null);
    setShowItemSelector(false);
  };

  const handleEditOffer = (offer) => {
    try {
      // Find the selected food items safely
      const offerItems = (offer.items || [])
        .map((itemId) => foodItems.find((food) => food.id === itemId))
        .filter(Boolean);

      setEditingOffer(offer);
      // Preserve the offer's saved price/discount: skip the next price-recompute
      // that setSelectedItems would otherwise trigger.
      skipPriceRecalcRef.current = true;
      setSelectedItems(offerItems);
      setFormData({
        name: offer.name || '',
        description: offer.description || '',
        price: parseFloat(offer.price) || 0,
        discounted_price: parseFloat(offer.discounted_price) || 0,
        image: offer.image || '',
        imageFile: null,
        is_carousel: Boolean(offer.is_carousel),
      });
      setShowForm(true);
      setViewingOffer(null);
    } catch (error) {
      setErrorMsg('Failed to load offer for editing');
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (
      window.confirm('Are you sure you want to delete this offer? This action cannot be undone.')
    ) {
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

      setSuccessMsg(
        `Offer ${!offer.is_carousel ? 'added to' : 'removed from'} carousel successfully!`,
      );
    } catch (error) {
      setErrorMsg(error.message || 'Failed to update carousel status');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoodItems = foodItems.filter((item) => {
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
    const percentage = (amount / original) * 100;
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Your Offers{' '}
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                {offers.length}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1 hidden md:block">
              Manage special offers and promotional deals for your customers
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full md:w-auto bg-orange-600 text-white px-5 py-2.5 rounded-xl hover:bg-orange-700 transition-all shadow-sm shadow-orange-200 flex items-center justify-center gap-2 font-medium active:scale-95"
            >
              <Plus size={18} />
              Create New Offer
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="flex overflow-x-auto pb-2 gap-2 md:grid md:grid-cols-4 md:gap-4 mb-6 no-scrollbar snap-x">
          <div className="min-w-[85px] flex-1 bg-blue-50 p-2 md:p-4 rounded-xl border border-blue-100 snap-start">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1">
              <div>
                <p className="text-[10px] md:text-sm text-blue-600 font-medium uppercase tracking-wide">
                  Total Offers
                </p>
                <p className="text-lg md:text-2xl font-bold text-blue-800 leading-tight">
                  {offers.length}
                </p>
              </div>
              <Package className="text-blue-500 w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          <div className="min-w-[85px] flex-1 bg-green-50 p-2 md:p-4 rounded-xl border border-green-100 snap-start">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1">
              <div>
                <p className="text-[10px] md:text-sm text-green-600 font-medium uppercase tracking-wide">
                  Active Ads
                </p>
                <p className="text-lg md:text-2xl font-bold text-green-800 leading-tight">
                  {carouselOffers.length}
                  <span className="text-xs text-green-600 font-normal">/3</span>
                </p>
              </div>
              <ShoppingBag className="text-green-500 w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          <div className="min-w-[85px] flex-1 bg-orange-50 p-2 md:p-4 rounded-xl border border-orange-100 snap-start">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1">
              <div>
                <p className="text-[10px] md:text-sm text-orange-600 font-medium uppercase tracking-wide">
                  Avg. Disc
                </p>
                <p className="text-lg md:text-2xl font-bold text-orange-800 leading-tight">
                  {offers.length > 0
                    ? Math.round(
                        offers.reduce((sum, offer) => {
                          const savings = calculateSavings(offer.price, offer.discounted_price);
                          return sum + savings.percentage;
                        }, 0) / offers.length,
                      )
                    : 0}
                  %
                </p>
              </div>
              <Percent className="text-orange-500 w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>

          <div className="min-w-[85px] flex-1 bg-purple-50 p-2 md:p-4 rounded-xl border border-purple-100 snap-start">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1">
              <div>
                <p className="text-[10px] md:text-sm text-purple-600 font-medium uppercase tracking-wide">
                  Savings
                </p>
                <p className="text-lg md:text-2xl font-bold text-purple-800 leading-tight">
                  ₹
                  {offers
                    .reduce((sum, offer) => {
                      const savings = calculateSavings(offer.price, offer.discounted_price);
                      return sum + savings.amount;
                    }, 0)
                    .toFixed(0)}
                </p>
              </div>
              <IndianRupee className="text-purple-500 w-4 h-4 md:w-6 md:h-6" />
            </div>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-gray-50 p-4 md:p-6 rounded-xl mb-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-white text-gray-400 hover:text-gray-700 p-2 rounded-full shadow-sm border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border-gray-200 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="E.g., Family Combo, Student Special"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border-gray-200 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    placeholder="Brief description of the offer"
                    required
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Original Price (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full border-gray-200 rounded-lg shadow-sm p-3 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-3 text-xs text-gray-400 font-medium">
                      Value
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Discounted Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="discounted_price"
                    value={formData.discounted_price}
                    onChange={handleInputChange}
                    className="w-full border-gray-200 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-semibold text-gray-800"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Your Savings
                  </label>
                  <div className="w-full border border-green-200 rounded-lg shadow-sm p-3 bg-green-50 flex items-center justify-between">
                    {formData.price > 0 && formData.discounted_price > 0 ? (
                      <>
                        <div className="text-green-700 font-bold text-sm">
                          ₹{(formData.price - formData.discounted_price).toFixed(2)}
                        </div>
                        <div className="text-xs font-medium bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                          {(
                            ((formData.price - formData.discounted_price) / formData.price) *
                            100
                          ).toFixed(0)}
                          % OFF
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Add items & price</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Offer Image
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>

                  {formData.image && (
                    <div className="relative group">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, image: '', imageFile: null }))
                        }
                        className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-md border border-gray-100 hover:bg-red-50"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Tap the box to upload. Max 5MB.</p>
                  </div>
                </div>
              </div>

              {/* Items Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Included Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowItemSelector(!showItemSelector)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {showItemSelector ? 'Finish Selection' : '+ Add Items'}
                  </button>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <Package className="mx-auto text-gray-300 mb-2" size={24} />
                    <p className="text-sm text-gray-500 font-medium">No items selected</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg shadow-sm"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-md bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                            <Package size={16} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {item.category} • ₹{parseFloat(item.price).toFixed(2)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedItem(index)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item Selector */}
              {showItemSelector && (
                <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border-gray-200 rounded-lg shadow-sm p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-gray-50"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredFoodItems.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package size={24} className="mx-auto mb-2 text-gray-300" />
                        <span className="text-sm">No items found</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {filteredFoodItems.map((item) => {
                          const count = selectedItems.filter(
                            (selected) => selected.id === item.id,
                          ).length;
                          const isSelected = count > 0;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleAddItem(item)}
                              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-orange-50 border ${
                                isSelected
                                  ? 'border-orange-200 bg-orange-50/50'
                                  : 'border-transparent'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}
                              >
                                {count > 0 ? (
                                  <span className="text-[9px] text-white font-bold">{count}</span>
                                ) : (
                                  <Plus size={10} className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-sm font-medium truncate ${isSelected ? 'text-orange-900' : 'text-gray-700'}`}
                                >
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ₹{parseFloat(item.price).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Carousel Option */}
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="is_carousel"
                    checked={formData.is_carousel}
                    onChange={handleInputChange}
                    name="is_carousel"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1 text-sm">
                  <label
                    htmlFor="is_carousel"
                    className="font-bold text-gray-800 cursor-pointer block"
                  >
                    Feature in Carousel
                  </label>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Show this offer on the home page slider. ({carouselOffers.length}/3 slots used)
                  </p>
                </div>
                {carouselOffers.length >= 3 && !editingOffer && !formData.is_carousel && (
                  <div className="text-amber-500" title="Carousel full">
                    <AlertCircle size={18} />
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm shadow-orange-200"
                >
                  {isUpdating ? 'Saving...' : editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Carousel Offers Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag size={20} className="text-orange-500" />
              Featured Offers
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {carouselOffers.length}/3 Active
            </span>
          </div>

          {carouselOffers.length === 0 ? (
            <div className="bg-white border text-center rounded-2xl p-8 shadow-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  <ShoppingBag size={24} className="text-blue-500" />
                </div>
              </div>
              <h4 className="text-gray-900 font-medium mb-1">No featured offers</h4>
              <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
                Promote your best deals by adding them to the carousel.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                + Create Offer
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-5 md:pb-0 md:mx-0 md:px-0 no-scrollbar">
              {carouselOffers.map((offer) => {
                const savings = calculateSavings(offer.price, offer.discounted_price);
                return (
                  <div
                    key={offer.id}
                    className="min-w-[85vw] md:min-w-0 snap-center bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all relative group"
                  >
                    <div className="relative aspect-[2/1] bg-gray-100">
                      {offer.image ? (
                        <img
                          src={offer.image}
                          alt={offer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex flex-col justify-center items-center p-6 text-white text-center">
                          <h3 className="font-bold text-lg leading-tight mb-1 opacity-90">
                            {offer.name}
                          </h3>
                          <div className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
                            {savings.percentage.toFixed(0)}%{' '}
                            <span className="text-lg align-top font-medium opacity-80">OFF</span>
                          </div>
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewingOffer(offer)}
                          className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full shadow-sm hover:text-blue-600 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => toggleCarouselStatus(offer)}
                          className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full shadow-sm hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg text-xs font-bold shadow-sm text-orange-600 flex items-center gap-1">
                          <Check size={10} strokeWidth={4} /> Featured
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 line-clamp-1">{offer.name}</h4>
                        <div className="text-right shrink-0 ml-2">
                          <span className="block text-lg font-bold text-orange-600 leading-none">
                            ₹{parseFloat(offer.discounted_price).toFixed(0)}
                          </span>
                          <span className="text-xs text-gray-400 line-through decoration-gray-300">
                            ₹{parseFloat(offer.price).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {offer.description}
                      </p>
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
              {offers.map((offer) => {
                const savings = calculateSavings(offer.price, offer.discounted_price);
                return (
                  <div
                    key={offer.id}
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
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
                        <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                          {offer.description}
                        </p>
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

      {viewingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 md:p-8 relative animate-in zoom-in-95 duration-200">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
              onClick={() => setViewingOffer(null)}
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              {viewingOffer.image ? (
                <img
                  src={viewingOffer.image}
                  alt={viewingOffer.name}
                  className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-2xl shadow-md mb-4 ring-4 ring-gray-50"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl shadow-md mb-4 ring-4 ring-orange-100">
                  <span className="text-3xl font-bold">
                    {calculateSavings(
                      viewingOffer.price,
                      viewingOffer.discounted_price,
                    ).percentage.toFixed(0)}
                    %
                  </span>
                </div>
              )}

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                {viewingOffer.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4 px-2">{viewingOffer.description}</p>

              <div className="flex items-center justify-center gap-3 mb-6 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-full">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400 font-medium uppercase">Original</span>
                  <span className="line-through text-gray-400 text-sm font-semibold Decoration-2">
                    ₹{parseFloat(viewingOffer.price).toFixed(0)}
                  </span>
                </div>
                <div className="h-8 w-px bg-gray-200 mx-1"></div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-orange-600 font-medium uppercase">Deal Price</span>
                  <span className="text-orange-600 font-bold text-xl leading-none">
                    ₹{parseFloat(viewingOffer.discounted_price).toFixed(0)}
                  </span>
                </div>
                <div className="ml-auto bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                  SAVE ₹{(viewingOffer.price - viewingOffer.discounted_price).toFixed(0)}
                </div>
              </div>

              <div className="w-full text-left bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Package size={14} className="text-gray-400" /> Included Items
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {(viewingOffer.items || []).map((itemId) => {
                    const item = foodItems.find((f) => f.id === itemId);
                    return item ? (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            className="w-8 h-8 rounded-md object-cover bg-gray-100"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700 truncate">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.category}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="w-full mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleEditOffer(viewingOffer)}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => setViewingOffer(null)}
                  className="px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm shadow-lg shadow-gray-200"
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
