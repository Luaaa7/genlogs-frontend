import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { ExternalLink } from 'lucide-react'
import { sourcingApi, type Referencia, type ResultadoBusqueda } from '@/api/sourcingApi'
import { Button } from '@/components/ui/button'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { mensajeError } from '@/lib/errores'

function enlaceSeguro(url: string | null): url is string {
  return !!url && /^https?:\/\/\S+$/i.test(url)
}

function cancelada(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

function es404(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function costoDe(r: Referencia): string {
  const puesto = Number(r.costoPuestoLima)
  if (puesto > 0) return formatearMoneda(puesto, 'PEN')
  const ref = Number(r.precioRef)
  if (ref > 0) return formatearMoneda(ref, r.codigoMoneda || 'PEN')
  return '—'
}

function etiqueta(r: Referencia) {
  if (r.estado === 'UTIL' && r.marcadaUtilDesde === 'COTIZACION') return 'Útil · desde la cotización'
  if (r.estado === 'UTIL') return 'Útil'
  if (r.estado === 'CAPTURADO') return 'Capturado'
  if (r.estado === 'CONVERTIDO') return 'Convertido'
  return r.estado
}

function cuerpoElegir(r: Referencia) {
  return r.idSolicitudItem != null ? { idSolicitudItem: r.idSolicitudItem } : {}
}

function fusionar(actual: Referencia[] | null, nuevas: Referencia[]): Referencia[] {
  const base = (actual ?? []).filter((r) => r.estado !== 'DESCARTADO')
  const ids = new Set(nuevas.map((r) => r.idSourcing))
  const resto = base.filter((r) => !ids.has(r.idSourcing))
  return [...nuevas.filter((r) => r.estado !== 'DESCARTADO'), ...resto]
}

interface Props {
  consulta: string
  puedeBuscar: boolean
  onElegir: (referencia: Referencia) => void
  onSinResultados?: () => void
}

/** Referencias ya guardadas para el texto del repuesto, y la búsqueda en fuentes bajo demanda. */
export function ReferenciasEncontradasPanel({ consulta, puedeBuscar, onElegir, onSinResultados }: Props) {
  const [lista, setLista] = useState<Referencia[] | null>(null)
  const [consultaLista, setConsultaLista] = useState<string | null>(null)
  const [marcas, setMarcas] = useState<Record<number, Referencia>>({})
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [oculto, setOculto] = useState(false)
  const [eligiendo, setEligiendo] = useState<number | null>(null)
  const [buscandoFuentes, setBuscandoFuentes] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const generacion = useRef(0)

  const q = consulta.trim()

  useEffect(() => {
    if (oculto || q.length < 2) return
    const actual = ++generacion.current
    const ctrl = new AbortController()
    const espera = window.setTimeout(() => {
      setCargando(true)
      setError(null)
      sourcingApi.historial({ q, soloElegibles: true, limite: 20 }, ctrl.signal)
        .then((filas) => {
          if (ctrl.signal.aborted || generacion.current !== actual) return
          setLista((filas ?? []).filter((r) => r.estado !== 'DESCARTADO'))
          setConsultaLista(q)
        })
        .catch((e: unknown) => {
          if (cancelada(e) || ctrl.signal.aborted || generacion.current !== actual) return
          if (es404(e)) {
            setOculto(true)
            return
          }
          setLista(null)
          setConsultaLista(q)
          setError(mensajeError(e, 'No se pudo consultar las referencias.'))
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setCargando(false)
        })
    }, 300)
    return () => {
      window.clearTimeout(espera)
      ctrl.abort()
    }
  }, [q, oculto])

  function vista(r: Referencia) {
    return marcas[r.idSourcing] ?? r
  }

  async function elegir(r: Referencia) {
    if (r.estado === 'CAPTURADO') {
      if (!puedeBuscar) return
      setEligiendo(r.idSourcing)
      setError(null)
      try {
        const marcada = await sourcingApi.elegirDesdeCotizacion(r.idSourcing, cuerpoElegir(r))
        setMarcas((actual) => ({ ...actual, [marcada.idSourcing]: marcada }))
        setLista((actual) => actual?.map((item) => (item.idSourcing === marcada.idSourcing ? marcada : item)) ?? actual)
        onElegir(marcada)
      } catch (e) {
        setError(mensajeError(e, 'No se pudo elegir la referencia.'))
      } finally {
        setEligiendo(null)
      }
      return
    }
    if (r.estado === 'UTIL' || r.estado === 'CONVERTIDO') onElegir(r)
  }

  async function buscarFuentes() {
    if (q.length < 2 || buscandoFuentes) return
    generacion.current += 1
    setBuscandoFuentes(true)
    setAviso(null)
    setError(null)
    try {
      const resultado: ResultadoBusqueda = await sourcingApi.buscar({ numeroParte: q, forzar: false })
      const llegadas = (resultado.referencias ?? []).map((r) => ({ ...r, estado: r.estado || 'CAPTURADO' as const }))
      setLista((actual) => fusionar(actual, llegadas))
      setConsultaLista(q)
      const partes = [
        resultado.reutilizada ? 'Se reutilizó una búsqueda reciente' : '',
        resultado.fuentesConError?.length ? `No respondieron: ${resultado.fuentesConError.join(', ')}` : '',
        llegadas.length === 0 ? 'Sin resultados: escribe costo y moneda como ítem libre' : '',
      ].filter(Boolean)
      setAviso(partes.join('. '))
      if (llegadas.length === 0) onSinResultados?.()
    } catch (e) {
      if (es404(e)) {
        setOculto(true)
        setLista(null)
        return
      }
      setError(mensajeError(e, 'No se pudo buscar en las fuentes.'))
    } finally {
      setBuscandoFuentes(false)
    }
  }

  if (oculto) {
    return (
      <p className="text-sm text-muted-foreground">
        La búsqueda de referencias no está disponible. Puedes elegir del catálogo o escribir el costo a mano.
      </p>
    )
  }

  const vigente = consultaLista === q
  const filas = vigente ? (lista ?? []).map(vista).filter((r) => r.estado !== 'DESCARTADO') : []
  const mostrarLista = q.length >= 2 && vigente

  return (
    <section aria-labelledby="referencias-encontradas" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="referencias-encontradas" className="text-sm font-medium text-foreground">Referencias ya encontradas</h3>
        {puedeBuscar && (
          <Button type="button" variant="outline" onClick={() => void buscarFuentes()} disabled={q.length < 2 || buscandoFuentes}>
            {buscandoFuentes ? 'Buscando… puede tardar' : 'Buscar en fuentes'}
          </Button>
        )}
      </div>
      <div aria-live="polite" className="flex flex-col gap-1">
        {cargando && <p className="text-sm text-muted-foreground">Buscando referencias…</p>}
        {aviso && <p className="text-sm text-foreground">{aviso}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      {mostrarLista && lista && filas.length === 0 && !cargando && (
        <p className="text-sm text-muted-foreground">
          No hay referencias guardadas para esa búsqueda. Puedes buscar en fuentes o escribir el costo a mano.
        </p>
      )}
      {mostrarLista && filas.length > 0 && (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto" aria-busy={eligiendo !== null}>
          {filas.map((r) => {
            const nombre = r.titulo ?? r.numeroParte ?? 'Referencia'
            const puedeElegir = r.estado === 'UTIL' || r.estado === 'CONVERTIDO' || (r.estado === 'CAPTURADO' && puedeBuscar)
            const ocupada = eligiendo === r.idSourcing
            return (
              <li key={r.idSourcing} className="rounded-md border border-border px-3 py-2 text-sm">
                {puedeElegir ? (
                  <button
                    type="button"
                    className="text-left font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                    disabled={eligiendo !== null}
                    onClick={() => void elegir(r)}
                  >
                    {ocupada ? 'Marcando…' : nombre}
                  </button>
                ) : (
                  <span className="font-medium text-foreground">{nombre}</span>
                )}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {[r.numeroParte, r.fuente, costoDe(r)].filter(Boolean).join(' · ')}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{etiqueta(r)}</span>
                {r.estado === 'CAPTURADO' && !puedeBuscar && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">Solo el asistente logístico puede marcarla desde la cotización</span>
                )}
                {enlaceSeguro(r.urlReferencia) && (
                  <a href={r.urlReferencia} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Ver en la tienda
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {q.length >= 2 && (
        <p className="text-xs text-muted-foreground">Al elegir una referencia queda marcada como Útil.</p>
      )}
    </section>
  )
}
