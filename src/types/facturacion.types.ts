export const TipoComprobante = { FACTURA: 'FACTURA', BOLETA: 'BOLETA', NOTA_CREDITO: 'NOTA_CREDITO', NOTA_DEBITO: 'NOTA_DEBITO' } as const
export type TipoComprobante = (typeof TipoComprobante)[keyof typeof TipoComprobante]
export const EstadoFacturacion = { EMITIDA: 'EMITIDA', PARCIAL: 'PARCIAL', PAGADA: 'PAGADA', VENCIDA: 'VENCIDA', ANULADA: 'ANULADA' } as const
export type EstadoFacturacion = (typeof EstadoFacturacion)[keyof typeof EstadoFacturacion]
export interface TipoComprobanteCatalogo { idTipoComprobante: number; codigoTipo: TipoComprobante; nombreTipo: string; seriePrefijo: string; requiereRuc: boolean }
export interface EstadoFacturacionCatalogo { idEstadoFacturacion: number; codigoEstado: EstadoFacturacion; nombreEstado: string; esFinal: boolean }
export interface DetalleFacturacion { idDetalleFacturacion: number; idFacturacion: number; idProducto?: number | null; idServicio?: number | null; descripcionPersonalizada?: string | null; cantidad: number; precioUnitario: number; descuentoUnitario: number; importeLinea: number }
export interface Factura {
  idFacturacion: number
  id?: number
  idOrdenCompra: number
  idTipoComprobante: number
  idEstadoFacturacion: number
  idCondicionPago: number
  idMoneda: number
  serieComprobante: string
  serie?: string
  numeroComprobante: string
  numero?: string
  codigoComprobante: string
  fechaEmision: string
  fechaVencimiento: string
  montoPagado: number
  observaciones?: string | null
  /** Documento emitido por SUNAT que se subió (null si aún no se adjunta). */
  urlArchivo?: string | null
  /** SIMULADO (prueba, sin valor tributario), PROVEEDOR (real) o null si se registró desde el portal de SUNAT. */
  sunatModo?: 'SIMULADO' | 'PROVEEDOR' | string | null
  sunatEstado?: string | null
  sunatMensaje?: string | null
  /** Correo del cliente para "Enviar al cliente". */
  clienteEmail?: string | null
  tipoComprobante?: TipoComprobante
  estadoCodigo?: EstadoFacturacion
  numeroOrdenCompra?: string
  cliente?: string
  clienteNombre?: string
  clienteId?: number
  tipo?: TipoComprobante
  moneda?: string
  estado?: EstadoFacturacion
  subtotal?: number
  igv?: number
  total: number
  /** % de IGV de la factura (18). */
  porcentajeIgv?: number
  saldoPendiente?: number
  detalles?: DetalleFacturacion[]
}
/** Línea de la factura: exactamente uno de idProducto / idServicio. */
export interface LineaFacturaInput { idProducto?: number; idServicio?: number; descripcionPersonalizada?: string; cantidad: number; precioUnitario: number; descuentoUnitario?: number }
export interface FacturaInput { idOrdenCompra: number; idTipoComprobante: number; idEstadoFacturacion?: number; idCondicionPago: number; idMoneda: number; serieComprobante: string; numeroComprobante: string; fechaEmision?: string; fechaVencimiento?: string; montoPagado?: number; observaciones?: string; lineas: LineaFacturaInput[] }
export interface FacturacionFiltros { estadoCodigo?: EstadoFacturacion; tipoCodigo?: TipoComprobante; idOrdenCompra?: number; page?: number; size?: number }
/** Cuerpo de PATCH /facturacion/{id}/pago. fechaPago en formato aaaa-mm-dd. */
export interface RegistrarPagoInput { montoPagado: number; fechaPago: string; medioPago: string; numeroOperacion?: string }
/** POST /facturacion/emitir: como FacturaInput pero sin serie ni número (los pone el sistema). */
export type EmitirFacturaInput = Omit<FacturaInput, 'serieComprobante' | 'numeroComprobante' | 'idEstadoFacturacion' | 'montoPagado' | 'observaciones'>
/** GET /facturacion/sunat */
export interface SunatConfig { modo: 'SIMULADO' | 'PROVEEDOR' | string; simulado: boolean; serieFactura: string; serieBoleta: string }
/** POST /facturacion/{id}/enviar (mismo cuerpo que el envío de cotizaciones). */
export interface EnviarComprobanteInput { correoDestinatario: string; asunto: string; mensaje: string; incluirDetalles: boolean }