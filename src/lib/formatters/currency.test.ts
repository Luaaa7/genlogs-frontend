import { describe, it, expect } from 'vitest';
import { formatCurrency, normalizarMoneda } from './currency';

describe('currency formatter', () => {
  it('formats PEN correctly', () => {
    expect(formatCurrency(1234.5, 'PEN')).toContain('S/');
    expect(formatCurrency(1234.5, 'PEN')).toContain('1,234.50');
  });

  it('formats USD correctly', () => {
    const formatted = formatCurrency(1234.5, 'USD');
    expect(formatted).toContain('USD');
    expect(formatted).toContain('1,234.50');
  });

  it('normalizes symbols to ISO codes', () => {
    expect(normalizarMoneda('$')).toBe('USD');
    expect(normalizarMoneda('US$')).toBe('USD');
    expect(normalizarMoneda('S/')).toBe('PEN');
    expect(normalizarMoneda('€')).toBe('EUR');
    expect(normalizarMoneda('PEN')).toBe('PEN');
    expect(normalizarMoneda('USD')).toBe('USD');
    expect(normalizarMoneda('')).toBe('PEN');
  });
});