import { useState } from "react"
import { Percent } from "lucide-react"
import { useHistorialIgv, useIgvVigente, useRegistrarTasaIgv } from "../hooks/useIgv"
import { PageHeader } from "@/components/ui/PageHeader"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass } from "@/components/ui/campoEstilos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Button } from "@/components/ui/button"
import { Tabla, TablaCard, Td, Th, filaClass } from "@/components/ui/tabla"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import { formatearFechaCorta } from "@/lib/formatters/fechaLocal"
import { aFechaISO } from "@/lib/formatters/rangoFechas"
import { avisar } from "@/lib/avisos"

const formatoPorcentaje = (p: number) => `${Number(p).toLocaleString("es-PE", { maximumFractionDigits: 2 })}%`

/**
 * Tasa del IGV (solo ADMINISTRADOR). Una tasa nueva rige desde la fecha que se
 * indique; las cotizaciones y facturas ya creadas conservan la tasa con que se
 * hicieron.
 */
export function ConfiguracionIgvPage() {
  const vigente = useIgvVigente()
  const historial = useHistorialIgv()
  const registrar = useRegistrarTasaIgv()

  const [porcentaje, setPorcentaje] = useState("")
  const [desde, setDesde] = useState(() => aFechaISO(new Date()))
  const [error, setError] = useState<string | null>(null)

  const hoy = aFechaISO(new Date())

  function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const valor = Number(porcentaje.replace(",", "."))
    if (!porcentaje.trim() || !Number.isFinite(valor) || valor < 0 || valor >= 100) {
      setError("Escribe un porcentaje entre 0 y 99.99 (por ejemplo 18).")
      return
    }
    if (!desde) {
      setError("Indica desde qué fecha rige la nueva tasa.")
      return
    }
    registrar.mutate(
      { porcentaje: valor, vigenteDesde: desde },
      {
        onSuccess: () => {
          avisar(`IGV de ${formatoPorcentaje(valor)} registrado desde el ${formatearFechaCorta(desde)}`)
          setPorcentaje("")
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(msg ?? "No se pudo registrar la tasa. Revisa que no exista otra con la misma fecha.")
        },
      }
    )
  }

  const ayudaPorcentaje = "Por ejemplo 18 o 18.5. Se usa en las cotizaciones y facturas que se creen desde esa fecha."
  const ayudaDesde = "Las cotizaciones y facturas anteriores conservan su tasa."

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="IGV" descripcion="Tasa del Impuesto General a las Ventas que usan las cotizaciones, facturas y PDF." />

      <section aria-labelledby="igv-vigente-t" className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Percent className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="igv-vigente-t" className="text-sm text-muted-foreground">Tasa que rige hoy</h2>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {vigente.isLoading ? "…" : formatoPorcentaje(vigente.porcentaje)}
          </p>
        </div>
      </section>

      <section aria-labelledby="igv-nueva-t" className="rounded-xl border border-border bg-card p-5">
        <h2 id="igv-nueva-t" className="mb-4 text-base font-semibold">Registrar una tasa nueva</h2>
        <form onSubmit={guardar} noValidate className="grid gap-4 sm:grid-cols-[160px_200px_auto] sm:items-start">
          <Campo id="igv-porcentaje" label="Porcentaje (%)" ayuda={ayudaPorcentaje} obligatorio>
            <input
              id="igv-porcentaje"
              inputMode="decimal"
              placeholder="18"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value.replace(/[^0-9.,]/g, ""))}
              aria-describedby={describedBy("igv-porcentaje", { ayuda: ayudaPorcentaje })}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="igv-desde" label="Rige desde" ayuda={ayudaDesde} obligatorio>
            <input
              id="igv-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              aria-describedby={describedBy("igv-desde", { ayuda: ayudaDesde })}
              className={inputFormClass}
            />
          </Campo>
          <Button type="submit" disabled={registrar.isPending} className="sm:mt-7">
            {registrar.isPending ? "Guardando…" : "Registrar tasa"}
          </Button>
        </form>
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}
      </section>

      <TablaCard>
        <Tabla titulo="Historial del IGV" minWidth={480}>
          <thead>
            <tr>
              <Th>Rige desde</Th>
              <Th alinear="derecha">Porcentaje</Th>
              <Th>Registrado por</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {historial.isLoading ? (
              <TableSkeletonRows columns={4} rows={3} />
            ) : historial.isError ? (
              <tr>
                <Td colSpan={4}>No se pudo cargar el historial.</Td>
              </tr>
            ) : (
              (historial.data ?? []).map((t) => {
                const futura = t.vigenteDesde > hoy
                const esVigente = !futura && Number(t.porcentaje) === Number(vigente.porcentaje) &&
                  (historial.data ?? []).filter((x) => x.vigenteDesde <= hoy)[0]?.idTasaIgv === t.idTasaIgv
                return (
                  <tr key={t.idTasaIgv} className={filaClass}>
                    <Td className="tabular-nums">{formatearFechaCorta(t.vigenteDesde)}</Td>
                    <Td alinear="derecha" className="tabular-nums font-medium">{formatoPorcentaje(t.porcentaje)}</Td>
                    <Td>{t.userCreate ?? "—"}</Td>
                    <Td>{futura ? "Programada" : esVigente ? "Vigente" : "Anterior"}</Td>
                  </tr>
                )
              })
            )}
          </tbody>
        </Tabla>
      </TablaCard>
    </div>
  )
}
