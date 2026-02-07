import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/supabase';
import { createRestaurant, getEmailTemplate } from '../../../admin/pages/AdminPannel/admin_service.js';
import { applyTemplate } from '../../../shared/api/emailService';
import {
    Building2,
    User,
    Phone,
    Mail,
    MapPin,
    Clock,
    Calendar,
    Check,
    X,
    Eye,
    RefreshCw,
    Search,
    Filter,
    ChevronDown,
    FileText,
    CreditCard,
    Shield,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';



const RegistrationRequests = ({ searchTerm = '' }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    // Status colors
    const statusColors = {
        pending_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
        approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
        rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
        processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2 }
    };

    // Fetch registrations
    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('restaurant_registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setRegistrations(data || []);
        } catch (err) {
            console.error('Error fetching registrations:', err);
            setError('Failed to load registrations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistrations();
    }, [statusFilter]);

    // Filter registrations by search term
    const filteredRegistrations = registrations.filter(reg =>
        reg.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Approve registration
    const handleApprove = async (registration) => {
        // Validation
        if (!registration.restaurant_name || !registration.owner_email) {
            alert('Error: Missing required restaurant name or owner email.');
            return;
        }

        // Processing starts immediately (removed window.confirm)
        setProcessingId(registration.id);
        setError(null);

        try {
            // Check for existing restaurant by email (Safety check)
            const { data: existingRestaurant } = await supabase
                .from('restaurants')
                .select('id, name')
                .eq('contact_email', registration.owner_email)
                .maybeSingle();

            if (existingRestaurant) {
                // Strict duplicate check
                alert(`A restaurant with email ${registration.owner_email} already exists (${existingRestaurant.name}). Please handle this request manually.`);
                setProcessingId(null);
                return;
            }

            // 1. Create auth user (optional)
            try {
                const { error: userError } = await supabase.functions.invoke('create-user', {
                    body: {
                        email: registration.owner_email,
                        password: 'TempPass@123',
                        email_confirm: true,
                        user_metadata: {
                            full_name: registration.owner_name,
                            phone: registration.owner_phone
                        }
                    }
                });

                if (userError) throw userError;
            } catch (authError) {
                console.warn('User creation skipped:', authError);
            }

            // 2. Create Restaurant using Service (Handles validation, staff creation, etc.)
            const restaurantPayload = {
                name: registration.restaurant_name,
                address: registration.address || 'Address pending',
                description: registration.description,
                contact_phone: registration.owner_phone,
                contact_email: registration.owner_email,
                cuisine_type: registration.restaurant_type || registration.cuisine_type,
                opening_hours: registration.opening_hours,
                gst_number: registration.gst_number,
                fssai_license: registration.fssai_license,
                google_maps_link: registration.google_maps_link,
                latitude: registration.latitude,
                longitude: registration.longitude,
                // Manager details for staff creation
                manager_name: registration.owner_name,
                manager_email: registration.owner_email,
                manager_phone: registration.owner_phone,
                // Aggregator Keys
                swiggy_api_key: registration.swiggy_api_key,
                zomato_api_key: registration.zomato_api_key
            };

            const { data: restaurantData, error: restaurantError } = await createRestaurant(restaurantPayload);

            if (restaurantError) {
                throw new Error('Restaurant service failed: ' + restaurantError);
            }

            if (!restaurantData) throw new Error('Failed to create restaurant record');


            // 3. Create Subscription
            const plan = registration.selected_plan || 'starter';
            const billingCycle = registration.billing_cycle || 'monthly';
            const price = registration.plan_price || 0;
            const gstAmount = registration.gst_amount || 0;
            const totalAmount = registration.total_amount || 0;

            const startDate = new Date();
            const endDate = new Date();
            if (billingCycle === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // Manually insert subscription
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .insert([{
                    restaurant_id: restaurantData.id,
                    plan_name: plan,
                    billing_cycle: billingCycle,
                    plan_price: price,
                    gst_amount: gstAmount,
                    total_amount: totalAmount,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    next_payment_date: endDate.toISOString(),
                    last_payment_date: startDate.toISOString(),
                    payment_method: 'manual',
                    status: 'active',
                    auto_renew: true,
                    grace_period_days: 7
                }])
                .select()
                .single();

            if (subError) {
                console.error('Subscription creation failed:', subError);
            } else {
                // Log to subscription history (Missing in original code)
                const { error: historyError } = await supabase
                    .from('subscription_history')
                    .insert([{
                        subscription_id: subData.id,
                        restaurant_id: restaurantData.id,
                        action: 'created',
                        new_plan: plan,
                        new_status: 'active',
                        amount_paid: totalAmount,
                        gst_amount: gstAmount,
                        notes: 'Initial subscription via Admin Approval'
                    }]);

                if (historyError) console.error('Failed to create history log:', historyError);
            }

            // 4. Update Registration Status
            const { error: updateError } = await supabase
                .from('restaurant_registrations')
                .update({
                    status: 'approved',
                    reviewed_at: new Date().toISOString(),
                    review_notes: `Restaurant created via Admin Service. ID: ${restaurantData.id}`
                })
                .eq('id', registration.id);

            if (updateError) throw updateError;

            // Send Welcome Email
            try {
                // Fetch template from email_templates
                const template = await getEmailTemplate('email_template_welcome');
                let subject = 'Welcome to Table Tap - Your Account is Approved!';
                let html = `<h2>Welcome, ${registration.owner_name}!</h2><p>Your registration for ${registration.restaurant_name} has been approved.</p><p>Credentials: ${registration.owner_email} / TempPass@123</p>`;

                if (template) {
                    subject = template.subject;
                    html = template.html;

                    // Replace variables
                    const vars = {
                        owner_name: registration.owner_name,
                        restaurant_name: registration.restaurant_name,
                        email: registration.owner_email,
                        password: 'TempPass@123',
                        dashboard_link: window.location.origin + '/admin/login',
                        year: new Date().getFullYear()
                    };

                    const applied = applyTemplate(template.subject, template.html, vars);
                    subject = applied.subject;
                    html = applied.html;
                }

                await supabase.functions.invoke('send-email', {
                    body: {
                        to: registration.owner_email,
                        subject: subject,
                        html: html
                    }
                });
            } catch (emailErr) {
                console.error('Failed to send welcome email', emailErr);
            }

            fetchRegistrations();
            setShowDetailModal(false);
            alert(`Approved! Restaurant "${registration.restaurant_name}" created & staff assigned.`);

        } catch (err) {
            console.error('Approval Error:', err);
            setError(err.message);
            alert('Failed to approve: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    // Reject registration
    const handleReject = async (registration) => {
        const reason = window.prompt('Enter rejection reason (optional):');

        if (reason === null) return; // User cancelled

        setProcessingId(registration.id);

        try {
            const { error: updateError } = await supabase
                .from('restaurant_registrations')
                .update({
                    status: 'rejected',
                    reviewed_at: new Date().toISOString(),
                    review_notes: reason || 'Rejected by admin'
                })
                .eq('id', registration.id);

            if (updateError) throw updateError;

            fetchRegistrations();
            setShowDetailModal(false);
            alert('Registration has been rejected.');

        } catch (err) {
            console.error('Error rejecting registration:', err);
            alert('Failed to reject: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge
    const StatusBadge = ({ status }) => {
        const config = statusColors[status] || statusColors.pending_review;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                <Icon size={14} />
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
        );
    };

    return (
        <div className="p-6">
            {/* Header */}
            {/* Header removed as it is handled by AdminHeader */}

            {/* Filters */}
            {/* Filters - Single Line Compact Layout */}
            {/* Filters & Stats Toolbar - Single Line Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

                {/* Left Side: Status Filter */}
                <div className="relative min-w-[160px]">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white text-sm font-medium text-gray-700"
                    >
                        <option value="all">All Status</option>
                        <option value="pending_review">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {/* Right Side: Quick Stats Row */}
                <div className="grid grid-cols-4 gap-1.5 md:flex md:items-center md:gap-4 w-full md:w-auto">
                    <div className="flex flex-col md:flex-row items-center md:gap-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <span className="text-[9px] md:text-xs text-gray-500 font-bold uppercase tracking-wider text-center">Total</span>
                        <span className="text-xs md:text-sm font-bold text-gray-900">{registrations.length}</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:gap-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-yellow-50 rounded-lg border border-yellow-100">
                        <span className="text-[9px] md:text-xs text-yellow-600 font-bold uppercase tracking-wider text-center">Pending</span>
                        <span className="text-xs md:text-sm font-bold text-yellow-700">
                            {registrations.filter(r => r.status === 'pending_review').length}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:gap-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-green-50 rounded-lg border border-green-100">
                        <span className="text-[9px] md:text-xs text-green-600 font-bold uppercase tracking-wider text-center">Approved</span>
                        <span className="text-xs md:text-sm font-bold text-green-700">
                            {registrations.filter(r => r.status === 'approved').length}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:gap-2 px-1.5 py-1 md:px-3 md:py-1.5 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-[9px] md:text-xs text-red-600 font-bold uppercase tracking-wider text-center">Rejected</span>
                        <span className="text-xs md:text-sm font-bold text-red-700">
                            {registrations.filter(r => r.status === 'rejected').length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-orange-500" />
                </div>
            ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No registrations found</h3>
                    <p className="text-gray-400">Registration requests from the landing page will appear here</p>
                </div>
            ) : (
                /* Registrations Table */
                /* Responsive List View */
                <div className="space-y-4">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {filteredRegistrations.map((registration) => (
                            <div key={registration.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                                            <Building2 size={20} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 line-clamp-1">{registration.restaurant_name}</h3>
                                            <p className="text-xs text-gray-500 capitalize">{registration.restaurant_type?.replace('-', ' ')}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <StatusBadge status={registration.status} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-3 mt-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Owner</span>
                                        <div className="flex items-center gap-1">
                                            <User size={12} className="text-gray-400" />
                                            <span className="font-medium text-gray-900 text-xs">{registration.owner_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Date</span>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Calendar size={12} className="text-gray-400" />
                                            <span className="font-medium text-gray-900 text-xs">
                                                {new Date(registration.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-1">
                                    <button
                                        onClick={() => {
                                            setSelectedRegistration(registration);
                                            setShowDetailModal(true);
                                        }}
                                        className="flex-1 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} />
                                        Details
                                    </button>
                                    {registration.status === 'pending_review' && (
                                        <>
                                            <button
                                                onClick={() => handleApprove(registration)}
                                                disabled={processingId === registration.id}
                                                className="px-4 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                                                title="Approve"
                                            >
                                                <Check size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(registration)}
                                                disabled={processingId === registration.id}
                                                className="px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <X size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Restaurant</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRegistrations.map((registration) => (
                                        <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                                        <Building2 size={20} className="text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{registration.restaurant_name}</p>
                                                        <p className="text-sm text-gray-500 capitalize">{registration.restaurant_type?.replace('-', ' ')}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{registration.owner_name}</p>
                                                <p className="text-sm text-gray-500">{registration.owner_email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                                                    {registration.selected_plan}
                                                </span>
                                                {registration.total_amount && (
                                                    <p className="text-sm text-gray-500 mt-1">₹{registration.total_amount}/{registration.billing_cycle === 'monthly' ? 'mo' : 'yr'}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={registration.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">{formatDate(registration.created_at)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRegistration(registration);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    {registration.status === 'pending_review' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(registration)}
                                                                disabled={processingId === registration.id}
                                                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                <Check size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(registration)}
                                                                disabled={processingId === registration.id}
                                                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRegistration && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Registration Details</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <StatusBadge status={selectedRegistration.status} />
                                <span className="text-sm text-gray-500">
                                    {formatDate(selectedRegistration.created_at)}
                                </span>
                            </div>

                            {/* Owner Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User size={18} className="text-orange-500" />
                                    Owner Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Name</p>
                                        <p className="font-medium text-gray-900">{selectedRegistration.owner_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                                        <p className="font-medium text-gray-900">{selectedRegistration.owner_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                                        <p className="font-medium text-gray-900">{selectedRegistration.owner_phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Restaurant Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 size={18} className="text-orange-500" />
                                    Restaurant Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Restaurant Name</p>
                                        <p className="font-medium text-gray-900">{selectedRegistration.restaurant_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
                                        <p className="font-medium text-gray-900 capitalize">{selectedRegistration.restaurant_type?.replace('-', ' ')}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Address</p>
                                        <p className="font-medium text-gray-900">{selectedRegistration.address}</p>
                                    </div>
                                    {selectedRegistration.description && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Description</p>
                                            <p className="font-medium text-gray-900">{selectedRegistration.description}</p>
                                        </div>
                                    )}
                                    {selectedRegistration.seating_capacity && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Seating Capacity</p>
                                            <p className="font-medium text-gray-900">{selectedRegistration.seating_capacity} seats</p>
                                        </div>
                                    )}
                                    {selectedRegistration.opening_hours && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Operating Hours</p>
                                            <p className="font-medium text-gray-900">{selectedRegistration.opening_hours}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location Info */}
                            {(selectedRegistration.latitude || selectedRegistration.longitude || selectedRegistration.google_maps_link) && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <MapPin size={18} className="text-orange-500" />
                                        Precise Location
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedRegistration.latitude && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Latitude</p>
                                                <p className="font-medium text-gray-900">{selectedRegistration.latitude}</p>
                                            </div>
                                        )}
                                        {selectedRegistration.longitude && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Longitude</p>
                                                <p className="font-medium text-gray-900">{selectedRegistration.longitude}</p>
                                            </div>
                                        )}
                                        {selectedRegistration.google_maps_link && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Google Maps Link</p>
                                                <a
                                                    href={selectedRegistration.google_maps_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-1 group"
                                                >
                                                    View on Google Maps
                                                    <Check size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Legal Info */}
                            {(selectedRegistration.gst_number || selectedRegistration.fssai_license) && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Shield size={18} className="text-orange-500" />
                                        Legal & Compliance
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedRegistration.gst_number && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">GST Number</p>
                                                <p className="font-medium text-gray-900">{selectedRegistration.gst_number}</p>
                                            </div>
                                        )}
                                        {selectedRegistration.fssai_license && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">FSSAI License</p>
                                                <p className="font-medium text-gray-900">{selectedRegistration.fssai_license}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Plan Info */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <CreditCard size={18} className="text-blue-500" />
                                    Selected Plan
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Plan</p>
                                        <p className="font-semibold text-blue-700 capitalize">{selectedRegistration.selected_plan}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Billing</p>
                                        <p className="font-medium text-gray-900 capitalize">{selectedRegistration.billing_cycle}</p>
                                    </div>
                                    {selectedRegistration.total_amount && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                                            <p className="font-semibold text-green-600">₹{selectedRegistration.total_amount}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Review Notes */}
                            {selectedRegistration.review_notes && (
                                <div className="bg-yellow-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Review Notes</h3>
                                    <p className="text-gray-700">{selectedRegistration.review_notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        {selectedRegistration.status === 'pending_review' && (
                            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={() => handleReject(selectedRegistration)}
                                    disabled={processingId === selectedRegistration.id}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    <X size={18} />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedRegistration)}
                                    disabled={processingId === selectedRegistration.id}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    {processingId === selectedRegistration.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Check size={18} />
                                    )}
                                    Confirm Approval
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationRequests;
