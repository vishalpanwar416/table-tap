import React from 'react';
import { Building2, ChevronDown, ChevronRight, Users } from 'lucide-react';

const RestaurantStaffHeader = ({
  restaurant,
  restaurantStaff,
  selectedRestaurantId,
  setSelectedRestaurantId,
}) => {
  const isExpanded = selectedRestaurantId === restaurant.id;

  return (
    <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 font-spartan">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0   rounded-xl flex items-center justify-center shadow-sm">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 font-spartan truncate">
              {restaurant.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <span className="inline-flex items-center gap-1 text-sm text-gray-600 font-spartan">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{restaurantStaff.length} staff</span>
              </span>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full font-spartan ${
                  restaurant.is_active
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
              >
                {restaurant.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedRestaurantId(isExpanded ? '' : restaurant.id)}
          className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/90 hover:bg-white border border-gray-200/80 shadow-sm hover:shadow transition-all duration-200 touch-manipulation"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default RestaurantStaffHeader;
