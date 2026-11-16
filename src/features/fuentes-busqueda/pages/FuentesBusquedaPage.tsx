import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { avisar } from '@/lib/avisos'
import { usePermisos } from '@/lib/permisos'
import { cn } from '@/lib/utils/utils'
import type { FuenteConfig } from '@/api/fuentesApi'
import {
  useActivarFuente,
  useCambiarLimites,
  useFuentes,
  useGuardarCuenta,
  useProbarSesion,
} from '../hooks/useFuentes'
import { ReglasExtraccion } from '../components/ReglasExtraccion'

/** D-37: una tienda entra en la búsqueda solo con 4 o más aciertos en la prueba de 10 pedidos. */
const ACIERTOS_MINIMOS = 4

const ESTADOS: Record<FuenteConfig['estado'], { texto: string; clase: string }> = {
  SIN_PROBAR: { texto: 'Sin probar', clase: 'bg-muted text-muted-foreground' },
  ACTIVA: { texto: 'Sesión activa', clase: 'bg-success/10 text-success' },
  CON_ERROR: { texto: 'Con error', clase: 'bg-destructive/10 text-destructive' },
  REQUIERE_VERIFICACION: { texto: 'Requiere verificación', clase: 'bg-warning/10 text-warning-text' },
}

const fechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
const fecha = (iso: string | null) => (iso ? fechaHora.format(new Date(iso)) : '—')

function mensajeDe(err: unknown, porDefecto: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto
}

/**
 * L2 (v3.3, BPMN 9-A) · Configuración > Fuentes de búsqueda. Una tarjeta por tienda: el Jefe
 * Administrativo guarda la cuenta de búsqueda (D-38), prueba la sesión, enciende la tienda (D-37)
 * y fija pausa y límite diario. El Asistente Logístico solo ve el estado. La cuenta nunca se muestra.
 */
export function FuentesBusquedaPage() {
  const fuentes = useFuentes()
  const { configurarFuentes } = usePermisos()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Fuentes de búsqueda"
        descripcion="Tiendas donde el sistema busca repuestos. Cada una usa una cuenta creada solo para búsquedas (D-38) y entra a la búsqueda cuando acierta 4 o más de 10 pedidos de prueba (D-37)."
      />
      {fuentes.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando fuentes…</p>
      ) : fuentes.isError || !fuentes.data ? (
        <ErrorBanner message="No se pudieron cargar las fuentes de búsqueda. Revisa tu conexión e inténtalo de nuevo." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {fuentes.data.map((f) => (
            <TarjetaFuente key={`${f.codigo}:${f.pausaSegundos}:${f.limiteDiario}`} fuente={f} editable={configurarFuentes} />
          ))}
        </div>
      )}
    </div>
  )
}

function TarjetaFuente({ fuente, editable }: { fuente: FuenteConfig; editable: boolean }) {
  const idTitulo = `fuente-${fuente.codigo}`
  const estado = ESTADOS[fuente.estado] ?? ESTADOS.SIN_PROBAR
  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={idTitulo} className="text-base font-semibold text-foreground">{fuente.nombre}</h2>
          <p className="text-xs text-muted-foreground">{fuente.urlBase}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', estado.clase)}>{estado.texto}</span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium',
            fuente.activa ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground')}>
            {fuente.activa ? 'En la búsqueda' : 'Apagada'}
          </span>
        </div>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Última prueba</dt><dd>{fecha(fuente.ultimaPrueba)}</dd></div>
        <div><dt className="text-muted-foreground">Sesión válida hasta</dt><dd>{fecha(fuente.sesionValidaHasta)}</dd></div>
        <div>
          <dt className="text-muted-foreground">Prueba de 10 pedidos</dt>
          <dd>{fuente.aciertosPrueba == null ? 'Sin correr' : `${fuente.aciertosPrueba} de 10`}</dd>
        </div>
      </dl>

      {fuente.ultimoError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{fuente.ultimoError}</p>
      )}

      {editable && (
        <>
          <FormCuenta fuente={fuente} />
          <Acciones fuente={fuente} />
          <FormLimites fuente={fuente} />
          <ReglasExtraccion codigo={fuente.codigo} nombre={fuente.nombre} />
        </>
      )}
    </section>
  )
}

function FormCuenta({ fuente }: { fuente: FuenteConfig }) {
  const guardar = useGuardarCuenta()
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const id = (c: string) => `${c}-${fuente.codigo}`

  function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (!usuario.trim() && !clave) {
      setError('Escribe el usuario o la contraseña de la cuenta de búsqueda.')
      return
    }
    guardar.mutate(
      { codigo: fuente.codigo, usuario: usuario.trim() || undefined, clave: clave || undefined },
      {
        onSuccess: () => {
          setUsuario('')
          setClave('')
          setError(null)
          avisar(`${fuente.nombre}: cuenta guardada. Prueba la sesión.`)
        },
        onError: (err) => setError(mensajeDe(err, 'No se pudo guardar la cuenta. Inténtalo de nuevo.')),
      },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Cuenta de búsqueda</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id={id('usuario')} label="Usuario o correo">
          <input id={id('usuario')} autoComplete="off" className={inputFormClass} value={usuario}
            placeholder={fuente.tieneUsuario ? 'Guardado · escribe para cambiarlo' : ''}
            onChange={(e) => { setUsuario(e.target.value); setError(null) }} />
        </Campo>
        <Campo id={id('clave')} label="Contraseña">
          <input id={id('clave')} type="password" autoComplete="new-password" className={inputFormClass} value={clave}
            placeholder={fuente.tieneClave ? '••••••••' : ''}
            onChange={(e) => { setClave(e.target.value); setError(null) }} />
        </Campo>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : 'Guardar cuenta'}
        </Button>
      </div>
    </form>
  )
}

function Acciones({ fuente }: { fuente: FuenteConfig }) {
  const probar = useProbarSesion()
  const activar = useActivarFuente()
  const [error, setError] = useState<string | null>(null)
  const tieneCuenta = fuente.tieneUsuario && fuente.tieneClave
  const puedeActivar = fuente.estado === 'ACTIVA' && (fuente.aciertosPrueba ?? 0) >= ACIERTOS_MINIMOS
  const idAyuda = `activar-ayuda-${fuente.codigo}`

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!tieneCuenta || probar.isPending}
          onClick={() => probar.mutate(fuente.codigo, {
            onSuccess: () => setError(null),
            onError: (err) => setError(mensajeDe(err, 'No se pudo probar la sesión.')),
          })}>
          {probar.isPending ? 'Probando…' : 'Probar sesión'}
        </Button>
        {fuente.activa ? (
          <Button type="button" variant="outline" disabled={activar.isPending}
            onClick={() => activar.mutate({ codigo: fuente.codigo, activa: false }, {
              onError: (err) => setError(mensajeDe(err, 'No se pudo apagar la fuente.')),
            })}>
            Desactivar
          </Button>
        ) : (
          <Button type="button" disabled={!puedeActivar || activar.isPending} aria-describedby={idAyuda}
            onClick={() => activar.mutate({ codigo: fuente.codigo, activa: true }, {
              onSuccess: () => avisar(`${fuente.nombre} entra en la búsqueda.`),
              onError: (err) => setError(mensajeDe(err, 'No se pudo activar la fuente.')),
            })}>
            Activar
          </Button>
        )}
      </div>
      {!tieneCuenta && <p className="text-xs text-muted-foreground">Guarda la cuenta de búsqueda para poder probar la sesión.</p>}
      {!fuente.activa && !puedeActivar && (
        <p id={idAyuda} className="text-xs text-muted-foreground">
          Para activarla necesita la sesión activa y 4 o más aciertos en la prueba de 10 pedidos.
        </p>
      )}
      {error && <ErrorBanner message={error} />}
    </div>
  )
}

function FormLimites({ fuente }: { fuente: FuenteConfig }) {
  const cambiar = useCambiarLimites()
  const [pausa, setPausa] = useState(String(fuente.pausaSegundos))
  const [limite, setLimite] = useState(String(fuente.limiteDiario))
  const [error, setError] = useState<string | null>(null)
  const id = (c: string) => `${c}-${fuente.codigo}`

  function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    const p = Number(pausa)
    const l = Number(limite)
    if (!Number.isInteger(p) || p < 0 || p > 300) {
      setError('La pausa debe estar entre 0 y 300 segundos.')
      return
    }
    if (!Number.isInteger(l) || l < 1 || l > 1000) {
      setError('El límite diario debe estar entre 1 y 1000 búsquedas.')
      return
    }
    cambiar.mutate(
      { codigo: fuente.codigo, pausaSegundos: p, limiteDiario: l },
      {
        onSuccess: () => { setError(null); avisar(`${fuente.nombre}: límites guardados`) },
        onError: (err) => setError(mensajeDe(err, 'No se pudieron guardar los límites.')),
      },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id={id('pausa')} label="Pausa entre búsquedas" ayuda="Segundos (0 a 300)">
          <input id={id('pausa')} inputMode="numeric" className={cn(inputFormClass, 'text-right tabular-nums')}
            value={pausa} onChange={(e) => { setPausa(e.target.value.replace(/\D/g, '')); setError(null) }} />
        </Campo>
        <Campo id={id('limite')} label="Límite diario" ayuda="Búsquedas por día (1 a 1000)">
          <input id={id('limite')} inputMode="numeric" className={cn(inputFormClass, 'text-right tabular-nums')}
            value={limite} onChange={(e) => { setLimite(e.target.value.replace(/\D/g, '')); setError(null) }} />
        </Campo>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={cambiar.isPending}>
          {cambiar.isPending ? 'Guardando…' : 'Guardar límites'}
        </Button>
      </div>
    </form>
  )
}
