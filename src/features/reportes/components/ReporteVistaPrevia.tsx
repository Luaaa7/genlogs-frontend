import { AlertCircle, Info, RefreshCw } from "lucide-react"
import { Tabla, TablaCard, Td, Th, filaClass } from "@/components/ui/tabla"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import { Button } from "@/components/ui/button"
import type { ReporteVistaPreviaResponse } from "@/api/reportesApi"

interface ReporteVistaPreviaProps<T = Record<string, unknown>> {
  titulo: string
  periodo: string
  data?: ReporteVistaPreviaResponse<T>
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  hiddenColumns?: string[]
}

export function ReporteVistaPrevia<T extends Record<string, unknown> = Record<string, unknown>>({
  titulo,
  periodo,
  data,
  isLoading,
  isError,
  onRetry,
  hiddenColumns = [],
}: ReporteVistaPreviaProps<T>) {
  const columnasVisibles = data?.columnas.filter((c) => !hiddenColumns.includes(c)) ?? []

  if (isLoading) {
    return (
      <TablaCard>
        <div className="p-6">
          <Tabla titulo={titulo} minWidth={600}>
            <thead>
              <tr>
                {Array.from({ length: Math.max(columnasVisibles.length, 4) }).map((_, i) => (
                  <Th key={i} className="cursor-default">
                    <span className="sr-only">Columna {i + 1}</span>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableSkeletonRows rows={5} columns={Math.max(columnasVisibles.length, 4)} />
            </tbody>
          </Tabla>
        </div>
      </TablaCard>
    )
  }

  if (isError) {
    return (
      <TablaCard>
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          <p className="text-destructive font-medium">No se pudo cargar la vista previa</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Verifica los filtros e inténtalo de nuevo.
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
          )}
        </div>
      </TablaCard>
    )
  }

  const filas = data?.filas ?? []
  const total = data?.total ?? 0

  if (filas.length === 0) {
    return (
      <TablaCard>
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Info className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-muted-foreground font-medium">Sin resultados</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            No hay datos para el periodo y filtros seleccionados.
          </p>
        </div>
      </TablaCard>
    )
  }

  return (
    <TablaCard>
      <div className="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-medium text-foreground">{titulo}</div>
        <div className="text-muted-foreground">{periodo}</div>
        <div className="text-muted-foreground tabular-nums">
          Mostrando <strong>{filas.length}</strong> de <strong>{total}</strong> registros
        </div>
      </div>
      <Tabla titulo={titulo} minWidth={600}>
        <thead>
          <tr>
            {columnasVisibles.map((col) => (
              <Th key={col} className="cursor-default">
                {col}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className={filaClass}>
              {columnasVisibles.map((col) => (
                <Td key={col} alinear={typeof fila[col] === "number" ? "derecha" : undefined}>
                  {(fila[col] as string | number | null | undefined) ?? "—"}
                </Td>
              ))}
            </tr>
          ))}
        </tbody>
      </Tabla>
    </TablaCard>
  )
}