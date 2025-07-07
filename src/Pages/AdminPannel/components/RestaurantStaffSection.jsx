import React from 'react';
import RestaurantStaffHeader from './RestaurantStaffHeader';
import StaffTableRow from './StaffTableRow';
import EmptyStaffState from './EmptyStaffState';

const RestaurantStaffSection = ({ 
  restaurant, 
  restaurantStaff, 
  filteredRestaurantStaff, 
  selectedRestaurantId, 
  setSelectedRestaurantId, 
  onEdit, 
  onDelete, 
  onAddStaff 
}) => {
  const isExpanded = selectedRestaurantId === restaurant.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 font-spartan">
      <RestaurantStaffHeader
        restaurant={restaurant}
        restaurantStaff={restaurantStaff}
        selectedRestaurantId={selectedRestaurantId}
        setSelectedRestaurantId={setSelectedRestaurantId}
      />
      
      {isExpanded && (
        <div className="border-t border-gray-100">
          {filteredRestaurantStaff.length > 0 ? (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                        Staff Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {filteredRestaurantStaff.map((member, index) => (
                      <StaffTableRow
                        key={member.id}
                        staff={member}
                        restaurant={restaurant}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        index={index}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyStaffState
              restaurantName={restaurant.name}
              onAddStaff={onAddStaff}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantStaffSection; 