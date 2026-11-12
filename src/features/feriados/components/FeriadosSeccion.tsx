import { useState } from 'react'
import { CalendarOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { avisar } from '@/lib/avisos'
import { usePermisos } from '@/lib/permisos'
import type { Feriado } from '@/api/feriadosApi'
import { useCrearFeriado, useFeriados, useQuitarFeriado } from '../hooks/useFeriados'
import { esFutura, fechaLarga, manana, validarFeriado } from '../lib/fechasFeriado'

const mensajeError = (err: unknown, porDefecto: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto

/**
 * D-18: feriados que no cuentan en los plazos de respuesta. Se muestra dentro de
 * Parámetros. Todo el personal ve la lista; el Jefe Administrativo agrega y quita
 * fechas (solo futuras: una fecha pasada ya se usó para calcular plazos).
 */
export function FeriadosSeccion() {
  const { editarFeriados } = usePermisos()
  const feriados = useFeriados()
  const crear = useCrearFeriado()
  const quitar = useQuitarFeriado()

  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [porQuitar, setPorQuitar] = useState<Feriado | null>(null)

  const lista = feriados.data ?? []

  function agregar(ev: React.FormEvent) {
    ev.preventDefault()
    const problema = validarFeriado(fecha, descripcion, lista)
    if (problema) {
      setError(problema)
      return
    }
    crear.mutate(
      { fecha, descripcion: descripcion.trim() },
      {
        onSuccess: () => {
          avisar('Feriado agregado')
          setFecha('')
          setDescripcion('')
          setError(null)
        },
        onError: (err) => setError(mensajeError(err, 'No se pudo agregar el feriado. Inténtalo de nuevo.')),
      },
    )
  }

  function confirmarQuitar() {
    if (!porQuitar) return
    quitar.mutate(porQuitar.idFeriado, {
      onSuccess: () => {
        avisar('Feriado quitado')
        setPorQuitar(null)
      },
      onError: (err) => {
        setPorQuitar(null)
        setError(mensajeError(err, 'No se pudo quitar el feriado. Inténtalo de nuevo.'))
      },
    })
  }

  return (
    <section aria-labelledby="titulo-feriados" className="rounded-xl border border-border bg-card p-5">
      <h2 id="titulo-feriados" className="text-base font-semibold text-foreground">Feriados</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Estas fechas no cuentan como días hábiles en los plazos de respuesta. Solo se pueden agregar o quitar fechas futuras.
      </p>

      {feriados.isLoading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">Cargando feriados…</p>
      ) : feriados.isError ? (
        <div className="mt-4"><ErrorBanner message="No se pudieron cargar los feriados. Revisa tu conexión e inténtalo de nuevo." /></div>
      ) : lista.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
          <CalendarOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          No hay feriados registrados desde hoy.
        </p>
      ) : (
        <ul aria-label="Próximos feriados" className="mt-4 divide-y divide-border rounded-lg border border-border">
          {lista.map((f) => (
            <li key={f.idFeriado} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize text-foreground">{fechaLarga(f.fecha)}</p>
                <p className="truncate text-sm text-muted-foreground">{f.descripcion}</p>
              </div>
              {editarFeriados && esFutura(f.fecha) && (
                <button
                  type="button"
                  onClick={() => setPorQuitar(f)}
                  aria-label={`Quitar el feriado del ${fechaLarga(f.fecha)}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editarFeriados && (
        <form onSubmit={agregar} noValidate aria-label="Agregar feriado" className="mt-5 grid gap-4 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
          <Campo id="feriado-fecha" label="Fecha">
            <input
              id="feriado-fecha"
              type="date"
              min={manana()}
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); setError(null) }}
              className={inputFormClass}
            />
          </Campo>
          <Campo id="feriado-motivo" label="Motivo" ayuda="Por ejemplo: Día de la Independencia.">
            <input
              id="feriado-motivo"
              maxLength={100}
              value={descripcion}
              onChange={(e) => { setDescripcion(e.target.value); setError(null) }}
              aria-describedby={describedBy('feriado-motivo', { ayuda: 'Por ejemplo: Día de la Independencia.' })}
              className={inputFormClass}
            />
          </Campo>
          <Button type="submit" disabled={crear.isPending}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {crear.isPending ? 'Agregando…' : 'Agregar'}
          </Button>
        </form>
      )}

      {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

      <ConfirmDialog
        open={porQuitar !== null}
        title="Quitar feriado"
        description={porQuitar ? `El ${fechaLarga(porQuitar.fecha)} (${porQuitar.descripcion}) volverá a contar como día hábil en los plazos.` : ''}
        confirmLabel="Quitar"
        variant="destructive"
        isLoading={quitar.isPending}
        onConfirm={confirmarQuitar}
        onCancel={() => setPorQuitar(null)}
      />
    </section>
  )
}
