import { useQuery } from "@tanstack/react-query"
import { AlertCircle, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { obtenerPreviewReporte } from "@/api/reportesApi"
import type { ReporteRequest } from "@/types/reporte.types"

interface ReportePreviewPanelProps {
  request: Partial<ReporteRequest> | null
}

export function ReportePreviewPanel({ request }: ReportePreviewPanelProps) {
  const enabled = !!(
    request?.tipoReporte &&
    request?.fechaInicio &&
    request?.fechaFin
  )

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["reporte-preview", request],
    queryFn: () => obtenerPreviewReporte(request as ReporteRequest),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })

  const columns = data?.data && data.data.length > 0 ? Object.keys(data.data[0]) : []

  return (
    <section aria-labelledby="preview-title" className="rounded-xl border border-border bg-card p-5 flex-1 min-w-0">
      <h2 id="preview-title" className="mb-4 text-base font-semibold text-foreground">
        Vista previa
      </h2>

      {!enabled && (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-sm">Seleccione tipo de reporte y periodo para ver la vista previa.</p>
        </div>
      )}

      {enabled && isLoading && (
        <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Cargando vista previa…</span>
        </div>
      )}

      {enabled && isError && (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-destructive">
          <XCircle className="h-6 w-6" aria-hidden="true" />
          <p className="text-sm text-center">No se pudo cargar la vista previa.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {enabled && !isLoading && !isError && data && data.data.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <AlertCircle className="h-6 w-6 mb-2" aria-hidden="true" />
          <p className="text-sm text-center">No hay datos para el periodo seleccionado.</p>
        </div>
      )}

      {enabled && !isLoading && !isError && data && data.data.length > 0 && (
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full text-sm" role="grid">
            <thead className="sticky top-0 bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/30">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 border-b border-border/50">
                      {String(row[col] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {data.data.length} de {data.total ?? data.data.length} registros.
          </p>
        </div>
      )}
    </section>
  )
}