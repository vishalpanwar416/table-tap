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
            // Use only first name
            setUserName(data.full_name.split(' ')[0]);
          } else {
            // Fallback to metadata or email (first name only)
            const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || "Guest";
            setUserName(fallbackName.split(' ')[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching profile for greeting:", err);
        if (mounted) {
          const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || "Guest";
          setUserName(fallbackName.split(' ')[0]);
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