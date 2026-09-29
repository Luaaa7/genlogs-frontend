// src/features/proformas/components/ProformaForm.tsx
import { useId, useState } from "react"
import type { ReactNode } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploader } from "@/components/ui/FileUploader"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mapearCondicionPago } from "@/lib/formatters/codigoCotizacion"
import { formatCurrency } from "@/lib/formatters/currency"
import { hoyISO } from "@/lib/formatters/fechaLocal"
import { cn } from "@/lib/utils"
import { MAX_ADJUNTOS, proformaSchema, toProformaRequest } from "@/lib/validators/proforma.schema"
import type { ProformaFormValues } from "@/lib/validators/proforma.schema"
import type { ProformaRequest } from "@/types/proforma.types"
import { useCotizacionesAprobadas } from "../hooks/useProformas"

interface ProformaFormProps {
  defaultValues?: Partial<ProformaFormValues>
  onSubmit: (request: ProformaRequest) => void
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  /** Mensaje de error del intento de guardado anterior. */
  errorMessage?: string | null
}

function Campo({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function ProformaForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Crear proforma",
  errorMessage,
}: ProformaFormProps) {
  const uid = useId()
  const idDe = (campo: string) => `${uid}-${campo}`

  const { data: cotizaciones, isLoading, isError, refetch } = useCotizacionesAprobadas()
  const [subiendo, setSubiendo] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ProformaFormValues>({
    resolver: zodResolver(proformaSchema),
    defaultValues: { fechaVencimiento: "", observaciones: "", adjuntos: [], ...defaultValues },
  })

  const cotizacionId = useWatch({ control, name: "cotizacionId" })
  const seleccionada = cotizaciones?.find((c) => c.id === cotizacionId)
  const sinAprobadas = !isLoading && !isError && (cotizaciones?.length ?? 0) === 0

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toProformaRequest(values)))}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* Cotización vinculada */}
      <section aria-labelledby={idDe("cotizacion-titulo")} className="flex flex-col gap-3">
        <h2 id={idDe("cotizacion-titulo")} className="text-base font-semibold">
          Cotización vinculada
        </h2>

        {isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-destructive">No se pudieron cargar las cotizaciones aprobadas.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : sinAprobadas ? (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No hay cotizaciones aprobadas. Una proforma solo puede crearse a partir de una cotización en
            estado Aprobada.{" "}
            <Link to="/cotizaciones" className="text-primary underline underline-offset-4">
              Ir a cotizaciones
            </Link>
          </p>
        ) : (
          <Campo id={idDe("cotizacion")} label="Cotización aprobada" error={errors.cotizacionId?.message}>
            <Controller
              control={control}
              name="cotizacionId"
              render={({ field }) => (
                <select
                  id={idDe("cotizacion")}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  onBlur={field.onBlur}
                  disabled={isLoading || submitting}
                  aria-invalid={!!errors.cotizacionId}
                  aria-describedby={errors.cotizacionId ? `${idDe("cotizacion")}-error` : undefined}
                  className={cn(
                    "h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    errors.cotizacionId ? "border-destructive" : "border-input"
                  )}
                >
                  <option value="" disabled>
                    {isLoading ? "Cargando cotizaciones…" : "Selecciona una cotización aprobada"}
                  </option>
                  {cotizaciones?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} — {c.clienteNombre ?? `Cliente ${c.clienteId}`} — {formatCurrency(c.total, c.moneda)}
                    </option>
                  ))}
                </select>
              )}
            />
          </Campo>
        )}

        {seleccionada && (
          <dl className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Cliente</dt>
              <dd className="font-medium">{seleccionada.clienteNombre ?? `Cliente ${seleccionada.clienteId}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Condición de pago</dt>
              <dd className="font-medium">{mapearCondicionPago(seleccionada.condicionPago)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Subtotal / IGV</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(seleccionada.subtotal, seleccionada.moneda)} /{" "}
                {formatCurrency(seleccionada.igv, seleccionada.moneda)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Total</dt>
              <dd className="font-semibold tabular-nums">{formatCurrency(seleccionada.total, seleccionada.moneda)}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* Datos de la proforma */}
      <section aria-labelledby={idDe("datos-titulo")} className="flex flex-col gap-4">
        <h2 id={idDe("datos-titulo")} className="text-base font-semibold">
          Datos de la proforma
        </h2>

        <div className="max-w-xs">
          <Campo id={idDe("vencimiento")} label="Fecha de vencimiento (opcional)" error={errors.fechaVencimiento?.message}>
            <Input
              id={idDe("vencimiento")}
              type="date"
              min={hoyISO()}
              aria-invalid={!!errors.fechaVencimiento}
              aria-describedby={errors.fechaVencimiento ? `${idDe("vencimiento")}-error` : undefined}
              className={cn(errors.fechaVencimiento && "border-destructive")}
              {...register("fechaVencimiento")}
            />
          </Campo>
        </div>

        <Campo id={idDe("observaciones")} label="Observaciones (opcional)" error={errors.observaciones?.message}>
          <textarea
            id={idDe("observaciones")}
            rows={4}
            maxLength={500}
            aria-invalid={!!errors.observaciones}
            aria-describedby={errors.observaciones ? `${idDe("observaciones")}-error` : undefined}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register("observaciones")}
          />
        </Campo>
      </section>

      {/* Adjuntos */}
      <section aria-labelledby={idDe("adjuntos-titulo")} className="flex flex-col gap-3">
        <h2 id={idDe("adjuntos-titulo")} className="text-base font-semibold">
          Adjuntos
        </h2>

        <FileUploader
          tipo="documento"
          multiple
          maxArchivos={MAX_ADJUNTOS}
          label="Documentos de respaldo (opcional)"
          disabled={submitting}
          onUploaded={(resultado) =>
            setValue(
              "adjuntos",
              [
                ...getValues("adjuntos"),
                {
                  nombreArchivo: resultado.nombreArchivo,
                  url: resultado.url,
                  tipoArchivo: resultado.tipoArchivo,
                  tamanioBytes: resultado.tamanioBytes,
                },
              ],
              { shouldDirty: true, shouldValidate: true }
            )
          }
          onRemoved={(resultado) =>
            setValue(
              "adjuntos",
              getValues("adjuntos").filter((a) => a.url !== resultado.url),
              { shouldDirty: true, shouldValidate: true }
            )
          }
          onUploadingChange={setSubiendo}
        />

        {errors.adjuntos?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.adjuntos.message}
          </p>
        )}
      </section>

      {errorMessage && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting || subiendo || sinAprobadas}>
          {(submitting || subiendo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? "Guardando…" : subiendo ? "Subiendo archivos…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}