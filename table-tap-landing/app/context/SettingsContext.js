'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext();

export const SettingsProvider = ({ children, initialSettings = null }) => {
    const hasInitial = initialSettings != null;
    const [settings, setSettings] = useState({
        company: initialSettings?.company_details || null,
        social: initialSettings?.social_links || null,
        hero: initialSettings?.landing_hero || null,
        logo: initialSettings?.system_logo || null,
        mapsKey: initialSettings?.google_maps_key?.key || null,
        loading: !hasInitial
    });

    useEffect(() => {
        if (hasInitial) return;
        const fetchSettings = async () => {
            try {
                console.log('Fetching landing settings...');
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('key, value')
                    .in('key', ['company_details', 'social_links', 'landing_hero', 'system_logo', 'google_maps_key']);

                if (error) {
                    const msg = error?.message || error?.code || (typeof error === 'object' && Object.keys(error || {}).length ? JSON.stringify(error) : String(error));
                    console.warn('Settings: fetch failed (using defaults). Details:', msg);
                    setSettings(prev => ({ ...prev, loading: false }));
                    return;
                }

                console.log(`Fetched ${data?.length || 0} settings rows`);
                if (data && data.length > 0) {
                    console.log('Settings received for keys:', data.map(d => d.key));
                }

                console.log('Fetched settings data:', data);

                const settingsMap = (data ?? []).reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                setSettings(prev => ({
                    company: settingsMap['company_details'] ?? prev.company,
                    social: settingsMap['social_links'] ?? prev.social,
                    hero: settingsMap['landing_hero'] ?? prev.hero,
                    logo: settingsMap['system_logo'] ?? prev.logo,
                    mapsKey: settingsMap['google_maps_key']?.key ?? prev.mapsKey,
                    loading: false
                }));
            } catch {
                setSettings(prev => ({ ...prev, loading: false }));
            }
        };

        fetchSettings();
    }, [hasInitial]);

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
