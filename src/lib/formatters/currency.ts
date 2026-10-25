/**
 * Normaliza un código de moneda a formato ISO 4217 de 3 letras.
 * Intl.NumberFormat exige códigos ISO (ej: USD, PEN, EUR) y no acepta símbolos ($, S/, €).
 */
export function normalizarMoneda(currency: string): string {
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

/** Símbolo que se muestra para cada moneda. "US$" en vez de "USD" para que se lea como dólares. */
const SIMBOLO_MONEDA: Record<string, string> = {
  PEN: 'S/',
  USD: 'US$',
  EUR: '€',
};

/**
 * "S/ 1,234.50", "US$ 1,234.50" o "€ 1,234.50".
 * El número se formatea con Intl (separador de miles y 2 decimales) y el
 * símbolo se pone a mano: Intl con es-PE muestra "USD" y no "US$".
 */
export function formatCurrency(amount: number, currency = "PEN"): string {
  const currencyISO = normalizarMoneda(currency);
  const simbolo = SIMBOLO_MONEDA[currencyISO] ?? currencyISO;
  const numero = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount || 0));
  return `${amount < 0 ? "-" : ""}${simbolo} ${numero}`;
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