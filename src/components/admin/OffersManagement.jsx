import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Edit, Trash2, Check, ShoppingBag } from 'lucide-react';
import { createOffer, updateOffer, deleteOffer, getAllOffers, setCarouselOffer } from '../../api/offerService';
import { getAllFoodItems } from '../../api/foodService';

const OffersManagement = ({ setLoading, setErrorMsg, setSuccessMsg }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOffer, setEditingOffer] = useState(null);
  const [carouselOffers, setCarouselOffers] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    discountedPrice: 0,
    image: '',
    imageFile: null,
    items: [],
    isCarousel: false
  });

  // Load food items and offers on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [items, offerData] = await Promise.all([
          getAllFoodItems(),
          getAllOffers()
        ]);
        setFoodItems(items);
        setOffers(offerData);
        
        // Identify carousel offers
        const carouselItems = offerData.filter(offer => offer.is_carousel);
        setCarouselOffers(carouselItems);
      } catch (error) {
        setErrorMsg('Failed to load data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [setLoading, setErrorMsg]);

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

  // Calculate price based on selected items
  useEffect(() => {
    if (selectedItems.length > 0) {
      const totalPrice = selectedItems.reduce((sum, item) => sum + item.price, 0);
      setFormData(prev => ({
        ...prev,
        price: totalPrice,
        discountedPrice: totalPrice * 0.9 // Default 10% discount
      }));
    }
  }, [selectedItems]);

  const toggleItemSelection = (item) => {
    if (selectedItems.some(selected => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (!formData.name || !formData.description || selectedItems.length === 0) {
        throw new Error('Please fill all required fields and select at least one item');
      }
      
      let imageUrl = formData.image;
      
      // Process the data for submission
      const offerData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        discounted_price: parseFloat(formData.discountedPrice),
        items: selectedItems.map(item => item.id),
        category: 'Offers',
        image: imageUrl,
        is_carousel: formData.isCarousel
      };
      
      if (editingOffer) {
        await updateOffer(editingOffer.id, offerData);
        setSuccessMsg('Offer updated successfully!');
      } else {
        await createOffer(offerData);
        setSuccessMsg('Offer created successfully!');
      }
      
      // Refresh offers list
      const updatedOffers = await getAllOffers();
      setOffers(updatedOffers);
      
      // Reset form
      resetForm();
    } catch (error) {
      setErrorMsg(error.message || 'Failed to save offer');
    } finally {
      setLoading(false);
      setShowForm(false);
      setShowItemSelector(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      discountedPrice: 0,
      image: '',
      imageFile: null,
      items: [],
      isCarousel: false
    });
    setSelectedItems([]);
    setEditingOffer(null);
  };

  const handleEditOffer = (offer) => {
    // Find the selected food items
    const offerItems = offer.items.map(itemId => 
      foodItems.find(food => food.id === itemId)
    ).filter(Boolean);
    
    setEditingOffer(offer);
    setSelectedItems(offerItems);
    setFormData({
      name: offer.name,
      description: offer.description,
      price: offer.price,
      discountedPrice: offer.discounted_price,
      image: offer.image,
      imageFile: null,
      isCarousel: offer.is_carousel
    });
    setShowForm(true);
  };

  const handleDeleteOffer = async (offerId) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        setLoading(true);
        await deleteOffer(offerId);
        const updatedOffers = await getAllOffers();
        setOffers(updatedOffers);
        setSuccessMsg('Offer deleted successfully!');
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
      
      // Check if we already have 3 carousel offers and this would be a 4th
      if (!offer.is_carousel && carouselOffers.length >= 3) {
        throw new Error('You can only have up to 3 offers in the carousel. Please remove one first.');
      }
      
      await setCarouselOffer(offer.id, !offer.is_carousel);
      
      // Refresh offers
      const updatedOffers = await getAllOffers();
      setOffers(updatedOffers);
      
      // Update carousel offers
      const updatedCarouselItems = updatedOffers.filter(o => o.is_carousel);
      setCarouselOffers(updatedCarouselItems);
      
      setSuccessMsg(`Offer ${!offer.is_carousel ? 'added to' : 'removed from'} carousel successfully!`);
    } catch (error) {
      setErrorMsg(error.message || 'Failed to update carousel status');
    } finally {
      setLoading(false);
    }
  };

  const filteredFoodItems = foodItems.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Offers & Promotions</h2>
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

        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
              <button 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offer Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="E.g., Family Combo, Student Meal"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Brief description of the offer"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-100"
                    placeholder="0.00"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price (₹) *</label>
                  <input
                    type="number"
                    name="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Savings</label>
                  <div className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-green-600 font-medium">
                    {formData.price > 0 ? (
                      <>
                        ₹{(formData.price - formData.discountedPrice).toFixed(2)} 
                        ({((1 - formData.discountedPrice / formData.price) * 100).toFixed(0)}%)
                      </>
                    ) : '0.00'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
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
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Selected Items *</label>
                  <button
                    type="button"
                    onClick={() => setShowItemSelector(!showItemSelector)}
                    className="text-sm text-orange-600 hover:text-orange-800"
                  >
                    {showItemSelector ? 'Done' : 'Add/Remove Items'}
                  </button>
                </div>
                
                {selectedItems.length === 0 ? (
                  <div className="bg-gray-100 border border-dashed border-gray-300 rounded-md p-4 text-center text-gray-500">
                    No items selected. Click "Add/Remove Items" to select products for this offer.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">₹{item.price.toFixed(2)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleItemSelection(item)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {showItemSelector && (
                <div className="border border-gray-200 rounded-md p-4 bg-white shadow-sm">
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {filteredFoodItems.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleItemSelection(item)}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                          selectedItems.some(selected => selected.id === item.id) 
                            ? 'bg-orange-100 border border-orange-300' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.category} • ₹{item.price.toFixed(2)}
                          </div>
                        </div>
                        {selectedItems.some(selected => selected.id === item.id) && (
                          <Check size={16} className="text-orange-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCarousel"
                  checked={formData.isCarousel}
                  onChange={(e) => setFormData({...formData, isCarousel: e.target.checked})}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="isCarousel" className="ml-2 block text-sm text-gray-700">
                  Add to Main Carousel {carouselOffers.length}/3
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
                >
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Carousel Offers Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Carousel Offers ({carouselOffers.length}/3)</h3>
          
          {carouselOffers.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
              No offers added to carousel yet. Create an offer and check "Add to Main Carousel" to display it prominently.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {carouselOffers.map(offer => (
                <div key={offer.id} className="border rounded-lg overflow-hidden shadow-sm">
                  {offer.image ? (
                    <div className="aspect-[2/1] bg-gray-100">
                      <img 
                        src={offer.image} 
                        alt={offer.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/1] bg-gray-700 text-white flex flex-col justify-center items-center p-4">
                      <p className="text-xl font-medium text-center">{offer.description}</p>
                      <p className="text-3xl font-bold mt-2 text-center">
                        {((1 - offer.discounted_price / offer.price) * 100).toFixed(0)}% OFF
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3">
                    <h4 className="font-medium">{offer.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <span className="line-through text-gray-400 text-sm mr-2">₹{offer.price.toFixed(2)}</span>
                        <span className="text-orange-600 font-semibold">₹{offer.discounted_price.toFixed(2)}</span>
                      </div>
                      
                      <button
                        onClick={() => toggleCarouselStatus(offer)}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* All Offers Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">All Offers</h3>
          
          {offers.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              No offers available. Click "Create New Offer" to add your first offer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(offer => (
                <div key={offer.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="w-24 h-24 bg-gray-100">
                      {offer.image ? (
                        <img 
                          src={offer.image} 
                          alt={offer.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700 text-white text-xl font-bold">
                          {((1 - offer.discounted_price / offer.price) * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800">{offer.name}</h3>
                        <div className="text-right">
                          <span className="text-gray-400 text-xs line-through mr-1">₹{offer.price.toFixed(2)}</span>
                          <span className="text-orange-500 font-semibold">₹{offer.discounted_price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">{offer.description}</p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center text-xs">
                          <Tag size={12} className="mr-1 text-green-600" />
                          <span className="text-green-600">
                            {((1 - offer.discounted_price / offer.price) * 100).toFixed(0)}% off
                          </span>
                          
                          {offer.is_carousel && (
                            <span className="ml-2 bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                              Carousel
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
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
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OffersManagement;