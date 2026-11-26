import axios from 'axios'
import { axiosClient } from '@/api/axiosClient'
import {
  RUTA_SOLICITUDES,
  rutaSolicitudHistorial,
  rutaSolicitudIniciar,
  rutaSolicitudItems,
  rutaSolicitudPausar,
  rutaSolicitudReanudar,
  rutaSolicitudReasignar,
  rutaSolicitudReclasificar,
  type EventoSolicitud,
  type ItemIdentificacion,
  type PausarSolicitudRequest,
  type ReasignarSolicitudRequest,
  type ReclasificarSolicitudRequest,
  type SolicitudInternaFila,
  type SolicitudInternaResponse,
  type FiltrosSolicitudes,
  type ListaSolicitudesResponse,
} from '@/api/contratos/solicitudes'

/**
 * Datos reales por defecto. El mock (SOL-001 a SOL-005) solo se enciende en las pruebas
 * (vitest pone MODE = "test") o a mano con VITE_SOLICITUDES_MOCK=true.
 */
const usarMock = import.meta.env.MODE === 'test' || import.meta.env.VITE_SOLICITUDES_MOCK === 'true'

/** GET real que existe en el backend: abiertas por vencimiento, con semáforo (sin paginar ni filtrar). */
const RUTA_VENCIMIENTO = `${RUTA_SOLICITUDES}/vencimiento`

/** Fila que devuelve GET /solicitudes/vencimiento. PAUSADA no es un color de la lista: se ve por el estado. */
export interface FilaVencimiento {
  solicitud: SolicitudInternaResponse
  semaforo: 'VERDE' | 'AMARILLO' | 'ROJO' | 'PAUSADA' | null
  porcentajePlazo?: number | null
}

/** Filtra y pagina en el cliente lo que trae /vencimiento. Se muestra lo último que llegó primero (por hora). */
export function listaDeVencimiento(filas: FilaVencimiento[], filtros: FiltrosSolicitudes): ListaSolicitudesResponse {
  const q = filtros.q?.trim().toLowerCase()
  const filtradas = [...filas]
    .sort((a, b) => masRecientePrimero(a.solicitud, b.solicitud))
    .filter(({ solicitud: s }) => !q || `${s.codigoSolicitud} ${s.asunto} ${s.cliente ?? ''}`.toLowerCase().includes(q))
    .filter(({ solicitud: s }) => !filtros.estado || s.estado === filtros.estado)
    .filter(({ solicitud: s }) => !filtros.tipoPlazo || s.tipoPlazo === filtros.tipoPlazo)
    .filter(({ solicitud: s }) => filtros.idAsistente == null || s.asignado?.idUsuario === filtros.idAsistente)
    .filter(({ solicitud: s }) => !filtros.sinAsignar || !s.asignado)
    .map(({ solicitud, semaforo }): SolicitudInternaFila => ({
      ...solicitud,
      semaforo: semaforo === 'PAUSADA' ? null : semaforo,
    }))
  const inicio = filtros.page * filtros.size
  return {
    content: filtradas.slice(inicio, inicio + filtros.size),
    totalElements: filtradas.length,
    totalPages: Math.ceil(filtradas.length / filtros.size),
  }
}

const ANA = { idUsuario: 7, nombreUsuario: 'alopez', nombres: 'Ana López' }

const SEMILLAS: SolicitudInternaResponse[] = [
  { idSolicitud: 1, codigoSolicitud: 'SOL-001', asunto: 'Filtros de aire', cliente: 'Minera Sur', estado: 'PENDIENTE', tipoPlazo: 'COMUN', fechaRecepcion: '2026-11-10T09:00:00', fechaLimiteInterna: '2026-11-12T18:00:00', pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null, reclasificaciones: 0, asignado: null },
  { idSolicitud: 2, codigoSolicitud: 'SOL-002', asunto: 'Bombas hidráulicas', cliente: 'Minera Sur', estado: 'EN_REVISION', tipoPlazo: 'COMUN', fechaRecepcion: '2026-11-09T09:00:00', fechaLimiteInterna: '2026-11-11T18:00:00', pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null, reclasificaciones: 0, asignado: ANA },
  { idSolicitud: 3, codigoSolicitud: 'SOL-003', asunto: 'Rodamientos', cliente: 'Minera Norte', estado: 'EN_ESPERA_TERCERO', tipoPlazo: 'IMPORTADO', fechaRecepcion: '2026-11-08T09:00:00', fechaLimiteInterna: '2026-11-14T18:00:00', pausadaDesde: '2026-11-11T08:30:00', motivoPausa: 'Esperando respuesta del proveedor', fechaEstimadaTercero: '2026-11-20', reclasificaciones: 0, asignado: ANA },
  { idSolicitud: 4, codigoSolicitud: 'SOL-004', asunto: 'Sellos', cliente: 'Minera Norte', estado: 'EN_REVISION', tipoPlazo: 'IMPORTADO', fechaRecepcion: '2026-11-07T09:00:00', fechaLimiteInterna: '2026-11-13T18:00:00', pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null, reclasificaciones: 1, asignado: ANA },
  { idSolicitud: 5, codigoSolicitud: 'SOL-005', asunto: 'Mangueras', cliente: 'Minera Este', estado: 'COTIZADA', tipoPlazo: 'ESPECIAL', fechaRecepcion: '2026-11-06T09:00:00', fechaLimiteInterna: null, pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null, reclasificaciones: 0, asignado: ANA },
]

/** Colores de ejemplo. No salen de la fecha: el que vence antes no es el rojo. */
const SEMAFORO_EJEMPLO: Record<number, SolicitudInternaFila['semaforo']> = {
  1: 'AMARILLO',
  2: 'VERDE',
  3: 'ROJO',
  4: 'VERDE',
  5: null,
}

const copias = new Map<number, SolicitudInternaResponse>()

function clonar(s: SolicitudInternaResponse): SolicitudInternaResponse {
  return { ...s, asignado: s.asignado ? { ...s.asignado } : null }
}

function leer(id: number): SolicitudInternaResponse | null {
  const previa = copias.get(id) ?? SEMILLAS.find((s) => s.idSolicitud === id)
  return previa ? clonar(previa) : null
}

function guardar(s: SolicitudInternaResponse): SolicitudInternaResponse {
  copias.set(s.idSolicitud, clonar(s))
  return clonar(s)
}

function conflicto(message: string): never {
  const error = new axios.AxiosError(message)
  error.response = { status: 409, data: { message }, statusText: 'Conflict', headers: {}, config: {} as never }
  throw error
}

const CERRADA = new Set(['COTIZADA', 'RECHAZADA', 'CANCELADA'])

function exigir(s: SolicitudInternaResponse, estado: SolicitudInternaResponse['estado']) {
  if (CERRADA.has(s.estado) || s.estado !== estado) conflicto('La solicitud no está en el estado que pide esta acción.')
}

const HISTORIAL: EventoSolicitud[] = [
  { tipo: 'CREADA', detalle: null, usuario: null, fecha: '2026-11-10T09:00:00' },
  { tipo: 'ESTADO', detalle: 'Pasó a revisión', usuario: 'Ana López', fecha: '2026-11-11T15:00:00' },
]

const ITEMS_MOCK: ItemIdentificacion[] = [
  { idItem: 1, descripcion: 'Filtro de aire 1R-0750', cantidad: 2, unidad: 'UND', idMarca: 1, marca: 'Caterpillar', numeroParte: '1R-0750', gtin: null, urlFoto: null, idProducto: null, equivalentes: [], confirmado: false, confirmadoPor: null, fechaConfirmacion: null },
  { idItem: 2, descripcion: 'Sello de goma', cantidad: 4, unidad: null, idMarca: null, marca: null, numeroParte: null, gtin: null, urlFoto: null, idProducto: null, equivalentes: [], confirmado: false, confirmadoPor: null, fechaConfirmacion: null },
]

/**
 * Pendiente de BE-B: GET /solicitudes/{id} para abrir el detalle sin pasar por la lista.
 * Con fila en la navegación se usa esa. En mock, si no hay fila, se lee la semilla. En real, sin fila, null.
 */
export function solicitudDeRuta(id: number, fila?: SolicitudInternaResponse | null, mock = usarMock): SolicitudInternaResponse | null {
  if (fila && fila.idSolicitud === id) return clonar(fila)
  if (!mock) return null
  return leer(id)
}

/** Más reciente primero: fecha y hora de recepción; si coinciden, el id más alto. */
function masRecientePrimero(a: SolicitudInternaResponse, b: SolicitudInternaResponse): number {
  const porHora = b.fechaRecepcion.localeCompare(a.fechaRecepcion)
  return porHora !== 0 ? porHora : b.idSolicitud - a.idSolicitud
}

function filaDe(s: SolicitudInternaResponse): SolicitudInternaFila {
  return { ...clonar(s), semaforo: SEMAFORO_EJEMPLO[s.idSolicitud] ?? null }
}

/** Query del GET real. Los vacíos no viajan. */
export function parametrosDeLista(filtros: FiltrosSolicitudes): Record<string, string | number> {
  const params: Record<string, string | number> = { page: filtros.page, size: filtros.size }
  if (filtros.q?.trim()) params.q = filtros.q.trim()
  if (filtros.estado) params.estado = filtros.estado
  if (filtros.tipoPlazo) params.tipoPlazo = filtros.tipoPlazo
  if (filtros.idAsistente != null) params.idAsistente = filtros.idAsistente
  return params
}

function listarMock(filtros: FiltrosSolicitudes): ListaSolicitudesResponse {
  const q = filtros.q?.trim().toLowerCase()
  const filas = SEMILLAS.map((s) => leer(s.idSolicitud) ?? s)
    .filter((s) => !q || `${s.codigoSolicitud} ${s.asunto} ${s.cliente}`.toLowerCase().includes(q))
    .filter((s) => !filtros.estado || s.estado === filtros.estado)
    .filter((s) => !filtros.tipoPlazo || s.tipoPlazo === filtros.tipoPlazo)
    .filter((s) => filtros.idAsistente == null || s.asignado?.idUsuario === filtros.idAsistente)
    .filter((s) => !filtros.sinAsignar || !s.asignado)
    .sort(masRecientePrimero)
    .map(filaDe)
  const size = filtros.size
  const page = filtros.page
  return {
    content: filas.slice(page * size, page * size + size),
    totalElements: filas.length,
    totalPages: Math.ceil(filas.length / size),
  }
}

export const solicitudesInternasApi = {
  async iniciar(id: number): Promise<SolicitudInternaResponse> {
    if (usarMock) {
      const s = leer(id) ?? conflicto('No se encontró la solicitud.')
      exigir(s, 'PENDIENTE')
      return guardar({ ...s, estado: 'EN_REVISION' })
    }
    const { data } = await axiosClient.patch<SolicitudInternaResponse>(rutaSolicitudIniciar(id))
    return data
  },
  async pausar(id: number, body: PausarSolicitudRequest): Promise<SolicitudInternaResponse> {
    if (usarMock) {
      const s = leer(id) ?? conflicto('No se encontró la solicitud.')
      exigir(s, 'EN_REVISION')
      return guardar({ ...s, estado: 'EN_ESPERA_TERCERO', pausadaDesde: '2026-11-11T16:00:00', motivoPausa: body.motivo, fechaEstimadaTercero: body.fechaEstimada ?? null })
    }
    const { data } = await axiosClient.patch<SolicitudInternaResponse>(rutaSolicitudPausar(id), body)
    return data
  },
  async reanudar(id: number): Promise<SolicitudInternaResponse> {
    if (usarMock) {
      const s = leer(id) ?? conflicto('No se encontró la solicitud.')
      exigir(s, 'EN_ESPERA_TERCERO')
      return guardar({ ...s, estado: 'EN_REVISION', pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null })
    }
    const { data } = await axiosClient.patch<SolicitudInternaResponse>(rutaSolicitudReanudar(id))
    return data
  },
  async reclasificar(id: number, body: ReclasificarSolicitudRequest): Promise<SolicitudInternaResponse> {
    if (usarMock) {
      const s = leer(id) ?? conflicto('No se encontró la solicitud.')
      if (CERRADA.has(s.estado)) conflicto('La solicitud no está en el estado que pide esta acción.')
      return guardar({ ...s, tipoPlazo: body.tipoPlazo, reclasificaciones: s.reclasificaciones + 1 })
    }
    const { data } = await axiosClient.patch<SolicitudInternaResponse>(rutaSolicitudReclasificar(id), body)
    return data
  },
  async reasignar(id: number, body: ReasignarSolicitudRequest): Promise<SolicitudInternaResponse> {
    if (usarMock) {
      const s = leer(id) ?? conflicto('No se encontró la solicitud.')
      if (CERRADA.has(s.estado)) conflicto('La solicitud no está en el estado que pide esta acción.')
      return guardar({ ...s, asignado: { idUsuario: body.idUsuario, nombreUsuario: `user${body.idUsuario}`, nombres: `Usuario ${body.idUsuario}` } })
    }
    const { data } = await axiosClient.patch<SolicitudInternaResponse>(rutaSolicitudReasignar(id), body)
    return data
  },
  async historial(id: number): Promise<EventoSolicitud[]> {
    if (usarMock) {
      if (!leer(id)) conflicto('No se encontró la solicitud.')
      return HISTORIAL.map((e) => ({ ...e }))
    }
    const { data } = await axiosClient.get<EventoSolicitud[]>(rutaSolicitudHistorial(id))
    return data
  },
  async items(id: number): Promise<ItemIdentificacion[]> {
    if (usarMock) {
      if (!leer(id)) conflicto('No se encontró la solicitud.')
      return ITEMS_MOCK.map((i) => ({ ...i, equivalentes: [...i.equivalentes] }))
    }
    const { data } = await axiosClient.get<ItemIdentificacion[]>(rutaSolicitudItems(id))
    return data
  },
  async listar(filtros: FiltrosSolicitudes): Promise<ListaSolicitudesResponse> {
    if (usarMock) return listarMock(filtros)
    const { data } = await axiosClient.get<FilaVencimiento[]>(RUTA_VENCIMIENTO)
    return listaDeVencimiento(data, filtros)
  },
}