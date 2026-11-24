import { axiosClient } from "@/api/axiosClient"
import {
  rutaCotizacionAprobar,
  rutaCotizacionDevolver,
  rutaCotizacionSolicitarAprobacion,
  type DevolverCotizacionRequest,
} from "@/api/contratos/cotizaciones"
import type {
  Cotizacion,
  CreateCotizacionRequest,
  UpdateCotizacionRequest,
  CotizacionesListResponse,
  CotizacionesFilterParams,
  UpdateEstadoCotizacionRequest,
  EnviarCotizacionRequest,
  AdjuntoCotizacion,
} from "@/types/cotizacion.types"

/** Lo que se escribe. APROBADA solo se lee: una aceptación nueva es ACEPTADA_CLIENTE. */
export type CodigoRespuestaCliente = "ACEPTADA_CLIENTE" | "EN_NEGOCIACION" | "RECHAZADA"
/** Clave interna del modal. No se manda: el POST lleva el código de estado. */
export type AccionRespuestaCliente = "acepto" | "pidio_cambios" | "rechazo"
export type MedioRespuestaCliente = "correo" | "whatsapp" | "llamada" | "otro"

/**
 * POST /cotizaciones/{id}/respuesta-cliente.
 * El DTO declara codigoEstado, comentario, idAdjunto, fechaRespuesta y medio.
 */
export interface RespuestaClienteRequest {
  codigoEstado: CodigoRespuestaCliente
  comentario: string
  idAdjunto?: number
  fechaRespuesta: string
  medio: MedioRespuestaCliente
  /** Solo si medio es "otro": cuál fue (máx. 60). */
  medioDetalle?: string
}

/** Respuesta que registra el vendedor o el jefe. El archivo se sube aparte. */
export interface RespuestaFlujoCliente extends RespuestaClienteRequest {
  adjunto?: File | null
}

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
      idUnidadMedida: l.idUnidadMedida ?? 0,
      producto: l.producto ?? l.productoNombre ?? undefined,
      servicio: l.servicio ?? l.servicioNombre ?? undefined,
      costoUnitario: l.costoUnitario == null ? null : Number(l.costoUnitario),
      margen: l.margen ?? null,
      margenPorcentaje: l.margenPorcentaje == null && l.margen == null ? null : Number(l.margenPorcentaje ?? l.margen),
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
      estadoNuevo: s.estadoNuevo ?? s.codigoEstado ?? s.estado,
      estadoAnterior: s.estadoAnterior ?? undefined,
      fechaEvento: s.fechaEvento,
      fecha: s.fechaEvento,
      usuarioNombre: s.usuarioNombre ?? s.usuario ?? undefined,
      comentario: s.comentario ?? undefined,
      observaciones: s.observaciones ?? s.comentario ?? '',
      medio: s.medio ?? null,
      medioDetalle: s.medioDetalle ?? null,
      rutaAdjunto: s.rutaAdjunto ?? null,
      rutaVersionPdf: s.rutaVersionPdf ?? null,
      fechaRespuesta: s.fechaRespuesta ?? null,
    }))
    const adjuntosMap = (adjuntos.data as any[]).map((a) => ({
      idAdjunto: a.idAdjunto,
      id: a.idAdjunto,
      nombreArchivo: a.nombreArchivo,
      urlArchivo: a.urlArchivo,
      urlCloudinary: a.urlArchivo,
      tipoArchivo: String(a.nombreArchivo ?? '').split('.').pop() ?? '',
      tamanio: a.tamanio ?? 0,
      fechaSubida: a.fechaSubida ?? undefined,
      subidoPor: a.subidoPor ?? '',
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

  /** Mismo id y código. La respuesta se lee igual que en el alta. */
  async actualizarCotizacion(id: number, data: UpdateCotizacionRequest): Promise<Cotizacion> {
    const response = await axiosClient.put<Cotizacion>(`/cotizaciones/${id}`, data)
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

  async solicitarAprobacion(id: number): Promise<Cotizacion> {
    const { data } = await axiosClient.post<Cotizacion>(rutaCotizacionSolicitarAprobacion(id))
    return data
  },

  async aprobarCotizacion(id: number): Promise<Cotizacion> {
    const { data } = await axiosClient.post<Cotizacion>(rutaCotizacionAprobar(id))
    return data
  },

  async devolverCotizacion(id: number, body: DevolverCotizacionRequest): Promise<Cotizacion> {
    const { data } = await axiosClient.post<Cotizacion>(rutaCotizacionDevolver(id), body)
    return data
  },

  /** El Jefe registra la respuesta que el cliente dio fuera del portal. La orden, si aprueba, la crea el backend. */
  async registrarRespuestaCliente(id: number, body: RespuestaClienteRequest): Promise<Cotizacion> {
    const { data } = await axiosClient.post<Cotizacion>(`/cotizaciones/${id}/respuesta-cliente`, body)
    return data
  },

  /** Aprobada por el Jefe → envía el correo y, si sale, deja la cotización en Enviada. */
  async marcarEnviada(id: number): Promise<Cotizacion> {
    const { data } = await axiosClient.post<Cotizacion>(`/cotizaciones/${id}/marcar-enviada`)
    return data
  },

  /**
   * Registra la respuesta. El archivo entra antes por /adjuntos; aquí solo va su id.
   * fechaRespuesta y medio van en el cuerpo porque el DTO ya los declara.
   */
  async registrarRespuestaFlujo(id: number, body: RespuestaFlujoCliente): Promise<Cotizacion> {
    let idAdjunto = body.idAdjunto
    if (body.adjunto) {
      const subido = await this.cargarAdjunto(id, body.adjunto)
      idAdjunto = subido.idAdjunto ?? subido.id
    }
    const solicitud: RespuestaClienteRequest = {
      codigoEstado: body.codigoEstado,
      comentario: body.comentario.trim(),
      fechaRespuesta: body.fechaRespuesta,
      medio: body.medio,
      ...(body.medio === 'otro' && body.medioDetalle?.trim() ? { medioDetalle: body.medioDetalle.trim() } : {}),
      ...(idAdjunto != null ? { idAdjunto } : {}),
    }
    const { data } = await axiosClient.post<Cotizacion>(`/cotizaciones/${id}/respuesta-cliente`, solicitud)
    return data
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