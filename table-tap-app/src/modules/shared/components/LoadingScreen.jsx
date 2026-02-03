import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Unified Loading Component for the entire app
 * 
 * Usage:
 *   <LoadingScreen />                    // Default full-screen loading
 *   <LoadingScreen message="Loading..." /> // Custom message
 *   <LoadingScreen variant="inline" />   // Inline spinner (not full-screen)
 *   <LoadingScreen variant="overlay" />  // Overlay on top of content
 *   <LoadingScreen size="sm" />          // Small spinner
 */

// Spinner sizes
const SIZES = {
    sm: { spinner: 'w-6 h-6', text: 'text-sm' },
    md: { spinner: 'w-10 h-10', text: 'text-base' },
    lg: { spinner: 'w-16 h-16', text: 'text-lg' },
};

// The actual spinner component
const Spinner = memo(({ size = 'md', className = '' }) => (
    <div
        className={`${SIZES[size].spinner} border-4 border-orange-500 border-t-transparent rounded-full animate-spin ${className}`}
    />
));

Spinner.displayName = 'Spinner';

// Full-screen loading (default)
const FullScreenLoading = memo(({ message, size = 'lg' }) => (
    <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex flex-col items-center space-y-4"
        >
            <Spinner size={size} />
            {message && (
                <p className={`text-white font-medium ${SIZES[size].text}`}>
                    {message}
                </p>
            )}
        </motion.div>
    </motion.div>
));

FullScreenLoading.displayName = 'FullScreenLoading';

// Inline loading (centered in container)
const InlineLoading = memo(({ message, size = 'md' }) => (
    <div className="flex flex-col items-center justify-center py-12">
        <Spinner size={size} />
        {message && (
            <p className={`text-gray-600 mt-4 ${SIZES[size].text}`}>
                {message}
            </p>
        )}
    </div>
));

InlineLoading.displayName = 'InlineLoading';

// Overlay loading (on top of existing content)
const OverlayLoading = memo(({ message, size = 'md' }) => (
    <motion.div
        className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
    >
        <Spinner size={size} />
        {message && (
            <p className={`text-white mt-3 font-medium ${SIZES[size].text}`}>
                {message}
            </p>
        )}
    </motion.div>
));

OverlayLoading.displayName = 'OverlayLoading';

// Page loading (centered on page with padding)
const PageLoading = memo(({ message, size = 'lg' }) => (
    <motion.div
        className="min-h-screen flex flex-col items-center justify-center bg-black p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
    >
        <div className="flex flex-col items-center space-y-4">
            <Spinner size={size} />
            {message && (
                <p className={`text-white font-medium ${SIZES[size].text}`}>
                    {message}
                </p>
            )}
        </div>
    </motion.div>
));

PageLoading.displayName = 'PageLoading';

// Card/Section loading skeleton
const CardSkeleton = memo(({ count = 3 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-300" />
                <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4" />
                    <div className="h-3 bg-gray-300 rounded w-1/2" />
                </div>
            </div>
        ))}
    </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Refreshing indicator (subtle, for background refresh)
const RefreshIndicator = memo(({ show }) => {
    if (!show) return null;

    return (
        <motion.div
            className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center space-x-2 shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
        >
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-xs font-medium">Refreshing...</span>
        </motion.div>
    );
});

RefreshIndicator.displayName = 'RefreshIndicator';

// Main unified loading component
const LoadingScreen = memo(({
    message = 'Loading...',
    variant = 'fullscreen',
    size = 'lg',
    showMessage = true
}) => {
    const displayMessage = showMessage ? message : null;

    switch (variant) {
        case 'inline':
            return <InlineLoading message={displayMessage} size={size} />;
        case 'overlay':
            return <OverlayLoading message={displayMessage} size={size} />;
        case 'page':
            return <PageLoading message={displayMessage} size={size} />;
        case 'fullscreen':
        default:
            return <FullScreenLoading message={displayMessage} size={size} />;
    }
});

LoadingScreen.displayName = 'LoadingScreen';

// Export all components
export {
    LoadingScreen as default,
    LoadingScreen,
    Spinner,
    FullScreenLoading,
    InlineLoading,
    OverlayLoading,
    PageLoading,
    CardSkeleton,
    RefreshIndicator
};
