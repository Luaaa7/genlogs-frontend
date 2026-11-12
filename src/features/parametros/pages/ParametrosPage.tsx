import { useState } from 'react'
import { Clock } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { avisar } from '@/lib/avisos'
import { usePermisos } from '@/lib/permisos'
import { cn } from '@/lib/utils/utils'
import type { ParametroSistema } from '@/api/contratos/parametros'
import { FeriadosSeccion } from '@/features/feriados/components/FeriadosSeccion'
import { useGuardarGrupo, useParametros } from '../hooks/useParametros'
import {
  GRUPOS_PARAMETROS,
  HORARIO_HABIL,
  SUFIJO_UNIDAD,
  clavesCambiadas,
  validarGrupo,
  type GrupoParametros,
} from '../lib/gruposParametros'

const fechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * Parámetros del sistema (RF-87): monto de alto valor, márgenes, plazos de
 * respuesta, verificación de la vitrina y feriados (D-18). Solo el Jefe
 * Administrativo edita; cada grupo se guarda por separado. APIs: /api/parametros
 * (BE-D) y /api/feriados (BE-B).
 */
export function ParametrosPage() {
  const parametros = useParametros()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Parámetros"
        descripcion="Valores que usa el sistema para cotizar, controlar plazos y mantener la vitrina. Cada grupo se guarda por separado."
      />

      {parametros.isLoading ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <table className="w-full"><tbody><TableSkeletonRows columns={3} rows={6} /></tbody></table>
        </div>
      ) : parametros.isError || !parametros.data ? (
        <ErrorBanner message="No se pudieron cargar los parámetros. Revisa tu conexión e inténtalo de nuevo." />
      ) : (
        <Grupos parametros={parametros.data} />
      )}

      <section aria-labelledby="horario-habil" className="rounded-xl border border-border bg-card p-5">
        <h2 id="horario-habil" className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Horario hábil
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Los plazos se cuentan solo en este horario. Por ahora está fijo en el sistema; los feriados se excluyen.
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          {HORARIO_HABIL.map((h) => (
            <div key={h.dias} className="rounded-lg bg-muted/50 px-3 py-2">
              <dt className="text-muted-foreground">{h.dias}</dt>
              <dd className="font-medium tabular-nums text-foreground">{h.horario}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* D-18: feriados editables (API de BE-B), dentro de Parámetros. */}
      <FeriadosSeccion />
    </div>
  )
}

function Grupos({ parametros }: { parametros: ParametroSistema[] }) {
  const guardados: Record<string, string> = Object.fromEntries(parametros.map((p) => [p.clave, p.valor]))
  const editadoEn: Record<string, string> = Object.fromEntries(parametros.map((p) => [p.clave, p.editadoEn]))
  // Se vuelve a montar con lo guardado cada vez que llegan datos nuevos del backend.
  const version = parametros.map((p) => `${p.clave}=${p.valor}`).join('|')

  return (
    <>
      {GRUPOS_PARAMETROS.map((grupo) => (
        <GrupoEditable key={`${grupo.id}:${version}`} grupo={grupo} guardados={guardados} editadoEn={editadoEn} />
      ))}
    </>
  )
}

function GrupoEditable({ grupo, guardados, editadoEn }: {
  grupo: GrupoParametros
  guardados: Record<string, string>
  editadoEn: Record<string, string>
}) {
  const { editarParametros } = usePermisos()
  const guardar = useGuardarGrupo()
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(grupo.campos.map((c) => [c.clave, guardados[c.clave] ?? ''])),
  )
  const [error, setError] = useState<string | null>(null)

  const faltan = grupo.campos.filter((c) => guardados[c.clave] === undefined)
  const cambiadas = clavesCambiadas(grupo, guardados, valores)
  const ultimaEdicion = grupo.campos
    .map((c) => editadoEn[c.clave])
    .filter(Boolean)
    .sort()
    .at(-1)

  function cambiar(clave: string, texto: string) {
    setValores((v) => ({ ...v, [clave]: texto.replace(/[^0-9.,]/g, '') }))
    setError(null)
  }

  function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    const problema = validarGrupo(grupo, valores)
    if (problema) {
      setError(problema)
      return
    }
    guardar.mutate(
      { grupo, guardados, valores },
      {
        onSuccess: () => avisar(`${grupo.titulo}: cambios guardados`),
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(msg ?? 'No se pudo guardar. Inténtalo de nuevo.')
        },
      },
    )
  }

  const idTitulo = `grupo-${grupo.id}`
  return (
    <form onSubmit={enviar} noValidate aria-labelledby={idTitulo} className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={idTitulo} className="text-base font-semibold text-foreground">{grupo.titulo}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{grupo.descripcion}</p>
        </div>
        {ultimaEdicion && (
          <p className="text-xs text-muted-foreground">Última edición: {fechaHora.format(new Date(ultimaEdicion))}</p>
        )}
      </div>

      {faltan.length > 0 ? (
        <p role="status" className="mt-4 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning-text">
          Faltan en la base: {faltan.map((c) => c.clave).join(', ')}. Hay que correr las migraciones de la v3.2.
        </p>
      ) : (
        <>
          <div className={cn('mt-4 grid gap-4', grupo.campos.length > 2 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2')}>
            {grupo.campos.map((campo) => {
              const id = `param-${campo.clave}`
              const sufijo = SUFIJO_UNIDAD[campo.unidad]
              return (
                <Campo key={campo.clave} id={id} label={campo.etiqueta} ayuda={campo.ayuda}>
                  <div className="flex items-center gap-2">
                    {campo.unidad === 'soles' && <span className="text-sm text-muted-foreground" aria-hidden="true">{sufijo}</span>}
                    <input
                      id={id}
                      inputMode={campo.unidad === 'dias' || campo.unidad === 'cantidad' ? 'numeric' : 'decimal'}
                      value={valores[campo.clave] ?? ''}
                      onChange={(e) => cambiar(campo.clave, e.target.value)}
                      readOnly={!editarParametros}
                      aria-describedby={describedBy(id, { ayuda: campo.ayuda })}
                      className={cn(inputFormClass, 'text-right tabular-nums', cambiadas.includes(campo.clave) && 'border-accent')}
                    />
                    {campo.unidad !== 'soles' && <span className="w-10 shrink-0 text-sm text-muted-foreground" aria-hidden="true">{sufijo}</span>}
                  </div>
                </Campo>
              )
            })}
          </div>

          {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

          {editarParametros && (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={cambiadas.length === 0 || guardar.isPending}
                onClick={() => {
                  setValores(Object.fromEntries(grupo.campos.map((c) => [c.clave, guardados[c.clave] ?? ''])))
                  setError(null)
                }}
              >
                Deshacer
              </Button>
              <Button type="submit" disabled={cambiadas.length === 0 || guardar.isPending}>
                {guardar.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          )}
        </>
      )}
    </form>
  )
}
