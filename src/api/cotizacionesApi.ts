import { axiosClient } from "@/api/axiosClient"
import type {
  Cotizacion,
  CreateCotizacionRequest,
  CotizacionesListResponse,
  CotizacionesFilterParams,
  UpdateEstadoCotizacionRequest,
  EnviarCotizacionRequest,
  AdjuntoCotizacion,
} from "@/types/cotizacion.types"

export const cotizacionesApi = {
  async listarCotizaciones(
    filtros?: CotizacionesFilterParams
  ): Promise<CotizacionesListResponse> {
    const params = new URLSearchParams()

    if (filtros?.estadoCotizacion) {
      params.append("estadoCotizacion", filtros.estadoCotizacion)
    }
    if (filtros?.clienteId) {
      params.append("clienteId", String(filtros.clienteId))
    }
    if (filtros?.moneda) {
      params.append("moneda", filtros.moneda)
    }

    params.append("page", String(filtros?.page ?? 0))
    params.append("size", String(filtros?.size ?? 10))
    params.append("sortBy", filtros?.sortBy ?? "fechaCotizacion")
    params.append("sortDir", filtros?.sortDir ?? "DESC")

    const response = await axiosClient.get<CotizacionesListResponse>("/cotizaciones", { params })
    return response.data
  },

  /**
   * El backend reparte el detalle en endpoints aparte (/lineas, /seguimiento,
   * /adjuntos) y con otros nombres de campo; aqui se arma el Cotizacion que
   * espera la pantalla de detalle.
   */
  async obtenerCotizacion(id: number): Promise<Cotizacion> {
    const [cab, lineas, seguimiento, adjuntos] = await Promise.all([
      axiosClient.get(`/cotizaciones/${id}`),
      axiosClient.get(`/cotizaciones/${id}/lineas`),
      axiosClient.get(`/cotizaciones/${id}/seguimiento`),
      axiosClient.get(`/cotizaciones/${id}/adjuntos`),
    ])
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const c: any = cab.data
    const detalles = (lineas.data as any[]).map((l) => ({
      idCotizacionDetalle: l.idCotizacionDetalle,
      idProducto: l.idProducto,
      idServicio: l.idServicio,
      idUnidadMedida: 0,
      producto: l.productoNombre ?? undefined,
      servicio: l.servicioNombre ?? undefined,
      descripcionPersonalizada: l.descripcionPersonalizada,
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precioUnitario),
      descuentoUnitario: Number(l.descuentoUnitario ?? 0),
      importeLinea: Number(l.importeLinea),
      subtotal: Number(l.importeLinea),
    }))
    const seguimientos = (seguimiento.data as any[]).map((s) => ({
      idSeguimiento: s.idSeguimiento,
      idEstadoCotizacion: 0,
      estadoNuevo: s.codigoEstado ?? s.estado,
      estadoAnterior: undefined,
      fechaEvento: s.fechaEvento,
      fecha: s.fechaEvento,
      usuarioNombre: s.usuario ?? undefined,
      comentario: s.comentario ?? undefined,
      observaciones: '',
    }))
    const adjuntosMap = (adjuntos.data as any[]).map((a) => ({
      idAdjunto: a.idAdjunto,
      id: a.idAdjunto,
      nombreArchivo: a.nombreArchivo,
      urlArchivo: a.urlArchivo,
      urlCloudinary: a.urlArchivo,
      tipoArchivo: String(a.nombreArchivo ?? '').split('.').pop() ?? '',
      tamanio: 0,
      subidoPor: '',
    }))
    /* eslint-enable @typescript-eslint/no-explicit-any */
    // El backend manda el nombre del estado ("En negociación"); la pantalla
    // espera el código ("EN_NEGOCIACION").
    const estadoCodigo = c.estado
      ? String(c.estado).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/\s+/g, '_')
      : undefined
    return {
      ...c,
      clienteNombre: c.clienteNombre ?? c.clienteRazonSocial,
      estadoCodigo: c.estadoCodigo ?? estadoCodigo,
      detalles,
      seguimientos,
      adjuntos: adjuntosMap,
    } as unknown as Cotizacion
  },

  async crearCotizacion(data: CreateCotizacionRequest): Promise<Cotizacion> {
    const response = await axiosClient.post<Cotizacion>("/cotizaciones", data)
    return response.data
  },

  async cambiarEstadoCotizacion(
    id: number,
    data: UpdateEstadoCotizacionRequest
  ): Promise<Cotizacion> {
    // El backend espera { codigoEstado, comentario } (CambiarEstadoCotizacionRequest).
    const response = await axiosClient.patch<Cotizacion>(`/cotizaciones/${id}/estado`, {
      codigoEstado: data.estadoNuevo,
      comentario: data.comentario ?? data.observaciones,
    })
    return response.data
  },

  async cargarAdjunto(cotizacionId: number, archivo: File): Promise<AdjuntoCotizacion> {
    const formData = new FormData()
    formData.append("archivo", archivo)

    const response = await axiosClient.post<AdjuntoCotizacion>(
      `/cotizaciones/${cotizacionId}/adjuntos`,
      formData
    )
    return response.data
  },

  async eliminarAdjunto(cotizacionId: number, adjuntoId: number): Promise<void> {
    await axiosClient.delete(`/cotizaciones/${cotizacionId}/adjuntos/${adjuntoId}`)
  },

  async enviarCotizacion(
    id: number,
    data: EnviarCotizacionRequest
  ): Promise<{ success: boolean; mensaje: string }> {
    const response = await axiosClient.post<{ success: boolean; mensaje: string }>(
      `/cotizaciones/${id}/enviar`,
      data
    )
    return response.data
  },

  async descargarCotizacionPDF(id: number): Promise<Blob> {
    const response = await axiosClient.get(`/cotizaciones/${id}/descargar-pdf`, {
      responseType: "blob",
    })
    return response.data
  },

  async duplicarCotizacion(id: number): Promise<Cotizacion> {
    const response = await axiosClient.post<Cotizacion>(`/cotizaciones/${id}/duplicar`)
    return response.data
  },

  async obtenerEstadisticas(): Promise<{
    totalCotizaciones: number
    totalPorEstado: Record<string, number>
    montoTotalPendiente: number
    /** Pendiente por moneda ({ USD: 98000, PEN: 27954.38 }); no se suman monedas distintas. */
    montoPendientePorMoneda?: Record<string, number>
    tasaAprobacion: number
  }> {
    const response = await axiosClient.get("/cotizaciones/estadisticas")
    return response.data
  },
}