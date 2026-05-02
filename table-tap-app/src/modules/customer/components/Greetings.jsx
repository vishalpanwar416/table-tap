import React, { useState, useEffect } from 'react';
import EnhancedGreetings from './EnhancedGreetings';
import { useAuth } from '../../shared/config/AuthContext';
import { supabase } from '../../shared/supabase';

export default function DynamicGreeting() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user) {
        if (mounted) setUserName("");
        return;
      }

      // Show something immediately so the greeting never gets stuck on "Guest!"
      const immediate = user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')?.[0] ||
        '';
      if (mounted && immediate) setUserName(immediate.split(' ')[0]);

      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (mounted) {
          const name = data?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')?.[0] ||
            '';
          setUserName(name.split(' ')[0]);
        }
      } catch {
        // immediate fallback already set above
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  return <EnhancedGreetings userName={userName} />;
}