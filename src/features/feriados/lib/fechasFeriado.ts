/** Fechas de los feriados (D-18). Todo en hora local y en formato AAAA-MM-DD, como el backend. */

/** AAAA-MM-DD de una fecha local (sin pasar por UTC, que en Perú cambia el día de noche). */
export function aIso(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mm}-${dd}`
}

/** Mañana: es la primera fecha que acepta el backend (solo fechas futuras). */
export function manana(hoy = new Date()): string {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  return aIso(d)
}

/** "AAAA-MM-DD" → Date local a medianoche. */
export function desdeIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, (m ?? 1) - 1, d ?? 1)
}

/** true si la fecha es posterior a hoy: solo esas se pueden quitar. */
export function esFutura(iso: string, hoy = new Date()): boolean {
  return iso >= manana(hoy)
}

const formato = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "jueves, 25 de diciembre de 2026" */
export function fechaLarga(iso: string): string {
  return formato.format(desdeIso(iso))
}

/** Lo que falta para poder agregar el feriado, o null si está listo. */
export function validarFeriado(fecha: string, descripcion: string, existentes: { fecha: string }[], hoy = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'Elige la fecha del feriado.'
  if (!esFutura(fecha, hoy)) return 'Solo se pueden agregar feriados de fechas futuras.'
  const motivo = descripcion.trim()
  if (!motivo) return 'Escribe el motivo del feriado.'
  if (motivo.length > 100) return 'El motivo no puede pasar de 100 caracteres.'
  if (existentes.some((f) => f.fecha === fecha)) return 'Ya hay un feriado registrado en esa fecha.'
  return null
}
