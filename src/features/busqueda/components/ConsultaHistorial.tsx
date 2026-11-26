import { useState, type FormEvent } from "react"
import { FilterX, History, Search, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Campo } from "@/components/ui/campo"
import { describedBy, inputFormClass } from "@/components/ui/campoEstilos"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { TablaCard } from "@/components/ui/tabla"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import { formatCurrency } from "@/lib/formatters/currency"
import type { EstadoReferencia, Referencia } from "@/api/sourcingApi"
import { useConsultaHistorial } from "../hooks/useBusqueda"
import { ESTADOS_REFERENCIA, FUENTES, nombreFuente } from "../lib/etiquetasReferencia"
import { TablaReferencias } from "./TablaReferencias"

const LIMITES = [20, 50] as const
const ESTADOS = Object.keys(ESTADOS_REFERENCIA) as EstadoReferencia[]

type Filtro = { q: string; soloElegibles: boolean; limite: number }

/** Cifras del resultado: cuántas hay, cuántas son útiles, de cuántas tiendas y el precio más bajo por moneda. */
function Resumen({ referencias }: { referencias: Referencia[] }) {
  const utiles = referencias.filter((r) => r.estado === "UTIL" || r.estado === "CONVERTIDO").length
  const fuentes = new Set(referencias.map((r) => r.fuente)).size
  const minimos = new Map<string, number>()
  for (const r of referencias) {
    if (r.precioRef == null) continue
    const moneda = r.codigoMoneda ?? "PEN"
    minimos.set(moneda, Math.min(minimos.get(moneda) ?? Infinity, r.precioRef))
  }
  const datos = [
    { titulo: "Referencias", valor: String(referencias.length) },
    { titulo: "Útiles o en vitrina", valor: String(utiles) },
    { titulo: "Fuentes", valor: String(fuentes) },
    {
      titulo: "Precio más bajo",
      valor: minimos.size === 0 ? "—" : [...minimos].map(([m, v]) => formatCurrency(v, m)).join(" · "),
    },
  ]
  return (
    <dl aria-label="Resumen del historial" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {datos.map((d) => (
        <div key={d.titulo} className="rounded-xl border border-border bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{d.titulo}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{d.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * v3.4 · Consulta del historial de búsquedas para el Jefe Administrativo y el Gerente: buscan por N.º de
 * parte, marca o descripción (GET /sourcing/historial?q=) y filtran por fuente y estado. No buscan en
 * las tiendas ni marcan referencias: eso es del Asistente Logístico.
 */
export function ConsultaHistorial({ textoInicial = "" }: { textoInicial?: string }) {
  const [texto, setTexto] = useState(textoInicial)
  const [soloElegibles, setSoloElegibles] = useState(false)
  const [limite, setLimite] = useState<number>(LIMITES[0])
  const [fuente, setFuente] = useState("")
  const [estado, setEstado] = useState("")
  const [error, setError] = useState<string>()
  const [filtro, setFiltro] = useState<Filtro | null>(
    textoInicial.trim().length >= 2 ? { q: textoInicial.trim(), soloElegibles: false, limite: LIMITES[0] } : null,
  )

  const consulta = useConsultaHistorial(filtro)
  const todas = consulta.data ?? []
  const visibles = todas.filter((r) => (!fuente || r.fuente === fuente) && (!estado || r.estado === estado))
  const hayFiltrosLocales = !!fuente || !!estado

  function enviar(e: FormEvent) {
    e.preventDefault()
    const q = texto.trim()
    if (q.length < 2) {
      setError("Escribe al menos 2 caracteres.")
      return
    }
    setError(undefined)
    const nuevo = { q, soloElegibles, limite }
    if (filtro && JSON.stringify(filtro) === JSON.stringify(nuevo)) consulta.refetch()
    else setFiltro(nuevo)
  }

  function limpiar() {
    setTexto("")
    setSoloElegibles(false)
    setLimite(LIMITES[0])
    setFuente("")
    setEstado("")
    setError(undefined)
    setFiltro(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={enviar} noValidate aria-label="Consultar el historial"
        className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Campo id="consulta-texto" label="N.º de parte, marca o descripción" obligatorio error={error} className="sm:col-span-2 lg:col-span-3"
          ayuda="Busca en todo lo que el Asistente Logístico ya encontró.">
          <input
            id="consulta-texto"
            className={inputFormClass}
            autoComplete="off"
            placeholder="Ej.: 1R-0750, Caterpillar o filtro combustible"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy("consulta-texto", { error, ayuda: true })}
          />
        </Campo>
        <Campo id="consulta-fuente" label="Fuente">
          <select id="consulta-fuente" className={inputFormClass} value={fuente} onChange={(e) => setFuente(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(FUENTES).map(([codigo, nombre]) => <option key={codigo} value={codigo}>{nombre}</option>)}
          </select>
        </Campo>
        <Campo id="consulta-estado" label="Estado">
          <select id="consulta-estado" className={inputFormClass} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS.map((codigo) => <option key={codigo} value={codigo}>{ESTADOS_REFERENCIA[codigo].label}</option>)}
          </select>
        </Campo>
        <Campo id="consulta-limite" label="Mostrar">
          <select id="consulta-limite" className={inputFormClass} value={limite} onChange={(e) => setLimite(Number(e.target.value))}>
            {LIMITES.map((n) => <option key={n} value={n}>Las {n} más recientes</option>)}
          </select>
        </Campo>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2 lg:col-span-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={soloElegibles}
              onChange={(e) => setSoloElegibles(e.target.checked)} />
            Ocultar las descartadas
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={limpiar}>
              <FilterX className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Limpiar
            </Button>
            <Button type="submit" disabled={consulta.isFetching}>
              <Search className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Buscar en el historial
            </Button>
          </div>
        </div>
      </form>

      {consulta.isError && (
        <ErrorBanner message="No se pudo consultar el historial." error={consulta.error} onRetry={() => consulta.refetch()} />
      )}

      {!filtro && (
        <EstadoVacio
          icono={<History className="h-5.5 w-5.5" />}
          titulo="Consulta el historial de búsquedas"
          descripcion="Escribe un N.º de parte, una marca o parte de la descripción. Luego puedes filtrar por fuente y estado, y ver el precio más bajo encontrado."
        />
      )}

      {filtro && consulta.isLoading && (
        <TablaCard><table className="w-full"><tbody><TableSkeletonRows rows={4} columns={6} /></tbody></table></TablaCard>
      )}

      {filtro && consulta.isSuccess && (
        todas.length === 0 ? (
          <TablaCard>
            <EstadoVacio
              icono={<SearchX className="h-5.5 w-5.5" />}
              titulo={`Nada en el historial para «${filtro.q}»`}
              descripcion="Todavía no se ha buscado. Pídele al Asistente Logístico que lo busque en las tiendas."
            />
          </TablaCard>
        ) : (
          <>
            <Resumen referencias={visibles} />
            {hayFiltrosLocales && (
              <p className="text-sm text-muted-foreground">
                Se muestran {visibles.length} de {todas.length}
                {fuente && <> · Fuente: {nombreFuente(fuente)}</>}
                {estado && <> · Estado: {ESTADOS_REFERENCIA[estado as EstadoReferencia].label}</>}
              </p>
            )}
            <TablaCard>
              {visibles.length === 0 ? (
                <EstadoVacio
                  icono={<FilterX className="h-5.5 w-5.5" />}
                  titulo="Ninguna referencia coincide con los filtros"
                  accion={<Button variant="outline" onClick={() => { setFuente(""); setEstado("") }}>Quitar filtros</Button>}
                />
              ) : (
                <TablaReferencias referencias={visibles} puedeMarcar={false} onMarcar={() => undefined} />
              )}
            </TablaCard>
          </>
        )
      )}
    </div>
  )
}
