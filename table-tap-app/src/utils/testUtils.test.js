import { formatCurrency, calculateGST, isValidPhoneNumber } from './testUtils';

describe('Utility Functions', () => {
    describe('formatCurrency', () => {
        test('formats positive numbers correctly', () => {
            expect(formatCurrency(100)).toBe('₹100.00');
            expect(formatCurrency(1234.56)).toBe('₹1234.56');
        });

        test('formats zero correctly', () => {
            expect(formatCurrency(0)).toBe('₹0.00');
        });

        test('handles invalid input', () => {
            expect(formatCurrency('invalid')).toBe('₹0.00');
            expect(formatCurrency(null)).toBe('₹0.00');
            expect(formatCurrency(undefined)).toBe('₹0.00');
        });

        test('rounds to 2 decimal places', () => {
            expect(formatCurrency(10.999)).toBe('₹11.00');
            expect(formatCurrency(10.001)).toBe('₹10.00');
        });
    });

    describe('calculateGST', () => {
        test('calculates 5% GST by default', () => {
            expect(calculateGST(100)).toBe(5);
            expect(calculateGST(1000)).toBe(50);
        });

        test('calculates custom GST percentage', () => {
            expect(calculateGST(100, 18)).toBe(18);
            expect(calculateGST(500, 12)).toBe(60);
        });

        test('handles zero amount', () => {
            expect(calculateGST(0)).toBe(0);
        });

        test('handles invalid input', () => {
            expect(calculateGST('invalid')).toBe(0);
            expect(calculateGST(100, 'invalid')).toBe(0);
        });
    });

    describe('isValidPhoneNumber', () => {
        test('validates correct Indian phone numbers', () => {
            expect(isValidPhoneNumber('9876543210')).toBe(true);
            expect(isValidPhoneNumber('8123456789')).toBe(true);
            expect(isValidPhoneNumber('7000000000')).toBe(true);
            expect(isValidPhoneNumber('6999999999')).toBe(true);
        });

        test('rejects invalid phone numbers', () => {
            expect(isValidPhoneNumber('1234567890')).toBe(false); // Starts with 1
            expect(isValidPhoneNumber('12345')).toBe(false); // Too short
            expect(isValidPhoneNumber('98765432101')).toBe(false); // Too long
            expect(isValidPhoneNumber('abcdefghij')).toBe(false); // Not a number
        });

        test('handles phone numbers with spaces', () => {
            expect(isValidPhoneNumber('987 654 3210')).toBe(true);
            expect(isValidPhoneNumber('9876 543 210')).toBe(true);
        });

        test('handles invalid input types', () => {
            expect(isValidPhoneNumber(null)).toBe(false);
            expect(isValidPhoneNumber(undefined)).toBe(false);
            expect(isValidPhoneNumber(123)).toBe(false);
        });
    });
});
