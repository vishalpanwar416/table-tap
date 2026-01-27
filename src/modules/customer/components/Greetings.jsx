import React, { useState, useEffect } from 'react';
import EnhancedGreetings from './EnhancedGreetings';


export default function DynamicGreeting() {
  const [userName, setUserName] = useState("");
  
  // If you want to update the name from outside sources
  useEffect(() => {
    // Example: Listen for user name changes
    const handleStorageChange = () => {
      setUserName("");
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return <EnhancedGreetings userName={userName} />;
}