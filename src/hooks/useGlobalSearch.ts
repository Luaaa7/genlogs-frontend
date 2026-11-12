import { useQuery } from "@tanstack/react-query"
import { clientesApi } from "@/api/clientesApi"
import { cotizacionesApi } from "@/api/cotizacionesApi"
import * as productosApi from "@/api/productosApi"
import { codigoTipoDocumento } from "@/types/tercero.types"

export interface ResultadoBusqueda {
  id: number
  titulo: string
  subtitulo?: string
}

export interface ResultadoBusquedaGlobal {
  clientes: ResultadoBusqueda[]
  cotizaciones: ResultadoBusqueda[]
  productos: ResultadoBusqueda[]
}

const resultadoVacio: ResultadoBusquedaGlobal = { clientes: [], cotizaciones: [], productos: [] }

/** Máximo de cotizaciones que se traen para filtrar aquí (el backend admite hasta ese tamaño). */
const MAX_COTIZACIONES = 200

/** Busca en paralelo sobre los tres catálogos que la búsqueda global (Ctrl+K)
 *  soporta. Clientes filtran por razón social/documento en el backend y los
 *  productos por nombre y por código. Las cotizaciones no tienen un parámetro
 *  de búsqueda de texto en la API, así que se traen todas (hasta 200) y se
 *  filtra por código o cliente aquí: antes solo se miraban las 30 más recientes
 *  y las cotizaciones antiguas no aparecían nunca. */
export function useGlobalSearch(termino: string) {
  const query = termino.trim()

  return useQuery({
    queryKey: ["busqueda-global", query],
    queryFn: async (): Promise<ResultadoBusquedaGlobal> => {
      const [clientes, cotizacionesResp, productosPorNombre, productosPorCodigo] = await Promise.all([
        clientesApi.listar({ razonSocial: query, size: 5 }),
        cotizacionesApi.listarCotizaciones({ size: MAX_COTIZACIONES, sortBy: "fechaCotizacion", sortDir: "DESC" }),
        productosApi.listarProductos({ nombre: query, size: 5 }),
        productosApi.listarProductos({ codigo: query, size: 5 }).catch(() => ({ content: [] as never[] })),
      ])
      // Productos: primero los que coinciden por nombre, luego los de código, sin repetir.
      const productosUnidos = [...(productosPorNombre.content ?? []), ...(productosPorCodigo.content ?? [])]
      const productos = productosUnidos.filter((p, i) => productosUnidos.findIndex((q) => q.idProducto === p.idProducto) === i)

      const queryLower = query.toLowerCase()
      const cotizacionesFiltradas = (cotizacionesResp.content ?? [])
        .filter((c) => {
          const codigo = (c.codigoCotizacion ?? c.codigo ?? "").toLowerCase()
          const cliente = (c.cliente ?? c.clienteNombre ?? "").toLowerCase()
          return codigo.includes(queryLower) || cliente.includes(queryLower)
        })
        .slice(0, 5)

      return {
        clientes: clientes.slice(0, 5).map((c) => ({
          id: c.idCliente ?? c.id,
          titulo: c.tercero.razonSocial,
          subtitulo: `${codigoTipoDocumento(c.tercero.tipoDocumento)} ${c.tercero.numeroDocumento}`,
        })),
        cotizaciones: cotizacionesFiltradas.map((c) => ({
          id: (c.idCotizacion ?? c.id)!,
          titulo: c.codigoCotizacion ?? c.codigo ?? `Cotización #${c.idCotizacion ?? c.id}`,
          subtitulo: c.cliente ?? c.clienteNombre,
        })),
        productos: productos.slice(0, 5).map((p) => ({
          id: p.idProducto,
          titulo: p.nombreProducto,
          subtitulo: p.codigoProducto,
        })),
      }
    },
    enabled: query.length >= 2,
    placeholderData: resultadoVacio,
    staleTime: 15_000,
  })
}
