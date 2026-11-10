export interface DashboardIndicadoresResponse {
  totalFacturado: number
  cotizacionesPendientes: number
  /** Monto de las cotizaciones pendientes por moneda: { "S/": 27954.38, "$": 98000.00 }. */
  montoCotizacionesPendientes?: Record<string, number>
  /** Días promedio desde el envío hasta la primera respuesta del cliente; null sin datos. */
  tiempoRespuestaPromedioDias?: number | null
  clientesActivos: number
  ordenesCompraProceso: number
  porcentajeVariacionFacturacion: number
}

export interface FacturacionHistoricoItem {
  mes: string
  monto: number
  comparativaAnoAnterior?: number
}

export type FacturacionPeriodo = "mensual" | "trimestral" | "anual"

export interface CotizacionEstadoItem {
  estado: string
  cantidad: number
  porcentaje: number
}

export interface DashboardFiltros {
  desde?: string
  hasta?: string
}