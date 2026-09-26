import { useForm } from "react-hook-form"
import type { ReporteRequest, TipoReporte, FormatoReporte } from "@/types/reporte.types"

interface ReporteFiltroFormProps {
  onSubmit: (valores: ReporteRequest) => void
  enviando?: boolean
}

const OPCIONES_TIPO: { value: TipoReporte; label: string }[] = [
  { value: "COTIZACIONES", label: "Cotizaciones" },
  { value: "ORDENES_COMPRA", label: "Órdenes de Compra" },
  { value: "FACTURACION", label: "Facturación" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "PRODUCTOS", label: "Productos" },
]

const OPCIONES_FORMATO: { value: FormatoReporte; label: string }[] = [
  { value: "EXCEL", label: "Excel (.xlsx)" },
  { value: "PDF", label: "PDF" },
]

export function ReporteFiltroForm({ onSubmit, enviando }: ReporteFiltroFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ReporteRequest>({
    defaultValues: {
      tipoReporte: "SERVICIOS",
      formato: "EXCEL",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium">Tipo de reporte</label>
        <select
          {...register("tipoReporte", { required: true })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {OPCIONES_TIPO.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Fecha inicio</label>
          <input
            type="date"
            {...register("fechaInicio", { required: "La fecha de inicio es obligatoria" })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          {errors.fechaInicio && <p className="text-sm text-destructive">{errors.fechaInicio.message}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Fecha fin</label>
          <input
            type="date"
            {...register("fechaFin", { required: "La fecha fin es obligatoria" })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          {errors.fechaFin && <p className="text-sm text-destructive">{errors.fechaFin.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Formato</label>
        <select
          {...register("formato", { required: true })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {OPCIONES_FORMATO.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {enviando ? "Generando..." : "Generar reporte"}
      </button>
    </form>
  )
}