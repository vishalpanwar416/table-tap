import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthWrapper from './AuthWrapper';
import { useAdminRestaurant } from '../context/AdminRestaurantContext';
import LoadingScreen from '../components/LoadingScreen';
import { useBasePathNavigate } from './BasePathContext';
import SubscriptionExpiredBanner from '../components/SubscriptionExpiredBanner';

/**
 * RestaurantDashboardWrapper
 * - Ensures user is authenticated + profile is complete (via AuthWrapper)
 * - Then enforces restaurant dashboard access via AdminRestaurantContext:
 *   - allowed roles: admin/manager/captain (or staff assigned via restaurant_staff)
 *   - must have a restaurant selected/assigned (admins can select via selector)
 * - Uses useBasePathNavigate for /login so dev stays under /restaurant; /home uses raw navigate to customer app.
 */
export default function RestaurantDashboardWrapper({ children }) {
  const navigate = useNavigate();
  const navigateWithBase = useBasePathNavigate();
  const location = useLocation();
  const { loading, error, canView, userRole, userRestaurantId, isAdmin } = useAdminRestaurant();

  useEffect(() => {
    // Only redirect on error if the user's role is known and they're not an admin/owner.
    // Admins and owners can access the dashboard even without a specific restaurant selected;
    // redirecting them creates a login→dashboard→login loop when the context errors transiently.
    if (!loading && error && userRole && !['admin', 'owner'].includes(userRole)) {
      navigateWithBase('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [loading, error, userRole, navigateWithBase, location.pathname]);

  if (loading) {
    return (
      <AuthWrapper>
        <LoadingScreen message="Checking permissions..." variant="inline" size="lg" />
      </AuthWrapper>
    );
  }

  // If there's an error and no role resolved, show an error state instead of looping.
  if (error && !userRole) {
    return (
      <AuthWrapper>
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Unable to Load Dashboard</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  // If user is admin or owner but hasn't selected a restaurant yet, still allow the dashboard
  // (the dashboard component itself handles the selector for these roles).
  const hasRestaurant = Boolean(userRestaurantId) || isAdmin() || (userRole === 'owner');

  // Explicitly allow all portal-specific roles to prevent premature redirects
  const PORTAL_ROLES = ['admin', 'owner', 'manager', 'captain', 'chef', 'waiter', 'cashier'];
  const allowed = typeof canView === 'function' ? canView() : PORTAL_ROLES.includes(userRole);

  // Don't redirect while context is still initializing (userRole not set yet)
  const stillInitializing = userRole == null;
  if (stillInitializing) {
    return (
      <AuthWrapper>
        <LoadingScreen message="Checking permissions..." variant="inline" size="lg" />
      </AuthWrapper>
    );
  }

  if (!allowed) {
    return (
      <AuthWrapper>
        {(() => {
          // If strictly not allowed, go back to login (base path navigate to stay in restaurant app)
          navigateWithBase('/login', { replace: true, state: { from: location.pathname } });
          return null;
        })()}
      </AuthWrapper>
    );
  }

  // If allowed but no restaurant selected, we stay on children (AdminDashboard) 
  // because AdminDashboard has its own logic to show a restaurant selector 
  // for admins/owners. For lower roles with no selection, we show a message.
  if (!hasRestaurant && !['admin', 'owner'].includes(userRole)) {
    const handleLogout = async () => {
      try {
        const { authService } = await import('../api/authService');
        await authService.signOut();
        navigateWithBase('/login');
      } catch (err) {
        console.error('Logout failed:', err);
        window.location.href = '/login';
      }
    };

    return (
      <AuthWrapper>
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 shadow-2xl">
            <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
              <span className="text-4xl">🏪</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No Restaurant Assigned</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              You don't have an active restaurant assignment. Please contact your manager to be added to a restaurant.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigateWithBase('/login')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all shadow-lg active:scale-[0.98]"
              >
                Back to Login
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-white/5 hover:bg-white/10 text-white px-6 py-4 rounded-2xl font-semibold transition-all border border-white/10 active:scale-[0.98]"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </AuthWrapper>
    );
  }

  // Show subscription banner for manager/owner/captain roles (not admin — admin manages all restaurants)
  const showSubscriptionBanner = userRestaurantId && !isAdmin();

  return (
    <AuthWrapper>
      {showSubscriptionBanner && (
        <SubscriptionExpiredBanner
          restaurantId={userRestaurantId}
          userRole={userRole}
        />
      )}
      {children}
    </AuthWrapper>
  );
}

