/**
 * Parse a scanned Table-Tap QR payload into restaurant + table IDs.
 * Supports full URLs and bare query strings, e.g.:
 *   https://app.table-tap.in/?restaurant=<uuid>&table=5
 */
export function parseTableTapQrPayload(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  const tryParams = (params) => {
    const restaurantId = params.get('restaurant');
    const tableNumber = params.get('table');
    if (restaurantId && tableNumber) {
      return { restaurantId, tableNumber };
    }
    return null;
  };

  try {
    const url = trimmed.startsWith('http')
      ? new URL(trimmed)
      : new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, 'https://app.table-tap.in');
    const fromUrl = tryParams(url.searchParams);
    if (fromUrl) return fromUrl;
  } catch {
    // fall through
  }

  const queryPart = trimmed.includes('?') ? trimmed.split('?').pop() : trimmed;
  try {
    return tryParams(new URLSearchParams(queryPart));
  } catch {
    return null;
  }
}
