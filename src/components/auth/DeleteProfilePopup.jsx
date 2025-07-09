import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabase';

const DeleteProfilePopup = ({ isOpen, onClose }) => {
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteProfile = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('User not found');
        throw new Error('User not found');
      }
      toast('User found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        // Extract file path from URL
        const urlParts = profile.avatar_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `profile-photos/${user.id}/${fileName}`;
        
        toast('Avatar found, attempting to delete');
        await supabase.storage
          .from('avatars')
          .remove([filePath])
        toast('Avatar delete attempted');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        toast.error('Failed to delete profile');
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }
      toast('Profile deleted');

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        toast.error('Sign out error');
      }
      toast('Signed out');

      toast.success('Your profile has been deleted successfully.');
      navigate('/login');
    } catch (error) {
      toast.error(error.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="delete-overlay"
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            key="delete-content"
            className="fixed bottom-3 left-0 right-0 bg-gradient-to-b from-red-100 to-white z-50 mx-auto p-6 rounded-[85px] shadow-xl border-2 border-red-200"
            style={{ maxWidth: '390px' }}
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex justify-center items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-black font-semibold mb-2">
                This action cannot be undone!
              </p>
              <p className="text-gray-700 text-sm">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-gray-600 text-sm mt-2 space-y-1">
                <li>• Your profile information</li>
                <li>• Your account data</li>
                <li>• All associated records</li>
              </ul>
            </div>

            <div className="flex gap-6 justify-center px-4">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 bg-gray-700 text-white py-3 rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white py-3 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteProfilePopup;