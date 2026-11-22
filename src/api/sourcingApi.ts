import { axiosClient } from "./axiosClient"
import { sourcingMock } from "./sourcingApi.mock"
import { RUTA_TIPO_CAMBIO, type TipoCambioDia } from "./contratos/parametros"

/**
 * Búsqueda de repuestos (BE-E, Fase 2). Contrato de /api/sourcing/**.
 * Solo personal interno: trae fuente, enlace y precio original, así que nunca
 * se usa en la landing ni en el portal del cliente.
 */

export type EstadoReferencia = "CAPTURADO" | "UTIL" | "DESCARTADO" | "CONVERTIDO"
export type MetodoBusqueda = "NUMERO_PARTE" | "GTIN" | "PALABRAS" | "IMAGEN" | "URL"
export type Origen = "NACIONAL" | "IMPORTADO"
/** Dónde se marcó ÚTIL. Nombre del campo en ReferenciaResponse. */
export type OrigenMarcaUtil = "BUSQUEDA" | "COTIZACION"

export interface Referencia {
  idSourcing: number
  idSolicitudItem: number | null
  fuente: string
  metodo: MetodoBusqueda
  titulo: string | null
  marca: string | null
  numeroParte: string | null
  precioRef: number | null
  codigoMoneda: string | null
  costoPuestoLima: number | null
  urlReferencia: string | null
  urlImagenRef: string | null
  estado: EstadoReferencia
  editadoAMano: boolean
  creadoEn: string
  marcadaUtilDesde?: OrigenMarcaUtil | null
  marcadaUtilEn?: string | null
  marcadaUtilPor?: string | null
}

/** Cuerpo de POST /sourcing/{id}/elegir-desde-cotizacion. Vacío si la referencia no tiene ítem de solicitud. */
export interface ElegirDesdeCotizacionRequest {
  idSolicitudItem?: number
}

export interface HistorialFiltro {
  numeroParte?: string
  idSolicitudItem?: number
  /** Texto libre: número de parte o nombre. */
  q?: string
  /** Excluye DESCARTADO. */
  soloElegibles?: boolean
  /** Tope de filas. El backend usa 20 si no se manda. */
  limite?: number
}

export interface BuscarReferenciasRequest {
  idSolicitudItem?: number
  numeroParte: string
  marca?: string
  gtin?: string
  palabras?: string
  forzar: boolean
}

export interface ResultadoBusqueda {
  reutilizada: boolean
  fuentesConsultadas: string[]
  fuentesConError: string[]
  sugerirUrl: boolean
  referencias: Referencia[]
}

export interface DatosUrl {
  url: string
  fuente: string
  titulo: string | null
  precio: number | null
  codigoMoneda: string | null
  urlImagen: string | null
  bloqueada: boolean
  motivo: string | null
}

export interface GuardarUrlRequest {
  idSolicitudItem?: number
  url: string
  titulo: string
  marca?: string
  numeroParte?: string
  precio: number
  codigoMoneda: string
  urlImagen?: string
  origen: Origen
  tipoCambio?: number
  flete?: number
  seguro?: number
  aduana?: number
  editadoAMano: boolean
}

/** Datos simulados mientras el backend está apagado: VITE_SOURCING_MOCK=true en .env.local. */
const usarMock = import.meta.env.VITE_SOURCING_MOCK === "true"

export const sourcingApi = {
  async buscar(body: BuscarReferenciasRequest): Promise<ResultadoBusqueda> {
    if (usarMock) return sourcingMock.buscar(body)
    const { data } = await axiosClient.post<ResultadoBusqueda>("/sourcing/buscar", body)
    return data
  },

  async historial(filtro: HistorialFiltro, signal?: AbortSignal): Promise<Referencia[]> {
    if (usarMock) return sourcingMock.historial(filtro)
    const params: HistorialFiltro = {}
    if (filtro.numeroParte != null && filtro.numeroParte !== "") params.numeroParte = filtro.numeroParte
    if (filtro.idSolicitudItem != null) params.idSolicitudItem = filtro.idSolicitudItem
    if (filtro.q != null && filtro.q !== "") params.q = filtro.q
    if (filtro.soloElegibles != null) params.soloElegibles = filtro.soloElegibles
    if (filtro.limite != null) params.limite = filtro.limite
    const config: { params: HistorialFiltro; signal?: AbortSignal } = { params }
    if (signal) config.signal = signal
    const { data } = await axiosClient.get<Referencia[]>("/sourcing/historial", config)
    return data
  },

  /** Marca la referencia elegida desde la cotización. No toca las demás filas. */
  async elegirDesdeCotizacion(idSourcing: number, body: ElegirDesdeCotizacionRequest = {}): Promise<Referencia> {
    const enviado = body.idSolicitudItem != null ? { idSolicitudItem: body.idSolicitudItem } : {}
    if (usarMock) return sourcingMock.elegirDesdeCotizacion(idSourcing, enviado)
    const { data } = await axiosClient.post<Referencia>(`/sourcing/${idSourcing}/elegir-desde-cotizacion`, enviado)
    return data
  },

  async cambiarEstado(idSourcing: number, estado: "UTIL" | "DESCARTADO"): Promise<Referencia> {
    if (usarMock) return sourcingMock.cambiarEstado(idSourcing, estado)
    const { data } = await axiosClient.patch<Referencia>(`/sourcing/${idSourcing}/estado`, { estado })
    return data
  },

  async leerUrl(url: string): Promise<DatosUrl> {
    if (usarMock) return sourcingMock.leerUrl(url)
    const { data } = await axiosClient.post<DatosUrl>("/sourcing/url/leer", { url })
    return data
  },

  async guardarUrl(body: GuardarUrlRequest): Promise<Referencia> {
    if (usarMock) return sourcingMock.guardarUrl(body)
    const { data } = await axiosClient.post<Referencia>("/sourcing/url", body)
    return data
  },

  /** Tipo de cambio del día (contrato del Paso 0, lo expone BE-D). Si aún no existe, la pantalla lo pide a mano. */
  async tipoCambioDelDia(): Promise<TipoCambioDia> {
    if (usarMock) return sourcingMock.tipoCambioDelDia()
    const { data } = await axiosClient.get<TipoCambioDia>(RUTA_TIPO_CAMBIO)
    return data
  },
}
