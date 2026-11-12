import type { NotificacionResponse, TipoAviso } from '@/api/contratos'

export const TIPO_ALTO_VALOR = 'ALTO_VALOR' satisfies TipoAviso

/** El enlace del aviso es la ruta del detalle, p. ej. /cotizaciones/15. */
export function avisoAltoValorDe(id: number, avisos: NotificacionResponse[]): NotificacionResponse | null {
  const ruta = `/cotizaciones/${id}`
  return avisos.find((aviso) => aviso.tipo === TIPO_ALTO_VALOR && rutaDe(aviso.enlace) === ruta) ?? null
}

function rutaDe(enlace: string | null): string {
  if (!enlace) return ''
  const sinConsulta = enlace.split('?')[0] ?? ''
  return sinConsulta.length > 1 && sinConsulta.endsWith('/') ? sinConsulta.slice(0, -1) : sinConsulta
}
