import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { avisar } from '@/lib/avisos'
import { cn } from '@/lib/utils/utils'
import {
  guardarSelectores,
  listarSelectores,
  type CampoSelector,
  type PaginaSelector,
  type ReglaExtraccion,
} from '@/api/fuentesApi'

const LARGO_MAXIMO = 1000

const PAGINAS: { pagina: PaginaSelector; titulo: string; campos: CampoSelector[] }[] = [
  { pagina: 'BUSQUEDA', titulo: 'Página de búsqueda', campos: ['ITEM', 'NOMBRE', 'DESCRIPCION', 'PRECIO', 'MONEDA', 'IMAGEN', 'ENLACE'] },
  { pagina: 'FICHA', titulo: 'Ficha del producto', campos: ['NOMBRE', 'DESCRIPCION', 'PRECIO', 'MONEDA', 'IMAGEN', 'ENLACE'] },
]

const ETIQUETAS: Record<CampoSelector, string> = {
  ITEM: 'Bloque de cada resultado',
  NOMBRE: 'Nombre',
  DESCRIPCION: 'Descripción',
  PRECIO: 'Precio',
  MONEDA: 'Moneda',
  IMAGEN: 'Imagen',
  ENLACE: 'Enlace',
}

const clave = (pagina: PaginaSelector, campo: CampoSelector) => `${pagina}:${campo}`

/**
 * M4 (v3.3, BPMN 9-A «Revisar reglas de extracción») · Reglas CSS de cada tienda, por página y
 * campo (fuente_selector). Solo el Jefe Administrativo. Las reglas son datos, nunca código: el
 * servicio de lectura las aplica (A4). «Probar regla» llega cuando el lector esté conectado.
 */
export function ReglasExtraccion({ codigo, nombre }: { codigo: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false)
  const idPanel = `reglas-${codigo}`
  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
      >
        {abierto ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
        Reglas de extracción
      </button>
      {abierto && (
        <div id={idPanel} className="mt-3">
          <Editor codigo={codigo} nombre={nombre} />
        </div>
      )}
    </div>
  )
}

function Editor({ codigo, nombre }: { codigo: string; nombre: string }) {
  const consulta = useQuery({ queryKey: ['fuentes-reglas', codigo], queryFn: () => listarSelectores(codigo) })
  if (consulta.isLoading) return <p className="text-sm text-muted-foreground">Cargando reglas…</p>
  if (consulta.isError || !consulta.data) {
    return <ErrorBanner message="No se pudieron cargar las reglas de esta tienda." />
  }
  const version = consulta.data.map((r) => `${clave(r.pagina, r.campo)}=${r.regla}`).join('|')
  return <Formulario key={version} codigo={codigo} nombre={nombre} guardadas={consulta.data} />
}

function Formulario({ codigo, nombre, guardadas }: { codigo: string; nombre: string; guardadas: ReglaExtraccion[] }) {
  const qc = useQueryClient()
  const original: Record<string, string> = Object.fromEntries(guardadas.map((r) => [clave(r.pagina, r.campo), r.regla]))
  const [valores, setValores] = useState<Record<string, string>>(original)
  const [error, setError] = useState<string | null>(null)
  const guardar = useMutation({
    mutationFn: (reglas: ReglaExtraccion[]) => guardarSelectores(codigo, reglas),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fuentes-reglas', codigo] }),
  })

  function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    const cambios: ReglaExtraccion[] = []
    for (const { pagina, titulo, campos } of PAGINAS) {
      for (const campo of campos) {
        const k = clave(pagina, campo)
        const nuevo = (valores[k] ?? '').trim()
        const antes = original[k]
        if (antes !== undefined && nuevo === '') {
          setError(`${titulo} · ${ETIQUETAS[campo]}: una regla guardada no se puede dejar vacía.`)
          return
        }
        if (nuevo.length > LARGO_MAXIMO) {
          setError(`${titulo} · ${ETIQUETAS[campo]}: la regla no puede pasar de ${LARGO_MAXIMO} caracteres.`)
          return
        }
        if (nuevo !== '' && nuevo !== antes) cambios.push({ pagina, campo, regla: nuevo })
      }
    }
    if (cambios.length === 0) {
      setError('No hay cambios para guardar.')
      return
    }
    guardar.mutate(cambios, {
      onSuccess: () => { setError(null); avisar(`${nombre}: reglas guardadas`) },
      onError: (err: unknown) => setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'No se pudieron guardar las reglas. Inténtalo de nuevo.'),
    })
  }

  return (
    <form onSubmit={enviar} noValidate aria-label={`Reglas de extracción de ${nombre}`} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Selectores CSS que usa el servicio de lectura en esta tienda. «Bloque de cada resultado» marca cada ficha en la
        búsqueda; los demás campos se leen dentro de ese bloque o en la ficha del producto.
      </p>
      {PAGINAS.map(({ pagina, titulo, campos }) => (
        <fieldset key={pagina} className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-foreground">{titulo}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {campos.map((campo) => {
              const k = clave(pagina, campo)
              const id = `regla-${codigo}-${pagina}-${campo}`
              const cambiado = (valores[k] ?? '').trim() !== (original[k] ?? '')
              return (
                <Campo key={k} id={id} label={ETIQUETAS[campo]}>
                  <input
                    id={id}
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(inputFormClass, 'font-mono text-xs', cambiado && 'border-accent')}
                    value={valores[k] ?? ''}
                    onChange={(e) => { setValores((v) => ({ ...v, [k]: e.target.value })); setError(null) }}
                  />
                </Campo>
              )
            })}
          </div>
        </fieldset>
      ))}
      {error && <ErrorBanner message={error} />}
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={guardar.isPending}>
          {guardar.isPending ? 'Guardando…' : 'Guardar reglas'}
        </Button>
      </div>
    </form>
  )
}
