import type { Cotizacion } from "@/types/cotizacion.types"
import type { Factura } from "@/types/facturacion.types"
import type { CotizacionEstadoItem } from "@/types/dashboard.types"
import { parsearFechaLocal } from "@/lib/formatters/fechaLocal"
import { formatCurrency, normalizarMoneda } from "@/lib/formatters/currency"

/** Cálculos del dashboard a partir de las listas de cotizaciones y facturas.
 *  Funciones puras: reciben los datos y "hoy", así son fáciles de probar. */

const MS_DIA = 24 * 60 * 60 * 1000
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"]

/** Estados en los que una cotización sigue "abierta" (puede vencer). */
const ESTADOS_ABIERTOS = new Set(["BORRADOR", "ENVIADA", "EN_NEGOCIACION"])
/** Facturas que ya no se cobran. */
const FACTURA_CERRADA = new Set(["PAGADA", "ANULADA"])

export const ETIQUETA_ESTADO: Record<string, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  EN_NEGOCIACION: "En negociación",
  APROBADA: "Aprobada",
  ACEPTADA: "Aceptada",
  CONVERTIDA_OC: "Convertida a OC",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
  ANULADA: "Anulada",
}

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

/** Días desde hoy hasta la fecha (negativo = ya pasó). */
function diasHasta(valor: string | undefined, hoy: Date): number | null {
  if (!valor) return null
  const fecha = parsearFechaLocal(valor)
  if (!fecha) return null
  return Math.round((inicioDelDia(fecha).getTime() - inicioDelDia(hoy).getTime()) / MS_DIA)
}

function fechaCorta(valor: string): string {
  const fecha = parsearFechaLocal(valor)
  if (!fecha) return valor
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()].toLowerCase()}.`
}

/** El backend manda el nombre del estado ("En negociación"); aquí se trabaja con
 *  códigos ("EN_NEGOCIACION"). Acepta cualquiera de los dos. */
export function normalizarEstado(valor?: string | null): string {
  return valor
    ? String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s+/g, "_")
    : ""
}

function estadoCotizacion(c: Cotizacion) {
  return normalizarEstado(c.estadoCodigo ?? c.estadoCotizacion ?? c.estado)
}

function estadoFactura(f: Factura) {
  return normalizarEstado(f.estadoCodigo ?? f.estado)
}

// ── Montos por moneda (no se suman USD y PEN entre sí) ───────────────────────

export type MontosPorMoneda = Record<string, number>

export function sumarMonto(acumulado: MontosPorMoneda, monto: number, moneda?: string | null) {
  const clave = normalizarMoneda(moneda ?? "PEN")
  acumulado[clave] = (acumulado[clave] ?? 0) + monto
}

/** "US$ 12,240.00 · S/ 4,000.00" (una parte por moneda, la mayor primero). */
export function formatearMontos(montos: MontosPorMoneda): string {
  const partes = Object.entries(montos)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1])
    .map(([moneda, v]) => formatCurrency(v, moneda))
  return partes.length ? partes.join(" · ") : formatCurrency(0)
}

/** Cotizaciones que siguen abiertas (pendientes de cerrar): cuántas y cuánto, por moneda. */
export function resumenPendientes(cotizaciones: Cotizacion[]) {
  const montos: MontosPorMoneda = {}
  let cantidad = 0
  for (const c of cotizaciones) {
    if (!ESTADOS_ABIERTOS.has(estadoCotizacion(c))) continue
    cantidad++
    sumarMonto(montos, c.total ?? 0, c.monedaCodigo ?? c.moneda)
  }
  return { cantidad, montos }
}

/** Todo lo cotizado (menos anuladas), por moneda. */
export function montoCotizadoPorMoneda(cotizaciones: Cotizacion[]): MontosPorMoneda {
  const montos: MontosPorMoneda = {}
  for (const c of cotizaciones) {
    if (estadoCotizacion(c) === "ANULADA") continue
    sumarMonto(montos, c.total ?? 0, c.monedaCodigo ?? c.moneda)
  }
  return montos
}

/** Facturas con saldo por cobrar cuyo vencimiento ya pasó, sin importar hace cuánto. */
export function contarFacturasVencidas(facturas: Factura[], hoy: Date): number {
  return facturas.filter((f) => {
    if (FACTURA_CERRADA.has(estadoFactura(f)) || saldoFactura(f) <= 0) return false
    const dias = diasHasta(f.fechaVencimiento, hoy)
    return dias !== null && dias < 0
  }).length
}

export function saldoFactura(f: Factura) {
  return f.saldoPendiente ?? Math.max(0, (f.total ?? 0) - (f.montoPagado ?? 0))
}

// ── Requiere atención ────────────────────────────────────────────────────────

export interface Pendiente {
  clave: string
  documento: string
  cliente: string
  tipo: "Cotización" | "Factura"
  motivo: string
  urgencia: "vencido" | "proximo"
  monto: number
  moneda: string
  href: string
  accion: string
  dias: number
}

function motivoVencimiento(prefijo: string, dias: number, fecha: string) {
  if (dias < 0) return `${prefijo === "Cobro" ? "Cobro venció" : "Venció"} el ${fechaCorta(fecha)}`
  if (dias === 0) return `${prefijo} hoy`
  if (dias === 1) return `${prefijo} mañana`
  return `${prefijo} en ${dias} días`
}

/** Hasta cuántos días atrás se sigue mostrando algo ya vencido: una cotización
 *  que venció hace meses es ruido; una factura sin cobrar importa más tiempo. */
const VENCIDO_COTIZACION_DIAS = 14
const VENCIDO_FACTURA_DIAS = 60

/** Cotizaciones abiertas y facturas por cobrar que vencen dentro de
 *  `horizonteDias` (o vencieron hace poco), de lo más urgente a lo menos. */
export function calcularPendientes(
  cotizaciones: Cotizacion[],
  facturas: Factura[],
  hoy: Date,
  horizonteDias: number
): Pendiente[] {
  const deCotizaciones: Pendiente[] = cotizaciones.flatMap((c) => {
    if (!ESTADOS_ABIERTOS.has(estadoCotizacion(c) ?? "")) return []
    const dias = diasHasta(c.fechaValidez, hoy)
    if (dias === null || dias > horizonteDias || dias < -VENCIDO_COTIZACION_DIAS) return []
    const id = c.idCotizacion ?? c.id
    return [{
      clave: `cot-${id}`,
      documento: c.codigoCotizacion ?? c.codigo ?? `Cotización ${id}`,
      cliente: c.clienteNombre ?? c.cliente ?? "Cliente sin nombre",
      tipo: "Cotización" as const,
      motivo: motivoVencimiento("Vence", dias, c.fechaValidez),
      urgencia: dias < 0 ? ("vencido" as const) : ("proximo" as const),
      monto: c.total ?? 0,
      moneda: c.monedaCodigo ?? c.moneda ?? "PEN",
      href: `/cotizaciones/${id}`,
      accion: dias < 0 ? "Renovar" : "Hacer seguimiento",
      dias,
    }]
  })

  const deFacturas: Pendiente[] = facturas.flatMap((f) => {
    const saldo = saldoFactura(f)
    if (FACTURA_CERRADA.has(estadoFactura(f)) || saldo <= 0) return []
    const dias = diasHasta(f.fechaVencimiento, hoy)
    if (dias === null || dias > horizonteDias || dias < -VENCIDO_FACTURA_DIAS) return []
    return [{
      clave: `fac-${f.idFacturacion ?? f.id}`,
      documento: f.codigoComprobante ?? `${f.serieComprobante}-${f.numeroComprobante}`,
      cliente: f.clienteNombre ?? f.cliente ?? "Cliente sin nombre",
      tipo: "Factura" as const,
      motivo: motivoVencimiento("Cobro vence", dias, f.fechaVencimiento),
      urgencia: dias < 0 ? ("vencido" as const) : ("proximo" as const),
      monto: saldo,
      moneda: f.moneda ?? "PEN",
      href: f.idOrdenCompra ? `/facturacion?idOrdenCompra=${f.idOrdenCompra}` : "/facturacion",
      accion: "Registrar cobro",
      dias,
    }]
  })

  return [...deCotizaciones, ...deFacturas].sort((a, b) => a.dias - b.dias)
}

// ── Series por mes ───────────────────────────────────────────────────────────

/** Claves "aaaa-mm" de los últimos `n` meses (el último es el actual). */
function ultimosMeses(hoy: Date, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (n - 1 - i), 1)
    return { clave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, etiqueta: MESES_CORTOS[d.getMonth()] }
  })
}

function claveMes(valor: string | undefined) {
  const fecha = valor ? parsearFechaLocal(valor) : null
  return fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}` : null
}

/** "Ene", "Feb"… a partir de "2026-01" o de un texto ya legible. */
export function etiquetaMes(mes: string) {
  const m = /^(\d{4})-(\d{2})/.exec(mes)
  return m ? MESES_CORTOS[Number(m[2]) - 1] ?? mes : mes
}

export interface CotizacionesMes { mes: string; aprobadas: number; enCurso: number; rechazadas: number }

/** Cotizaciones emitidas por mes (por fecha de cotización), según cómo terminaron. */
export function cotizacionesPorMes(cotizaciones: Cotizacion[], hoy: Date, meses = 4): CotizacionesMes[] {
  const filas = ultimosMeses(hoy, meses).map((m) => ({ ...m, aprobadas: 0, enCurso: 0, rechazadas: 0 }))
  for (const c of cotizaciones) {
    const fila = filas.find((f) => f.clave === claveMes(c.fechaCotizacion))
    if (!fila) continue
    const estado = estadoCotizacion(c)
    if (estado === "APROBADA") fila.aprobadas++
    else if (ESTADOS_ABIERTOS.has(estado)) fila.enCurso++
    else if (estado === "RECHAZADA" || estado === "VENCIDA") fila.rechazadas++
  }
  return filas.map(({ etiqueta, aprobadas, enCurso, rechazadas }) => ({ mes: etiqueta, aprobadas, enCurso, rechazadas }))
}

/** Monto cotizado por mes (suma de totales), para comparar con lo facturado. */
export function cotizadoPorMes(cotizaciones: Cotizacion[], hoy: Date, meses = 6) {
  const filas = ultimosMeses(hoy, meses).map((m) => ({ ...m, cotizado: 0 }))
  for (const c of cotizaciones) {
    if (estadoCotizacion(c) === "ANULADA") continue
    const fila = filas.find((f) => f.clave === claveMes(c.fechaCotizacion))
    if (fila) fila.cotizado += c.total ?? 0
  }
  return filas
}

// ── Mapa de calor ────────────────────────────────────────────────────────────

/** Cotizaciones creadas por día hábil en las últimas `semanas` semanas:
 *  filas = lunes…viernes, columnas = semanas (la última es la actual). */
export function actividadPorDia(cotizaciones: Cotizacion[], hoy: Date, semanas = 6): number[][] {
  const lunesActual = inicioDelDia(hoy)
  lunesActual.setDate(lunesActual.getDate() - ((lunesActual.getDay() + 6) % 7))
  const inicio = new Date(lunesActual.getTime() - (semanas - 1) * 7 * MS_DIA)
  const matriz = Array.from({ length: 5 }, () => Array<number>(semanas).fill(0))
  for (const c of cotizaciones) {
    const fecha = parsearFechaLocal(c.fechaCreacion ?? c.fechaCotizacion)
    if (!fecha) continue
    const dias = Math.round((inicioDelDia(fecha).getTime() - inicio.getTime()) / MS_DIA)
    const semana = Math.floor(dias / 7)
    const diaSemana = dias % 7
    if (dias < 0 || semana >= semanas || diaSemana > 4) continue
    matriz[diaSemana][semana]++
  }
  return matriz
}

// ── Tasa de aprobación y estados ─────────────────────────────────────────────

/** Aprobadas sobre respondidas (aprobadas + rechazadas). null si aún no hay respuestas. */
export function tasaAprobacion(estados: CotizacionEstadoItem[]): number | null {
  const contar = (codigos: string[]) => estados.filter((e) => codigos.includes(normalizarEstado(e.estado))).reduce((s, e) => s + e.cantidad, 0)
  const aprobadas = contar(["APROBADA", "ACEPTADA", "CONVERTIDA_OC"])
  const rechazadas = contar(["RECHAZADA"])
  const respondidas = aprobadas + rechazadas
  return respondidas === 0 ? null : Math.round((aprobadas / respondidas) * 100)
}

// ── Mejores clientes ─────────────────────────────────────────────────────────

export interface ClienteDestacado { nombre: string; idCliente?: number; facturado: number; comprobantes: number; montos: MontosPorMoneda }

/** Clientes con más facturación del año en curso (facturas no anuladas). */
export function mejoresClientes(facturas: Factura[], hoy: Date, limite = 3): ClienteDestacado[] {
  const porCliente = new Map<string, ClienteDestacado>()
  for (const f of facturas) {
    if (estadoFactura(f) === "ANULADA") continue
    const fecha = parsearFechaLocal(f.fechaEmision)
    if (!fecha || fecha.getFullYear() !== hoy.getFullYear()) continue
    const nombre = f.clienteNombre ?? f.cliente
    if (!nombre) continue
    const actual = porCliente.get(nombre) ?? { nombre, idCliente: f.clienteId, facturado: 0, comprobantes: 0, montos: {} }
    actual.facturado += f.total ?? 0
    sumarMonto(actual.montos, f.total ?? 0, f.moneda)
    actual.comprobantes++
    porCliente.set(nombre, actual)
  }
  return [...porCliente.values()].sort((a, b) => b.facturado - a.facturado).slice(0, limite)
}

export function iniciales(nombre: string) {
  const palabras = nombre
    .replace(/\b(S\.?A\.?C?\.?|S\.?A\.?A\.?|E\.?I\.?R\.?L\.?|Compañía|Sociedad)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return palabras.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}