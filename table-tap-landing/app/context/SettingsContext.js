'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext();

export const SettingsProvider = ({ children, initialSettings = null }) => {
    const [settings, setSettings] = useState({
        company: initialSettings?.company_details || null,
        social: initialSettings?.social_links || null,
        hero: initialSettings?.landing_hero || null,
        logo: initialSettings?.system_logo || null,
        loading: !initialSettings
    });


    useEffect(() => {
        const fetchSettings = async () => {
            try {
                console.log('Fetching landing settings...');
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('key, value')
                    .in('key', ['company_details', 'social_links', 'landing_hero', 'system_logo']);

                if (error) {
                    console.error('Supabase error fetching settings:', error);
                    throw error;
                }

                console.log(`Fetched ${data?.length || 0} settings rows`);
                if (data && data.length > 0) {
                    console.log('Settings received for keys:', data.map(d => d.key));
                }

                console.log('Fetched settings data:', data);

                const settingsMap = data.reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                setSettings({
                    company: settingsMap['company_details'] || null,
                    social: settingsMap['social_links'] || null,
                    hero: settingsMap['landing_hero'] || null,
                    logo: settingsMap['system_logo'] || null,
                    loading: false
                });
                console.log('Settings state updated. Company info present:', !!settingsMap['company_details']);
            } catch (err) {
                console.error('Error fetching landing settings:', err);
                setSettings(prev => ({ ...prev, loading: false }));
            }
        };

        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
