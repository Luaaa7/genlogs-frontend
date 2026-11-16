import { useState } from 'react'
import { Check, ExternalLink, Minus, X } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { avisar } from '@/lib/avisos'
import { cn } from '@/lib/utils/utils'
import type { ConsultaTienda, CorridaGuardada, FichaPrueba, ResumenTienda } from '@/api/pruebaFuentesApi'
import { useBuscarPrueba, useGuardarCorrida, useResumenPrueba } from '../hooks/usePruebaFuentes'
import {
  ACIERTOS_MINIMOS,
  PEDIDOS,
  TEXTO_ESTADO,
  aSolicitud,
  conteo,
  faltanMarcar,
  guardarCorridaLocal,
  leerCorridaLocal,
  marcaAutomatica,
  marcasDelPedido,
  seEvalua,
  textoPedido,
  tiendasCompletas,
  yaEsta,
  type Marca,
  type PedidoEnCurso,
} from '../lib/corrida'

type Nombres = Record<string, string>

const numero = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

function mensajeDe(err: unknown, porDefecto: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto
}

/**
 * M3 (v3.3, BPMN 9-C) · Búsqueda de prueba. El Jefe Administrativo busca 10 pedidos reales
 * (marca + N.º de parte) en las 5 tiendas, ve los 6 campos que leyó cada una y marca si acertó.
 * Al guardar, cada tienda queda con sus aciertos sobre 10: con 4 o más ya se puede activar (D-37)
 * en Configuración > Fuentes de búsqueda (RF-94).
 */
export function PruebaFuentesPage() {
  const resumen = useResumenPrueba()
  const nombres: Nombres = Object.fromEntries((resumen.data ?? []).map((t) => [t.codigo, t.nombre]))
  const [pedidos, setPedidos] = useState<PedidoEnCurso[]>(leerCorridaLocal)
  const [guardadas, setGuardadas] = useState<CorridaGuardada[] | null>(null)

  function cambiarPedidos(nuevos: PedidoEnCurso[]) {
    setPedidos(nuevos)
    guardarCorridaLocal(nuevos)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Prueba de 10 pedidos"
        descripcion={`Busca ${PEDIDOS} pedidos reales en las tiendas y marca si cada una encontró el repuesto. Una tienda entra a la búsqueda con ${ACIERTOS_MINIMOS} o más aciertos (D-37).`}
      />

      <TablaAciertos
        cargando={resumen.isLoading}
        error={resumen.isError}
        tiendas={resumen.data ?? []}
        onReintentar={() => resumen.refetch()}
      />

      {guardadas && <ResultadoGuardado guardadas={guardadas} onCerrar={() => setGuardadas(null)} />}

      <NuevoPedido
        nombres={nombres}
        pedidos={pedidos}
        onAgregar={(p) => {
          setGuardadas(null)
          cambiarPedidos([...pedidos, p])
        }}
      />

      <CorridaEnCurso
        nombres={nombres}
        pedidos={pedidos}
        onCambiar={cambiarPedidos}
        onGuardada={(r) => {
          setGuardadas(r)
          cambiarPedidos([])
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------- tabla de aciertos (RF-94)

function TablaAciertos({ cargando, error, tiendas, onReintentar }: {
  cargando: boolean
  error: boolean
  tiendas: ResumenTienda[]
  onReintentar: () => void
}) {
  return (
    <section aria-labelledby="titulo-aciertos" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <h2 id="titulo-aciertos" className="text-base font-semibold text-foreground">Aciertos sobre 10 por tienda</h2>
      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando aciertos…</p>
      ) : error ? (
        <ErrorBanner message="No se pudieron cargar los aciertos de las tiendas." onRetry={onReintentar} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-4 font-medium">Tienda</th>
                <th scope="col" className="py-2 pr-4 font-medium">Última prueba</th>
                <th scope="col" className="py-2 pr-4 font-medium">Corrida</th>
                <th scope="col" className="py-2 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tiendas.map((t) => (
                <tr key={t.codigo} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-medium text-foreground">
                    {t.nombre}
                    {t.activa && <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">En la búsqueda</span>}
                  </th>
                  <td className="py-2 pr-4 tabular-nums">{t.aciertos == null ? 'Sin correr' : `${t.aciertos} de ${PEDIDOS}`}</td>
                  <td className="py-2 pr-4 tabular-nums">{t.corrida === 0 ? '—' : `N.º ${t.corrida}`}</td>
                  <td className="py-2">
                    {t.aciertos == null ? (
                      <span className="text-muted-foreground">Falta la prueba</span>
                    ) : t.aprobada ? (
                      <span className="text-success">Puede activarse</span>
                    ) : (
                      <span className="text-destructive">Necesita {ACIERTOS_MINIMOS} o más</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- buscar y marcar un pedido

function NuevoPedido({ nombres, pedidos, onAgregar }: {
  nombres: Nombres
  pedidos: PedidoEnCurso[]
  onAgregar: (p: PedidoEnCurso) => void
}) {
  const buscar = useBuscarPrueba()
  const [marca, setMarca] = useState('')
  const [numeroParte, setNumeroParte] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [actual, setActual] = useState<{ pedido: string; consultas: ConsultaTienda[] } | null>(null)
  const [marcas, setMarcas] = useState<Record<string, Marca | undefined>>({})
  const completa = pedidos.length >= PEDIDOS

  function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!numeroParte.trim()) {
      setError('Escribe el N.º de parte del pedido.')
      return
    }
    const pedido = textoPedido(marca, numeroParte)
    if (yaEsta(pedidos, pedido)) {
      setError(`«${pedido}» ya está en esta prueba: usa ${PEDIDOS} pedidos distintos.`)
      return
    }
    setError(null)
    buscar.mutate(
      { marca: marca.trim(), numeroParte: numeroParte.trim() },
      {
        onSuccess: (consultas) => {
          setActual({ pedido, consultas })
          setMarcas({})
        },
        onError: (err) => setError(mensajeDe(err, 'No se pudo buscar en las tiendas. Inténtalo de nuevo.')),
      },
    )
  }

  const faltan = actual ? faltanMarcar(actual.consultas, marcas) : []
  const nombre = (codigo: string) => nombres[codigo] ?? codigo

  function agregar() {
    if (!actual || faltan.length > 0 || completa) return
    onAgregar({ pedido: actual.pedido, tiendas: marcasDelPedido(actual.consultas, marcas) })
    avisar(`«${actual.pedido}» agregado a la prueba (${pedidos.length + 1} de ${PEDIDOS})`)
    setActual(null)
    setMarcas({})
    setMarca('')
    setNumeroParte('')
  }

  return (
    <section aria-labelledby="titulo-pedido" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 id="titulo-pedido" className="text-base font-semibold text-foreground">
        Pedido {Math.min(pedidos.length + 1, PEDIDOS)} de {PEDIDOS}
      </h2>
      {completa ? (
        <p className="text-sm text-muted-foreground">Ya tienes los {PEDIDOS} pedidos. Revisa la prueba y guárdala.</p>
      ) : (
        <form onSubmit={enviar} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Campo id="prueba-marca" label="Marca" opcional>
            <input id="prueba-marca" className={inputFormClass} value={marca} maxLength={60} autoComplete="off"
              placeholder="CAT" onChange={(e) => { setMarca(e.target.value); setError(null) }} />
          </Campo>
          <Campo id="prueba-parte" label="N.º de parte" obligatorio>
            <input id="prueba-parte" className={inputFormClass} value={numeroParte} maxLength={60} autoComplete="off"
              placeholder="1R-0750" onChange={(e) => { setNumeroParte(e.target.value); setError(null) }} />
          </Campo>
          <Button type="submit" disabled={buscar.isPending}>
            {buscar.isPending ? 'Buscando…' : 'Buscar en las tiendas'}
          </Button>
        </form>
      )}
      {error && <ErrorBanner message={error} />}

      {actual && !completa && (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <p className="text-sm text-foreground">
            Resultados de <strong>{actual.pedido}</strong>. Marca en cada tienda cuál ficha es el repuesto pedido, o que ninguna lo es.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {actual.consultas.map((c) => (
              <TarjetaTienda key={c.codigo} consulta={c} nombre={nombre(c.codigo)} marca={marcas[c.codigo]}
                onMarcar={(m) => setMarcas((actuales) => ({ ...actuales, [c.codigo]: m }))} />
            ))}
          </div>
          <div className="flex flex-col items-end gap-2">
            {faltan.length > 0 && (
              <p className="text-xs text-muted-foreground">Falta marcar: {faltan.map(nombre).join(', ')}</p>
            )}
            <Button type="button" onClick={agregar} disabled={faltan.length > 0}>
              Agregar a la prueba ({pedidos.length + 1} de {PEDIDOS})
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function TarjetaTienda({ consulta, nombre, marca, onMarcar }: {
  consulta: ConsultaTienda
  nombre: string
  marca: Marca | undefined
  onMarcar: (m: Marca) => void
}) {
  const idTitulo = `tienda-${consulta.codigo}`
  const automatica = marcaAutomatica(consulta)
  const grupo = `acierto-${consulta.codigo}`
  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={idTitulo} className="text-sm font-semibold text-foreground">{nombre}</h3>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium',
          consulta.estado === 'OK' ? 'bg-success/10 text-success'
            : seEvalua(consulta) ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground')}>
          {TEXTO_ESTADO[consulta.estado] ?? consulta.estado}
        </span>
      </div>
      {consulta.motivo && <p className="text-xs text-muted-foreground">{consulta.motivo}</p>}

      {!seEvalua(consulta) ? (
        <p className="text-sm text-muted-foreground">No se evalúa en esta prueba.</p>
      ) : automatica ? (
        <p className="text-sm text-muted-foreground">Cuenta como «no acertó».</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">¿Cuál es el repuesto pedido?</legend>
          {consulta.fichas.map((f, i) => (
            <label key={i} className={cn('flex cursor-pointer gap-3 rounded-md border p-3',
              marca?.acerto && marca.indice === i ? 'border-success bg-success/5' : 'border-border')}>
              <input type="radio" name={grupo} className="mt-1"
                checked={!!marca?.acerto && marca.indice === i}
                onChange={() => onMarcar({ acerto: true, enlace: f.urlReferencia, indice: i })}
                aria-label={`Acertó: ${f.titulo ?? `ficha ${i + 1}`}`} />
              <Ficha ficha={f} />
            </label>
          ))}
          <label className={cn('flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm',
            marca && !marca.acerto ? 'border-destructive bg-destructive/5' : 'border-border')}>
            <input type="radio" name={grupo} checked={!!marca && !marca.acerto}
              onChange={() => onMarcar({ acerto: false, enlace: null })} />
            Ninguna es la pedida (no acertó)
          </label>
        </fieldset>
      )}
    </section>
  )
}

/** Los 6 campos de la ficha (A4): nombre, descripción, precio, moneda, imagen y enlace. */
function Ficha({ ficha }: { ficha: FichaPrueba }) {
  return (
    <div className="flex min-w-0 flex-1 gap-3">
      {ficha.urlImagen ? (
        <img src={ficha.urlImagen} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded object-contain bg-muted" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">Sin imagen</div>
      )}
      <div className="flex min-w-0 flex-col gap-0.5 text-sm">
        <span className="font-medium text-foreground">{ficha.titulo ?? 'Sin nombre'}</span>
        {ficha.descripcion && <span className="line-clamp-2 text-xs text-muted-foreground">{ficha.descripcion}</span>}
        <span className="tabular-nums">
          {ficha.precio == null ? 'Sin precio' : `${ficha.codigoMoneda ?? 'Moneda ?'} ${numero.format(ficha.precio)}`}
        </span>
        {ficha.urlReferencia && (
          <a href={ficha.urlReferencia} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-accent underline-offset-4 hover:underline">
            Ver en la tienda <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- corrida en curso

function CorridaEnCurso({ nombres, pedidos, onCambiar, onGuardada }: {
  nombres: Nombres
  pedidos: PedidoEnCurso[]
  onCambiar: (p: PedidoEnCurso[]) => void
  onGuardada: (r: CorridaGuardada[]) => void
}) {
  const guardar = useGuardarCorrida()
  const [error, setError] = useState<string | null>(null)
  const nombre = (codigo: string) => nombres[codigo] ?? codigo
  const tiendas = Array.from(new Set(pedidos.flatMap((p) => Object.keys(p.tiendas))))
  const completas = tiendasCompletas(pedidos)
  const incompletas = tiendas.filter((t) => !completas.includes(t))
  const totales = conteo(pedidos)
  const lista = pedidos.length === PEDIDOS && completas.length > 0

  function enviar() {
    if (!lista) return
    guardar.mutate(aSolicitud(pedidos, completas), {
      onSuccess: (r) => {
        setError(null)
        avisar('Prueba de 10 pedidos guardada')
        onGuardada(r)
      },
      onError: (err) => setError(mensajeDe(err, 'No se pudo guardar la prueba. Inténtalo de nuevo.')),
    })
  }

  return (
    <section aria-labelledby="titulo-corrida" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 id="titulo-corrida" className="text-base font-semibold text-foreground">
        Prueba en curso · {pedidos.length} de {PEDIDOS} pedidos
      </h2>
      {pedidos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay pedidos. Busca el primero arriba.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-4 font-medium">Pedido</th>
                  {tiendas.map((t) => <th key={t} scope="col" className="py-2 pr-4 font-medium">{nombre(t)}</th>)}
                  <th scope="col" className="py-2"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p, i) => (
                  <tr key={p.pedido} className="border-b border-border">
                    <th scope="row" className="py-2 pr-4 text-left font-medium text-foreground">{i + 1}. {p.pedido}</th>
                    {tiendas.map((t) => <td key={t} className="py-2 pr-4"><Celda marca={p.tiendas[t]} /></td>)}
                    <td className="py-2 text-right">
                      <Button type="button" variant="ghost" size="sm" aria-label={`Quitar ${p.pedido}`}
                        onClick={() => onCambiar(pedidos.filter((x) => x !== p))}>
                        Quitar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="py-2 pr-4 text-left font-medium text-foreground">Aciertos</th>
                  {tiendas.map((t) => (
                    <td key={t} className="py-2 pr-4 font-medium tabular-nums">
                      {totales[t]?.aciertos ?? 0} de {totales[t]?.evaluados ?? 0}
                    </td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          {incompletas.length > 0 && (
            <p className="text-xs text-muted-foreground">
              No se guardan: {incompletas.map(nombre).join(', ')}. No se evaluaron en todos los pedidos (por ejemplo, sin sesión).
            </p>
          )}
          {error && <ErrorBanner message={error} />}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={guardar.isPending}
              onClick={() => { if (window.confirm('¿Descartar los pedidos de esta prueba?')) onCambiar([]) }}>
              Descartar prueba
            </Button>
            <Button type="button" onClick={enviar} disabled={!lista || guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : 'Guardar prueba'}
            </Button>
          </div>
          {pedidos.length < PEDIDOS && (
            <p className="text-right text-xs text-muted-foreground">Faltan {PEDIDOS - pedidos.length} pedidos para guardar.</p>
          )}
        </>
      )}
    </section>
  )
}

function Celda({ marca }: { marca: Marca | undefined }) {
  if (!marca) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-4 w-4" aria-hidden="true" />No evaluada</span>
  return marca.acerto
    ? <span className="inline-flex items-center gap-1 text-success"><Check className="h-4 w-4" aria-hidden="true" />Acertó</span>
    : <span className="inline-flex items-center gap-1 text-destructive"><X className="h-4 w-4" aria-hidden="true" />No acertó</span>
}

function ResultadoGuardado({ guardadas, onCerrar }: { guardadas: CorridaGuardada[]; onCerrar: () => void }) {
  return (
    <section aria-labelledby="titulo-guardada" className="flex flex-col gap-2 rounded-xl border border-success/40 bg-success/5 p-5">
      <h2 id="titulo-guardada" className="text-base font-semibold text-foreground">Prueba guardada</h2>
      <ul className="flex flex-col gap-1 text-sm">
        {guardadas.map((g) => (
          <li key={g.codigo}>
            <strong>{g.nombre}</strong>: {g.aciertos} de {g.pedidos} (corrida N.º {g.corrida}) ·{' '}
            {g.aprobada ? 'ya puede activarse en Fuentes de búsqueda' : `no llega a ${ACIERTOS_MINIMOS}`}
            {g.desactivada && ' · se apagó porque estaba activa y no llegó al mínimo'}
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCerrar}>Cerrar</Button>
      </div>
    </section>
  )
}