// src/hooks/useProfileCheck.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';

export const useProfileCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && location.pathname !== '/complete-profile') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mobile_number, date_of_birth')
          .eq('id', user.id)
          .single();

        if (!profile?.mobile_number || !profile?.date_of_birth) {
          navigate('/complete-profile');
        }
      }
    };

    checkProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => checkProfile());
    
    return () => subscription?.unsubscribe();
  }, [navigate, location]);
};