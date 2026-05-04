import { formatCurrency, formatDate } from './formatters';

describe('formatCurrency', () => {
  it('formats whole numbers as INR with two decimals', () => {
    expect(formatCurrency(100)).toBe('₹100.00');
  });

  it('formats decimals correctly', () => {
    expect(formatCurrency(1234.5)).toBe('₹1,234.50');
  });

  it('groups thousands using the Indian numbering system', () => {
    expect(formatCurrency(100000)).toBe('₹1,00,000.00');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });
});

describe('formatDate', () => {
  it('formats an ISO date as DD MMM YYYY', () => {
    expect(formatDate('2026-03-05')).toBe('5 Mar 2026');
  });
});
