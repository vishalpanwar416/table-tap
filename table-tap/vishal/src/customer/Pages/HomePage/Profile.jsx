import { useState, useEffect } from 'react';
import { 
  ShoppingBag,
  User,
  CreditCard,
  Phone,
  HelpCircle,
  Settings,
  LogOut,
  Home,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';

export default function Profile() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { icon: <ShoppingBag size={24} />, label: "My Orders" },
    { icon: <User size={24} />, label: "My Profile" },
    { icon: <CreditCard size={24} />, label: "Payment Methods" },
    { icon: <Phone size={24} />, label: "Contact Us" },
    { icon: <HelpCircle size={24} />, label: "Help & FAQs" },
    { icon: <Settings size={24} />, label: "Settings" }
  ];

  const renderSidebarContent = () => (
    <div className="h-full relative border-r-4 border-purple-600 overflow-hidden">
      {/* Purple curved effect - adjusted for right side */}
      <div className="absolute top-0 right-0 w-full h-full">
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-600 rounded-tr-full"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-purple-600 rounded-br-full"></div>
      </div>

      {/* Close button for mobile */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <button onClick={() => setIsOpen(false)} className="text-white">
          <X size={24} />
        </button>
      </div>

      {/* Time */}
      <div className="text-white p-4 text-lg font-semibold text-right">{time}</div>

      {/* Profile */}
      <div className="flex items-center p-6 pb-8 flex-row-reverse">
        <div className="w-16 h-16 rounded-full overflow-hidden ml-4">
          <img src="/api/placeholder/150/150" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <div className="text-right">
          <h2 className="text-white text-2xl font-bold">Vishal Panwar</h2>
          <p className="text-gray-400 text-sm">Vishalpanwar416@gmail.com</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4">
        {menuItems.map((item, index) => (
          <div key={index}>
            <div className="flex items-center py-4 cursor-pointer flex-row-reverse">
              <span className="text-teal-300 text-xl font-medium ml-4">{item.label}</span>
              <div className="bg-white rounded-full p-3">
                {item.icon}
              </div>
            </div>
            <div className="h-px bg-gray-700"></div>
          </div>
        ))}

        {/* Log Out */}
        <div className="flex items-center py-4 cursor-pointer mt-4 flex-row-reverse">
          <span className="text-teal-300 text-xl font-medium ml-4">Log Out</span>
          <div className="bg-white rounded-full p-3">
            <LogOut size={24} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-white p-4 flex justify-between items-center">
          <div className="bg-black rounded-full p-2">
            <Home className="text-white" size={20} />
          </div>
          <button onClick={() => setIsOpen(true)}>
            <Menu size={24} className="text-black" />
          </button>
        </div>

        {/* Main content would go here */}
        <div className="flex-1 p-4">
          <h1 className="text-2xl font-bold">Welcome to your profile</h1>
          {/* Your main content here */}
        </div>
      </div>

      {/* Mobile Sidebar - now on the right */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-black z-50 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {renderSidebarContent()}
      </div>

      {/* Desktop Sidebar - now on the right */}
      <div className="hidden lg:block lg:w-80 bg-black flex-shrink-0">
        {renderSidebarContent()}
      </div>
    </div>
  );
}