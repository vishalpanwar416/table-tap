import React from 'react';
import { User } from 'lucide-react';

const UserManagement = () => {
return (
<div className="bg-white rounded-xl shadow-sm p-6">
<h2 className="text-xl font-semibold mb-4 text-gray-800">User Management</h2>
<div className="text-center py-12 text-gray-500">
<User className="w-12 h-12 mx-auto text-gray-400" />
<p className="mt-2">User management features coming soon</p>
</div>
</div>
);
};

export default UserManagement;