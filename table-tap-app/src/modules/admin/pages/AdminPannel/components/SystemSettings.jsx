import React, { useState, useEffect } from 'react';
import {
    Save,
    Lock,
    Globe,
    Database,
    Key,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Send,
    Play,
    FileCode,
    Eye,
    EyeOff,
    CreditCard,
    FileText,
    X,
    Printer,
    Download
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';
import {
    getSystemSettings,
    updateSystemSetting,
    getAllRestaurants,
    getEmailTemplate
} from '../admin_service.js';
import { applyTemplate } from '../../../../shared/api/emailService';
import { generateProfessionalInvoiceHTML } from '../../../../shared/utils/invoiceGenerator';

const MOCK_DATA = {
    email_template_welcome: {
        owner_name: 'Test Owner',
        restaurant_name: 'Table Tap Test Kitchen',
        email: 'test@example.com',
        password: 'test-password-123',
        dashboard_link: typeof window !== 'undefined' ? window.location.origin + '/admin/login' : 'https://tabletap.in/admin/login',
        year: new Date().getFullYear()
    },
    email_template_invoice: {
        invoice_number: 'INV-TEST-001',
        date: new Date().toLocaleDateString(),
        restaurant_name: 'Table Tap Test Kitchen',
        plan_name: 'Professional',
        billing_cycle: 'monthly',
        subtotal: '1000.00',
        gst: '180.00',
        total_paid: '1180.00',
        year: new Date().getFullYear()
    },
    email_template_application_received: {
        owner_name: 'Test Applicant',
        restaurant_name: 'New Burger Joint',
        plan: 'starter',
        status_url: typeof window !== 'undefined' ? window.location.origin + '/application-status' : 'https://tabletap.in/status',
        payment_row: '<tr><td style="padding: 10px 0; color: #64748b; font-size: 14px;">Payment Status</td><td style="padding: 10px 0; font-size: 14px; text-align: right;"><span style="background-color: #F97316; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Pending Verification</span></td></tr>',
        year: new Date().getFullYear()
    },
    email_template_bill: {
        restaurant_name: 'Test Restaurant',
        restaurant_address: '123 Main St, Food City',
        order_id: 'TT-88229',
        date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        table_number: 'T-05',
        payment_method: 'UPI / Digital',
        customer_name: 'Guest User',
        customer_email: 'guest@example.com',
        customer_phone: '+91 99999 00000',
        items_rows: `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">Paneer Butter Masala x 1</td>
                <td style="padding: 12px 10px; text-align: center; color: #64748b;">1</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b;">₹280.00</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 0; color: #1e293b; font-weight: 500;">Butter Naan x 2</td>
                <td style="padding: 12px 10px; text-align: center; color: #64748b;">2</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b;">₹120.00</td>
            </tr>
        `,
        subtotal: '₹400.00',
        discount: '₹0.00',
        sgst: '₹10.00',
        cgst: '₹10.00',
        discount_row: '',
        delivery_row: '',
        special_instructions_block: '<div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;"><p style="margin:0; font-size: 12px; color: #92400e;"><strong>Note:</strong> Less spicy, extra butter.</p></div>',
        total: '₹420.00',
        special_instructions: 'Less spicy, extra butter.',
        restaurant_contact: 'Support: +91 12345 67890',
        restaurant_gst: '<p style="margin: 0; color: #94a3b8; font-size: 11px;">GSTIN: 07AAAAA0000A1Z5</p>',
        year: new Date().getFullYear()
    },
    email_template_onboarding_menu: {
        owner_name: 'Test Owner',
        restaurant_name: 'Table Tap Kitchen',
        guide_link: typeof window !== 'undefined' ? window.location.origin + '/docs/menu-setup' : 'https://tabletap.in/docs/menu-setup',
        year: new Date().getFullYear()
    },
    email_template_onboarding_qr: {
        owner_name: 'Test Owner',
        restaurant_name: 'Table Tap Test Kitchen',
        qr_dashboard_link: typeof window !== 'undefined' ? window.location.origin + '/admin/qr-codes' : 'https://tabletap.in/admin/qr-codes',
        download_link: 'https://tabletap.in/api/download-all-qrs',
        year: new Date().getFullYear()
    },
    email_template_onboarding_kitchen: {
        owner_name: 'Test Owner',
        restaurant_name: 'Table Tap Test Kitchen',
        kitchen_link: typeof window !== 'undefined' ? window.location.origin + '/admin/kitchen' : 'https://tabletap.in/admin/kitchen',
        kot_guide_link: 'https://tabletap.in/docs/kot-setup',
        year: new Date().getFullYear()
    },
    order_accepted: {
        order_number: '88229',
        restaurant_name: 'Table Tap Test Kitchen',
        year: new Date().getFullYear()
    },
    order_rejected: {
        order_number: '88229',
        restaurant_name: 'Table Tap Test Kitchen',
        reason: 'Restaruant is currently at full capacity. Please try again in 15 minutes.',
        year: new Date().getFullYear()
    }
};

const SystemSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null); // Key being saved
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const [editingSetting, setEditingSetting] = useState(null);

    // Fetch settings on mount and category change
    useEffect(() => {
        if (activeCategory === 'email') {
            fetchSettings(true); // Fetch both settings and templates
        } else if (activeCategory === 'diagnostics') {
            // No fetch needed
        } else {
            fetchSettings(false); // Fetch only system settings
        }
    }, [activeCategory]);

    const fetchSettings = async (includeTemplates = false) => {
        setLoading(true);
        try {
            const queries = [supabase.from('system_settings').select('*').order('category').order('key')];

            if (includeTemplates) {
                queries.push(supabase.from('email_templates').select('*').order('category').order('key'));
            }

            const results = await Promise.all(queries);
            const settingsRes = results[0];
            const templatesRes = results[1];

            if (settingsRes.error) throw settingsRes.error;

            let allSettings = [...settingsRes.data];

            if (includeTemplates && templatesRes && !templatesRes.error) {
                // Map templates to match the setting format for the UI
                const templates = (templatesRes.data || []).map(t => ({
                    key: t.key,
                    value: { subject: t.subject, html: t.html },
                    description: t.description,
                    category: 'email', // Force to 'email' category for the UI view
                    is_template: true, // Flag to differentiate for updates
                    updated_at: t.updated_at
                }));
                allSettings = [...allSettings, ...templates];
            }

            setSettings(allSettings);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key, newValue, description) => {
        setSaving(key);
        setError(null);
        setSuccess(null);

        try {
            // Validate JSON
            let parsedValue;
            try {
                parsedValue = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
            } catch (e) {
                throw new Error('Invalid JSON format');
            }

            const targetSetting = settings.find(s => s.key === key);

            if (targetSetting?.is_template) {
                // Update email_templates table
                const { error } = await supabase
                    .from('email_templates')
                    .update({
                        subject: parsedValue.subject,
                        html: parsedValue.html,
                        description: description,
                        updated_at: new Date().toISOString()
                    })
                    .eq('key', key);

                if (error) throw error;
            } else {
                // Update system_settings table
                const { error } = await supabase
                    .from('system_settings')
                    .update({
                        value: parsedValue,
                        description: description,
                        updated_at: new Date().toISOString()
                    })
                    .eq('key', key);

                if (error) throw error;
            }

            setSuccess(`Setting '${key}' updated successfully`);
            fetchSettings();
        } catch (err) {
            console.error('Error updating setting:', err);
            setError(err.message);
        } finally {
            setSaving(null);
        }
    };

    const [showTemplateTester, setShowTemplateTester] = useState(false);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const handleTestTemplate = async (key, templateData, recipientEmail) => {
        const email = recipientEmail || prompt("Enter recipient email for template test:");
        if (!email) return;

        setSuccess(null);
        setError(null);

        try {
            let subject = templateData.subject;
            let html = templateData.html;

            // Get mock data for this template key
            const mockData = MOCK_DATA[key] || {};

            // Use applyTemplate utility
            const applied = applyTemplate(templateData.subject, templateData.html, mockData);
            subject = applied.subject;
            html = applied.html;

            const { error: invokeError } = await supabase.functions.invoke('send-email', {
                body: {
                    to: email,
                    subject: `[TEST] ${subject}`,
                    html: html
                }
            });

            if (invokeError) throw invokeError;

            setSuccess(`Template test sent to ${email}`);
            return true;
        } catch (err) {
            console.error('Template test failed:', err);
            setError('Failed to send template test: ' + err.message);
            return false;
        }
    };

    const handlePreviewTemplate = (key, templateData) => {
        try {
            const mockData = MOCK_DATA[key] || {};
            const applied = applyTemplate(templateData.subject, templateData.html, mockData);

            setPreviewTemplate({
                key,
                subject: applied.subject,
                html: applied.html
            });
        } catch (err) {
            console.error('Error generating preview:', err);
            setError('Failed to generate preview');
        }
    };

    const handleTestEmail = async () => {
        setShowTemplateTester(true);
    };

    const handlePreviewInvoice = (companyDetails) => {
        const mockInvoiceData = {
            invoiceNumber: 'INV-PREVIEW-001',
            invoiceDate: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            customer: {
                name: 'Sample Restaurant',
                address: '123 Business Road, Tech Park',
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560001',
                country: 'India',
                email: 'contact@samplerestaurant.com',
                phone: '+91 98765 43210',
                gstin: '29ABCDE1234F1Z5'
            },
            items: [
                {
                    name: 'TableTap Professional Plan',
                    description: 'Monthly Software Subscription (SaaS)',
                    quantity: 1,
                    unitPrice: 2000,
                    taxRate: 18,
                    amount: 2000
                }
            ],
            payment: {
                totalAmount: 2360, // 2000 + 18% GST
                paymentId: 'pay_1234567890',
                method: 'UPI',
                date: new Date().toISOString()
            },
            companyDetails: companyDetails,
            isPaid: true
        };

        const html = generateProfessionalInvoiceHTML(mockInvoiceData);
        setPreviewInvoice(html);
    };

    // Seed Payment Settings if missing
    const handleFixPayment = async () => {
        try {
            const defaults = [
                {
                    key: 'razorpay_keys',
                    value: { key_id: '', key_secret: '' },
                    category: 'api',
                    description: 'Razorpay Keys (Admin)',
                    is_secret: true,
                    is_active: true
                },
                {
                    key: 'stripe_keys',
                    value: { publishable_key: '', secret_key: '' },
                    category: 'api',
                    description: 'Stripe Keys (Admin)',
                    is_secret: true,
                    is_active: true
                },
                {
                    key: 'google_maps_key',
                    value: { key: '' },
                    category: 'api',
                    description: 'Google Maps API Key for location services',
                    is_secret: true,
                    is_active: true
                },
                {
                    key: 'openai_keys',
                    value: { api_key: '' },
                    category: 'api',
                    description: 'OpenAI Keys for Advisor AI (Admin)',
                    is_secret: true,
                    is_active: true
                },
                {
                    key: 'whatsapp_keys',
                    value: { access_token: '', phone_number_id: '' },
                    category: 'api',
                    description: 'WhatsApp Business API Keys (Admin)',
                    is_secret: true,
                    is_active: true
                },
                {
                    key: 'email_template_onboarding_menu',
                    value: {
                        subject: "Step 1: Setting up your Menu at {{restaurant_name}}",
                        html: "<html><body><h1>Welcome {{owner_name}}!</h1><p>The first step to going digital is setting up your menu. Click here to start: {{guide_link}}</p></body></html>"
                    },
                    category: 'email',
                    description: 'Onboarding Step 1: Menu Setup',
                    is_secret: false,
                    is_active: true
                },
                {
                    key: 'email_template_onboarding_qr',
                    value: {
                        subject: "Step 2: Print your QR Codes for {{restaurant_name}}",
                        html: "<html><body><h1>Hi {{owner_name}}!</h1><p>Your menu is ready. Now, generate and print your table QR codes here: {{qr_dashboard_link}}</p></body></html>"
                    },
                    category: 'email',
                    description: 'Onboarding Step 2: QR Generation',
                    is_secret: false,
                    is_active: true
                }
            ];
            const { error } = await supabase.from('system_settings').upsert(defaults, { onConflict: 'key' });
            if (error) throw error;
            setSuccess('System settings and new onboarding templates initialized.');
            fetchSettings();
            setTimeout(() => setActiveCategory('email'), 1500);
        } catch (err) {
            setError(err.message);
        }
    };

    // Helper to format JSON for textarea
    const formatJSON = (val) => JSON.stringify(val, null, 2);

    // Group settings by category
    const categories = ['all', ...new Set(settings.map(s => s.category || 'misc')), 'diagnostics'];

    const filteredSettings = activeCategory === 'all'
        ? settings
        : settings.filter(s => s.category === activeCategory);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
            {/* Category Tabs & Actions */}
            <div className="flex items-center justify-between gap-3 px-0.5">
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar flex-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0
                                ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchSettings}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors shrink-0 bg-white rounded-lg shadow-sm border border-gray-100"
                    title="Refresh Settings"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Content */}
            {activeCategory === 'diagnostics' ? (
                <DiagnosticsPanel onFixPayment={handleFixPayment} />
            ) : (
                <>
                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle size={20} />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle size={20} />
                            <span className="font-medium">{success}</span>
                        </div>
                    )}

                    {/* Settings Grid */}
                    <div className="grid gap-2 md:gap-6 w-full max-w-full">
                        {activeCategory === 'email' ? (
                            <div className="grid gap-2 w-full">
                                {filteredSettings.map((setting) => (
                                    <CompactEmailItem
                                        key={setting.key}
                                        setting={setting}
                                        onEdit={() => setEditingSetting(setting)}
                                        onTestTemplate={handleTestTemplate}
                                        onPreviewTemplate={handlePreviewTemplate}
                                    />
                                ))}
                            </div>
                        ) : (
                            filteredSettings.map((setting) => (
                                <SettingCard
                                    key={setting.key}
                                    setting={setting}
                                    onSave={handleUpdate}
                                    isSaving={saving === setting.key}
                                    onTestEmail={handleTestEmail}
                                    onTestTemplate={handleTestTemplate}
                                    onPreviewInvoice={handlePreviewInvoice}
                                    onPreviewTemplate={handlePreviewTemplate}
                                />
                            ))
                        )}

                        {filteredSettings.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Database className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-gray-500">No settings found in this category.</p>
                            </div>
                        )}
                    </div>

                    {/* Setting Editor Modal (for compact items) */}
                    {editingSetting && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 md:p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditingSetting(null)} />
                            <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto overflow-x-hidden no-scrollbar animate-in zoom-in-95 duration-200 rounded-xl shadow-2xl">
                                <SettingCard
                                    setting={editingSetting}
                                    onSave={(key, val, desc) => {
                                        handleUpdate(key, val, desc);
                                        setEditingSetting(null);
                                    }}
                                    isSaving={saving === editingSetting.key}
                                    onTestEmail={handleTestEmail}
                                    onTestTemplate={handleTestTemplate}
                                    onPreviewInvoice={handlePreviewInvoice}
                                    onPreviewTemplate={handlePreviewTemplate}
                                    isPopup={true}
                                    onClose={() => setEditingSetting(null)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Invoice Preview Modal */}
                    {previewInvoice && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                                onClick={() => setPreviewInvoice(null)}
                            />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="font-bold text-gray-900">Invoice Preview</h3>
                                    <button
                                        onClick={() => setPreviewInvoice(null)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto bg-gray-100 p-6">
                                    <div
                                        className="bg-white shadow-lg mx-auto"
                                        style={{ maxWidth: '800px' }}
                                        dangerouslySetInnerHTML={{
                                            __html: previewInvoice
                                                .replace(/<html[^>]*>|<\/html>|<head>[\s\S]*?<\/head>|<body[^>]*>|<\/body>|<!DOCTYPE[^>]*>/gi, '')
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Template Preview Modal */}
                    {previewTemplate && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 md:p-4">
                            <div
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                                onClick={() => setPreviewTemplate(null)}
                            />
                            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-gray-50/50">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm md:text-base">Email Preview</h3>
                                        <p className="text-[10px] md:text-xs text-gray-500 font-mono mt-0.5">{previewTemplate.key}</p>
                                    </div>
                                    <button
                                        onClick={() => setPreviewTemplate(null)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                                    </button>
                                </div>
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Subject</p>
                                    <p className="text-xs md:text-sm font-bold text-gray-800">{previewTemplate.subject}</p>
                                </div>
                                <div className="flex-1 overflow-auto bg-gray-100 p-2 md:p-6 custom-scrollbar">
                                    <div
                                        className="bg-white shadow-sm mx-auto rounded-lg overflow-hidden"
                                        style={{ maxWidth: '600px' }}
                                        dangerouslySetInnerHTML={{
                                            __html: previewTemplate.html
                                        }}
                                    />
                                </div>
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                                    <button
                                        onClick={() => {
                                            const templateKey = previewTemplate.key;
                                            setPreviewTemplate(null);
                                            handleTestTemplate(templateKey, settings.find(s => s.key === templateKey)?.value);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm"
                                    >
                                        <Send size={14} />
                                        Send Test Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Template Tester Modal */}
                    <TemplateTesterModal
                        isOpen={showTemplateTester}
                        onClose={() => setShowTemplateTester(false)}
                        templates={settings.filter(s => s.key.startsWith('email_template_'))}
                        onTest={handleTestTemplate}
                        onPreview={handlePreviewTemplate}
                    />
                </>
            )}
        </div>
    );
};

const CompactEmailItem = ({ setting, onEdit, onTestTemplate, onPreviewTemplate }) => {
    const isTemplate = setting.key.startsWith('email_template_') || setting.key.includes('order_');
    const label = setting.key.replace('email_template_', '').replace(/_/g, ' ').toUpperCase();

    return (
        <div
            onClick={onEdit}
            className="group flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] w-full overflow-hidden"
        >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`p-1.5 rounded-lg shrink-0 ${isTemplate ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                    {isTemplate ? <FileCode size={16} /> : <Send size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-[12px] md:text-[13px] font-bold text-gray-900 truncate">{label}</h4>
                    <p className="text-[9px] md:text-[10px] text-gray-400 truncate">{setting.description || 'Manage template configuration'}</p>
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
                {isTemplate && (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreviewTemplate(setting.key, setting.value);
                            }}
                            className="p-1.5 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Preview"
                        >
                            <Eye size={14} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTestTemplate(setting.key, setting.value);
                            }}
                            className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Quick Test"
                        >
                            <Play size={14} fill="currentColor" />
                        </button>
                    </div>
                )}
                <div className="p-1 px-1.5 text-[9px] font-black text-gray-300 group-hover:text-indigo-500 transition-colors uppercase">
                    Edit
                </div>
            </div>
        </div>
    );
};

const DiagnosticsPanel = ({ onFixPayment }) => {
    const [checks, setChecks] = useState({
        database: { status: 'idle', message: 'Ready to check' },
        auth: { status: 'idle', message: 'Ready to check' },
        storage: { status: 'idle', message: 'Ready to check' },
        email: { status: 'idle', message: 'Ready to check' },
        payment: { status: 'idle', message: 'Ready to check' },
        ai: { status: 'idle', message: 'Ready to check' },
        maps: { status: 'idle', message: 'Ready to check' },
        whatsapp: { status: 'idle', message: 'Ready to check' },
    });
    const [running, setRunning] = useState(false);

    const runDiagnostics = async () => {
        setRunning(true);
        const initialLoadingState = {
            database: { status: 'loading', message: 'Connecting...' },
            auth: { status: 'loading', message: 'Verifying session...' },
            storage: { status: 'loading', message: 'Checking buckets...' },
            email: { status: 'loading', message: 'Pinging service...' },
            payment: { status: 'loading', message: 'Checking keys...' },
            ai: { status: 'loading', message: 'Checking AI config...' },
            maps: { status: 'loading', message: 'Checking Maps config...' },
            whatsapp: { status: 'loading', message: 'Checking WhatsApp config...' },
        };
        setChecks(initialLoadingState);

        const newChecks = { ...initialLoadingState }; // Start with loading states

        // 1. Database Check
        try {
            const start = performance.now();
            const { count, error } = await supabase.from('restaurants').select('*', { count: 'exact', head: true });
            const duration = Math.round(performance.now() - start);

            if (error) throw error;
            newChecks.database = {
                status: 'success',
                message: `Connected (${duration}ms). ${count} records found.`
            };
        } catch (error) {
            newChecks.database = { status: 'error', message: error.message };
        }

        // 2. Auth Check
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (session) {
                newChecks.auth = { status: 'success', message: `Authenticated as ${session.user.email}` };
            } else {
                newChecks.auth = { status: 'warning', message: 'No active session' };
            }
        } catch (error) {
            newChecks.auth = { status: 'error', message: error.message };
        }

        // 3. Storage Check
        try {
            const { data: buckets, error } = await supabase.storage.listBuckets();
            if (error) throw error;
            newChecks.storage = {
                status: 'success',
                message: `Access OK. ${buckets.length} buckets available.`
            };
        } catch (error) {
            newChecks.storage = { status: 'error', message: error.message };
        }

        // 4. Email Service Check
        try {
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: { type: 'ping' }
            });
            if (error) throw error;
            newChecks.email = { status: 'success', message: 'Service reachable' };
        } catch (error) {
            // It might restrict ping, so allow 400s if it means reachable
            if (error.message.includes('400') || error.message.includes('401')) {
                newChecks.email = { status: 'success', message: 'Service reachable (Auth required)' };
            } else {
                newChecks.email = { status: 'error', message: 'Unreachable' };
            }
        }

        // 5. API Keys Check (Payment, AI, Maps)
        try {
            const { data: settings } = await supabase.from('system_settings').select('key, value');

            // --- Payment Check ---
            const razSetting = settings?.find(s => s.key === 'razorpay_keys' || s.key === 'razorpay_key_id');
            let razConfigured = false;
            if (razSetting) {
                razConfigured = typeof razSetting.value === 'object' ? !!razSetting.value.key_id : !!razSetting.value;
            }
            const stripeSetting = settings?.find(s => s.key === 'stripe_keys' || s.key === 'stripe_publishable_key');
            let stripeConfigured = false;
            if (stripeSetting) {
                stripeConfigured = typeof stripeSetting.value === 'object' ? !!stripeSetting.value.publishable_key : !!stripeSetting.value;
            }
            const adminConfigured = razConfigured || stripeConfigured;
            const { data: restaurants } = await getAllRestaurants();
            const total = restaurants?.length || 0;
            const configured = restaurants?.filter(r => r.razorpay_key_id).length || 0;
            newChecks.payment = {
                status: adminConfigured ? 'success' : 'warning',
                message: `Admin: ${adminConfigured ? 'Configured' : 'Missing Key'}. Restaurants: ${configured}/${total} Setup`
            };

            // --- AI Advisor Check ---
            const aiSetting = settings?.find(s => s.key === 'openai_keys');
            const aiKeyVal = aiSetting?.value?.api_key || aiSetting?.value?.key;
            if (!aiSetting) {
                newChecks.ai = { status: 'error', message: 'Setting openai_keys missing from DB' };
            } else if (!aiKeyVal) {
                newChecks.ai = { status: 'warning', message: 'Key initialized but empty' };
            } else {
                newChecks.ai = { status: 'success', message: 'OpenAI key configured' };
            }

            // --- Google Maps Check ---
            const mapsSetting = settings?.find(s => s.key === 'google_maps_key');
            const mapsKeyVal = mapsSetting?.value?.key || mapsSetting?.value?.api_key || mapsSetting?.value;
            if (!mapsSetting) {
                newChecks.maps = { status: 'error', message: 'Setting google_maps_key missing from DB' };
            } else if (!mapsKeyVal) {
                newChecks.maps = { status: 'warning', message: 'Key initialized but empty' };
            } else {
                newChecks.maps = { status: 'success', message: 'Google Maps key configured' };
            }

            // --- WhatsApp Check ---
            const waSetting = settings?.find(s => s.key === 'whatsapp_keys');
            const waTokenVal = waSetting?.value?.access_token;
            const waIdVal = waSetting?.value?.phone_number_id;
            if (!waSetting) {
                newChecks.whatsapp = { status: 'error', message: 'Setting whatsapp_keys missing from DB' };
            } else if (!waTokenVal || !waIdVal) {
                newChecks.whatsapp = { status: 'warning', message: 'WhatsApp keys incomplete' };
            } else {
                newChecks.whatsapp = { status: 'success', message: 'WhatsApp API configured' };
            }

        } catch (error) {
            newChecks.payment = { status: 'error', message: error.message };
            newChecks.ai = { status: 'error', message: 'Failed to check AI config' };
            newChecks.maps = { status: 'error', message: 'Failed to check Maps config' };
            newChecks.whatsapp = { status: 'error', message: 'Failed to check WhatsApp config' };
        }

        setChecks(newChecks);
        setRunning(false);
    };

    const StatusIcon = ({ status }) => {
        if (status === 'loading') return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
        if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
        if (status === 'error') return <AlertTriangle className="w-5 h-5 text-red-500" />;
        if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        return <div className="w-5 h-5 rounded-full border-2 border-gray-200" />;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">System Diagnostics</h3>
                        <p className="text-sm text-gray-500">Check connectivity and status of core services.</p>
                    </div>
                    <button
                        onClick={runDiagnostics}
                        disabled={running}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {running ? 'Running...' : 'Run Checks'}
                        {!running && <Play size={16} />}
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Database</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.database.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.database.status} />
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-purple-600">
                                <Key size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Auth Session</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.auth.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.auth.status} />
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Storage</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.storage.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.storage.status} />
                    </div>

                    {/* Email Service Check */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                                <Send size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Email Service</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.email.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.email.status} />
                    </div>

                    {/* Payment Gateway Check */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Payment Gateways</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.payment.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.payment.status} />
                    </div>

                    {/* AI Advisor Check */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">AI Advisor (OpenAI)</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.ai.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.ai.status} />
                    </div>

                    {/* Google Maps Check */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Google Maps API</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.maps.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.maps.status} />
                    </div>

                    {/* WhatsApp Check */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                                <Send size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">WhatsApp Business</h4>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">{checks.whatsapp.message}</p>
                            </div>
                        </div>
                        <StatusIcon status={checks.whatsapp.status} />
                    </div>

                    {/* Initialize Settings Button - Centered/Bottom */}
                    {(checks.payment.status === 'warning' || checks.ai.status === 'error' || checks.maps.status === 'error' || checks.whatsapp.status === 'error') && (
                        <div className="md:col-span-2 flex justify-center py-2">
                            <button
                                onClick={onFixPayment}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all text-sm shadow-sm"
                            >
                                <RefreshCw size={14} />
                                Initialize Missing Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SettingCard = ({ setting, onSave, isSaving, onTestEmail, onTestTemplate, onPreviewInvoice, onPreviewTemplate, isPopup, onClose }) => {
    // Initialize parsed value state
    const [jsonValue, setJsonValue] = useState(JSON.stringify(setting.value, null, 2));
    // Initialize form values state
    const [formValues, setFormValues] = useState(typeof setting.value === 'object' ? setting.value : {});
    const [description, setDescription] = useState(setting.description || '');
    const [isEditing, setIsEditing] = useState(false);
    const [showSecret, setShowSecret] = useState(!setting.is_secret);
    const [editorMode, setEditorMode] = useState('form'); // 'form' or 'json'

    // Reset when setting prop changes
    useEffect(() => {
        const val = setting.value || {};
        setJsonValue(JSON.stringify(val, null, 2));
        setFormValues(typeof val === 'object' ? val : {});
        setDescription(setting.description);
        // Default to form view generally, unless it's a complex array or empty
        setEditorMode(typeof val === 'object' && !Array.isArray(val) ? 'form' : 'json');
    }, [setting]);

    const handleSave = () => {
        if (editorMode === 'form') {
            // Convert form values back to JSON string for the save handler which expects stringified JSON (or update handler logic)
            // Actually handleUpdate expects the raw JSON string? looking at line 114: parsedValue = JSON.parse(newValue);
            // So we pass stringified formValues.
            onSave(setting.key, JSON.stringify(formValues), description);
        } else {
            onSave(setting.key, jsonValue, description);
        }
        setIsEditing(false);
    };

    const handleFormChange = (key, value) => {
        const newValues = { ...formValues, [key]: value };
        setFormValues(newValues);
        setJsonValue(JSON.stringify(newValues, null, 2));
    };

    const isSecret = setting.is_secret;
    const isRichText = (key, val) => typeof val === 'string' && (val.length > 50 || key === 'html' || key === 'body');

    return (
        <div className={`bg-white rounded-xl md:rounded-2xl border transition-all duration-200 ${isEditing ? 'border-indigo-500 shadow-xl ring-1 ring-indigo-500' : 'border-gray-100 shadow-sm'} ${isPopup ? 'border-none' : ''}`}>
            <div className={`p-2.5 md:p-6 ${isPopup ? 'max-w-full overflow-x-hidden' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 md:gap-4 mb-3 md:mb-4">
                    <div className="flex items-start gap-2 md:gap-3 min-w-0">
                        <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${isSecret ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isSecret ? <Lock size={16} className="md:w-5 md:h-5" /> : <Globe size={16} className="md:w-5 md:h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 font-mono text-[10px] md:text-sm break-all leading-tight truncate md:whitespace-normal">{setting.key}</h3>
                            <span className="text-[8px] md:text-[9px] text-gray-400 uppercase tracking-widest font-bold bg-gray-50/80 px-1 py-0.5 rounded mt-0.5 inline-block border border-gray-100">
                                {setting.category}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {!isEditing ? (
                            <>
                                {setting.key === 'company_details' && (
                                    <button
                                        onClick={() => onPreviewInvoice(formValues)}
                                        className="flex-1 md:flex-none px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100 whitespace-nowrap"
                                    >
                                        <FileText className="w-3 h-3 inline-block mr-1 md:mr-2" />
                                        Preview
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 md:flex-none px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-center border border-indigo-100"
                                >
                                    Edit
                                </button>
                                {isPopup && (
                                    <button
                                        onClick={onClose}
                                        className="px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-gray-400 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="flex gap-2 w-full md:w-auto">
                                {setting.key === 'company_details' && (
                                    <button
                                        onClick={() => onPreviewInvoice(formValues)}
                                        className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100 whitespace-nowrap hidden md:inline-block"
                                    >
                                        <FileText className="w-3 h-3 inline-block mr-1 md:mr-2" />
                                        Preview
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 md:flex-none px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 text-center"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-2 md:flex-none flex items-center justify-center gap-1.5 px-2 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                    {/* Description Field */}
                    {isEditing ? (
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 text-xs md:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="Describe what this setting does..."
                            />
                        </div>
                    ) : (
                        description && <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{description}</p>
                    )}

                    {/* Editor Toggle */}
                    {isEditing && typeof setting.value === 'object' && !Array.isArray(setting.value) && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setEditorMode(editorMode === 'form' ? 'json' : 'form')}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                {editorMode === 'form' ? <FileCode size={12} /> : <Database size={12} />}
                                Switch to {editorMode === 'form' ? 'JSON' : 'Form'} View
                            </button>
                        </div>
                    )}

                    {/* Value Editor */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between items-center">
                            <span>Configuration</span>
                            {isSecret && (
                                <button
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 p-1"
                                >
                                    {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                                    <span className="text-[10px] md:text-xs">{showSecret ? 'Hide' : 'Show'}</span>
                                </button>
                            )}
                        </label>

                        {isSecret && !showSecret && !isEditing ? (
                            <div className="w-full py-3 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-center text-gray-300 font-mono text-xs select-none break-all">
                                ••••••••••••••••••••••••••••
                            </div>
                        ) : (
                            <>
                                {editorMode === 'form' && typeof formValues === 'object' ? (
                                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 md:gap-y-3 ${isEditing ? 'p-2 md:p-4 border border-gray-100 rounded-xl bg-gray-50/50' : ''}`}>
                                        {Object.entries(formValues).map(([key, val]) => {
                                            const isLong = isRichText(key, val);
                                            return (
                                                <div key={key} className={isLong ? 'md:col-span-2' : ''}>
                                                    <label className="block text-[9px] font-semibold text-gray-400 mb-0.5 capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </label>
                                                    {isLong ? (
                                                        <textarea
                                                            value={val}
                                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                                            disabled={!isEditing}
                                                            rows={key === 'html' ? 6 : 3}
                                                            className={`w-full text-[11px] md:text-sm p-2 md:p-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all
                                                                ${isEditing ? 'bg-white border-gray-200' : 'bg-transparent border-transparent resize-none p-0'}`}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={val}
                                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                                            disabled={!isEditing}
                                                            className={`w-full text-[11px] md:text-sm p-1 md:p-2 rounded-lg border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium
                                                                ${isEditing ? 'bg-white border-gray-200' : 'bg-transparent border-transparent p-0'}`}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {Object.keys(formValues).length === 0 && (
                                            <p className="text-xs text-gray-400 italic">Empty configuration object</p>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        value={jsonValue}
                                        onChange={(e) => setJsonValue(e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full h-32 md:h-48 font-mono text-[10px] md:text-xs p-3 md:p-4 rounded-xl border leading-relaxed
                                            ${isEditing
                                                ? 'bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900'
                                                : 'bg-gray-50/50 border-transparent text-gray-500 resize-none'
                                            }`}
                                        spellCheck="false"
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Resend: show config used for test email and send test */}
                {setting.key === 'resend_config' && !isEditing && (
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                        <p className="text-[9px] md:text-[13px] text-gray-500 bg-gray-50/80 border border-gray-100 rounded-lg px-2 py-1 leading-relaxed">
                            API key and sender are read from here. To send from your domain, set <code className="text-[9px] bg-white px-1 py-0.5 rounded">from_email</code> to e.g. <code className="text-[9px] bg-white px-1 py-0.5 rounded">TableTap &lt;noreply@table-tap.in&gt;</code> (domain must be verified at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline font-medium">resend.com/domains</a>).
                        </p>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                            <p className="text-[9px] md:text-xs text-gray-400">
                                Sender: <strong className="font-mono text-gray-600 break-all">{setting.value?.from_email || 'TableTap <onboarding@resend.dev>'}</strong>
                            </p>
                            <button
                                onClick={onTestEmail}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] md:text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                            >
                                <Send size={12} /> Send Test Email
                            </button>
                        </div>
                    </div>
                )}

                {/* Test Action for Email Templates */}
                {setting.category === 'email' && setting.key.startsWith('email_template_') && !isEditing && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2 justify-end">
                        <button
                            onClick={() => onPreviewTemplate(setting.key, setting.value)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] md:text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                        >
                            <Eye size={12} /> Preview
                        </button>
                        <button
                            onClick={() => onTestTemplate(setting.key, setting.value)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] md:text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                        >
                            <Play size={12} fill="indigo" /> Test Template
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TemplateTesterModal = ({ isOpen, onClose, templates, onTest, onPreview }) => {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(null); // template key being sent

    if (!isOpen) return null;

    const restaurantTemplates = templates.filter(t =>
        t.key.includes('welcome') || t.key.includes('invoice') || t.key.includes('received')
    );
    const customerTemplates = templates.filter(t =>
        t.key.includes('bill') || t.key.includes('order') || t.key.includes('onboarding')
    );

    const handleSend = async (key, data) => {
        if (!email) {
            alert('Please enter a recipient email');
            return;
        }
        setSending(key);
        await onTest(key, data, email);
        setSending(null);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 md:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm md:text-base">Test Email Templates</h3>
                        <p className="text-[9px] text-gray-400">Send templates with mock data</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-3 md:p-6 space-y-4 overflow-y-auto overflow-x-hidden">
                    {/* Recipient Email */}
                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Recipient Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g. yourname@example.com"
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition-all font-medium text-[12px]"
                            />
                            <Send size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    {/* Restaurant Templates */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            Restaurant Side <div className="h-px bg-indigo-100 flex-1" />
                        </h4>
                        <div className="grid gap-2">
                            {restaurantTemplates.map(t => (
                                <div
                                    key={t.key}
                                    className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white hover:border-indigo-200 transition-all group"
                                >
                                    <div className="text-left min-w-0">
                                        <p className="text-[12px] font-bold text-gray-700 group-hover:text-indigo-600 transition-colors truncate">
                                            {t.key.replace('email_template_', '').replace(/_/g, ' ').toUpperCase()}
                                        </p>
                                        <p className="text-[9px] text-gray-400 truncate">{t.value.subject}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPreview(t.key, t.value);
                                            }}
                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Preview"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSend(t.key, t.value);
                                            }}
                                            disabled={sending === t.key}
                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Send Test"
                                        >
                                            {sending === t.key ? (
                                                <RefreshCw size={16} className="animate-spin" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Customer Templates */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            Customer Side <div className="h-px bg-emerald-100 flex-1" />
                        </h4>
                        <div className="grid gap-2">
                            {customerTemplates.map(t => (
                                <div
                                    key={t.key}
                                    className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white hover:border-emerald-200 transition-all group"
                                >
                                    <div className="text-left min-w-0">
                                        <p className="text-[12px] font-bold text-gray-700 truncate">
                                            {t.key.replace('email_template_', '').replace(/_/g, ' ').toUpperCase()}
                                        </p>
                                        <p className="text-[9px] text-gray-400 truncate">{t.value.subject}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onPreview(t.key, t.value);
                                            }}
                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Preview"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSend(t.key, t.value);
                                            }}
                                            disabled={sending === t.key}
                                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                            title="Send Test"
                                        >
                                            {sending === t.key ? (
                                                <RefreshCw size={16} className="animate-spin" />
                                            ) : (
                                                <Send size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-2.5 bg-amber-50/50 border-t border-amber-100">
                    <p className="text-[8.5px] md:text-[10px] text-amber-600 leading-tight italic">
                        Mock data used for testing.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
