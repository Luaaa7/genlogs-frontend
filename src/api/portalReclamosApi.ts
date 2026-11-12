import { axiosClient } from "./axiosClient"

/**
 * Reclamos del cliente (RF-70), contrato de BE-A (Karla, #80). Solo con sesión de cliente
 * y solo de su propia empresa:
 * GET  /portal/reclamos                     → ReclamoPortal[]
 * GET  /portal/reclamos/:id                 → ReclamoPortal (con historial)
 * POST /portal/reclamos                     { asunto, descripcion, idOrdenCompra? } → 201 ReclamoPortal
 * POST /portal/reclamos/:id/calificacion    { puntaje 1–5, comentario? } → ReclamoPortal
 * Nunca trae responsable, prioridad, fecha límite ni comentarios internos.
 */
export interface EventoReclamoPortal {
  estado: string
  fecha: string
}

export interface ReclamoPortal {
  idReclamo: number
  codigoReclamo: string
  /** REGISTRADO, EN_PROCESO, RESUELTO, CERRADO o ANULADO. */
  estado: string
  asunto: string
  descripcion?: string
  numeroOrdenCompra?: string
  fechaRegistro?: string
  fechaCierre?: string
  solucion?: string
  calificacion?: number | null
  comentarioCalificacion?: string
  /** true si está RESUELTO o CERRADO y todavía no se calificó. */
  puedeCalificar: boolean
  historial?: EventoReclamoPortal[]
}

export interface NuevoReclamoPortal {
  asunto: string
  descripcion: string
  idOrdenCompra?: number
}

export interface CalificacionReclamoPortal {
  puntaje: number
  comentario?: string
}

const base = "/portal/reclamos"

export const portalReclamosApi = {
  listar: () => axiosClient.get<ReclamoPortal[]>(base).then(({ data }) => data),
  detalle: (id: number) => axiosClient.get<ReclamoPortal>(`${base}/${id}`).then(({ data }) => data),
  crear: (reclamo: NuevoReclamoPortal) => axiosClient.post<ReclamoPortal>(base, reclamo).then(({ data }) => data),
  calificar: (id: number, calificacion: CalificacionReclamoPortal) =>
    axiosClient.post<ReclamoPortal>(`${base}/${id}/calificacion`, calificacion).then(({ data }) => data),
}
