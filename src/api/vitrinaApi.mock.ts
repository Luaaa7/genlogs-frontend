import type { EstadoPublicacion } from "./contratos/enumeraciones"
import type { ConvertirProductoRequest, ImagenProductoRequest, ProductoVitrina } from "./vitrinaApi"

/** Datos simulados de /api/vitrina/productos (VITE_VITRINA_MOCK=true). En memoria. */
let productos: ProductoVitrina[] = [
  {
    idProducto: 1, codigo: "GLB-000101", nombre: "Filtro de combustible CAT 1R-0750", descripcion: null,
    idCategoria: 3, categoria: "Filtros", idUnidadMedida: 1, unidad: "Unidad", marca: "Caterpillar", numeroParte: "1R-0750",
    tipoRepuesto: "OEM", origen: "IMPORTADO", estado: "BORRADOR", costoPuestoLima: 455, margen: 60, precioReferencial: 728,
    evaluacionMargen: "FUERA_DE_RANGO", requiereJefe: true, tieneImagenVerificada: false, fechaUltimaVerificacion: null, imagenes: [],
  },
]
let siguiente = 2

const copia = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250))
const buscar = (id: number) => {
  const p = productos.find((x) => x.idProducto === id)
  if (!p) throw new Error("No existe el producto")
  return p
}

export const vitrinaMock = {
  listar: (estado?: EstadoPublicacion) => copia(estado ? productos.filter((p) => p.estado === estado) : productos),
  detalle: (id: number) => copia(buscar(id)),
  convertir(b: ConvertirProductoRequest) {
    const costo = b.costoPuestoLima ?? 100
    const margen = b.margen ?? 25
    const fuera = margen < 15 || margen > 45
    const p: ProductoVitrina = {
      idProducto: siguiente, codigo: `GLB-0001${siguiente++}`, nombre: b.nombre, descripcion: b.descripcion ?? null,
      idCategoria: b.idCategoriaProducto, categoria: "Categoría", idUnidadMedida: b.idUnidadMedida, unidad: "Unidad",
      marca: null, numeroParte: b.numeroParte ?? null, tipoRepuesto: b.tipoRepuesto, origen: b.origen ?? "NACIONAL",
      estado: "BORRADOR", costoPuestoLima: costo, margen, precioReferencial: Math.round(costo * (1 + margen / 100) * 100) / 100,
      evaluacionMargen: fuera ? "FUERA_DE_RANGO" : margen > 35 ? "CON_AVISO" : "NORMAL", requiereJefe: fuera,
      tieneImagenVerificada: false, fechaUltimaVerificacion: new Date().toISOString(), imagenes: [],
    }
    productos = [p, ...productos]
    return copia(p)
  },
  agregarImagen(id: number, b: ImagenProductoRequest) {
    const p = buscar(id)
    const principal = b.principal || p.imagenes.length === 0
    if (principal) p.imagenes.forEach((i) => (i.principal = false))
    p.imagenes.push({ idImagen: Date.now(), url: b.urlImagen, fuente: b.fuente, principal, verificada: true })
    p.tieneImagenVerificada = true
    return copia(p)
  },
  accion(id: number, accion: "publicar" | "ocultar" | "retirar" | "verificar") {
    const p = buscar(id)
    if (accion === "publicar") {
      if (!p.tieneImagenVerificada) return Promise.reject(new Error("Sube una foto propia verificada antes de publicar"))
      p.estado = "PUBLICADO"
    }
    if (accion === "ocultar") p.estado = "OCULTO"
    if (accion === "retirar") p.estado = "RETIRADO"
    if (accion === "verificar" || accion === "publicar") p.fechaUltimaVerificacion = new Date().toISOString()
    return copia(p)
  },
}
