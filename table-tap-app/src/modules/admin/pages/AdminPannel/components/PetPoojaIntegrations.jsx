import React, { useState, useEffect, useCallback } from 'react';
import {
  Plug,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Store,
  ShoppingBag,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '../../../../shared/supabase';

// ── Service helpers ────────────────────────────────────────────────────────────

const fetchIntegrations = async () => {
  const { data, error } = await supabase
    .from('petpooja_integrations')
    .select(`
      *,
      restaurants (
        id,
        name,
        address,
        contact_phone
      )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const fetchRestaurantsWithoutIntegration = async () => {
  const { data: integrated, error: e1 } = await supabase
    .from('petpooja_integrations')
    .select('restaurant_id');
  if (e1) throw e1;
  const usedIds = (integrated || []).map((r) => r.restaurant_id);

  let query = supabase.from('restaurants').select('id, name, address').eq('is_active', true);
  if (usedIds.length > 0) query = query.not('id', 'in', `(${usedIds.join(',')})`);
  const { data, error: e2 } = await query.order('name');
  if (e2) throw e2;
  return data || [];
};

const createIntegration = async (payload) => {
  const { data, error } = await supabase
    .from('petpooja_integrations')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteIntegration = async (id) => {
  const { error } = await supabase.from('petpooja_integrations').delete().eq('id', id);
  if (error) throw error;
};

const toggleStoreStatus = async (id, storeOpen) => {
  const { error } = await supabase
    .from('petpooja_integrations')
    .update({ store_open: storeOpen })
    .eq('id', id);
  if (error) throw error;
};

const fetchOrderLogs = async (integrationId) => {
  const { data, error } = await supabase
    .from('petpooja_order_logs')
    .select('*')
    .eq('integration_id', integrationId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StatusBadge = ({ status, storeOpen }) => {
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
        <XCircle className="w-3 h-3" /> Error
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
        <AlertCircle className="w-3 h-3" /> Inactive
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${storeOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
      {storeOpen ? <CheckCircle className="w-3 h-3" /> : <Store className="w-3 h-3" />}
      {storeOpen ? 'Store Open' : 'Store Closed'}
    </span>
  );
};

const LogRow = ({ log }) => {
  const isSuccess = log.status === 'success';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${isSuccess ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
      {isSuccess
        ? <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        : <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700 capitalize">{log.direction} order</span>
          <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
        </div>
        {log.error_message && <p className="text-xs text-rose-600 mt-1">{log.error_message}</p>}
      </div>
    </div>
  );
};

const IntegrationCard = ({ integration, onDelete, onToggleStore, onRefreshLogs }) => {
  const [expanded, setExpanded] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchOrderLogs(integration.id);
      setLogs(data);
    } catch {
      // silently fail
    } finally {
      setLoadingLogs(false);
    }
  }, [integration.id]);

  useEffect(() => {
    if (expanded) loadLogs();
  }, [expanded, loadLogs]);

  const handleToggleStore = async () => {
    setTogglingStore(true);
    try {
      await onToggleStore(integration.id, !integration.store_open);
    } finally {
      setTogglingStore(false);
    }
  };

  const ordersToday =
    integration.orders_date === new Date().toISOString().slice(0, 10)
      ? integration.orders_pushed_today
      : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 text-base font-spartan truncate">
                {integration.restaurants?.name || 'Unknown Restaurant'}
              </h3>
              <StatusBadge status={integration.status} storeOpen={integration.store_open} />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-spartan">
              Pet Pooja ID: <code className="bg-slate-100 px-1 rounded">{integration.petpooja_rest_id}</code>
            </p>
            {integration.restaurants?.address && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{integration.restaurants.address}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleStore}
              disabled={togglingStore}
              title={integration.store_open ? 'Close store' : 'Open store'}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {integration.store_open
                ? <ToggleRight className="w-5 h-5 text-emerald-600" />
                : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(integration.id)}
                  className="px-2 py-1 text-xs bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-slate-800 font-spartan">{ordersToday}</p>
            <p className="text-xs text-slate-500 font-spartan">Orders today</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-slate-600 font-spartan">Last sync</p>
            <p className="text-xs text-slate-500 mt-1">
              {integration.last_menu_sync_at
                ? new Date(integration.last_menu_sync_at).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-slate-600 font-spartan">Last order</p>
            <p className="text-xs text-slate-500 mt-1">
              {integration.last_order_pushed_at
                ? new Date(integration.last_order_pushed_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : 'None'}
            </p>
          </div>
        </div>

        {integration.last_error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <p className="text-xs text-rose-600"><span className="font-semibold">Last error:</span> {integration.last_error}</p>
          </div>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50/50">
          {/* Credentials */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 font-spartan">Credentials</h4>
            <div className="space-y-2">
              {[
                { label: 'App Key', value: integration.app_key },
                { label: 'Access Token', value: integration.access_token },
                { label: 'App Secret', value: showSecret ? integration.app_secret : '••••••••••••••••••••' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-28 shrink-0 font-spartan">{label}</span>
                  <code className="text-xs bg-white border border-slate-200 px-2 py-1 rounded flex-1 truncate">{value}</code>
                </div>
              ))}
              <button
                onClick={() => setShowSecret((v) => !v)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mt-1"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecret ? 'Hide secret' : 'Show secret'}
              </button>
            </div>
          </div>

          {/* Order logs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700 font-spartan">Recent order logs</h4>
              <button
                onClick={loadLogs}
                disabled={loadingLogs}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {loadingLogs ? (
              <div className="text-center py-4 text-sm text-slate-400">Loading logs…</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-400">No logs yet</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((log) => <LogRow key={log.id} log={log} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AddIntegrationModal = ({ onClose, onSave }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    restaurant_id: '',
    petpooja_rest_id: '',
    app_key: '',
    app_secret: '',
    access_token: '',
  });

  useEffect(() => {
    fetchRestaurantsWithoutIntegration()
      .then(setRestaurants)
      .catch(() => setError('Failed to load restaurants'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.restaurant_id || !form.petpooja_rest_id || !form.app_key || !form.app_secret || !form.access_token) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 font-spartan">Connect Pet Pooja</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 font-spartan">Restaurant</label>
            {loading ? (
              <div className="text-sm text-slate-400">Loading restaurants…</div>
            ) : (
              <select
                name="restaurant_id"
                value={form.restaurant_id}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-spartan"
                required
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
          </div>

          {[
            { name: 'petpooja_rest_id', label: 'Pet Pooja Rest ID', placeholder: 'e.g. 12345' },
            { name: 'app_key', label: 'App Key (32 chars)', placeholder: 'Provided by Pet Pooja' },
            { name: 'app_secret', label: 'App Secret (40 chars)', placeholder: 'Provided by Pet Pooja' },
            { name: 'access_token', label: 'Access Token (40 chars)', placeholder: 'Provided by Pet Pooja' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 mb-1 font-spartan">{label}</label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-spartan"
                required
              />
            </div>
          ))}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-spartan"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 font-spartan"
            >
              {saving ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const PetPoojaIntegrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIntegrations();
      setIntegrations(data);
    } catch (err) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    const data = await createIntegration(form);
    setIntegrations((prev) => [{ ...data, restaurants: null }, ...prev]);
    await load();
  };

  const handleDelete = async (id) => {
    await deleteIntegration(id);
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleStore = async (id, storeOpen) => {
    await toggleStoreStatus(id, storeOpen);
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, store_open: storeOpen } : i))
    );
  };

  const filtered = integrations.filter((i) => {
    const name = i.restaurants?.name?.toLowerCase() || '';
    const rid = i.petpooja_rest_id?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || rid.includes(q);
  });

  const stats = {
    total: integrations.length,
    active: integrations.filter((i) => i.status === 'active').length,
    open: integrations.filter((i) => i.store_open && i.status === 'active').length,
    ordersToday: integrations.reduce((sum, i) => {
      if (i.orders_date === new Date().toISOString().slice(0, 10)) return sum + i.orders_pushed_today;
      return sum;
    }, 0),
  };

  return (
    <div className="space-y-6 font-spartan">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-spartan">Pet Pooja Integrations</h2>
          <p className="text-sm text-slate-500 mt-1">Manage restaurants connected via Pet Pooja POS</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" />
            Connect Restaurant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Plug, label: 'Total Connected', value: stats.total, color: 'slate' },
          { icon: CheckCircle, label: 'Active', value: stats.active, color: 'emerald' },
          { icon: Store, label: 'Stores Open', value: stats.open, color: 'amber' },
          { icon: ShoppingBag, label: 'Orders Today', value: stats.ordersToday, color: 'primary' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      {integrations.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by restaurant name or Pet Pooja ID…"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-2xl">
          <Plug className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {search ? 'No results found' : 'No restaurants connected yet'}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600"
            >
              Connect your first restaurant
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onDelete={handleDelete}
              onToggleStore={handleToggleStore}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddIntegrationModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default PetPoojaIntegrations;
