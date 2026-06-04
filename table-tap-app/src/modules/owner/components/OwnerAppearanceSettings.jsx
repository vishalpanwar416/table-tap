import React, { useState, useEffect } from 'react';
import { Palette, Store, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../shared/supabase';
import ThemeSelector from '../../shared/components/ThemeSelector';
import { DEFAULT_THEME_ID } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';

/**
 * Owner-facing appearance manager: lists every owned restaurant and lets the owner
 * pick the customer-app theme for each one. Theme is a per-restaurant property
 * (restaurants.theme_id), so each row saves independently and immediately.
 */
const OwnerAppearanceSettings = ({ restaurants = [] }) => {
  // Map restaurantId -> selected theme id (seeded from each row, kept in sync as the list loads).
  const [selected, setSelected] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { id, type: 'success'|'error' }

  useEffect(() => {
    setSelected((prev) => {
      const next = { ...prev };
      restaurants.forEach((r) => {
        if (next[r.id] === undefined) next[r.id] = r.theme_id || DEFAULT_THEME_ID;
      });
      return next;
    });
  }, [restaurants]);

  const handleSelect = async (restaurantId, themeId) => {
    const previous = selected[restaurantId] || DEFAULT_THEME_ID;
    if (previous === themeId) return;

    // Optimistic update; revert if the save fails.
    setSelected((prev) => ({ ...prev, [restaurantId]: themeId }));
    setSavingId(restaurantId);
    setFeedback(null);

    const { error } = await supabase
      .from('restaurants')
      .update({ theme_id: themeId, updated_at: new Date().toISOString() })
      .eq('id', restaurantId);

    setSavingId(null);
    if (error) {
      setSelected((prev) => ({ ...prev, [restaurantId]: previous }));
      setFeedback({ id: restaurantId, type: 'error' });
    } else {
      setFeedback({ id: restaurantId, type: 'success' });
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Customer App Theme</h3>
          <p className="text-sm text-gray-500">
            Choose the look &amp; feel customers see for each of your restaurants.
          </p>
        </div>
      </div>

      {restaurants.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <Store className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          No restaurants found.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {restaurants.map((r) => (
            <div key={r.id} className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm md:text-base font-bold text-gray-900 truncate">
                    {r.name || 'Unnamed restaurant'}
                  </span>
                </div>
                {feedback?.id === r.id && feedback.type === 'success' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 shrink-0">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
                {feedback?.id === r.id && feedback.type === 'error' && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" /> Failed to save
                  </span>
                )}
                {savingId === r.id && (
                  <span className="text-xs font-semibold text-gray-400 shrink-0">Saving…</span>
                )}
              </div>
              <ThemeSelector
                value={selected[r.id]}
                disabled={savingId === r.id}
                onChange={(themeId) => handleSelect(r.id, themeId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerAppearanceSettings;
