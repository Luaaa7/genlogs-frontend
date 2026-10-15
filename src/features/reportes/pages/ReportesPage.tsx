import { useGenerarReporte } from "../hooks/useGenerarReporte"
import { ReporteFiltroForm } from "../components/ReporteFiltroForm"
import type { ReporteRequest } from "@/types/reporte.types"

export function ReportesPage() {
  const generarReporte = useGenerarReporte()

  function handleSubmit(valores: ReporteRequest) {
    generarReporte.mutate(valores)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <div className="max-w-md rounded-lg border border-border p-6">
        <h2 className="mb-4 text-lg font-semibold">Generar reporte</h2>
        <ReporteFiltroForm onSubmit={handleSubmit} enviando={generarReporte.isPending} />

        {generarReporte.isError && (
          <p className="mt-4 text-sm text-destructive">
            Ocurrió un error al generar el reporte. Intenta de nuevo.
          </p>
        )}

        {generarReporte.isSuccess && (
          <p className="mt-4 text-sm text-primary">
            Reporte generado y descargado correctamente.
          </p>
        )}
      </div>
    </div>
  )
}