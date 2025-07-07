import React from 'react';
import StaffTableHeader from './StaffTableHeader';
import StaffTableRow from './StaffTableRow';
import EmptyStaffState from './EmptyStaffState';

const StaffTable = ({ staff, restaurants, searchTerm, setSearchTerm, selectedRestaurantId, setSelectedRestaurantId, onEdit, onDelete }) => {
  if (staff.length === 0) {
    return <EmptyStaffState />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-spartan">
      <StaffTableHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedRestaurantId={selectedRestaurantId}
        setSelectedRestaurantId={setSelectedRestaurantId}
        restaurants={restaurants}
      />
      
      <div className="overflow-x-auto">
        <table className="w-full font-spartan">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                Staff Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-spartan">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((staffMember) => (
              <StaffTableRow
                key={staffMember.id}
                staff={staffMember}
                restaurant={restaurants.find(r => r.id === staffMember.restaurant_id)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTable; 