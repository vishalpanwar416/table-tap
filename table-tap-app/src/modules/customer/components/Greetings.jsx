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

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (mounted) {
          if (data?.full_name) {
            setUserName(data.full_name);
          } else {
            // Fallback to metadata or email
            setUserName(user.user_metadata?.name || user.email?.split('@')[0] || "Guest");
          }
        }
      } catch (err) {
        console.error("Error fetching profile for greeting:", err);
        if (mounted) {
          setUserName(user.user_metadata?.name || user.email?.split('@')[0] || "Guest");
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  return <EnhancedGreetings userName={userName} />;
}