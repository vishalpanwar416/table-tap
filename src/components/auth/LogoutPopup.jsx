import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabase';


const LogoutPopup = ({ isOpen, onClose, onConfirm }) => {

  const navigate = useNavigate();

  const popupVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { y: 100, opacity: 0, transition: { duration: 0.3 } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login'); 
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="popup-overlay"
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            key="popup-content"
            className="fixed bottom-3 left-0 right-0 bg-gradient-to-b from-gray-300 to-white z-50 mx-auto p-6 rounded-[85px] shadow-xl "
            style={{ maxWidth: '390px' }}
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex justify-center items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-full">
                  <LogOut className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-black">Log Out</h2>
              </div>
            </div>

            <p className="text-black mb-6 text-center">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>

            <div className="flex gap-6 justify-center px-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 text-white py-3 rounded-full hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                    className="flex-1 bg-red-500/40 text-black py-3 rounded-full hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LogoutPopup;