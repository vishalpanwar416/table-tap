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
  getSubscriptionHistory
} from '../../../../admin/api/subscriptionService';
import { supabase } from '../../../../shared/supabase';
import { getAllRestaurants, getSystemSetting } from '../admin_service';

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
    color: 'from-blue-500 to-cyan-500',
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        plansResponse,
        cyclesResponse,
        subscriptionsResponse,
        restaurantsResponse,
        statsResponse,
        renewalsResponse
      ] = await Promise.all([
        getSubscriptionPlans(),
        getBillingCycles(),
        getRestaurantSubscriptions(),
        getAllRestaurants(),
        getSubscriptionStats(),
        getUpcomingRenewals(14)
      ]);

      if (plansResponse.error) throw new Error(plansResponse.error);
      if (subscriptionsResponse.error) throw new Error(subscriptionsResponse.error);
      if (statsResponse.error) throw new Error(statsResponse.error);

      setPlans(plansResponse.data || []);
      setBillingCycles(cyclesResponse.data || []);
      setSubscriptions(subscriptionsResponse.data || []);
      setRestaurants(restaurantsResponse.data || []);
      setStats(statsResponse.data);
      setUpcomingRenewals(renewalsResponse.data || []);

      if (plansResponse.data?.length > 0 && !assignForm.plan_id) {
        setAssignForm(prev => ({ ...prev, plan_id: plansResponse.data[0].key }));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
        color: plan.color || 'from-blue-500 to-cyan-500',
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
        color: 'from-blue-500 to-cyan-500',
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
        color: planForm.color || 'from-blue-500 to-cyan-500',
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
          color: 'from-blue-500 to-cyan-500',
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
          color: 'from-purple-500 to-pink-500',
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
          base_price: 29999,
          features: [
            "Bespoke Multi-outlet controls",
            "Custom WhatsApp bundles (10k-50k)",
            "Dedicated DB / Project isolation",
            "Custom AI & ERP integrations",
            "SSO & Security audit trails",
            "Dedicated CSM & Priority SLA",
            "Starting ₹29,999 - ₹59,999/mo",
            "Full migration & onboarding support"
          ],
          color: 'from-amber-600 to-orange-700',
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
      case 'grace_period': return 'text-orange-600 bg-orange-100';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
  const generateInvoiceHTML = (txn, restaurant) => {
    const date = new Date(txn.created_at).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Calculate subtotal and tax (assuming inclusive 18% GST)
    // Calculate tax (Use stored GST if available)
    const amount = Number(txn.amount_paid);
    let subtotal, gst;

    if (txn.gst_amount) {
      gst = Number(txn.gst_amount).toFixed(2);
      subtotal = (amount - Number(gst)).toFixed(2);
    } else {
      // Fallback for legacy records
      subtotal = (amount / 1.18).toFixed(2);
      gst = (amount - Number(subtotal)).toFixed(2);
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom: 2px solid #e2e8f0;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Invoice</h1>
          <p style="color: #64748b; margin: 8px 0 0;">#${txn.id.slice(0, 8).toUpperCase()}</p>
        </div>
        
        <div style="padding: 32px 24px;">
          <p>Hello <strong>${restaurant.name}</strong>,</p>
          <p>Thank you for your business. Here is the receipt for your recent subscription payment.</p>
          
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding-bottom: 12px; color: #64748b;">Date</td>
                <td style="padding-bottom: 12px; text-align: right; font-weight: bold;">${date}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 12px 0; color: #64748b;">Plan</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">${txn.plan_name} (${txn.billing_cycle})</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 12px 0; color: #64748b;">Subtotal</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">₹${subtotal}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 12px 0; color: #64748b;">GST (18%)</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">₹${gst}</td>
              </tr>
              <tr>
                <td style="padding-top: 12px; font-size: 18px; font-weight: bold;">Total Paid</td>
                <td style="padding-top: 12px; text-align: right; font-size: 18px; font-weight: bold; color: #16a34a;">₹${amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #64748b; text-align: center;">
            This is an automated email. If you have any questions, please contact support.
          </p>
        </div>
        
        <div style="background-color: #0f172a; color: white; padding: 20px; text-align: center; font-size: 12px;">
          &copy; ${new Date().getFullYear()} TableTap. All rights reserved.
        </div>
      </div>
    `;
  };

  const handleResendEmail = async (transaction) => {
    if (!selectedBillingRestaurant?.contact_email) {
      handleError("This restaurant currently has no contact email configured.");
      return;
    }

    setProcessingId(`email-${transaction.id}`);

    try {
      // Fetch template
      const template = await getSystemSetting('email_template_invoice');

      let subject = `Invoice #${transaction.id.slice(0, 8).toUpperCase()} - TableTap`;
      let html = generateInvoiceHTML(transaction, selectedBillingRestaurant);

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

        Object.keys(vars).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, vars[key] || '');
          html = html.replace(regex, vars[key] || '');
        });
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices: {selectedBillingRestaurant.name}</h1>
            <p className="text-gray-500 text-sm">Sorted by date and time • {billingHistory.length} Records</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
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
                              className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
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

      {/* Tabs */}
      {/* Tabs - Modern Pills */}
      <div className="flex overflow-x-auto pb-2 no-scrollbar">
        <nav className="flex space-x-2 p-1 bg-gray-100/50 rounded-2xl">
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
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                  ? 'bg-black text-white shadow-lg shadow-gray-900/20'
                  : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                  }`}
              >
                <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-[10px] rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Dashboard Overview</h3>
              <p className="text-sm text-gray-500">Real-time subscription metrics</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleProcessExpired}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-200 text-orange-700 rounded-xl hover:bg-orange-50 transition-all shadow-sm text-sm font-medium"
              >
                <CalendarClock className="w-4 h-4" />
                Process Expirations
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={() => openAssignModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 text-sm font-medium"
              >
                <Package className="w-4 h-4" />
                Assign Subscription
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Subscriptions</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grace Period</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{stats.gracePeriodSubscriptions || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <IndianRupee className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Revenue</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">₹{(stats.monthlyRecurringRevenue || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => {
              const count = stats.planCounts?.[plan.key] || 0;
              // Map icon name to component or fallback
              const Icon = plan.key === 'starter' ? Zap : plan.key === 'professional' ? Brain : Building2;
              const colorClass = plan.key === 'starter' ? 'text-blue-600' : plan.key === 'professional' ? 'text-purple-600' : 'text-indigo-600';
              const iconColor = plan.key === 'starter' ? 'text-blue-500' : plan.key === 'professional' ? 'text-purple-500' : 'text-indigo-500';

              return (
                <div key={plan.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 capitalize text-lg">{plan.name}</h3>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-4xl font-black ${colorClass} mb-1`}>{count}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    active users
                  </p>
                  <div className="mt-4 pt-4 border-t border-dashed">
                    <p className="text-sm font-medium text-gray-500">
                      ₹{plan.base_price?.toLocaleString()}<span className="text-xs">/mo</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expiring Soon Alert */}
          {upcomingRenewals.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-orange-800">Subscriptions Expiring Soon</h3>
                  <p className="text-orange-700 text-sm">
                    {upcomingRenewals.length} subscription(s) will expire within 14 days
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('expiring')}
                  className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
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
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 text-sm">
                              {subscription.restaurant?.name?.charAt(0) || 'R'}
                            </div>
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
                              <span className="text-[10px] font-bold text-orange-600 pl-1 animation-pulse">
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
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Subscription"
                              disabled={processingId === subscription.id}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleViewBilling(subscription)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
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
      )}

      {/* Expiring Soon Tab */}
      {activeTab === 'expiring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
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
              <div key={sub.id} className="bg-white rounded-3xl shadow-sm border border-orange-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${sub.daysUntilExpiry <= 3 ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {sub.daysUntilExpiry <= 0 ? 'Expired' : `${sub.daysUntilExpiry} days left`}
                  </p>
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-2xl ${sub.daysUntilExpiry <= 3 ? 'bg-red-50' : 'bg-orange-50'}`}>
                    <AlertTriangle className={`w-6 h-6 ${sub.daysUntilExpiry <= 3 ? 'text-red-500' : 'text-orange-500'}`} />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{sub.restaurant?.name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{sub.plan?.name}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                  <div className="flex justify-between items-center mb-4 text-xs font-medium text-gray-500">
                    <span>Expires: {formatDate(sub.end_date)}</span>
                    <span className="font-bold text-gray-900">₹{sub.total_amount?.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => openAssignModal(sub)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:to-red-600 transition-all"
                  >
                    Renew Subscription
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plans Tab */}
      {/* Billing & Invoices Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
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
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                            {sub.restaurant?.name?.charAt(0) || 'R'}
                          </div>
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
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
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Plan Stats */}
          {/* Plan Stats */}
          {/* Plan Stats - One Line Scrollable */}
          <div className="flex flex-row gap-4 overflow-x-auto pb-4 items-stretch no-scrollbar">
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
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider truncate" title={`${plan.name} Users`}>
                  {plan.name} Users
                </p>
                <p className="text-3xl font-black text-indigo-700 mt-2">
                  {stats?.planCounts?.[plan.key] || 0}
                </p>
              </div>
            ))}

            {/* Add Plan Action Card */}
            <button
              onClick={() => openPlanModal()}
              className="bg-white p-5 rounded-xl border-dashed border-2 border-blue-300 shadow-sm min-w-[200px] flex-shrink-0 flex flex-col items-center justify-center hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors mb-2">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Add New Plan (+)</p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 flex flex-col items-center gap-4">
                <p className="text-gray-500 font-medium">No subscription plans found in the system.</p>
                <button
                  onClick={handleInitializeDefaults}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-500/20"
                >
                  Initialize Default Plans
                </button>
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className={`group relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 ${!plan.is_active ? 'opacity-75 grayscale' : ''}`}>
                  <div className={`h-2.5 bg-gradient-to-r ${plan.color || 'from-gray-400 to-gray-500'}`} />

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openPlanModal(plan)} className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-sm border border-gray-100">
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
        </div>
      )}

      {/* Plan Modal - Redesigned Premium Version */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.2)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
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

            <form onSubmit={handlePlanSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

              {/* SECTION: BASIC INFO */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Plan Identity</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Internal Key</label>
                    <input
                      value={planForm.key}
                      onChange={(e) => setPlanForm({ ...planForm, key: e.target.value.toLowerCase() })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
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
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
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
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-h-[80px]"
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

                <div className="grid grid-cols-2 gap-6">
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
                            className="w-full bg-orange-50/50 border-none rounded-xl px-3 py-2 text-sm font-black text-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all outline-none"
                            placeholder={cycle.discount_percentage}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-300 text-xs font-black">%</span>
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

                <div className="grid grid-cols-2 gap-6">
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
                      placeholder="from-blue-600 to-indigo-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 text-center block">Features List</label>
                  <textarea
                    value={Array.isArray(planForm.features) ? planForm.features.join(', ') : ''}
                    onChange={(e) => setPlanForm({ ...planForm, features: e.target.value.split(',').map(f => f.trim()).filter(f => f !== '') })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none min-h-[120px] leading-relaxed"
                    placeholder="Unlimited Menus, QR Ordering, AI Insights, etc."
                  />
                  <p className="text-[10px] text-gray-400 font-bold ml-1 italic italic">Separate each feature with a comma</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-[32px]">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Display Publicly</span>
                      <button
                        type="button"
                        onClick={() => setPlanForm({ ...planForm, is_public: !planForm.is_public })}
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${planForm.is_public ? 'bg-blue-600' : 'bg-gray-300'}`}
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
                        className={`w-12 h-6 rounded-full transition-all duration-300 relative ${planForm.ai_features_enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
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
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-[32px] border border-blue-50 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-black text-blue-900 uppercase tracking-widest">Call to Action</span>
                  <button
                    type="button"
                    onClick={() => setPlanForm({ ...planForm, use_custom_builder: !planForm.use_custom_builder })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${planForm.use_custom_builder ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-blue-600 shadow-sm'}`}
                  >
                    <Stars size={12} />
                    Custom Builder
                  </button>
                </div>
                <input
                  value={planForm.button_text}
                  onChange={(e) => setPlanForm({ ...planForm, button_text: e.target.value })}
                  className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-sm"
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
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] transition-all duration-300 disabled:opacity-50 active:scale-95"
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
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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
                    className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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
                      className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm"
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
                      className="w-full border rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm"
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
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                  placeholder="Payment details, transaction ID, or other remarks..."
                />
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t border-transparent mt-2">
                <button
                  type="submit"
                  disabled={processingId === 'assign'}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Billing History</h3>
                  <p className="text-sm text-gray-500">{selectedBillingRestaurant?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBillingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {billingHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <CreditCard size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">No transactions found</p>
                  <p className="text-sm">This restaurant hasn't made any payments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map((txn, idx) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${txn.action === 'created' ? 'bg-green-100 text-green-700' :
                          txn.action === 'renewed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{txn.plan_name} Plan <span className="text-xs font-normal text-gray-500 px-2 bg-gray-100 rounded-full">{txn.billing_cycle}</span></p>
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(txn.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-right">
                            <p className="font-black text-gray-900">₹{txn.amount_paid}</p>
                            <span className="text-[10px] font-bold uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Paid</span>
                          </div>

                          {/* Email Status Indicator */}
                          <div className="flex items-center gap-1.5 mt-1">
                            {txn.email_sent ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle size={10} /> Email Sent
                              </span>
                            ) : (
                              <button
                                onClick={() => handleResendEmail(txn)}
                                disabled={processingId === `email-${txn.id}`}
                                className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full hover:bg-orange-100 transition-colors"
                              >
                                {processingId === `email-${txn.id}` ? (
                                  <RefreshCw size={10} className="animate-spin" />
                                ) : (
                                  <AlertCircle size={10} />
                                )}
                                {processingId === `email-${txn.id}` ? 'Sending...' : 'Email Not Sent'}
                              </button>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => generateInvoice(txn)}
                          disabled={downloadingInvoice === txn.id}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-70"
                        >
                          {downloadingInvoice === txn.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Package size={14} />
                          )}
                          Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 rounded-b-3xl border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">Invoices are automatically generated for each successful payment.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagementV2;