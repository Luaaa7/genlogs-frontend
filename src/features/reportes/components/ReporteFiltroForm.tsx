import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Download, Loader2 } from "lucide-react"
import { reporteFiltroSchema } from "@/lib/validators/reporteFiltro.schema"
import { anioActual, mesActual, trimestreActual, ultimosDias, type RangoFechas } from "@/lib/formatters/rangoFechas"
import type { ReporteRequest, TipoReporte, FormatoReporte } from "@/types/reporte.types"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass } from "@/components/ui/campoEstilos"
import { Button } from "@/components/ui/button"

interface ReporteFiltroFormProps {
  onSubmit: (valores: ReporteRequest) => void
  enviando?: boolean
}

const OPCIONES_TIPO: { value: TipoReporte; label: string }[] = [
  { value: "COTIZACIONES", label: "Cotizaciones" },
  { value: "ORDENES_COMPRA", label: "Órdenes de compra" },
  { value: "FACTURACION", label: "Facturación" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "PRODUCTOS", label: "Productos" },
]

const OPCIONES_FORMATO: { value: FormatoReporte; label: string }[] = [
  { value: "EXCEL", label: "Excel (.xlsx)" },
  { value: "PDF", label: "PDF" },
]

const RANGOS_RAPIDOS: { label: string; calcular: () => RangoFechas }[] = [
  { label: "Últimos 30 días", calcular: () => ultimosDias(30) },
  { label: "Mes actual", calcular: () => mesActual() },
  { label: "Trimestre actual", calcular: () => trimestreActual() },
  { label: "Año actual", calcular: () => anioActual() },
]

export function ReporteFiltroForm({ onSubmit, enviando }: ReporteFiltroFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ReporteRequest>({
    resolver: zodResolver(reporteFiltroSchema),
    defaultValues: {
      tipoReporte: "SERVICIOS",
      formato: "EXCEL",
      fechaInicio: "",
      fechaFin: "",
    },
  })

  function aplicarRango(rango: RangoFechas) {
    setValue("fechaInicio", rango.fechaInicio, { shouldValidate: true })
    setValue("fechaFin", rango.fechaFin, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="rep-tipo" label="Tipo de reporte" error={errors.tipoReporte?.message}>
          <select id="rep-tipo" {...register("tipoReporte")} aria-invalid={!!errors.tipoReporte} className={inputFormClass}>
            {OPCIONES_TIPO.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>
        </Campo>
        <Campo id="rep-formato" label="Formato" error={errors.formato?.message}>
          <select id="rep-formato" {...register("formato")} aria-invalid={!!errors.formato} className={inputFormClass}>
            {OPCIONES_FORMATO.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>
        </Campo>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1.5 text-sm font-medium text-foreground">Periodo</legend>
        <div role="group" aria-label="Periodos rápidos" className="flex flex-wrap gap-2">
          {RANGOS_RAPIDOS.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => aplicarRango(r.calcular())}
              className="h-8 rounded-full border border-border bg-card px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="rep-inicio" label="Desde" error={errors.fechaInicio?.message}>
            <input
              id="rep-inicio"
              type="date"
              {...register("fechaInicio")}
              aria-invalid={!!errors.fechaInicio}
              aria-describedby={describedBy("rep-inicio", { error: errors.fechaInicio })}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="rep-fin" label="Hasta" error={errors.fechaFin?.message}>
            <input
              id="rep-fin"
              type="date"
              {...register("fechaFin")}
              aria-invalid={!!errors.fechaFin}
              aria-describedby={describedBy("rep-fin", { error: errors.fechaFin })}
              className={inputFormClass}
            />
          </Campo>
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={enviando}>
          {enviando
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
          {enviando ? "Generando…" : "Generar y descargar"}
        </Button>
      </div>
    </form>
  )
}
