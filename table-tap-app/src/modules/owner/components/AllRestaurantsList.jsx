import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    ArrowRight,
    Search,
    Filter,
    MapPin,
    Users,
    ChevronRight,
    ExternalLink,
    Store,
    Plus
} from 'lucide-react';

const AllRestaurantsList = ({ restaurants }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRestaurants = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Search */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
                        <p className="text-gray-500 text-sm">Manage all your restaurants from one place</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search restaurants..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 whitespace-nowrap">
                            <Plus size={18} /> Connect New
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid of Restaurants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((restaurant) => (
                    <div
                        key={restaurant.id}
                        className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all overflow-hidden flex flex-col"
                    >
                        {/* Status Ribbon (Mock for now) */}
                        <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-500" />

                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 p-2 flex items-center justify-center">
                                    {restaurant.logo_url ? (
                                        <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 size={24} className="text-gray-400" />
                                    )}
                                </div>
                                <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Active
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
                                {restaurant.name}
                            </h3>

                            <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                                <MapPin size={14} />
                                <span className="truncate">{restaurant.address || 'Address not set'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Staff</span>
                                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                                        <Users size={14} className="text-orange-400" /> Admin
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Orders</span>
                                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                                        <Store size={14} className="text-orange-400" /> Live
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center gap-2">
                            <button
                                onClick={() => navigate(`/restaurant/${restaurant.id}/dashboard`)}
                                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={14} /> View Dashboard
                            </button>
                            <button className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-200 transition-all">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AllRestaurantsList;
