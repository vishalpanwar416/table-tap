import React from 'react';
import { Check, Palette } from 'lucide-react';
import { THEME_OPTIONS } from '../../../themes/registry';
import { DEFAULT_THEME_ID } from '../../restaurant/pages/RestaurantSelection/RestaurantContext';

/**
 * Presentational theme picker — renders one selectable card per registered theme
 * (from the theme registry) and reports the chosen id via onChange.
 *
 * Headless of any persistence: the manager and owner dashboards each decide how
 * to save the selected `theme_id` on the restaurants row.
 *
 * @param {string}  value     currently selected theme id
 * @param {(id:string)=>void} onChange  called with the picked theme id
 * @param {boolean} disabled  render read-only (no selection changes)
 */
const ThemeSelector = ({ value, onChange, disabled = false }) => {
  const selectedId = value || DEFAULT_THEME_ID;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {THEME_OPTIONS.map((theme) => {
        const isSelected = selectedId === theme.id;
        return (
          <button
            type="button"
            key={theme.id}
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => !disabled && onChange?.(theme.id)}
            className={`relative text-left p-4 md:p-5 rounded-2xl border-2 transition-all ${
              isSelected
                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center shadow">
                <Check className="w-3.5 h-3.5 text-white" />
              </span>
            )}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Palette className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm md:text-base font-bold text-gray-900 truncate">
                  {theme.name}
                </span>
                <span className="block text-[11px] md:text-xs text-gray-500 truncate">
                  {theme.description}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSelector;
