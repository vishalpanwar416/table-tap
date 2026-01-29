import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthWrapper from './AuthWrapper';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';

/**
 * RestaurantDashboardWrapper
 * - Ensures user is authenticated + profile is complete (via AuthWrapper)
 * - Then enforces restaurant dashboard access via AdminRestaurantContext:
 *   - allowed roles: admin/manager/captain (or staff assigned via restaurant_staff)
 *   - must have a restaurant selected/assigned (admins can select via selector)
 */
export default function RestaurantDashboardWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, canView, userRole, userRestaurantId, isAdmin } = useAdminRestaurant();

  useEffect(() => {
    // If context says access denied, redirect away.
    if (!loading && error) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [loading, error, navigate, location.pathname]);

  if (loading) {
    return (
      <AuthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking permissions...</p>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  // If user is admin but hasn't selected a restaurant yet, still allow the dashboard
  // (it will show selector); for non-admin, require assigned restaurant.
  const hasRestaurant = Boolean(userRestaurantId) || isAdmin();
  const allowed = typeof canView === 'function' ? canView() : ['admin', 'manager', 'captain'].includes(userRole);

  if (!allowed || !hasRestaurant) {
    return (
      <AuthWrapper>
        {(() => {
          navigate('/home', { replace: true, state: { from: location.pathname } });
          return null;
        })()}
      </AuthWrapper>
    );
  }

  return <AuthWrapper>{children}</AuthWrapper>;
}

