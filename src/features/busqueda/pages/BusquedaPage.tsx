import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Info, Link2, Loader2, RefreshCw, Search, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass } from "@/components/ui/campoEstilos"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { PageHeader } from "@/components/ui/PageHeader"
import { TablaCard } from "@/components/ui/tabla"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import { avisar } from "@/lib/avisos"
import { mensajeError } from "@/lib/errores"
import type { Referencia, ResultadoBusqueda } from "@/api/sourcingApi"
import {
  useBuscarReferencias,
  useCambiarEstadoReferencia,
  useHistorialReferencias,
  usePuedeBuscar,
} from "../hooks/useBusqueda"
import { TablaReferencias } from "../components/TablaReferencias"
import { PegarUrlModal } from "../components/PegarUrlModal"
import { ConvertirModal } from "@/features/vitrina/components/ConvertirModal"
import { vitrinaHabilitada } from "@/lib/interruptores"
import { usePermisos } from "@/lib/permisos"

const esquema = z.object({
  numeroParte: z.string().trim().min(1, "Escribe el N.º de parte").max(60, "Máximo 60 caracteres"),
  marca: z.string().trim().max(100, "Máximo 100 caracteres"),
  gtin: z.string().trim().regex(/^$|^[0-9]{8,14}$/, "El GTIN tiene de 8 a 14 dígitos"),
  palabras: z.string().trim(),
})
type Valores = z.infer<typeof esquema>

const vacioAUndefined = (s: string) => (s.trim() ? s.trim() : undefined)

/**
 * Subproceso 8.2 · Panel de búsqueda (BPMN 9). El asistente busca por marca y
 * N.º de parte, revisa las referencias y marca cada una como ÚTIL o DESCARTADA.
 * Se puede abrir con ?numeroParte=…&idSolicitudItem=… desde una solicitud.
 */
export function BusquedaPage() {
  const [params] = useSearchParams()
  const idSolicitudItem = Number(params.get("idSolicitudItem")) || undefined
  const puedeBuscar = usePuedeBuscar()

  const [numeroParte, setNumeroParte] = useState(params.get("numeroParte") ?? "")
  const [ultimo, setUltimo] = useState<ResultadoBusqueda | null>(null)
  const [marcando, setMarcando] = useState<number>()
  const [pegandoUrl, setPegandoUrl] = useState(false)
  const [convirtiendo, setConvirtiendo] = useState<Referencia | null>(null)
  const permisos = usePermisos()
  const puedeConvertir = vitrinaHabilitada && permisos.puedeCrear("vitrina")

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { numeroParte: params.get("numeroParte") ?? "", marca: params.get("marca") ?? "", gtin: "", palabras: "" },
  })

  const historial = useHistorialReferencias(numeroParte)
  const buscar = useBuscarReferencias()
  const cambiarEstado = useCambiarEstadoReferencia(numeroParte)

  function ejecutar(valores: Valores, forzar: boolean) {
    const np = valores.numeroParte.trim()
    setNumeroParte(np)
    buscar.mutate(
      {
        idSolicitudItem,
        numeroParte: np,
        marca: vacioAUndefined(valores.marca),
        gtin: vacioAUndefined(valores.gtin),
        palabras: vacioAUndefined(valores.palabras),
        forzar,
      },
      { onSuccess: setUltimo },
    )
  }

  // Gerente y Jefe Adm. solo consultan el historial: no disparan búsquedas en las fuentes.
  const enviar = handleSubmit((v) => (puedeBuscar ? ejecutar(v, false) : setNumeroParte(v.numeroParte.trim())))
  const forzar = () => handleSubmit((v) => ejecutar(v, true))()

  function marcar(idSourcing: number, estado: "UTIL" | "DESCARTADO") {
    setMarcando(idSourcing)
    cambiarEstado.mutate(
      { idSourcing, estado },
      {
        onSuccess: () => avisar(estado === "UTIL" ? "Referencia marcada como útil" : "Referencia descartada"),
        onSettled: () => setMarcando(undefined),
      },
    )
  }

  const referencias = historial.data ?? []
  const cargando = historial.isLoading || buscar.isPending

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Búsqueda de repuestos"
        descripcion="Busca por marca y N.º de parte en las fuentes aprobadas. Nada de esto se muestra al cliente."
        acciones={puedeBuscar && (
          <Button variant="outline" onClick={() => setPegandoUrl(true)}>
            <Link2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Pegar URL
          </Button>
        )}
      />

      <form onSubmit={enviar} noValidate className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo id="numeroParte" label="N.º de parte" obligatorio error={errors.numeroParte?.message}>
          <input
            id="numeroParte"
            className={inputFormClass}
            autoComplete="off"
            placeholder="1R-0750"
            aria-invalid={!!errors.numeroParte}
            aria-describedby={describedBy("numeroParte", { error: errors.numeroParte })}
            {...register("numeroParte")}
          />
        </Campo>
        <Campo id="marca" label="Marca" opcional error={errors.marca?.message}>
          <input id="marca" className={inputFormClass} placeholder="Caterpillar" {...register("marca")} />
        </Campo>
        <Campo id="gtin" label="GTIN" opcional error={errors.gtin?.message}>
          <input
            id="gtin"
            className={inputFormClass}
            inputMode="numeric"
            aria-invalid={!!errors.gtin}
            aria-describedby={describedBy("gtin", { error: errors.gtin })}
            {...register("gtin")}
          />
        </Campo>
        <Campo id="palabras" label="Palabras clave" opcional>
          <input id="palabras" className={inputFormClass} placeholder="filtro combustible" {...register("palabras")} />
        </Campo>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={buscar.isPending}>
            {buscar.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />}
            {puedeBuscar ? "Buscar" : "Ver historial"}
          </Button>
          {puedeBuscar && ultimo?.reutilizada && (
            <Button type="button" variant="outline" onClick={forzar} disabled={buscar.isPending}>
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Buscar de nuevo en las fuentes
            </Button>
          )}
        </div>
      </form>

      {buscar.isError && <ErrorBanner message={mensajeError(buscar.error, "No se pudo buscar.")} error={buscar.error} />}
      {cambiarEstado.isError && (
        <ErrorBanner message={mensajeError(cambiarEstado.error, "No se pudo cambiar el estado.")} error={cambiarEstado.error} />
      )}
      {historial.isError && (
        <ErrorBanner message="No se pudo cargar el historial." error={historial.error} onRetry={() => historial.refetch()} />
      )}

      {ultimo && <ResumenBusqueda resultado={ultimo} numeroParte={getValues("numeroParte")} />}

      {numeroParte && (
        <TablaCard>
          {cargando ? (
            <table className="w-full"><tbody><TableSkeletonRows rows={3} columns={puedeBuscar ? 7 : 6} /></tbody></table>
          ) : referencias.length === 0 ? (
            <EstadoVacio
              icono={<SearchX className="h-5.5 w-5.5" />}
              titulo="Sin referencias para este N.º de parte"
              descripcion="Las fuentes no devolvieron resultados. Busca el repuesto en una tienda y pega su URL."
              accion={puedeBuscar && (
                <Button onClick={() => setPegandoUrl(true)}>
                  <Link2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Pegar URL
                </Button>
              )}
            />
          ) : (
            <TablaReferencias
              referencias={referencias}
              puedeMarcar={puedeBuscar}
              marcando={marcando}
              onMarcar={marcar}
              onConvertir={puedeConvertir ? setConvirtiendo : undefined}
            />
          )}
        </TablaCard>
      )}

      {convirtiendo && <ConvertirModal referencia={convirtiendo} onCerrar={() => setConvirtiendo(null)} />}

      {pegandoUrl && (
        <PegarUrlModal
          numeroParte={numeroParte || getValues("numeroParte").trim()}
          marca={getValues("marca").trim() || undefined}
          idSolicitudItem={idSolicitudItem}
          onCerrar={() => setPegandoUrl(false)}
        />
      )}
    </div>
  )
}

function ResumenBusqueda({ resultado, numeroParte }: { resultado: ResultadoBusqueda; numeroParte: string }) {
  const partes: string[] = []
  if (resultado.reutilizada) {
    partes.push(`Mostramos lo que se encontró para ${numeroParte} en las últimas 24 horas, sin volver a consultar las fuentes.`)
  } else if (resultado.fuentesConsultadas.length > 0) {
    partes.push(`Se consultó: ${resultado.fuentesConsultadas.join(", ")}.`)
  } else {
    partes.push("Todavía no hay fuentes conectadas.")
  }
  if (resultado.fuentesConError.length > 0) {
    partes.push(`No respondieron: ${resultado.fuentesConError.join(", ")}.`)
  }
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-info/10 px-3 py-2 text-sm text-info">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {partes.join(" ")}
    </p>
  )
}
