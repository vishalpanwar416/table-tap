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
    Eye,
    EyeOff,
    Send,
    FileCode,
    Play
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';

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
        payment_row: '<tr><td style="padding: 8px 0; color: #777; font-size: 14px;">Payment:</td><td style="padding: 8px 0; font-size: 14px; text-align: right;"><span style="background-color: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 12px;">✓ Paid (Test)</span></td></tr>',
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

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .order('category')
                .order('key');

            if (error) throw error;
            setSettings(data);
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
                parsedValue = JSON.parse(newValue);
            } catch (e) {
                throw new Error('Invalid JSON format');
            }

            const { error } = await supabase
                .from('system_settings')
                .update({
                    value: parsedValue,
                    description: description,
                    updated_at: new Date().toISOString()
                })
                .eq('key', key);

            if (error) throw error;

            setSuccess(`Setting '${key}' updated successfully`);

            // Update local state
            setSettings(prev => prev.map(s =>
                s.key === key ? { ...s, value: parsedValue, description } : s
            ));

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(null);
        }
    };

    const handleTestEmail = async () => {
        const email = prompt("Enter recipient email (check your inbox/spam):");
        if (!email) return;

        setSuccess(null);
        setError(null);

        try {
            const { error: invokeError } = await supabase.functions.invoke('send-email', {
                body: {
                    to: email,
                    subject: 'Test Email from Table Tap Admin',
                    html: `
                        <div style="font-family: sans-serif; padding: 40px; text-align: center; background-color: #f9fafb;">
                            <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 500px; margin: 0 auto;">
                                <h1 style="color: #4F46E5; margin-bottom: 20px;">Test Successful!</h1>
                                <p style="color: #4B5563; line-height: 1.6;">Your email service configuration is working correctly.</p>
                                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
                                <p style="color: #9CA3AF; font-size: 12px;">Sent securely via Table Tap Admin Panel.</p>
                            </div>
                        </div>
                    `
                }
            });

            if (invokeError) throw invokeError;

            setSuccess(`Test email sent to ${email}`);
        } catch (err) {
            console.error('Test email failed:', err);
            setError('Failed to send test email: ' + err.message);
        }
    };

    const handleTestTemplate = async (key, templateData) => {
        const email = prompt("Enter recipient email for template test:");
        if (!email) return;

        setSuccess(null);
        setError(null);

        try {
            let subject = templateData.subject;
            let html = templateData.html;

            // Get mock data for this template key
            const mockData = MOCK_DATA[key] || {};

            // Basic variable replacement
            Object.keys(mockData).forEach(varName => {
                const regex = new RegExp(`{{${varName}}}`, 'g');
                subject = subject.replace(regex, mockData[varName]);
                html = html.replace(regex, mockData[varName]);
            });

            const { error: invokeError } = await supabase.functions.invoke('send-email', {
                body: {
                    to: email,
                    subject: `[TEST] ${subject}`,
                    html: html
                }
            });

            if (invokeError) throw invokeError;

            setSuccess(`Template test sent to ${email}`);
        } catch (err) {
            console.error('Template test failed:', err);
            setError('Failed to send template test: ' + err.message);
        }
    };

    // Helper to format JSON for textarea
    const formatJSON = (val) => JSON.stringify(val, null, 2);

    // Group settings by category
    const categories = ['all', ...new Set(settings.map(s => s.category || 'misc'))];

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">System Settings</h1>
                    <p className="text-gray-500 text-sm">Manage API keys, content, and global configuration.</p>
                </div>
                <button
                    onClick={fetchSettings}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap
                            ${activeCategory === cat
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

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
            <div className="grid gap-6">
                {filteredSettings.map((setting) => (
                    <SettingCard
                        key={setting.key}
                        setting={setting}
                        onSave={handleUpdate}
                        isSaving={saving === setting.key}
                        onTestEmail={handleTestEmail}
                        onTestTemplate={handleTestTemplate}
                    />
                ))}

                {filteredSettings.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Database className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-gray-500">No settings found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingCard = ({ setting, onSave, isSaving, onTestEmail, onTestTemplate }) => {
    const [value, setValue] = useState(JSON.stringify(setting.value, null, 2));
    const [description, setDescription] = useState(setting.description || '');
    const [isEditing, setIsEditing] = useState(false);
    const [showSecret, setShowSecret] = useState(!setting.is_secret);

    // Reset when setting prop changes
    useEffect(() => {
        setValue(JSON.stringify(setting.value, null, 2));
        setDescription(setting.description);
    }, [setting]);

    const handleSave = () => {
        onSave(setting.key, value, description);
        setIsEditing(false);
    };

    const isSecret = setting.is_secret;

    return (
        <div className={`bg-white rounded-2xl border transition-all duration-200 ${isEditing ? 'border-indigo-500 shadow-xl ring-1 ring-indigo-500' : 'border-gray-100 shadow-sm'}`}>
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSecret ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isSecret ? <Lock size={20} /> : <Globe size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 font-mono text-sm">{setting.key}</h3>
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold bg-gray-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {setting.category}
                            </span>
                        </div>
                    </div>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                Save
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Description Field */}
                    {isEditing ? (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="Describe what this setting does..."
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600">{description}</p>
                    )}

                    {/* Value Editor */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                            <span>Value (JSON)</span>
                            {isSecret && (
                                <button
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                                >
                                    {showSecret ? <EyeOff size={10} /> : <Eye size={10} />}
                                    {showSecret ? 'Hide' : 'Show'}
                                </button>
                            )}
                        </label>

                        {isSecret && !showSecret && !isEditing ? (
                            <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-400 font-mono text-sm select-none">
                                ••••••••••••••••••••••••••••
                            </div>
                        ) : (
                            <textarea
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                disabled={!isEditing}
                                className={`w-full h-48 font-mono text-xs p-4 rounded-xl border leading-relaxed
                                    ${isEditing
                                        ? 'bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900'
                                        : 'bg-gray-50 border-transparent text-gray-600 resize-none'
                                    }`}
                                spellCheck="false"
                            />
                        )}
                    </div>
                </div>

                {/* Test Action for Email */}
                {setting.key === 'resend_config' && !isEditing && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={onTestEmail}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                            <Send size={16} /> Send Test Email
                        </button>
                    </div>
                )}

                {/* Test Action for Email Templates */}
                {setting.category === 'email' && setting.key.startsWith('email_template_') && !isEditing && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => onTestTemplate(setting.key, setting.value)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                            <Play size={16} /> Test Template
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemSettings;
