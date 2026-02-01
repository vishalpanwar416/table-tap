'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X, Navigation, Check } from 'lucide-react';

export default function LocationPicker({ onLocationSelect, onClose, initialLocation }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const searchInputRef = useRef(null);
    const autocompleteRef = useRef(null);

    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState(null);

    // Load Google Maps Script
    useEffect(() => {
        if (window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            setError('Google Maps API key not configured');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setError('Failed to load Google Maps');
        document.head.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

        const defaultCenter = initialLocation?.lat && initialLocation?.lng
            ? { lat: initialLocation.lat, lng: initialLocation.lng }
            : { lat: 17.385, lng: 78.4867 }; // Hyderabad default

        const map = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 15,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControlOptions: {
                position: window.google.maps.ControlPosition.RIGHT_CENTER
            }
        });

        mapInstanceRef.current = map;

        // Create marker
        const marker = new window.google.maps.Marker({
            map,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
            icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#2A9D8F',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
            }
        });

        if (initialLocation?.lat && initialLocation?.lng) {
            marker.setPosition(defaultCenter);
            setSelectedLocation(initialLocation);
        }

        markerRef.current = marker;

        // Click on map to place marker
        map.addListener('click', (e) => {
            const position = e.latLng;
            marker.setPosition(position);
            reverseGeocode(position.lat(), position.lng());
        });

        // Drag marker
        marker.addListener('dragend', () => {
            const position = marker.getPosition();
            reverseGeocode(position.lat(), position.lng());
        });

        // Initialize autocomplete
        if (searchInputRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
                componentRestrictions: { country: 'in' },
                fields: ['address_components', 'geometry', 'formatted_address', 'name']
            });

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    const location = place.geometry.location;
                    map.setCenter(location);
                    map.setZoom(17);
                    marker.setPosition(location);
                    processPlaceResult(place);
                }
            });

            autocompleteRef.current = autocomplete;
        }
    }, [isLoaded, initialLocation]);

    const reverseGeocode = async (lat, lng) => {
        if (!window.google?.maps) return;

        const geocoder = new window.google.maps.Geocoder();
        try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                processPlaceResult(response.results[0], lat, lng);
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        }
    };

    const processPlaceResult = (place, lat, lng) => {
        const addressComponents = place.address_components || [];
        let address = '';
        let city = '';
        let state = '';
        let pincode = '';
        let country = '';

        addressComponents.forEach(component => {
            const types = component.types;
            if (types.includes('street_number') || types.includes('route') || types.includes('sublocality_level_2') || types.includes('sublocality_level_1')) {
                address += (address ? ', ' : '') + component.long_name;
            }
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                if (!city) city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
            }
            if (types.includes('postal_code')) {
                pincode = component.long_name;
            }
            if (types.includes('country')) {
                country = component.long_name;
            }
        });

        const latitude = lat || place.geometry?.location?.lat();
        const longitude = lng || place.geometry?.location?.lng();

        const locationData = {
            address: address || place.formatted_address?.split(',')[0] || '',
            city,
            state,
            pincode,
            country,
            lat: latitude,
            lng: longitude,
            formattedAddress: place.formatted_address || '',
            googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
        };

        setSelectedLocation(locationData);
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const latLng = { lat: latitude, lng: longitude };

                if (mapInstanceRef.current && markerRef.current) {
                    mapInstanceRef.current.setCenter(latLng);
                    mapInstanceRef.current.setZoom(17);
                    markerRef.current.setPosition(latLng);
                    reverseGeocode(latitude, longitude);
                }
                setIsLocating(false);
            },
            (err) => {
                setError('Unable to get your location. Please search or click on the map.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
        }
    };

    if (error && !isLoaded) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Unable to Load Map</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#2A9D8F]/10 rounded-2xl flex items-center justify-center">
                            <MapPin className="text-[#2A9D8F]" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Select Location</h2>
                            <p className="text-gray-500 text-sm font-medium">Search or click on the map to pin your restaurant</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search for your restaurant location..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 focus:border-[#2A9D8F] font-medium text-gray-900"
                        />
                    </div>
                    <button
                        onClick={handleCurrentLocation}
                        disabled={isLocating}
                        className="px-4 py-3 bg-[#2A9D8F]/10 text-[#2A9D8F] rounded-xl font-bold flex items-center gap-2 hover:bg-[#2A9D8F]/20 transition-colors disabled:opacity-50"
                    >
                        {isLocating ? (
                            <div className="w-5 h-5 border-2 border-[#2A9D8F] border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Navigation size={20} />
                        )}
                        <span className="hidden sm:inline">Current Location</span>
                    </button>
                </div>

                {/* Map */}
                <div className="relative">
                    {!isLoaded && (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                            <div className="text-center">
                                <div className="w-10 h-10 border-3 border-[#2A9D8F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Loading map...</p>
                            </div>
                        </div>
                    )}
                    <div ref={mapRef} className="w-full h-[350px]" />
                </div>

                {/* Selected Location Info */}
                {selectedLocation && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#2A9D8F] rounded-xl flex items-center justify-center shrink-0">
                                <MapPin className="text-white" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 truncate">{selectedLocation.formattedAddress || selectedLocation.address}</p>
                                <p className="text-sm text-gray-500">
                                    {[selectedLocation.city, selectedLocation.state, selectedLocation.pincode].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedLocation}
                        className="px-6 py-3 bg-[#2A9D8F] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#238b7e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={20} />
                        Confirm Location
                    </button>
                </div>
            </div>
        </div>
    );
}
