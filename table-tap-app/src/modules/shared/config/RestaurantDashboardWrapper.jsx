import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthWrapper from './AuthWrapper';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';
import LoadingScreen from '../components/LoadingScreen';

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
        <LoadingScreen message="Checking permissions..." variant="inline" size="lg" />
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

