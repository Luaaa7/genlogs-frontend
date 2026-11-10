import { describe, it, expect } from 'vitest';
import { formatCurrency, normalizarMoneda, simboloMoneda } from './currency';

describe('currency formatter', () => {
  it('formats PEN as S/', () => {
    expect(formatCurrency(1234.5, 'PEN')).toBe('S/\u00A01,234.50');
    expect(formatCurrency(1234.5, 'S/')).toBe('S/\u00A01,234.50');
    expect(formatCurrency(-10, 'PEN')).toBe('-S/\u00A010.00');
  });

  it('formats USD as $', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$\u00A01,234.50');
    expect(formatCurrency(1234.5, '$')).toBe('$\u00A01,234.50');
  });

  it('maps codes and symbols to the display symbol', () => {
    expect(simboloMoneda('PEN')).toBe('S/');
    expect(simboloMoneda('S/')).toBe('S/');
    expect(simboloMoneda('USD')).toBe('$');
    expect(simboloMoneda('US$')).toBe('$');
    expect(simboloMoneda()).toBe('S/');
  });

  it('normalizes symbols to ISO codes', () => {
    expect(normalizarMoneda('$')).toBe('USD');
    expect(normalizarMoneda('US$')).toBe('USD');
    expect(normalizarMoneda('S/')).toBe('PEN');
    expect(normalizarMoneda('PEN')).toBe('PEN');
    expect(normalizarMoneda('USD')).toBe('USD');
    expect(normalizarMoneda('')).toBe('PEN');
  });
});
