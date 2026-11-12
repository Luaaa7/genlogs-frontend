import { axiosClient } from './axiosClient'
import type { PageResponse } from '@/types/common.types'
import type { OrdenCompra, OrdenCompraFiltros, OrdenCompraInput, EstadoOrdenCompra, ConfirmarOcCliente } from '@/types/ordenCompra.types'

/**
 * Mientras el confirmar-oc no está en la rama, la lista muestra tres órdenes de ejemplo.
 * Borrar la asignación deja el GET, el POST del PDF y el PATCH reales.
 */
let usarMock = false
usarMock = true // borra esta línea para los POST y PATCH reales

function ordenDeEjemplo(parcial: Partial<OrdenCompra> & Pick<OrdenCompra, 'idOrdenCompra' | 'numeroOrdenCompra' | 'total'>): OrdenCompra {
  return {
    id: parcial.idOrdenCompra,
    idCotizacion: 9000 + parcial.idOrdenCompra,
    idEstadoOrdenCompra: 1,
    idCondicionPago: 1,
    fechaRecepcion: '2026-11-01',
    estadoCodigo: 'RECIBIDA',
    clienteNombre: 'Minera Sur',
    moneda: 'PEN',
    urlArchivo: null,
    numeroOcCliente: null,
    montoOcCliente: null,
    fechaEmisionCliente: null,
    ocLeidaAuto: false,
    ocConfirmadaPor: null,
    ...parcial,
  }
}

const ordenesMock: OrdenCompra[] = [
  ordenDeEjemplo({
    idOrdenCompra: 1,
    numeroOrdenCompra: 'OC-001',
    total: 1180,
    numeroOcCliente: 'MIN-100',
    montoOcCliente: 1180,
    fechaEmisionCliente: '2026-11-01',
    ocLeidaAuto: true,
    urlArchivo: '/oc/min-100.pdf',
  }),
  ordenDeEjemplo({
    idOrdenCompra: 2,
    numeroOrdenCompra: 'OC-002',
    total: 1180,
    numeroOcCliente: 'MIN-200',
    montoOcCliente: 1500,
    fechaEmisionCliente: '2026-11-02',
    ocLeidaAuto: true,
    urlArchivo: '/oc/min-200.pdf',
  }),
  ordenDeEjemplo({
    idOrdenCompra: 3,
    numeroOrdenCompra: 'OC-003',
    total: 800,
  }),
]

function paginaDe(ordenes: OrdenCompra[], filtros: OrdenCompraFiltros): PageResponse<OrdenCompra> {
  const page = filtros.page ?? 0
  const size = filtros.size ?? 10
  const filtradas = ordenes.filter((o) => !filtros.estadoCodigo || o.estadoCodigo === filtros.estadoCodigo)
  return {
    content: filtradas.slice(page * size, page * size + size).map((o) => ({ ...o })),
    totalElements: filtradas.length,
    totalPages: Math.max(1, Math.ceil(filtradas.length / size)),
  }
}

function reemplazar(id: number, cambios: Partial<OrdenCompra>): OrdenCompra {
  const i = ordenesMock.findIndex((o) => o.idOrdenCompra === id)
  if (i < 0) throw new Error('No existe la orden')
  ordenesMock[i] = { ...ordenesMock[i], ...cambios }
  return { ...ordenesMock[i] }
}

export const ordenesCompraApi = {
  listar: async (filtros: OrdenCompraFiltros = {}): Promise<PageResponse<OrdenCompra>> => {
    if (usarMock) return paginaDe(ordenesMock, filtros)
    const { data } = await axiosClient.get<PageResponse<OrdenCompra>>('/ordenes-compra', { params: filtros })
    return data
  },
  obtener: (id: number) => {
    if (usarMock) {
      const orden = ordenesMock.find((o) => o.idOrdenCompra === id)
      if (!orden) return Promise.reject(new Error('No existe la orden'))
      return Promise.resolve({ ...orden })
    }
    return axiosClient.get<OrdenCompra>(`/ordenes-compra/${id}`).then((r) => r.data)
  },
  crear: (data: OrdenCompraInput) => axiosClient.post<OrdenCompra>('/ordenes-compra', data).then((r) => r.data),
  cambiarEstado: (id: number, estado: EstadoOrdenCompra) =>
    axiosClient.patch<OrdenCompra>(`/ordenes-compra/${id}/estado`, { codigoEstado: estado }).then((r) => r.data),
  subirArchivo: (id: number, archivo: File, onProgress?: (porcentaje: number) => void) => {
    if (usarMock) {
      onProgress?.(40)
      const actual = reemplazar(id, { urlArchivo: `mock://${archivo.name}` })
      onProgress?.(100)
      return Promise.resolve(actual)
    }
    const form = new FormData()
    form.append('archivo', archivo)
    return axiosClient.post<OrdenCompra>(`/ordenes-compra/${id}/archivo`, form, {
      onUploadProgress: (evento) => {
        if (!onProgress || !evento.total) return
        onProgress(Math.round((evento.loaded / evento.total) * 100))
      },
    }).then((r) => r.data)
  },
  confirmarOc: (id: number, body: ConfirmarOcCliente) => {
    if (usarMock) return Promise.resolve(reemplazar(id, { ...body, ocConfirmadaPor: 1 }))
    return axiosClient.patch<OrdenCompra>(`/ordenes-compra/${id}/confirmar-oc`, body).then((r) => r.data)
  },
}
