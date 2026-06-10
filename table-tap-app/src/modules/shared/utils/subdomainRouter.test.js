import {
  isAdminHost,
  isCustomerAppOrigin,
  isPortalHost,
  isRestaurantPortalHost,
  stripDeploymentPrefix,
} from './subdomainRouter';

describe('subdomainRouter staging hosts', () => {
  test('stripDeploymentPrefix removes staging prefix', () => {
    expect(stripDeploymentPrefix('staging.admin.table-tap.in')).toBe('admin.table-tap.in');
    expect(stripDeploymentPrefix('admin.table-tap.in')).toBe('admin.table-tap.in');
  });

  test('isAdminHost recognizes staging admin subdomain', () => {
    expect(isAdminHost('staging.admin.table-tap.in')).toBe(true);
    expect(isAdminHost('admin.table-tap.in')).toBe(true);
    expect(isAdminHost('staging.app.table-tap.in')).toBe(false);
  });

  test('isRestaurantPortalHost recognizes staging restaurant subdomain', () => {
    expect(isRestaurantPortalHost('staging.restaurant.table-tap.in')).toBe(true);
    expect(isRestaurantPortalHost('restaurant.table-tap.in')).toBe(true);
  });

  test('isPortalHost is true for staging admin and restaurant', () => {
    expect(isPortalHost('staging.admin.table-tap.in')).toBe(true);
    expect(isPortalHost('staging.restaurant.table-tap.in')).toBe(true);
  });

  test('isCustomerAppOrigin is false on staging admin', () => {
    expect(isCustomerAppOrigin('staging.admin.table-tap.in')).toBe(false);
    expect(isCustomerAppOrigin('staging.app.table-tap.in')).toBe(true);
  });
});
