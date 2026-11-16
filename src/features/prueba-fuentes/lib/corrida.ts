import type { ConsultaTienda, EstadoConsultaFuente, PedidoPrueba } from '@/api/pruebaFuentesApi'

/** La prueba es de 10 pedidos y una tienda entra con 4 o más aciertos (D-37). */
export const PEDIDOS = 10
export const ACIERTOS_MINIMOS = 4

/** Lo que marcó el Jefe para una tienda en un pedido. */
export interface Marca {
  acerto: boolean
  enlace: string | null
  /** Ficha elegida en pantalla (no se envía al backend). */
  indice?: number
}

/** Un pedido ya buscado y marcado; tiendas: código → marca (solo las que se evaluaron). */
export interface PedidoEnCurso {
  pedido: string
  tiendas: Record<string, Marca>
}

export const TEXTO_ESTADO: Record<EstadoConsultaFuente, string> = {
  OK: 'Encontró fichas',
  SIN_RESULTADOS: 'Sin resultados',
  CON_ERROR: 'Con error',
  BLOQUEADA: 'La tienda bloqueó la lectura',
  REQUIERE_VERIFICACION: 'Pidió código o CAPTCHA',
  OMITIDA_SESION: 'Sin sesión probada',
  OMITIDA_CUOTA: 'Llegó a su límite diario',
  NO_CONECTADO: 'Servicio de lectura sin conectar',
}

/** Las omitidas y el servicio sin conectar no se evalúan: no dicen nada de la tienda. */
export function seEvalua(c: ConsultaTienda): boolean {
  return c.estado !== 'OMITIDA_SESION' && c.estado !== 'OMITIDA_CUOTA' && c.estado !== 'NO_CONECTADO'
}

/** Sin fichas o con error, la tienda no acertó; con fichas, decide el Jefe (null). */
export function marcaAutomatica(c: ConsultaTienda): Marca | null {
  if (!seEvalua(c)) return null
  if (c.estado !== 'OK' || c.fichas.length === 0) return { acerto: false, enlace: null }
  return null
}

/** "CAT 1R-0750": lo que se guarda como pedido (máximo 120 caracteres en fuente_prueba). */
export function textoPedido(marca: string, numeroParte: string): string {
  return `${marca} ${numeroParte}`.replace(/\s+/g, ' ').trim().slice(0, 120)
}

/** Tiendas con fichas que el Jefe todavía no marcó. */
export function faltanMarcar(consultas: ConsultaTienda[], marcas: Record<string, Marca | undefined>): string[] {
  return consultas
    .filter((c) => seEvalua(c) && marcaAutomatica(c) === null && !marcas[c.codigo])
    .map((c) => c.codigo)
}

/** Las marcas finales del pedido: las del Jefe más las automáticas. */
export function marcasDelPedido(consultas: ConsultaTienda[], marcas: Record<string, Marca | undefined>): Record<string, Marca> {
  const tiendas: Record<string, Marca> = {}
  for (const c of consultas) {
    const marca = marcaAutomatica(c) ?? marcas[c.codigo]
    if (seEvalua(c) && marca) tiendas[c.codigo] = marca
  }
  return tiendas
}

export function yaEsta(pedidos: PedidoEnCurso[], pedido: string): boolean {
  const clave = pedido.toUpperCase()
  return pedidos.some((p) => p.pedido.toUpperCase() === clave)
}

/** Tiendas evaluadas en todos los pedidos: solo esas se guardan (el backend exige los 10). */
export function tiendasCompletas(pedidos: PedidoEnCurso[]): string[] {
  if (pedidos.length === 0) return []
  return Object.keys(pedidos[0].tiendas).filter((codigo) => pedidos.every((p) => p.tiendas[codigo]))
}

/** Aciertos y pedidos evaluados por tienda, para el resumen de la corrida en curso. */
export function conteo(pedidos: PedidoEnCurso[]): Record<string, { aciertos: number; evaluados: number }> {
  const total: Record<string, { aciertos: number; evaluados: number }> = {}
  for (const p of pedidos) {
    for (const [codigo, marca] of Object.entries(p.tiendas)) {
      const t = (total[codigo] ??= { aciertos: 0, evaluados: 0 })
      t.evaluados++
      if (marca.acerto) t.aciertos++
    }
  }
  return total
}

/** Lo que se envía a POST /fuentes/prueba/corridas. */
export function aSolicitud(pedidos: PedidoEnCurso[], tiendas: string[]): PedidoPrueba[] {
  return pedidos.map((p) => ({
    pedido: p.pedido,
    resultados: tiendas.map((codigo) => ({
      fuente: codigo,
      acerto: p.tiendas[codigo].acerto,
      enlace: p.tiendas[codigo].enlace,
    })),
  }))
}

// ---------------------------------------------------------------- guardado local

const CLAVE_LOCAL = 'genlogs-prueba-10-pedidos'

/** La corrida en curso sobrevive a un F5 (10 búsquedas toman tiempo). Solo en esta pestaña. */
export function leerCorridaLocal(): PedidoEnCurso[] {
  try {
    const datos = JSON.parse(sessionStorage.getItem(CLAVE_LOCAL) ?? '[]')
    return Array.isArray(datos) ? (datos as PedidoEnCurso[]).slice(0, PEDIDOS) : []
  } catch {
    return []
  }
}

export function guardarCorridaLocal(pedidos: PedidoEnCurso[]): void {
  try {
    if (pedidos.length === 0) sessionStorage.removeItem(CLAVE_LOCAL)
    else sessionStorage.setItem(CLAVE_LOCAL, JSON.stringify(pedidos))
  } catch {
    /* sin almacenamiento: la prueba funciona igual mientras no se recargue */
  }
}