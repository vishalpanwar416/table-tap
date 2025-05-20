import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { QRCodeSVG } from 'qrcode.react';

const QRGeneratorPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    city: '',
    location: null
  });
  const [qrUrl, setQrUrl] = useState('');
  const navigate = useNavigate();


  const parseGoogleMapsUrl = (url) => {
    try {
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      return coordMatch ? {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      } : null;
    } catch {
      return null;
    }
  };
  // Fetch all restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setRestaurants(data);
    };
    fetchRestaurants();
  }, []);

  // Generate QR URL
  const generateQR = (restaurant) => {
    const slug = restaurant.name.toLowerCase().replace(/ /g, '-') + '-' + restaurant.id.slice(0,4);
    const url = `${window.location.origin}/login?restaurant=${slug}`;
    setQrUrl(url);
    setSelectedRestaurant(restaurant);
  };

  // Create new restaurant
  const handleCreateRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.address) return;
    
    const { data, error } = await supabase
      .from('restaurants')
      .insert([{
        ...newRestaurant,
        location: `POINT(${newRestaurant.location?.lng || 0} ${newRestaurant.location?.lat || 0})`
      }])
      .select()
      .single();

    if (data) {
      setRestaurants([data, ...restaurants]);
      setNewRestaurant({ name: '', address: '', city: '', location: null });
      generateQR(data);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Restaurant QR Generator</h1>

      {/* Create New Restaurant Form */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add New Restaurant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Restaurant Name"
            className="p-2 border rounded"
            value={newRestaurant.name}
            onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="Address"
            className="p-2 border rounded"
            value={newRestaurant.address}
            onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
          />
          <input
            type="text"
            placeholder="City"
            className="p-2 border rounded"
            value={newRestaurant.city}
            onChange={(e) => setNewRestaurant({...newRestaurant, city: e.target.value})}
          />
          <button
            onClick={handleCreateRestaurant}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Restaurant
          </button>
        </div>
      </div>

      {/* Restaurant Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Existing Restaurant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurants.map(restaurant => (
            <div
              key={restaurant.id}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => generateQR(restaurant)}
            >
              <h3 className="font-semibold">{restaurant.name}</h3>
              <p className="text-sm text-gray-600">{restaurant.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* QR Display */}
      {selectedRestaurant && qrUrl && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg text-center">
          <h3 className="text-xl font-semibold mb-4">{selectedRestaurant.name} QR Code</h3>
          <div className="mb-4">
          <QRCodeSVG
            value={qrUrl}
            size={256}
            level="H"
            includeMargin={true}
          />
          </div>
          <p className="text-sm text-gray-600 break-all">{qrUrl}</p>
          <button
            onClick={() => navigator.clipboard.writeText(qrUrl)}
            className="mt-4 text-blue-500 hover:text-blue-600"
          >
            Copy URL
          </button>
        </div>
      )}
    </div>
  );
};

export default QRGeneratorPage;