/**
 * BasePathContext
 * In development (localhost), restaurant and admin apps use path prefixes:
 *   /restaurant/login, /admin/login, etc.
 * In production (subdomains), paths are root-relative: /login, /dashboard.
 * This context provides basePath and a navigate that prepends basePath in dev
 * so the same components work in both modes.
 */
import React, { createContext, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isDevelopment } from '../utils/subdomainRouter';

const BasePathContext = createContext({ basePath: '', navigate: null });

export function BasePathProvider({ children, basePathSegment = '' }) {
  const navigate = useNavigate();
  const basePath = isDevelopment() ? basePathSegment : '';

  const navigateWithBase = useCallback(
    (to, options) => {
      if (!basePath) {
        navigate(to, options);
        return;
      }
      const pathname = typeof to === 'string' ? to : (typeof to === 'number' ? String(to) : '/');
      const path = pathname === '/' ? basePath : `${basePath}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
      navigate(path, options);
    },
    [navigate, basePath]
  );

  return (
    <BasePathContext.Provider value={{ basePath, navigate: navigateWithBase }}>
      {children}
    </BasePathContext.Provider>
  );
}

export function useBasePathNavigate() {
  const ctx = useContext(BasePathContext);
  const navigate = useNavigate();
  return ctx.navigate || navigate;
}

export function useBasePath() {
  const ctx = useContext(BasePathContext);
  return ctx.basePath || '';
}

/**
 * Get the effective location for Routes: in dev, pathname is stripped of basePath
 * so path="/login" matches when URL is /restaurant/login.
 */
export function useEffectiveLocation(basePathSegment = '') {
  const location = useLocation();
  const pathname = location.pathname || '/';

  if (!isDevelopment() || !basePathSegment) {
    return location;
  }
  const prefix = basePathSegment.startsWith('/') ? basePathSegment : `/${basePathSegment}`;
  if (!pathname.startsWith(prefix)) {
    return location;
  }
  const stripped = pathname.slice(prefix.length) || '/';
  return { ...location, pathname: stripped };
}
