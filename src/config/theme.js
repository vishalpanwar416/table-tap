// Theme configuration for consistent styling across all customer pages
export const theme = {
  colors: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Main orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    }
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  typography: {
    fontFamily: {
      sans: ['"League Spartan"', 'system-ui', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Common component styles
export const componentStyles = {
  button: {
    primary: 'bg-orange-500 text-white hover:bg-orange-600 transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-500 focus:outline-none',
    danger: 'bg-red-500 text-white hover:bg-red-600 transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none',
    success: 'bg-green-500 text-white hover:bg-green-600 transition-colors focus:ring-2 focus:ring-green-500 focus:outline-none',
  },
  
  card: {
    base: 'bg-white rounded-xl shadow-sm border border-gray-100',
    elevated: 'bg-white rounded-xl shadow-lg border border-gray-200',
    interactive: 'bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow',
  },
  
  input: {
    base: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors',
    error: 'w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors',
  },
  
  badge: {
    primary: 'bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium',
    success: 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium',
    warning: 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium',
    error: 'bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium',
  },
};

// Animation variants for consistent motion
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

// Utility functions for theme usage
export const themeUtils = {
  // Get color with opacity
  colorWithOpacity: (color, opacity) => {
    const colors = {
      orange: 'rgb(249 115 22)',
      gray: 'rgb(107 114 128)',
      green: 'rgb(34 197 94)',
      red: 'rgb(239 68 68)',
      yellow: 'rgb(245 158 11)',
    };
    return `${colors[color]} / ${opacity}`;
  },
  
  // Get responsive value
  responsive: (values) => {
    return Object.entries(values).map(([breakpoint, value]) => 
      breakpoint === 'base' ? value : `${breakpoint}:${value}`
    ).join(' ');
  },
  
  // Get spacing value
  spacing: (size) => theme.spacing[size] || size,
  
  // Get border radius value
  borderRadius: (size) => theme.borderRadius[size] || size,
}; 