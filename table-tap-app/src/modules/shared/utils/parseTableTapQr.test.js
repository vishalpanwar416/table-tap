import { parseTableTapQrPayload } from './parseTableTapQr';

describe('parseTableTapQrPayload', () => {
  it('parses full app URL', () => {
    const result = parseTableTapQrPayload('https://app.table-tap.in/?restaurant=abc-123&table=5');
    expect(result).toEqual({ restaurantId: 'abc-123', tableNumber: '5' });
  });

  it('parses relative path with query', () => {
    const result = parseTableTapQrPayload('/?restaurant=uuid-here&table=12');
    expect(result).toEqual({ restaurantId: 'uuid-here', tableNumber: '12' });
  });

  it('parses bare query string', () => {
    const result = parseTableTapQrPayload('restaurant=x&table=3');
    expect(result).toEqual({ restaurantId: 'x', tableNumber: '3' });
  });

  it('returns null for invalid payload', () => {
    expect(parseTableTapQrPayload('https://example.com')).toBeNull();
    expect(parseTableTapQrPayload('')).toBeNull();
  });
});
