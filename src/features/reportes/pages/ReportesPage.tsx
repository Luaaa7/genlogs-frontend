import { CheckCircle2 } from "lucide-react"
import { useGenerarReporte } from "../hooks/useGenerarReporte"
import { ReporteFiltroForm } from "../components/ReporteFiltroForm"
import { ReportePreviewPanel } from "../components/ReportePreviewPanel"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { PageHeader } from "@/components/ui/PageHeader"
import type { ReporteRequest } from "@/types/reporte.types"
import { useState } from "react"

export function ReportesPage() {
  const generarReporte = useGenerarReporte()
  const [filtrosPreview, setFiltrosPreview] = useState<Partial<ReporteRequest>>({})

  function handleSubmit(valores: ReporteRequest) {
    generarReporte.mutate(valores)
  }

  function handlePreviewChange(valores: Partial<ReporteRequest>) {
    setFiltrosPreview(valores)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Reportes"
        descripcion="Elige el tipo de reporte, el periodo y el formato; se descarga al generarse."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="generar-t" className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 id="generar-t" className="mb-4 text-base font-semibold text-foreground">
            Generar reporte
          </h2>
          <ReporteFiltroForm
            onSubmit={handleSubmit}
            enviando={generarReporte.isPending}
            onChange={handlePreviewChange}
          />

          {generarReporte.isError && (
            <div className="mt-4">
              <ErrorBanner message="No se pudo generar el reporte. Revisa el periodo e inténtalo de nuevo." />
            </div>
          )}

          {generarReporte.isSuccess && (
            <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Reporte generado y descargado.
            </p>
          )}
        </section>

        <ReportePreviewPanel request={filtrosPreview} />
      </div>
    </div>
  )
}
