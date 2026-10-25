/**
 * Normaliza un código de moneda a formato ISO 4217 de 3 letras.
 * Intl.NumberFormat exige códigos ISO (ej: USD, PEN, EUR) y no acepta símbolos ($, S/, €).
 */
function normalizarMoneda(currency: string): string {
  const simboloAISO: Record<string, string> = {
    '$': 'USD',
    'US$': 'USD',
    'S/': 'PEN',
    'S/.': 'PEN',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
  };

  const upper = currency?.trim()?.toUpperCase();
  if (!upper) return 'PEN';

  // Si ya es un código ISO de 3 letras, devolverlo tal cual
  if (/^[A-Z]{3}$/.test(upper)) return upper;

  // Si es un símbolo conocido, mapear a ISO
  if (simboloAISO[currency.trim()]) return simboloAISO[currency.trim()];

  // Fallback: devolver PEN por seguridad
  return 'PEN';
}

export function formatCurrency(amount: number, currency = "PEN"): string {
  const currencyISO = normalizarMoneda(currency);
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currencyISO,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-PE").format(value)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}