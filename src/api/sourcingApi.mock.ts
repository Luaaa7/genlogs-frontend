import type {
  BuscarReferenciasRequest,
  DatosUrl,
  GuardarUrlRequest,
  Referencia,
  ResultadoBusqueda,
} from "./sourcingApi"
import { calcularCostoPuestoLima } from "@/lib/costoPuestoLima"

/**
 * Datos simulados del contrato de /api/sourcing/** para trabajar sin backend.
 * Se activan con VITE_SOURCING_MOCK=true. Viven en memoria: se pierden al recargar.
 */
let siguienteId = 100
let referencias: Referencia[] = [
  {
    idSourcing: 1, idSolicitudItem: null, fuente: "EBAY", metodo: "NUMERO_PARTE",
    titulo: "Caterpillar 1R-0750 Fuel Filter - New OEM", marca: "Caterpillar", numeroParte: "1R-0750",
    precioRef: 18.5, codigoMoneda: "USD", costoPuestoLima: null,
    urlReferencia: "https://www.ebay.com/itm/ejemplo-1", urlImagenRef: null,
    estado: "CAPTURADO", editadoAMano: false, creadoEn: new Date().toISOString(),
  },
  {
    idSourcing: 2, idSolicitudItem: null, fuente: "MERCADO_LIBRE", metodo: "NUMERO_PARTE",
    titulo: "Filtro combustible CAT 1R0750 original", marca: "Caterpillar", numeroParte: "1R-0750",
    precioRef: 95, codigoMoneda: "PEN", costoPuestoLima: null,
    urlReferencia: "https://articulo.mercadolibre.com.pe/ejemplo-2", urlImagenRef: null,
    estado: "UTIL", editadoAMano: false, creadoEn: new Date().toISOString(),
  },
]

const esperar = <T,>(valor: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(valor)), 300))
const mismoNumero = (a: string | null, b: string) => (a ?? "").toLowerCase() === b.trim().toLowerCase()

export const sourcingMock = {
  buscar(body: BuscarReferenciasRequest): Promise<ResultadoBusqueda> {
    const encontradas = referencias.filter((r) => mismoNumero(r.numeroParte, body.numeroParte))
    const reutilizada = !body.forzar && encontradas.length > 0
    return esperar({
      reutilizada,
      fuentesConsultadas: reutilizada ? [] : ["EBAY", "MERCADO_LIBRE"],
      fuentesConError: [],
      sugerirUrl: encontradas.length === 0,
      referencias: encontradas.filter((r) => r.estado !== "DESCARTADO"),
    })
  },

  historial(filtro: { numeroParte?: string; idSolicitudItem?: number }): Promise<Referencia[]> {
    const lista = filtro.idSolicitudItem
      ? referencias.filter((r) => r.idSolicitudItem === filtro.idSolicitudItem)
      : referencias.filter((r) => mismoNumero(r.numeroParte, filtro.numeroParte ?? ""))
    return esperar(lista)
  },

  cambiarEstado(idSourcing: number, estado: "UTIL" | "DESCARTADO"): Promise<Referencia> {
    const ref = referencias.find((r) => r.idSourcing === idSourcing)
    if (!ref) return Promise.reject(new Error("No existe la referencia"))
    if (ref.estado === "CONVERTIDO") {
      return Promise.reject(new Error("La referencia ya se convirtió en producto y no puede cambiar de estado"))
    }
    ref.estado = estado
    return esperar(ref)
  },

  leerUrl(url: string): Promise<DatosUrl> {
    const amazon = /amazon\./i.test(url)
    return esperar({
      url,
      fuente: amazon ? "AMAZON" : /alibaba\./i.test(url) ? "ALIBABA" : "PROVEEDOR",
      titulo: amazon ? null : "Rodamiento SKF 6205-2RS",
      precio: amazon ? null : 12.4,
      codigoMoneda: amazon ? null : "USD",
      urlImagen: null,
      bloqueada: amazon,
      motivo: amazon ? "La tienda no permitió leer la página (HTTP 503). Completa los datos a mano." : null,
    })
  },

  tipoCambioDelDia() {
    return esperar({ fecha: new Date().toISOString().slice(0, 10), codigoMoneda: "USD", valor: 3.75, fuente: "SUNAT" as const, esDeHoy: true })
  },

  guardarUrl(body: GuardarUrlRequest): Promise<Referencia> {
    const nueva: Referencia = {
      idSourcing: siguienteId++,
      idSolicitudItem: body.idSolicitudItem ?? null,
      fuente: /amazon\./i.test(body.url) ? "AMAZON" : /alibaba\./i.test(body.url) ? "ALIBABA" : "PROVEEDOR",
      metodo: "URL",
      titulo: body.titulo,
      marca: body.marca ?? null,
      numeroParte: body.numeroParte ?? null,
      precioRef: body.precio,
      codigoMoneda: body.codigoMoneda,
      costoPuestoLima: calcularCostoPuestoLima(body),
      urlReferencia: body.url,
      urlImagenRef: body.urlImagen ?? null,
      estado: "CAPTURADO",
      editadoAMano: body.editadoAMano,
      creadoEn: new Date().toISOString(),
    }
    referencias = [nueva, ...referencias]
    return esperar(nueva)
  },
}
