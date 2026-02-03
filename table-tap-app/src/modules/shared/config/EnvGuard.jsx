import React from 'react';

const REQUIRED_ENV_VARS = {
    'Supabase URL': process.env.REACT_APP_SUPABASE_URL,
    'Supabase Anon Key': process.env.REACT_APP_SUPABASE_ANON_KEY
};

const EnvGuard = ({ children }) => {
    const missingVars = Object.entries(REQUIRED_ENV_VARS)
        .filter(([_, value]) => !value || value === 'placeholder' || value.includes('placeholder'))
        .map(([key]) => key);

    // In development, we might want to be more lenient or just show a warning
    // But for the "black screen" fix, we need to know if this is the cause.
    // We'll show a full blocking error in production if these are missing, 
    // because the app simply won't work without them.

    if (missingVars.length > 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuration Error</h1>
                    <p className="text-gray-600 mb-6">
                        The application is missing required configuration to run.
                    </p>

                    <div className="bg-red-50 border border-red-100 rounded p-4 mb-6 text-left">
                        <p className="text-sm font-semibold text-red-800 mb-2">Missing Environment Variables:</p>
                        <ul className="list-disc pl-5 text-sm text-red-700">
                            {missingVars.map(varName => (
                                <li key={varName}>{varName}</li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                        If you are the developer: Please set these variables in your Vercel Project Settings.
                    </p>
                </div>
            </div>
        );
    }

    return children;
};

export default EnvGuard;
