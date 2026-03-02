import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    User,
    Building2,
    Mail,
    Phone,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
    Trash2,
    ExternalLink,
    ChevronDown,
    RefreshCw,
    Eye
} from 'lucide-react';
import { getAllInquiries, updateInquiryStatus, deleteInquiry } from '../admin_service.js';

const InquiryManagement = ({ searchTerm = '' }) => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const { data, error } = await getAllInquiries();
            if (error) throw new Error(error);
            setInquiries(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            setUpdatingId(id);
            const { error } = await updateInquiryStatus(id, newStatus);
            if (error) throw new Error(error);

            setInquiries(prev => prev.map(item =>
                item.id === id ? { ...item, status: newStatus } : item
            ));
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

        try {
            setUpdatingId(id);
            const { success, error } = await deleteInquiry(id);
            if (!success) throw new Error(error);

            setInquiries(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            alert('Failed to delete inquiry: ' + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'converted': return 'bg-green-100 text-green-700 border-green-200';
            case 'ignored': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const filteredInquiries = inquiries.filter(item => {
        const matchesSearch =
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading inquiries...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full font-spartan">
            {/* Stats Cards - Compact on Mobile */}
            <div className="grid grid-cols-4 gap-1 md:gap-3 px-1 md:px-0 mt-1 md:mt-2 pb-2 md:pb-0">
                <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-1 md:p-1.5 bg-blue-100 rounded-lg mb-0.5 md:mb-1">
                        <User className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs md:text-xl font-bold text-gray-900 leading-none">{inquiries.length}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">Total</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-1 md:p-1.5 bg-amber-100 rounded-lg mb-0.5 md:mb-1">
                        <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs md:text-xl font-bold text-gray-900 leading-none">{inquiries.filter(i => i.status === 'new' || !i.status).length}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">New</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-1 md:p-1.5 bg-green-100 rounded-lg mb-0.5 md:mb-1">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xs md:text-xl font-bold text-gray-900 leading-none">{inquiries.filter(i => i.status === 'converted').length}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">Won</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-1.5 md:p-3 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="p-1 md:p-1.5 bg-purple-100 rounded-lg mb-0.5 md:mb-1">
                        <Building2 className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xs md:text-xl font-bold text-gray-900 leading-none">{new Set(inquiries.map(i => i.restaurant_name).filter(Boolean)).size}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">Rest.</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-y md:border md:rounded-xl border-gray-200 md:shadow-sm mb-2 md:mb-3 mt-2 md:mt-4 overflow-x-auto no-scrollbar">
                <div className="p-2 md:p-3 min-w-max flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-50 rounded-lg border border-gray-200 p-0.5 overflow-hidden">
                            {[
                                { value: 'all', label: 'All Status' },
                                { value: 'new', label: 'New' },
                                { value: 'contacted', label: 'Contacted' },
                                { value: 'converted', label: 'Converted' },
                                { value: 'ignored', label: 'Ignored' }
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setStatusFilter(value)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${statusFilter === value
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 border-l border-gray-200 pl-2 sm:pl-3">
                        <button
                            onClick={fetchInquiries}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Leads List - Responsive */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Mobile View: Cards */}
                <div className="md:hidden">
                    {filteredInquiries.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <div className="flex flex-col items-center">
                                <AlertCircle size={40} className="mb-2 opacity-20" />
                                <p>No inquiries found</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredInquiries.map((item) => (
                                <div key={item.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                {item.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.restaurant_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setSelectedInquiry(item)}
                                                className="p-1.5 text-blue-600 bg-blue-50 rounded-lg"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-red-500 bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <Mail size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{item.email}</span>
                                        </div>
                                        {item.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone size={12} className="shrink-0 text-gray-400" />
                                                <span>{item.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                            <Building2 size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{item.interested_plan || 'Standard'} Plan</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} className="shrink-0 text-gray-400" />
                                            <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <span className="text-xs font-medium text-gray-400">Status</span>
                                        <div className="relative">
                                            <select
                                                value={item.status || 'new'}
                                                onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                                disabled={updatingId === item.id}
                                                className={`appearance-none pl-2 pr-6 py-1 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none ${getStatusColor(item.status || 'new')}`}
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="converted">Converted</option>
                                                <option value="ignored">Ignored</option>
                                            </select>
                                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Lead Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Restaurant & Plan</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle size={40} className="mb-2 opacity-20" />
                                            <p>No inquiries found matching your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInquiries.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                    {item.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.name}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                        <span className="flex items-center gap-1"><Mail size={12} /> {item.email}</span>
                                                        {item.phone && <span className="flex items-center gap-1"><Phone size={12} /> {item.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-800">{item.restaurant_name || 'N/A'}</p>
                                                <p className="text-xs text-blue-600 font-semibold uppercase mt-1">
                                                    {item.interested_plan || 'Standard'} Plan
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} />
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative inline-block text-left">
                                                <select
                                                    value={item.status || 'new'}
                                                    onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                                    disabled={updatingId === item.id}
                                                    className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none transition-colors ${getStatusColor(item.status || 'new')}`}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="converted">Converted</option>
                                                    <option value="ignored">Ignored</option>
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedInquiry(item)}
                                                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Inquiry Detail Modal */}
            {selectedInquiry && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedInquiry(null)}>
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <MessageSquare />
                                </div>
                                <h3 className="text-xl font-bold">Leads Detail</h3>
                            </div>
                            <button onClick={() => setSelectedInquiry(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Trash2 size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Contact Person</p>
                                    <p className="font-bold text-gray-900 border-l-2 border-blue-500 pl-3">{selectedInquiry.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Restaurant</p>
                                    <p className="font-bold text-gray-900 border-l-2 border-purple-500 pl-3">{selectedInquiry.restaurant_name}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                    <Mail className="text-blue-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Email Address</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedInquiry.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                    <Phone className="text-green-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone Number</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedInquiry.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Lead's Message</p>
                                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 italic text-gray-700 leading-relaxed shadow-inner">
                                    "{selectedInquiry.message || 'No message provided'}"
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <a
                                    href={`mailto:${selectedInquiry.email}`}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Mail size={18} /> Reply via Email
                                </a>
                                {selectedInquiry.phone && (
                                    <a
                                        href={`tel:${selectedInquiry.phone}`}
                                        className="w-14 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                                    >
                                        <Phone size={20} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiryManagement;
