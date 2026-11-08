/**
 * Normaliza una moneda a su código ISO de 3 letras (PEN, USD). Sirve como
 * clave interna para agrupar montos; en pantalla se muestra {@link simboloMoneda}.
 */
export function normalizarMoneda(currency: string): string {
  const simboloAISO: Record<string, string> = {
    '$': 'USD',
    'US$': 'USD',
    'S/': 'PEN',
    'S/.': 'PEN',
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

/** Símbolo con que se muestra la moneda: "S/" para soles y "$" para dólares. */
export function simboloMoneda(currency = "PEN"): string {
  const codigo = normalizarMoneda(currency);
  if (codigo === "PEN") return "S/";
  if (codigo === "USD") return "$";
  return codigo;
}

/**
 * "S/ 1,234.50" o "$ 1,234.50": el símbolo de la moneda, igual que en los
 * PDF y los reportes del backend.
 */
export function formatCurrency(amount: number, currency = "PEN"): string {
  const numero = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount || 0));
  // Espacio no separable: el símbolo y el número nunca quedan en líneas distintas.
  return `${amount < 0 ? "-" : ""}${simboloMoneda(currency)}\u00A0${numero}`;
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
