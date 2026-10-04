import { useQuery } from "@tanstack/react-query"
import { cotizacionesApi } from "@/api/cotizacionesApi"
import { facturacionApi } from "@/api/facturacionApi"

/** Cuántos registros recientes se traen para los bloques operativos
 *  (pendientes, series por mes, mejores clientes). El backend aún no expone
 *  estos agregados: se calculan en el navegador sobre lo más reciente. */
const LIMITE = 200

/** Listas recientes de cotizaciones y facturas para el dashboard. Si una falla,
 *  el resto del dashboard sigue funcionando: sus bloques muestran vacío. */
export function useDashboardOperativo() {
  const cotizaciones = useQuery({
    queryKey: ["dashboard-cotizaciones-recientes"],
    queryFn: () => cotizacionesApi.listarCotizaciones({ page: 0, size: LIMITE, sortBy: "fechaCreacion", sortDir: "DESC" }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const facturas = useQuery({
    queryKey: ["dashboard-facturas-recientes"],
    queryFn: () => facturacionApi.listar({ page: 0, size: LIMITE }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  return {
    cotizaciones: cotizaciones.data?.content ?? [],
    facturas: facturas.data?.content ?? [],
    isLoading: cotizaciones.isLoading || facturas.isLoading,
    refetch: () => {
      cotizaciones.refetch()
      facturas.refetch()
    },
  }
}
