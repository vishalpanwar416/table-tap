import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  IndianRupee,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Building2,
  Package,
  Brain,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Download,
  Filter,
  Search,
  RotateCcw,
  CalendarClock,
  ChevronDown,
  FileText,
  Printer,
  Send,
  Mail,
  Stars
} from 'lucide-react';
import {
  createInvoiceData,
  generateProfessionalInvoiceHTML,
  printInvoice,
  generateInvoicePDF,
  COMPANY_DETAILS
} from '../../../../shared/utils/invoiceGenerator';
import {
  getRestaurantInvoices,
  sendInvoiceEmail,
  getCompanyDetails as fetchCompanyDetails
} from '../../../../shared/api/invoiceService';
import {
  getSubscriptionPlans,
  getBillingCycles,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getRestaurantSubscriptions,
  assignSubscriptionToRestaurant,
  updateRestaurantSubscription,
  cancelRestaurantSubscription,
  reactivateSubscription,
  getSubscriptionStats,
  getUpcomingRenewals,
  processExpiredSubscriptions,
  getSubscriptionHistory,
  getPaginatedSubscriptions
} from '../../../../admin/api/subscriptionService';
import { supabase } from '../../../../shared/supabase';
import { getAllRestaurants, getSystemSetting, getEmailTemplate } from '../admin_service.js';
import { applyTemplate } from '../../../../shared/api/emailService';

const SubscriptionManagementV2 = () => {


  const [activeTab, setActiveTab] = useState('overview');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [billingCycles, setBillingCycles] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Pagination & Loading States for Tabs
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingRenewals, setLoadingRenewals] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Billing & Invoice State
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [viewingInvoices, setViewingInvoices] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [selectedBillingRestaurant, setSelectedBillingRestaurant] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);

  // Error handler helper
  const handleError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Form states
  const [assignForm, setAssignForm] = useState({
    restaurant_id: '',
    plan_id: '',
    billing_cycle: 'monthly',
    payment_method: 'manual',
    notes: ''
  });

  const [planForm, setPlanForm] = useState({
    key: '',
    name: '',
    description: '',
    base_price: 0,
    features: [],
    color: 'from-primary-500 to-cyan-500',
    icon: 'Zap',
    is_active: true,
    is_public: true,
    is_popular: false,
    badge_text: '',
    use_custom_builder: false,
    button_text: '',
    plan_discount_percentage: 0,
    ai_features_enabled: false,
    cycle_discounts: {}
  });

  useEffect(() => {
    // Initial master data fetch
    fetchMasterData();
  }, []);

  useEffect(() => {
    // Fetch data for the current tab
    if (activeTab === 'subscriptions' || activeTab === 'billing') {
      setPage(1);
      fetchTabData(activeTab, 1, false);
    } else {
      fetchTabData(activeTab);
    }
  }, [activeTab]);

  const fetchMasterData = async () => {
    try {
      const [plansRes, cyclesRes] = await Promise.all([
        getSubscriptionPlans(),
        getBillingCycles()
      ]);
      setPlans(plansRes.data || []);
      setBillingCycles(cyclesRes.data || []);
    } catch (e) {
      console.error('Master data fail:', e);
    }
  };

  const fetchTabData = async (tab, pageNum = 1, isLoadMore = false) => {
    try {
      setError(null);
      if (pageNum === 1) setLoading(true);

      switch (tab) {
        case 'overview':
          setLoadingStats(true);
          const statsRes = await getSubscriptionStats();
          if (statsRes.data) setStats(statsRes.data);
          setLoadingStats(false);
          break;
        case 'expiring':
          setLoadingRenewals(true);
          const renewalsRes = await getUpcomingRenewals(14);
          setUpcomingRenewals(renewalsRes.data || []);
          setLoadingRenewals(false);
          break;
        case 'subscriptions':
        case 'billing':
          if (isLoadMore) setLoadingMore(true);
          const subsRes = await getPaginatedSubscriptions(pageNum, pageSize);

          if (isLoadMore) {
            setSubscriptions(prev => [...prev, ...(subsRes.data || [])]);
          } else {
            setSubscriptions(subsRes.data || []);
            // Also fetch restaurants for the lookup if needed for assignment modal
            const restRes = await getAllRestaurants();
            setRestaurants(restRes.data || []);
          }

          setTotalCount(subsRes.totalCount);
          setHasMore((pageNum * pageSize) < subsRes.totalCount);
          setLoadingMore(false);
          break;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setLoadingStats(false);
      setLoadingRenewals(false);
      setLoadingMore(false);
    }
  };

  const fetchData = () => fetchTabData(activeTab, page, false);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTabData(activeTab, nextPage, true);
    }
  };

  const handleProcessExpired = async () => {
    try {
      setLoading(true);
      const response = await processExpiredSubscriptions();
      if (response.error) throw new Error(response.error);
      setSuccess(`Processed ${response.data?.processedCount || 0} expired subscriptions`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessingId('assign');
      const subscriptionData = {
        ...assignForm,
        status: 'active'
      };

      let response;
      if (editingSubscription) {
        response = await updateRestaurantSubscription(editingSubscription.id, subscriptionData);
      } else {
        response = await assignSubscriptionToRestaurant(subscriptionData);
      }

      if (response.error) throw new Error(response.error);

      setShowAssignModal(false);
      setEditingSubscription(null);
      resetAssignForm();
      setSuccess(editingSubscription ? 'Subscription updated!' : 'Subscription assigned!');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelSubscription = async (subscription) => {
    const reason = window.prompt('Enter cancellation reason (optional):');
    if (reason === null) return;

    try {
      setProcessingId(subscription.id);
      const response = await cancelRestaurantSubscription(subscription.id, reason);
      if (response.error) throw new Error(response.error);
      setSuccess(`Subscription for "${subscription.restaurant?.name}" has been cancelled`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReactivate = async (subscription) => {
    if (!window.confirm(`Reactivate subscription for "${subscription.restaurant?.name}"?`)) return;

    try {
      setProcessingId(subscription.id);
      const response = await reactivateSubscription(subscription.id);
      if (response.error) throw new Error(response.error);
      setSuccess(`Subscription for "${subscription.restaurant?.name}" has been reactivated`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      restaurant_id: '',
      plan_id: 'lite',
      billing_cycle: 'monthly',
      payment_method: 'manual',
      notes: ''
    });
  };

  const openPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      // Ensure features is an array and exclude potentially problematic fields like nested objects
      setPlanForm({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        // Ensure other fields have defaults if missing
        color: plan.color || 'from-primary-500 to-cyan-500',
        icon: plan.icon || 'Zap',
        is_public: plan.is_public !== false, // Default to true if undefined
        is_popular: !!plan.is_popular,
        badge_text: plan.badge_text || '',
        use_custom_builder: !!plan.use_custom_builder,
        button_text: plan.button_text || '',
        plan_discount_percentage: plan.plan_discount_percentage || 0,
        plan_discount_percentage: plan.plan_discount_percentage || 0,
        ai_features_enabled: !!plan.ai_features_enabled,
        cycle_discounts: plan.cycle_discounts || {}
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        key: '',
        name: '',
        description: '',
        base_price: 0,
        features: [],
        color: 'from-primary-500 to-cyan-500',
        icon: 'Zap',
        is_active: true,
        is_public: true,
        is_popular: false,
        badge_text: '',
        use_custom_builder: false,
        button_text: '',
        plan_discount_percentage: 0,
        ai_features_enabled: false
      });
    }
    setShowPlanModal(true);
  };

  const openAssignModal = (subscription = null) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setAssignForm({
        restaurant_id: subscription.restaurant_id,
        plan_id: subscription.plan_name,
        billing_cycle: subscription.billing_cycle,
        payment_method: subscription.payment_method || 'manual',
        notes: ''
      });
    } else {
      setEditingSubscription(null);
      resetAssignForm();
      // Pre-select first plan if available
      if (plans.length > 0) {
        setAssignForm(prev => ({ ...prev, plan_id: plans[0].key }));
      }
    }
    setShowAssignModal(true);
  };

  const handlePlanSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    console.log('--- Submitting Plan ---');
    console.log('Mode:', editingPlan ? 'Edit' : 'Create');
    console.log('Original Plan:', editingPlan);
    console.log('Form State:', planForm);

    try {
      setProcessingId('plan');
      setError(null);

      // Extract and validate fields
      const payload = {
        key: planForm.key?.trim(),
        name: planForm.name?.trim(),
        description: planForm.description?.trim(),
        base_price: isNaN(parseInt(planForm.base_price)) ? 0 : parseInt(planForm.base_price),
        features: Array.isArray(planForm.features) ? planForm.features : [],
        color: planForm.color || 'from-primary-500 to-cyan-500',
        icon: planForm.icon || 'Zap',
        is_active: planForm.is_active !== false,
        is_public: planForm.is_public !== false,
        is_popular: !!planForm.is_popular,
        badge_text: planForm.badge_text || '',
        use_custom_builder: !!planForm.use_custom_builder,
        button_text: planForm.button_text?.trim() || 'Get Started Now',
        plan_discount_percentage: isNaN(parseInt(planForm.plan_discount_percentage)) ? 0 : parseInt(planForm.plan_discount_percentage),
        ai_features_enabled: !!planForm.ai_features_enabled,
        cycle_discounts: planForm.cycle_discounts || {}
      };

      console.log('Payload constructed:', payload);

      if (!payload.name || !payload.key) {
        throw new Error('Name and Key are required fields.');
      }

      let response;
      if (editingPlan && editingPlan.id) {
        console.log('Calling updateSubscriptionPlan with ID:', editingPlan.id);
        response = await updateSubscriptionPlan(editingPlan.id, payload);
      } else {
        console.log('Calling createSubscriptionPlan');
        response = await createSubscriptionPlan(payload);
      }

      console.log('Service Response:', response);

      if (response.error) throw new Error(response.error);
      if (!response.data) throw new Error('Operation successful but no data returned. Refresh to see changes.');

      // If we got here, it was successful
      setShowPlanModal(false);
      setSuccess(editingPlan ? 'Changes saved successfully!' : 'Plan created successfully!');

      // Refresh the data to reflect changes in the UI
      console.log('Refreshing data...');
      await fetchData();
      console.log('Data refreshed.');

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error submitting plan:', error);
      setError(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) return;
    try {
      const response = await deleteSubscriptionPlan(id);
      if (response.error) throw new Error(response.error);
      setSuccess('Plan deactivated');
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm('This will create default plans (Starter, Professional, Enterprise). Continue?')) return;
    setLoading(true);
    try {
      const defaultPlans = [
        {
          key: 'lite',
          name: 'Lite',
          description: 'QR ordering, digital menu, and basic analytics for small outlets.',
          base_price: 899,
          features: [
            "QR ordering & Digital menu",
            "Order dashboard & Tables",
            "10 staff seats",
            "Email billing/receipts",
            "Basic sales/traffic analytics",
            "WhatsApp pay-as-you-go (₹1/msg)",
            "Email support (weekdays)",
            "Self-serve onboarding"
          ],
          color: 'from-primary-500 to-cyan-500',
          icon: 'Zap',
          is_active: true,
          is_public: true,
          is_popular: false,
          ai_features_enabled: false,
          button_text: 'Get Started Now'
        },
        {
          key: 'standard',
          name: 'Standard',
          description: 'Advanced inventory, costing, and messaging for growing restaurants.',
          base_price: 1199,
          features: [
            "Everything in Lite",
            "Inventory & costing (Recipes, stock alerts)",
            "Product mix & daypart analytics",
            "300 WhatsApp msgs/mo included",
            "25 staff seats & Role-based access",
            "Basic aggregator status toggle",
            "Email/In-app support (7 days)",
            "30-min guided onboarding call"
          ],
          color: 'from-amber-500 to-orange-500',
          icon: 'Stars',
          is_active: true,
          is_public: true,
          is_popular: true,
          badge_text: 'Most Popular',
          ai_features_enabled: false,
          button_text: 'Start Free Trial'
        },
        {
          key: 'pro',
          name: 'Pro',
          description: 'AI insights, full aggregator sync, and priority support for high-volume ops.',
          base_price: 1699,
          features: [
            "Everything in Standard",
            "800 WhatsApp msgs/mo included",
            "AI forecasting & smart alerts",
            "Full aggregator sync & relay",
            "Floor plan + KDS (Captain/Counter)",
            "Mini-site + order link (Custom domain)",
            "50 staff seats & Audit logs",
            "Priority performance support (SLA)",
            "Done-for-you menu setup & training"
          ],
          color: 'from-slate-700 to-slate-900',
          icon: 'Crown',
          is_active: true,
          is_public: true,
          is_popular: false,
          ai_features_enabled: true,
          button_text: 'Get Pro Today'
        },
        {
          key: 'custom',
          name: 'Enterprise',
          description: 'Bespoke solutions for restaurant chains and enterprise groups.',
          base_price: 2999,
          features: [
            "Bespoke Multi-outlet controls",
            "Custom WhatsApp bundles (10k-50k)",
            "Dedicated DB / Project isolation",
            "Custom AI & ERP integrations",
            "SSO & Security audit trails",
            "Dedicated CSM & Priority SLA",
            "Starting ₹2,999 - ₹5,999/mo",
            "Full migration & onboarding support"
          ],
          color: 'from-amber-600 to-primary-700',
          icon: 'Building2',
          is_active: true,
          is_public: true,
          is_popular: false,
          ai_features_enabled: true,
          use_custom_builder: true,
          button_text: 'Build Your Plan'
        }
      ];
      for (const plan of defaultPlans) {
        const existing = plans.find(p => p.key === plan.key);
        if (!existing) {
          await createSubscriptionPlan(plan);
        } else {
          // Update existing plan details
          await updateSubscriptionPlan(existing.id, plan);
        }
      }
      setSuccess('Default plans initialized successfully');
      await fetchData();
    } catch (err) {
      setError('Failed to initialize plans: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get restaurants without active subscription
  const availableRestaurants = restaurants.filter(r =>
    !subscriptions.some(s => s.restaurant_id === r.id && ['active', 'grace_period'].includes(s.status))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'grace_period': return 'text-primary-600 bg-primary-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'grace_period': return <AlertTriangle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleViewBilling = async (subscription) => {
    try {
      setProcessingId(subscription.id);
      setSelectedBillingRestaurant(subscription.restaurant);

      const { data, error } = await getSubscriptionHistory(subscription.restaurant_id);
      if (error) throw error;

      setBillingHistory(data || []);
      setViewingInvoices(true);
    } catch (err) {
      console.error('Error fetching billing history:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const generateInvoice = async (transaction) => {
    // Generate professional PDF invoice
    setDownloadingInvoice(transaction.id);

    try {
      // Get subscription data for this restaurant
      const subscription = subscriptions.find(s => s.restaurant_id === transaction.restaurant_id);

      // Create invoice data
      const invoiceData = createInvoiceData({
        transaction: {
          id: transaction.id,
          created_at: transaction.created_at,
          amount_paid: transaction.amount_paid,
          gst_amount: transaction.gst_amount || (transaction.amount_paid - transaction.amount_paid / 1.18),
          plan_name: transaction.plan_name || subscription?.plan_name,
          billing_cycle: transaction.billing_cycle || subscription?.billing_cycle,
          payment_reference: transaction.payment_reference
        },
        restaurant: selectedBillingRestaurant,
        subscription: subscription,
        invoiceNumber: `TT-${transaction.id.slice(0, 8).toUpperCase()}`,
        companyDetails: COMPANY_DETAILS
      });

      // Generate and download PDF
      await generateInvoicePDF(invoiceData);
    } catch (err) {
      console.error('Error generating invoice PDF:', err);
      // Fallback to HTML download
      const subscription = subscriptions.find(s => s.restaurant_id === transaction.restaurant_id);
      const invoiceData = createInvoiceData({
        transaction: {
          id: transaction.id,
          created_at: transaction.created_at,
          amount_paid: transaction.amount_paid,
          gst_amount: transaction.gst_amount,
          plan_name: transaction.plan_name || subscription?.plan_name,
          billing_cycle: transaction.billing_cycle || subscription?.billing_cycle,
          payment_reference: transaction.payment_reference
        },
        restaurant: selectedBillingRestaurant,
        subscription: subscription,
        invoiceNumber: `TT-${transaction.id.slice(0, 8).toUpperCase()}`,
        companyDetails: COMPANY_DETAILS
      });

      const html = generateProfessionalInvoiceHTML(invoiceData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-TT-${transaction.id.slice(0, 8).toUpperCase()}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Print invoice
  const handlePrintInvoice = (transaction) => {
    const subscription = subscriptions.find(s => s.restaurant_id === transaction.restaurant_id);
    const invoiceData = createInvoiceData({
      transaction: {
        id: transaction.id,
        created_at: transaction.created_at,
        amount_paid: transaction.amount_paid,
        gst_amount: transaction.gst_amount,
        plan_name: transaction.plan_name || subscription?.plan_name,
        billing_cycle: transaction.billing_cycle || subscription?.billing_cycle,
        payment_reference: transaction.payment_reference
      },
      restaurant: selectedBillingRestaurant,
      subscription: subscription,
      invoiceNumber: `TT-${transaction.id.slice(0, 8).toUpperCase()}`,
      companyDetails: COMPANY_DETAILS
    });
    printInvoice(invoiceData);
  };

  // Helper to generate Invoice HTML


  const handleResendEmail = async (transaction) => {
    if (!selectedBillingRestaurant?.contact_email) {
      handleError("This restaurant currently has no contact email configured.");
      return;
    }

    setProcessingId(`email-${transaction.id}`);

    try {
      // Fetch template
      const template = await getEmailTemplate('email_template_invoice');

      let subject = `Invoice #${transaction.id.slice(0, 8).toUpperCase()} - TableTap`;
      let html = `<p>Thank you for your business. Your invoice #${transaction.id.slice(0, 8).toUpperCase()} for ₹${transaction.amount_paid} is ready.</p>`;

      if (template) {
        subject = template.subject;
        html = template.html;

        // Calculate values for template variables
        const date = new Date(transaction.created_at).toLocaleDateString('en-IN', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        const amount = Number(transaction.amount_paid);
        let subtotal, gst;
        if (transaction.gst_amount) {
          gst = Number(transaction.gst_amount).toFixed(2);
          subtotal = (amount - Number(gst)).toFixed(2);
        } else {
          subtotal = (amount / 1.18).toFixed(2);
          gst = (amount - Number(subtotal)).toFixed(2);
        }

        const vars = {
          invoice_number: transaction.id.slice(0, 8).toUpperCase(),
          date: date,
          restaurant_name: selectedBillingRestaurant.name,
          plan_name: transaction.plan_name,
          billing_cycle: transaction.billing_cycle,
          subtotal: subtotal,
          gst: gst,
          total_paid: amount.toFixed(2),
          year: new Date().getFullYear()
        };

        const applied = applyTemplate(template.subject, template.html, vars);
        subject = applied.subject;
        html = applied.html;
      }

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: selectedBillingRestaurant.contact_email,
          subject: subject,
          html: html,
          text: `Invoice for ₹${transaction.amount_paid} - ${new Date(transaction.created_at).toLocaleDateString()}`
        }
      });

      if (error) throw error;

      // Check response success (if function returns success: false)
      if (data && data.success === false) {
        throw new Error(data.error || "Email service returned failure.");
      }

      setSuccess(`Invoice email sent to ${selectedBillingRestaurant.contact_email}`);

      // Update local state to show 'Sent'
      setBillingHistory(prev => prev.map(txn =>
        txn.id === transaction.id ? { ...txn, email_sent: true } : txn
      ));

    } catch (err) {
      console.error('Email send failed:', err);
      // Friendly message for common error (Missing secrets)
      if (err.message && (err.message.includes('Function not found') || err.message.includes('Failed to fetch'))) {
        handleError("Email service unavailable. Please define and deploy the 'send-email' function.");
      } else {
        handleError(`Failed to send email: ${err.message}`);
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleSendRenewalReminder = async (subscription) => {
    if (!subscription.restaurant?.contact_email) {
      handleError("This restaurant currently has no contact email configured.");
      return;
    }

    setProcessingId(`remind-${subscription.id}`);

    try {
      // Fetch template
      const template = await getEmailTemplate('email_template_renewal_reminder');

      let subject = `Action Required: Your Table Tap Subscription is Expiring Soon`;
      let html = `<p>Hello,</p><p>This is a reminder that your subscription is expiring.</p>`;

      if (template) {
        subject = template.subject;
        html = template.html;

        const vars = {
          restaurant_name: subscription.restaurant.name,
          plan_name: subscription.plan_name,
          days_left: subscription.daysUntilExpiry,
          expiration_date: formatDate(subscription.end_date)
        };

        const applied = applyTemplate(template.subject, template.html, vars);
        subject = applied.subject;
        html = applied.html;
      }

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: subscription.restaurant.contact_email,
          subject: subject,
          html: html,
          text: `Your subscription for ${subscription.restaurant.name} is expiring in ${subscription.daysUntilExpiry} days.`
        }
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || "Email service returned failure.");
      }

      setSuccess(`Reminder email sent to ${subscription.restaurant.contact_email}`);

    } catch (err) {
      console.error('Email send failed:', err);
      if (err.message && (err.message.includes('Function not found') || err.message.includes('Failed to fetch'))) {
        handleError("Email service unavailable. Please define and deploy the 'send-email' function.");
      } else {
        handleError(`Failed to send reminder: ${err.message}`);
      }
    } finally {
      setProcessingId(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Dedicated Invoice Page View
  if (viewingInvoices && selectedBillingRestaurant) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewingInvoices(false)}
            className="p-3 hover:bg-white bg-gray-50 rounded-xl transition-all text-gray-500 hover:text-gray-900 shadow-sm hover:shadow"
          >
            <ArrowLeft size={20} />
          </button>

          {selectedBillingRestaurant?.logo_url && (
            <img
              src={selectedBillingRestaurant.logo_url}
              alt={selectedBillingRestaurant.name}
              className="w-12 h-12 rounded-xl object-cover shadow-sm border border-gray-100 hidden sm:block"
            />
          )}

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Invoices: {selectedBillingRestaurant.name}</h1>
            <p className="text-gray-500 text-sm">Sorted by date and time • {billingHistory.length} Records</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {billingHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="w-8 h-8 opacity-20" />
                        <p>No invoices found for this restaurant.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  billingHistory.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{new Date(txn.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500 font-medium">{new Date(txn.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 capitalize">{txn.plan_name} Plan</p>
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">{txn.billing_cycle} Cycle</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">₹{txn.amount_paid?.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${txn.action === 'created' || txn.action === 'renewed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {txn.action === 'created' || txn.action === 'renewed' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                          Paid
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {txn.email_sent ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                              <CheckCircle size={10} /> Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleResendEmail(txn)}
                              disabled={processingId === `email-${txn.id}`}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 hover:bg-primary-100 transition-colors"
                            >
                              {processingId === `email-${txn.id}` ? (
                                <RefreshCw size={10} className="animate-spin" />
                              ) : (
                                <AlertCircle size={10} />
                              )}
                              {processingId === `email-${txn.id}` ? 'Sending...' : 'Not Sent'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePrintInvoice(txn)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                            title="Print Invoice"
                          >
                            <Printer size={14} />
                            Print
                          </button>
                          <button
                            onClick={() => generateInvoice(txn)}
                            disabled={downloadingInvoice === txn.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-70"
                          >
                            {downloadingInvoice === txn.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            Download PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View - Hidden on Desktop */}
          <div className="md:hidden p-4 space-y-4">
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No invoices found.</p>
              </div>
            ) : (
              billingHistory.map((txn, idx) => (
                <div key={txn.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Paid</span>
                      <span className="font-black text-gray-900 text-sm">₹{txn.amount_paid}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900 text-sm">{txn.plan_name} Plan <span className="text-gray-400 font-normal text-xs">({txn.billing_cycle})</span></h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    {/* Email Button */}
                    <button
                      onClick={() => !txn.email_sent && handleResendEmail(txn)}
                      disabled={processingId === `email-${txn.id}` || txn.email_sent}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors ${txn.email_sent
                        ? 'bg-green-50 text-green-600 cursor-default'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        }`}
                    >
                      {txn.email_sent ? <CheckCircle size={10} /> : (processingId === `email-${txn.id}` ? <RefreshCw size={10} className="animate-spin" /> : <AlertCircle size={10} />)}
                      {txn.email_sent ? 'Sent' : (processingId === `email-${txn.id}` ? 'Sending...' : 'Resend')}
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={() => generateInvoice(txn)}
                      disabled={downloadingInvoice === txn.id}
                      className="flex items-center justify-center gap-1.5 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors disabled:opacity-70 shadow-sm"
                    >
                      {downloadingInvoice === txn.id ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        <Download size={10} />
                      )}
                      Invoice
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Removed as per request */}

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Top Navigation & Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2 md:gap-4 font-spartan">
        {/* Tabs - Compact Pills */}
        <div className="w-full xl:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <nav className="flex space-x-1 md:space-x-1.5 p-0.5 md:p-1 bg-gray-50 rounded-xl border border-gray-100 max-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'subscriptions', label: 'All Subscriptions', icon: Building2 },
              { id: 'billing', label: 'Billing & Invoices', icon: IndianRupee },
              { id: 'expiring', label: 'Expiring Soon', icon: AlertTriangle, count: upcomingRenewals.length },
              { id: 'plans', label: 'Plans', icon: Package }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-500 hover:bg-white hover:text-gray-900 shadow-sm'
                    }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-600'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions (Always visible) */}
        <div className="flex items-center gap-1.5 md:gap-2 w-full xl:w-auto pt-1 md:pt-0">
          <button
            onClick={handleProcessExpired}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-all shadow-sm text-xs md:text-sm font-bold flex-1 xl:flex-initial whitespace-nowrap"
            title="Process Expirations"
          >
            <CalendarClock className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span>Process Expirations</span>
          </button>
          <button
            onClick={() => openAssignModal()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all shadow-md text-xs md:text-sm font-bold flex-1 xl:flex-initial whitespace-nowrap"
            title="Assign Subscription"
          >
            <Package className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <span>Assign Subscription</span>
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-4 animate-in fade-in duration-300 font-spartan">

          {/* Stats Cards - Compact Single Line on Mobile */}
          <div className="grid grid-cols-4 gap-1.5 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Subscriptions */}
            <div className="bg-white p-2 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100/50 flex flex-col md:flex-row items-center justify-center md:justify-start">
              <div className="hidden md:block p-3 bg-primary-50 rounded-xl mr-4">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Total</p>
                <p className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider">Total Subscriptions</p>
                <p className="text-sm md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1">{stats.totalSubscriptions}</p>
              </div>
            </div>

            {/* Active */}
            <div className="bg-white p-2 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100/50 flex flex-col md:flex-row items-center justify-center md:justify-start">
              <div className="hidden md:block p-3 bg-green-50 rounded-xl mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Active</p>
                <p className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
                <p className="text-sm md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1">{stats.activeSubscriptions}</p>
              </div>
            </div>

            {/* Grace Period */}
            <div className="bg-white p-2 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100/50 flex flex-col md:flex-row items-center justify-center md:justify-start">
              <div className="hidden md:block p-3 bg-primary-50 rounded-xl mr-4">
                <AlertTriangle className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Grace</p>
                <p className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider">Grace Period</p>
                <p className="text-sm md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1">{stats.gracePeriodSubscriptions || 0}</p>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white p-2 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100/50 flex flex-col md:flex-row items-center justify-center md:justify-start">
              <div className="hidden md:block p-3 bg-yellow-50 rounded-xl mr-4">
                <IndianRupee className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-[9px] md:text-xs font-bold text-gray-400 uppercase tracking-wider md:hidden">Revenue</p>
                <p className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Revenue</p>
                <p className="text-sm md:text-3xl font-black text-gray-900 mt-0.5 md:mt-1 truncate w-full">₹{(stats.monthlyRecurringRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Plan Breakdown */}
          {/* Plan Breakdown */}
          <div className="grid grid-cols-2 gap-2 md:grid md:grid-cols-3 md:gap-6">
            {plans.map(plan => {
              const count = stats.planCounts?.[plan.key] || 0;

              // Dynamic Styling based on plan key
              let Icon = Building2;
              let colorText = 'text-gray-900';
              let colorBg = 'bg-gray-50';

              if (plan.key === 'lite') { Icon = Zap; colorText = 'text-primary-600'; colorBg = 'bg-primary-50'; }
              else if (plan.key === 'standard') { Icon = Stars; colorText = 'text-amber-600'; colorBg = 'bg-amber-50'; }
              else if (plan.key === 'pro') { Icon = Brain; colorText = 'text-slate-700'; colorBg = 'bg-slate-50'; }
              else if (plan.key === 'custom') { Icon = Building2; colorText = 'text-amber-600'; colorBg = 'bg-amber-50'; }
              else if (plan.key === 'starter') { Icon = Zap; colorText = 'text-primary-600'; colorBg = 'bg-primary-50'; } // Fallback

              return (
                <div key={plan.id} className="bg-white p-2 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100/50 flex flex-col items-center md:items-stretch justify-between">
                  <div className="flex items-center justify-between w-full mb-1 md:mb-4">
                    <h3 className="font-bold text-gray-900 capitalize text-[10px] md:text-lg truncate w-full text-center md:text-left">{plan.name}</h3>
                    <div className={`hidden md:block p-2 rounded-lg ${colorBg}`}>
                      <Icon className={`w-5 h-5 ${colorText}`} />
                    </div>
                  </div>

                  <div className="text-center md:text-left mb-1 md:mb-0">
                    <p className={`text-sm md:text-4xl font-black ${colorText} mb-0 md:mb-1 leading-tight`}>{count}</p>
                    <p className="text-[8px] md:text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">
                      active users
                    </p>
                  </div>

                  <div className="mt-1 md:mt-4 pt-1 md:pt-4 border-t border-dashed w-full border-gray-100 text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-medium text-gray-500">
                      ₹{plan.base_price?.toLocaleString()}<span className="text-[8px] md:text-xs">/mo</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expiring Soon Alert */}
          {upcomingRenewals.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-primary-500" />
                <div>
                  <h3 className="font-semibold text-primary-800">Subscriptions Expiring Soon</h3>
                  <p className="text-primary-700 text-sm">
                    {upcomingRenewals.length} subscription(s) will expire within 14 days
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('expiring')}
                  className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                >
                  View All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {/* Subscriptions Tab - Premium Table */}
      {activeTab === 'subscriptions' && (
        <>
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                    <th className="px-8 py-4">Restaurant</th>
                    <th className="px-6 py-4">Plan & Cycle</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                        <Package className="w-12 h-12 text-gray-200" />
                        <p>No subscriptions found. Assign one to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((subscription) => {
                      const daysLeft = getDaysRemaining(subscription.end_date);
                      return (
                        <tr key={subscription.id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              {subscription.restaurant?.logo_url ? (
                                <img
                                  src={subscription.restaurant.logo_url}
                                  alt={subscription.restaurant.name}
                                  className="w-10 h-10 rounded-xl object-cover shadow-md border border-gray-100"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-200 text-sm">
                                  {subscription.restaurant?.name?.charAt(0) || 'R'}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-bold text-gray-900 leading-tight">
                                  {subscription.restaurant?.name || 'Unknown Restaurant'}
                                </div>
                                <div className="text-xs text-gray-400 font-medium mt-0.5">
                                  {subscription.restaurant?.contact_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                                {subscription.plan_name}
                              </span>
                              <span className="text-xs text-gray-400 font-medium ml-1 capitalize">
                                {subscription.billing_cycle}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit ${getStatusColor(subscription.status)}`}>
                                {getStatusIcon(subscription.status)}
                                <span className="capitalize">{subscription.status.replace('_', ' ')}</span>
                              </span>
                              {subscription.status === 'active' && daysLeft !== null && daysLeft <= 14 && (
                                <span className="text-[10px] font-bold text-primary-600 pl-1 animation-pulse">
                                  Expires in {daysLeft} days
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-xs font-medium text-gray-900">{formatDate(subscription.start_date)}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">to {formatDate(subscription.end_date)}</div>
                          </td>
                          <td className="px-6 py-5 text-sm font-black text-gray-900 font-mono">
                            ₹{subscription.total_amount?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openAssignModal(subscription)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                title="Edit Subscription"
                                disabled={processingId === subscription.id}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleViewBilling(subscription)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                title="View Billing & Invoices"
                                disabled={processingId === subscription.id}
                              >
                                {processingId === subscription.id ? <RefreshCw size={16} className="animate-spin" /> : <IndianRupee size={16} />}
                              </button>
                              {subscription.status === 'active' && (
                                <button
                                  onClick={() => handleCancelSubscription(subscription)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Cancel Subscription"
                                  disabled={processingId === subscription.id}
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                              {['cancelled', 'expired'].includes(subscription.status) && (
                                <button
                                  onClick={() => handleReactivate(subscription)}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                  title="Reactivate Subscription"
                                  disabled={processingId === subscription.id}
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 animate-in fade-in duration-300">
            {subscriptions.length === 0 ? (
              <div className="text-center text-gray-400 flex flex-col items-center gap-2 py-8 bg-white/50 rounded-2xl border border-gray-100">
                <Package className="w-8 h-8 text-gray-200" />
                <p className="text-sm">No subscriptions found.</p>
              </div>
            ) : (
              subscriptions.map((subscription) => {
                const daysLeft = getDaysRemaining(subscription.end_date);
                return (
                  <div key={subscription.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col gap-2 relative">
                    {/* Header: Restaurant & Status */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {subscription.restaurant?.logo_url ? (
                          <img
                            src={subscription.restaurant.logo_url}
                            alt={subscription.restaurant.name}
                            className="w-8 h-8 rounded-lg object-cover shadow-sm border border-gray-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-sm shadow-primary-200 text-xs">
                            {subscription.restaurant?.name?.charAt(0) || 'R'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 leading-tight truncate">
                            {subscription.restaurant?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">
                            {subscription.restaurant?.contact_email}
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-full p-1 ${getStatusColor(subscription.status)}/10 flex-shrink-0`}>
                        {React.cloneElement(getStatusIcon(subscription.status), { size: 14 })}
                      </div>
                    </div>

                    {/* Plan Details & Date */}
                    <div className="flex justify-between items-center bg-gray-50/50 rounded-lg p-2 border border-gray-50/50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-gray-900 capitalize">{subscription.plan_name}</p>
                          <span className="text-[9px] text-gray-400 capitalize bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm">{subscription.billing_cycle}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-900">Expires: {formatDate(subscription.end_date)}</p>
                        {subscription.status === 'active' && daysLeft !== null && daysLeft <= 14 && (
                          <span className="text-[9px] font-bold text-primary-600 block animate-pulse">
                            {daysLeft} days left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer: Amount & Actions */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div>
                        <p className="text-base font-black text-gray-900 font-mono leading-none">₹{subscription.total_amount?.toLocaleString() || 0}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openAssignModal(subscription)}
                          className="p-1.5 bg-gray-50 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleViewBilling(subscription)}
                          className="p-1.5 bg-gray-50 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                          title="Billing"
                        >
                          <IndianRupee size={14} />
                        </button>
                        {subscription.status === 'active' && (
                          <button
                            onClick={() => handleCancelSubscription(subscription)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        {['cancelled', 'expired'].includes(subscription.status) && (
                          <button
                            onClick={() => handleReactivate(subscription)}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            title="Reactivate"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center py-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Restaurants'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Expiring Soon Tab */}
      {activeTab === 'expiring' && (
        <>
          {/* Desktop Grid - Hidden on Mobile */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {upcomingRenewals.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">All Good!</h3>
                <p className="text-gray-500 mt-2">No subscriptions expiring in the next 14 days</p>
              </div>
            ) : (
              upcomingRenewals.map((sub) => (
                <div key={sub.id} className="bg-white rounded-3xl shadow-sm border border-primary-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                  <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${sub.daysUntilExpiry <= 3 ? 'bg-red-500 text-white' : 'bg-primary-100 text-primary-700'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {sub.daysUntilExpiry <= 0 ? 'Expired' : `${sub.daysUntilExpiry} days left`}
                    </p>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-2xl ${sub.daysUntilExpiry <= 3 ? 'bg-red-50' : 'bg-primary-50'}`}>
                      <AlertTriangle className={`w-6 h-6 ${sub.daysUntilExpiry <= 3 ? 'text-red-500' : 'text-primary-500'}`} />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{sub.restaurant?.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{sub.plan?.name}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                    <div className="flex justify-between items-center mb-4 text-xs font-medium text-gray-500">
                      <span>Expires: {formatDate(sub.end_date)}</span>
                      <span className="font-bold text-gray-900">₹{sub.total_amount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAssignModal(sub)}
                        className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/20 hover:to-red-600 transition-all"
                      >
                        Renew
                      </button>
                      <button
                        onClick={() => handleSendRenewalReminder(sub)}
                        disabled={processingId === `remind-${sub.id}`}
                        className="px-4 py-3 bg-primary-50 text-primary-600 border border-primary-200 rounded-xl font-bold text-sm hover:bg-primary-100 transition-all flex items-center justify-center disabled:opacity-50"
                        title="Send Reminder Email"
                      >
                        {processingId === `remind-${sub.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Compact List - Hidden on Desktop */}
          <div className="md:hidden space-y-3 animate-in fade-in duration-300">
            {upcomingRenewals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="bg-green-100 p-3 rounded-full mb-3 mx-auto w-fit">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">All Good!</p>
                <p className="text-xs text-gray-500 mt-1">No subscriptions expiring soon.</p>
              </div>
            ) : (
              upcomingRenewals.map((sub) => (
                <div key={sub.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sub.daysUntilExpiry <= 3 ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-500'}`}>
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{sub.restaurant?.name}</h4>
                        <p className="text-xs text-gray-500">{sub.plan?.name || 'Plan'}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sub.daysUntilExpiry <= 3 ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'}`}>
                      {sub.daysUntilExpiry <= 0 ? 'Expired' : `${sub.daysUntilExpiry} days`}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                    <div className="text-xs text-gray-500">
                      Expires: <span className="text-gray-900 font-bold">{formatDate(sub.end_date)}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSendRenewalReminder(sub)}
                        disabled={processingId === `remind-${sub.id}`}
                        className="p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all shadow-sm disabled:opacity-50"
                        title="Remind"
                      >
                        {processingId === `remind-${sub.id}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openAssignModal(sub)}
                        className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-red-500 text-white rounded-lg text-xs font-bold shadow-sm hover:to-red-600 transition-all"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Plans Tab */}
      {/* Billing & Invoices Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Billing & Invoices</h3>
                <p className="text-sm text-gray-500">Manage invoices and payment history for all restaurants</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Restaurant</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {sub.restaurant?.logo_url ? (
                            <img
                              src={sub.restaurant.logo_url}
                              alt={sub.restaurant.name}
                              className="w-10 h-10 rounded-xl object-cover shadow-lg border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-200">
                              {sub.restaurant?.name?.charAt(0) || 'R'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900">{sub.restaurant?.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{sub.restaurant?.contact_email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                            {sub.plan_name}
                          </span>
                          <p className="text-xs text-gray-400 mt-1 font-medium pl-1">
                            By {sub.payment_method || 'Manual'} ({sub.billing_cycle})
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(sub.status)}`}>
                          {getStatusIcon(sub.status)}
                          <span className="capitalize">{sub.status.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewBilling(sub)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-200 hover:shadow-lg"
                        >
                          <IndianRupee size={14} />
                          View Internal Invoices
                        </button>
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500 bg-gray-50/30 border-dashed border-2 border-gray-200 rounded-xl m-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-gray-100 rounded-full">
                            <IndianRupee className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="font-medium">No billing records found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {subscriptions.length === 0 ? (
              <div className="text-center text-gray-400 flex flex-col items-center gap-2 py-8 bg-white/50 rounded-2xl border border-gray-100">
                <IndianRupee className="w-8 h-8 text-gray-200" />
                <p className="text-sm">No billing records found.</p>
              </div>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col gap-2 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {sub.restaurant?.logo_url ? (
                        <img
                          src={sub.restaurant.logo_url}
                          alt={sub.restaurant.name}
                          className="w-8 h-8 rounded-lg object-cover shadow-sm border border-gray-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold shadow-sm shadow-primary-200 text-xs">
                          {sub.restaurant?.name?.charAt(0) || 'R'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 leading-tight truncate">
                          {sub.restaurant?.name || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">
                          {sub.restaurant?.contact_email}
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-full p-1 ${getStatusColor(sub.status)}/10 flex-shrink-0`}>
                      {React.cloneElement(getStatusIcon(sub.status), { size: 14 })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50/50 rounded-lg p-2 border border-gray-50/50">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-gray-900 capitalize">{sub.plan_name}</p>
                      <span className="text-[9px] text-gray-400 capitalize bg-white px-1.5 py-0.5 rounded border border-gray-100 shadow-sm">{sub.billing_cycle}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{sub.payment_method || 'Manual'}</span>
                  </div>

                  <button
                    onClick={() => handleViewBilling(sub)}
                    className="w-full py-2 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-100 transition-colors"
                  >
                    <IndianRupee size={14} />
                    View Invoices
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plan Stats */}
          {/* Plan Stats */}
          {/* Plan Stats - One Line Scrollable */}
          {/* Desktop Stats - Scrollable Row */}
          <div className="hidden md:flex flex-row gap-4 overflow-x-auto pb-4 items-stretch no-scrollbar">
            <div className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Plans</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{plans.length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Active Plans</p>
              <p className="text-3xl font-black text-green-700 mt-2">{plans.filter(p => p.is_active).length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive Plans</p>
              <p className="text-3xl font-black text-gray-400 mt-2">{plans.filter(p => !p.is_active).length}</p>
            </div>

            {/* Plan Wise Subscription Counts */}
            {plans.map(plan => (
              <div key={`stat-${plan.id}`} className="bg-white p-5 rounded-xl border shadow-sm min-w-[200px] flex-shrink-0 flex flex-col justify-center">
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wider truncate" title={`${plan.name} Users`}>
                  {plan.name} Users
                </p>
                <p className="text-3xl font-black text-primary-700 mt-2">
                  {stats?.planCounts?.[plan.key] || 0}
                </p>
              </div>
            ))}

            {/* Add Plan Action Card */}
            <button
              onClick={() => openPlanModal()}
              className="bg-white p-5 rounded-xl border-dashed border-2 border-primary-300 shadow-sm min-w-[200px] flex-shrink-0 flex flex-col items-center justify-center hover:bg-primary-50 transition-all group"
            >
              <div className="p-2 bg-primary-100 rounded-full group-hover:bg-primary-200 transition-colors mb-2">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-wider">Add New Plan (+)</p>
            </button>
          </div>

          {/* Mobile Stats - Compact Grid */}
          <div className="md:hidden grid grid-cols-4 gap-2 pb-4">
            <div className="bg-white p-2 rounded-xl border shadow-sm flex flex-col justify-center text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider leading-tight">Total</p>
              <p className="text-lg font-black text-gray-900 mt-0.5 leading-none">{plans.length}</p>
            </div>
            <div className="bg-white p-2 rounded-xl border shadow-sm flex flex-col justify-center text-center">
              <p className="text-[8px] font-bold text-green-600 uppercase tracking-wider leading-tight">Active</p>
              <p className="text-lg font-black text-green-700 mt-0.5 leading-none">{plans.filter(p => p.is_active).length}</p>
            </div>
            <div className="bg-white p-2 rounded-xl border shadow-sm flex flex-col justify-center text-center">
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider leading-tight">Inactive</p>
              <p className="text-lg font-black text-gray-400 mt-0.5 leading-none">{plans.filter(p => !p.is_active).length}</p>
            </div>

            {plans.map(plan => (
              <div key={`mob-stat-${plan.id}`} className="bg-white p-2 rounded-xl border shadow-sm flex flex-col justify-center text-center">
                <p className="text-[8px] font-bold text-primary-600 uppercase tracking-wider truncate leading-tight">
                  {plan.name}
                </p>
                <p className="text-lg font-black text-primary-700 mt-0.5 leading-none">
                  {stats?.planCounts?.[plan.key] || 0}
                </p>
              </div>
            ))}

            <button
              onClick={() => openPlanModal()}
              className="col-span-4 bg-white p-2 rounded-xl border-dashed border-2 border-primary-300 shadow-sm flex flex-row items-center justify-center gap-1.5 hover:bg-primary-50 transition-all cursor-pointer"
            >
              <div className="p-0.5 bg-primary-100 rounded-full">
                <Plus className="w-3 h-3 text-primary-600" />
              </div>
              <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Add New Plan</p>
            </button>
          </div>

          {/* Desktop Plans Grid - Hidden on Mobile */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {plans.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 flex flex-col items-center gap-4">
                <p className="text-gray-500 font-medium">No subscription plans found in the system.</p>
                <button
                  onClick={handleInitializeDefaults}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-bold shadow-lg shadow-primary-500/20"
                >
                  Initialize Default Plans
                </button>
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className={`group relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${!plan.is_active ? 'opacity-75 grayscale' : ''}`}>
                  <div className={`h-2.5 bg-gradient-to-r ${plan.color || 'from-gray-400 to-gray-500'}`} />

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openPlanModal(plan)} className="p-2 bg-white text-primary-600 hover:bg-primary-50 rounded-full shadow-sm border border-gray-100">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-sm border border-gray-100">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-7 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                      <p className="text-gray-500 text-sm mt-2 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="mb-6 pb-6 border-b border-gray-50">
                      <span className="text-4xl font-black text-gray-900 tracking-tight">₹{plan.base_price?.toLocaleString()}</span>
                      <span className="text-gray-400 font-bold text-sm ml-1">/month</span>
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between items-center pt-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {plan.is_active ? 'Active Plan' : 'Inactive'}
                      </span>
                      <code className="text-[10px] font-mono text-gray-300 bg-gray-50 px-2 py-1 rounded">{plan.key}</code>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Compact Plans List - Hidden on Desktop */}
          <div className="md:hidden space-y-3 animate-in fade-in duration-300">
            {plans.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-8 text-center flex flex-col items-center gap-3">
                <p className="text-gray-500 text-sm font-medium">No subscription plans found.</p>
                <button
                  onClick={handleInitializeDefaults}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm"
                >
                  Initialize Default Plans
                </button>
              </div>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => openPlanModal(plan)}
                  className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform ${!plan.is_active ? 'opacity-75 grayscale' : ''}`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color || 'from-gray-400 to-gray-500'}`} />

                  <div className="flex justify-between items-start mt-1">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-gray-900">₹{plan.base_price?.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-bold">/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Drop Edit button as the entire card is clickable, keep Delete only */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                        className="p-2 bg-gray-50 text-red-600 rounded-lg border border-gray-200 hover:bg-red-50 transition-colors z-10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded">
                      {plan.features?.length || 0} Features
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Plan Modal - Redesigned Premium Version */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.2)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
                  {editingPlan ? <Edit size={24} /> : <Zap size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">
                    {editingPlan ? 'Edit Plan' : 'Create Plan'}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{editingPlan ? planForm.key : 'Set up new tier'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all duration-300 group"
              >
                <XCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <form onSubmit={handlePlanSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 md:p-8 md:space-y-10 custom-scrollbar">

              {/* SECTION: BASIC INFO */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-primary-600 rounded-full" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Plan Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Internal Key</label>
                    <input
                      value={planForm.key}
                      onChange={(e) => setPlanForm({ ...planForm, key: e.target.value.toLowerCase() })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                      placeholder="e.g. starter"
                      required
                      disabled={!!editingPlan}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Display Name</label>
                    <input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                      placeholder="e.g. Growth Pro"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Short Description</label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none min-h-[80px]"
                    placeholder="Describe this plan in one sentence..."
                    required
                  />
                </div>
              </div>

              {/* SECTION: PRICING */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Economics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Base Price /Month</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                      <input
                        type="number"
                        value={planForm.base_price}
                        onChange={(e) => setPlanForm({ ...planForm, base_price: parseInt(e.target.value) })}
                        className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-5 py-3.5 text-lg font-black text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Plan Level Sale (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={planForm.plan_discount_percentage}
                        onChange={(e) => setPlanForm({ ...planForm, plan_discount_percentage: parseInt(e.target.value) })}
                        className="w-full bg-red-50/30 border-none rounded-2xl px-5 py-3.5 text-lg font-black text-red-600 focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all outline-none"
                        placeholder="0"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-red-300 font-black">%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Cycle-Specific Discounts (%)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {billingCycles.map(cycle => (
                      <div key={cycle.key} className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">{cycle.label}</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={planForm.cycle_discounts?.[cycle.key] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                              setPlanForm(prev => ({
                                ...prev,
                                cycle_discounts: {
                                  ...prev.cycle_discounts,
                                  [cycle.key]: val
                                }
                              }));
                            }}
                            className="w-full bg-primary-50/50 border-none rounded-xl px-3 py-2 text-sm font-black text-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
                            placeholder={cycle.discount_percentage}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-300 text-xs font-black">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Leave empty to use global billing cycle default.</p>
                </div>
              </div>

              {/* SECTION: BRANDING & FEATURES */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-amber-500 rounded-full" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Style & Logic</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Visual Icon</label>
                    <select
                      value={planForm.icon}
                      onChange={(e) => setPlanForm({ ...planForm, icon: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="Zap">Zap (Lightning)</option>
                      <option value="Crown">Crown (Premium)</option>
                      <option value="Stars">Stars (Special)</option>
                      <option value="Shield">Shield (Secure)</option>
                      <option value="Building2">Building (Chain)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">UI Color (Gradient)</label>
                    <input
                      value={planForm.color}
                      onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-xs font-mono font-bold text-gray-600 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all outline-none"
                      placeholder="from-primary-600 to-primary-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 text-center block">Features List</label>
                  <textarea
                    value={Array.isArray(planForm.features) ? planForm.features.join(', ') : ''}
                    onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split(',').map(f => f.trim()).filter(f => f !== '') })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none min-h-[120px] leading-relaxed"
                    placeholder="Unlimited Menus, QR Ordering, AI Insights, etc."
                  />
                  <p className="text-[10px] text-gray-400 font-bold ml-1 italic italic">Separate each feature with a comma</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[32px]">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Display Publicly</span>
                      <button
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, is_public: !planForm.is_public })}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${planForm.is_public ? 'bg-primary-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${planForm.is_public ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Market as Popular</span>
                      <button
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, is_popular: !planForm.is_popular })}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${planForm.is_popular ? 'bg-amber-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${planForm.is_popular ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 border-l border-gray-200 pl-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">AI Enabled</span>
                      <button
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, ai_features_enabled: !planForm.ai_features_enabled })}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${planForm.ai_features_enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${planForm.ai_features_enabled ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Active Tier</span>
                      <button
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, is_active: !planForm.is_active })}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${planForm.is_active ? 'bg-emerald-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${planForm.is_active ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {planForm.is_popular && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Badge Text</label>
                    <input
                      value={planForm.badge_text}
                      onChange={(e) => setPlanForm({ ...planForm, badge_text: e.target.value })}
                      className="w-full bg-amber-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-amber-900 focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all outline-none"
                      placeholder="e.g. Most Popular"
                    />
                  </div>
                )}
              </div>

              {/* SECTION: CTA */}
              <div className="p-6 bg-gradient-to-br from-primary-50 to-white rounded-[32px] border border-primary-50 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-black text-primary-900 uppercase tracking-widest">Call to Action</span>
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, use_custom_builder: !planForm.use_custom_builder })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${planForm.use_custom_builder ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white text-primary-600 shadow-sm'}`}
                  >
                    <Stars size={12} />
                    Custom Builder
                  </button>
                </div>
                <input
                  value={planForm.button_text}
                  onChange={(e) => setPlanForm({ ...planForm, button_text: e.target.value })}
                  className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none shadow-sm"
                  placeholder={planForm.use_custom_builder ? "Build Your Plan" : "Get Started Now"}
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-white border-t border-gray-100 flex gap-4">
              <button
                type="submit"
                onClick={handlePlanSubmit}
                disabled={processingId === 'plan'}
                className="flex-[2] bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] transition-all duration-300 disabled:opacity-50 active:scale-95"
              >
                {processingId === 'plan' ? 'Processing...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
              </button>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Assign Subscription Modal */}
      {/* Assign Subscription Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSubscription ? 'Update Subscription' : 'Assign Subscription'}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Select Restaurant
                </label>
                <div className="relative">
                  <select
                    value={assignForm.restaurant_id}
                    onChange={(e) => setAssignForm({ ...assignForm, restaurant_id: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                    required
                    disabled={!!editingSubscription}
                  >
                    <option value="">Choose a restaurant...</option>
                    {(editingSubscription ? restaurants : availableRestaurants).map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Subscription Plan
                </label>
                <div className="relative">
                  <select
                    value={assignForm.plan_id}
                    onChange={(e) => setAssignForm({ ...assignForm, plan_id: e.target.value })}
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                    required
                  >
                    <option value="">Select a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.key}>
                        {plan.name} — ₹{plan.base_price?.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Billing Cycle
                  </label>
                  <div className="relative">
                    <select
                      value={assignForm.billing_cycle}
                      onChange={(e) => setAssignForm({ ...assignForm, billing_cycle: e.target.value })}
                      className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none text-sm"
                    >
                      {billingCycles.map(cycle => (
                        <option key={cycle.id} value={cycle.key}>
                          {cycle.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={assignForm.payment_method}
                      onChange={(e) => setAssignForm({ ...assignForm, payment_method: e.target.value })}
                      className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none text-sm"
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="razorpay">Razorpay</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none min-h-[80px]"
                  placeholder="Payment details, transaction ID, or other remarks..."
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-transparent mt-2">
                <button
                  type="submit"
                  disabled={processingId === 'assign'}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-700 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:from-primary-600 hover:to-primary-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingId === 'assign' ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{editingSubscription ? 'Update Subscription' : 'Assign Plan'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Billing History Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {selectedBillingRestaurant?.logo_url ? (
                  <img
                    src={selectedBillingRestaurant.logo_url}
                    alt={selectedBillingRestaurant.name}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    <IndianRupee size={20} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">Billing History</h3>
                  <p className="text-xs md:text-sm text-gray-500">{selectedBillingRestaurant?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar">
              {billingHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <CreditCard size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">No transactions found</p>
                  <p className="text-sm">This restaurant hasn't made any payments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map((txn, idx) => (
                    <div key={txn.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3">
                      {/* Top Row: Info & Amount */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${txn.action === 'created' ? 'bg-green-100 text-green-700' :
                            txn.action === 'renewed' ? 'bg-primary-100 text-primary-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">
                              {txn.plan_name} <span className="hidden sm:inline text-[10px] font-normal text-gray-500 px-1.5 bg-gray-100 rounded-full align-middle">{txn.billing_cycle}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {new Date(txn.created_at).toLocaleDateString()} • <span className="sm:hidden uppercase">{txn.billing_cycle}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-gray-900 text-sm">₹{txn.amount_paid}</p>
                          <span className="text-[9px] font-bold uppercase text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full block w-fit ml-auto mt-0.5">Paid</span>
                        </div>
                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50/50">
                        {/* Email Status */}
                        <div>
                          {txn.email_sent ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                              <CheckCircle size={10} /> Email Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => handleResendEmail(txn)}
                              disabled={processingId === `email-${txn.id}`}
                              className="flex items-center gap-1 text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              {processingId === `email-${txn.id}` ? (
                                <RefreshCw size={10} className="animate-spin" />
                              ) : (
                                <AlertCircle size={10} />
                              )}
                              {processingId === `email-${txn.id}` ? 'Sending...' : 'Resend Email'}
                            </button>
                          )}
                        </div>

                        {/* Invoice Button */}
                        <button
                          onClick={() => generateInvoice(txn)}
                          disabled={downloadingInvoice === txn.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors disabled:opacity-70 shadow-sm"
                        >
                          {downloadingInvoice === txn.id ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <Package size={10} />
                          )}
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-gray-50 rounded-b-3xl border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">Invoices are automatically generated for each successful payment.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementV2;