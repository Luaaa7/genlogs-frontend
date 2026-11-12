import type { FuenteTipoCambio } from '@/api/contratos/enumeraciones'

/** Texto escrito → número (acepta coma decimal). NaN si no es un número. */
export function aNumero(texto: string): number {
  const limpio = texto.trim().replace(',', '.')
  return /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN
}

/** Lo que falta para poder guardar, o null. Mismas reglas que el backend (mayor que 0, hasta 4 decimales). */
export function validarTipoCambio(texto: string): string | null {
  const limpio = texto.trim().replace(',', '.')
  if (!limpio) return 'Escribe el tipo de cambio.'
  const n = aNumero(limpio)
  if (!Number.isFinite(n)) return 'Escribe solo números, con punto o coma para los decimales.'
  if (n <= 0) return 'El tipo de cambio tiene que ser mayor que 0.'
  const decimales = limpio.includes('.') ? limpio.split('.')[1].replace(/0+$/, '').length : 0
  if (decimales > 4) return 'El tipo de cambio admite hasta 4 decimales.'
  // Un dólar en soles nunca está cerca de estos extremos: casi siempre es un error al escribir.
  if (n < 1 || n > 10) return 'Revisa el valor: debe ser cuántos soles cuesta 1 dólar (por ejemplo 3.7500).'
  return null
}

/** De dónde salió el valor, para mostrarlo. */
export function textoFuente(fuente: FuenteTipoCambio): string {
  switch (fuente) {
    case 'SUNAT':
      return 'SUNAT (consulta automática)'
    case 'SBS':
      return 'SBS'
    case 'MANUAL':
      return 'Corregido por el Jefe Administrativo'
  }
}

const fechaLarga = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "AAAA-MM-DD" → "miércoles, 11 de noviembre de 2026" (en hora local). */
export function fechaDia(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return fechaLarga.format(new Date(a, (m ?? 1) - 1, d ?? 1))
}

/** 3.79 → "3.7900" (siempre 4 decimales, como lo guarda el backend). */
export function formatoValor(valor: number): string {
  return Number(valor).toFixed(4)
}
