import { useState } from "react"
import { useDebounce } from "use-debounce"
import { CheckCircle2 } from "lucide-react"
import { useGenerarReporte } from "../hooks/useGenerarReporte"
import { useVistaPreviaReporte } from "../hooks/useVistaPreviaReporte"
import { ReporteFiltroForm } from "../components/ReporteFiltroForm"
import { ReporteVistaPrevia } from "../components/ReporteVistaPrevia"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { PageHeader } from "@/components/ui/PageHeader"
import type { ReporteRequest, TipoReporte } from "@/types/reporte.types"

const LABELS_TIPO: Record<TipoReporte, string> = {
  COTIZACIONES: "Cotizaciones",
  ORDENES_COMPRA: "Órdenes de compra",
  FACTURACION: "Facturación",
  SERVICIOS: "Servicios",
  PRODUCTOS: "Productos",
}

export function ReportesPage() {
  const generarReporte = useGenerarReporte()

  // Form values for preview (debounced)
  const [formValues, setFormValues] = useState<Partial<ReporteRequest>>({})
  const [debouncedValues] = useDebounce(formValues, 500)

  // Build request for preview when we have required fields
  const previewRequest: ReporteRequest | null =
    debouncedValues.tipoReporte &&
    debouncedValues.fechaInicio &&
    debouncedValues.fechaFin &&
    debouncedValues.formato
      ? (debouncedValues as ReporteRequest)
      : null

  const { data: previewData, isLoading: previewLoading, isError: previewError, refetch: refetchPreview } =
    useVistaPreviaReporte(previewRequest)

  function handleFormChange(values: Partial<ReporteRequest>) {
    setFormValues(values)
  }

  function handleSubmit(valores: ReporteRequest) {
    generarReporte.mutate(valores)
  }

  const periodoTexto = previewRequest
    ? `${previewRequest.fechaInicio} → ${previewRequest.fechaFin}`
    : "Seleccione un periodo"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Reportes"
        descripcion="Elige el tipo de reporte, el periodo y el formato; se descarga al generarse."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario - 5/12 en lg, full en mobile */}
        <section
          aria-labelledby="generar-t"
          className="lg:col-span-5 rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 id="generar-t" className="mb-4 text-base font-semibold text-foreground">
            Generar reporte
          </h2>
          <ReporteFiltroForm
            onSubmit={handleSubmit}
            onChange={handleFormChange}
            enviando={generarReporte.isPending}
          />

          {generarReporte.isError && (
            <div className="mt-4">
              <ErrorBanner
                message="No se pudo generar el reporte. Revisa el periodo e inténtalo de nuevo."
              />
            </div>
          )}

          {generarReporte.isSuccess && (
            <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Reporte generado y descargado.
            </p>
          )}
        </section>

        {/* Vista previa - 7/12 en lg, full en mobile */}
        <section
          aria-labelledby="preview-t"
          className="lg:col-span-7 rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 id="preview-t" className="mb-4 text-base font-semibold text-foreground">
            Vista previa
          </h2>
          <ReporteVistaPrevia
            titulo={previewRequest ? LABELS_TIPO[previewRequest.tipoReporte] : "—"}
            periodo={periodoTexto}
            data={previewData}
            isLoading={previewLoading}
            isError={previewError}
            onRetry={refetchPreview}
            hiddenColumns={["id", "Id", "ID", "uuid", "createdAt", "updatedAt"]}
          />
        </section>
      </div>
    </div>
  )
}
