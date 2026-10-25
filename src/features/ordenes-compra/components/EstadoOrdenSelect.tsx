import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AxiosError } from 'axios'
import { Check, ChevronDown, Loader2 } from 'lucide-react'
import { useCambiarEstadoOrdenCompra } from '../hooks/useOrdenesCompra'
import { EstadoBadge, type EstadoBadgeTono } from '@/components/ui/EstadoBadge'
import { ESTADOS_ORDEN, estadoDe } from '@/lib/formatters/estados'
import { cn } from '@/lib/utils'
import type { EstadoOrdenCompra } from '@/types/ordenCompra.types'

/** Estados finales: ya no se pueden cambiar (el backend también lo bloquea). */
const ESTADOS_FINALES = new Set<string>(['ATENDIDA', 'ANULADA'])

/** Punto de color de cada opción, del mismo tono que su etiqueta. */
const PUNTO: Record<EstadoBadgeTono, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  accent: 'bg-accent',
  neutral: 'bg-muted-foreground',
}

const ANCHO_MENU = 208

interface Props {
  idOrden: number
  estadoActual: string
  numero: string
  onError: (mensaje: string) => void
}

/**
 * Etiqueta del estado + botón "Cambiar" que abre un menú con los estados.
 * El menú va en un portal porque la tabla recorta lo que sobresale.
 */
export function EstadoOrdenSelect({ idOrden, estadoActual, numero, onError }: Props) {
  const { mutate, isPending } = useCambiarEstadoOrdenCompra(idOrden)
  const actual = estadoDe(ESTADOS_ORDEN, estadoActual)

  const [abierto, setAbierto] = useState(false)
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const cerrar = useCallback(() => setAbierto(false), [])

  // Ubica el menú debajo de la etiqueta (o encima si no entra abajo).
  useLayoutEffect(() => {
    if (!abierto || !botonRef.current) return
    const r = botonRef.current.getBoundingClientRect()
    const alto = menuRef.current?.offsetHeight ?? 160
    const abajo = r.bottom + 6 + alto <= window.innerHeight
    setPosicion({
      top: abajo ? r.bottom + 6 : r.top - 6 - alto,
      left: Math.min(r.left, window.innerWidth - ANCHO_MENU - 8),
    })
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !botonRef.current?.contains(t)) cerrar()
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar()
        botonRef.current?.focus()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
        const i = items.indexOf(document.activeElement as HTMLButtonElement)
        const sig = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
        items[sig]?.focus()
      }
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [abierto, cerrar])

  const badge = <EstadoBadge tono={actual.tono}>{actual.label}</EstadoBadge>

  // Atendida y Anulada no tienen vuelta atrás: solo se muestra la etiqueta.
  if (ESTADOS_FINALES.has(estadoActual)) return badge

  function elegir(nuevo: EstadoOrdenCompra) {
    setAbierto(false)
    mutate(nuevo, {
      onError: (err) =>
        onError(`No se pudo cambiar el estado de la orden ${numero}. ${(err as AxiosError<{ message?: string }>).response?.data?.message ?? ''}`.trim()),
    })
  }

  const opciones = Object.entries(ESTADOS_ORDEN) as [EstadoOrdenCompra, (typeof ESTADOS_ORDEN)[string]][]

  return (
    <>
      <div className="flex items-center gap-1.5">
        {badge}
        <button
          ref={botonRef}
          type="button"
          onClick={() => setAbierto((v) => !v)}
          disabled={isPending}
          aria-haspopup="menu"
          aria-expanded={abierto}
          aria-label={`Cambiar estado de la orden ${numero}`}
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors',
            'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait',
            abierto && 'bg-muted text-foreground',
          )}
        >
          {isPending ? 'Guardando…' : 'Cambiar'}
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', abierto && 'rotate-180')} aria-hidden="true" />
          )}
        </button>
      </div>

      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Cambiar estado de la orden ${numero}`}
            style={{ top: posicion?.top ?? -9999, left: posicion?.left ?? -9999, width: ANCHO_MENU }}
            className="fixed z-[90] rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none"
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cambiar estado</p>
            {opciones.map(([codigo, e]) => {
              const esActual = codigo === estadoActual
              return (
                <button
                  key={codigo}
                  type="button"
                  role="menuitem"
                  disabled={esActual}
                  onClick={() => elegir(codigo)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none',
                    esActual ? 'cursor-default text-muted-foreground' : 'text-foreground hover:bg-muted focus-visible:bg-muted',
                  )}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', PUNTO[e.tono])} aria-hidden="true" />
                  <span className="flex-1">{e.label}</span>
                  {esActual && <Check className="h-4 w-4 text-accent" aria-label="Estado actual" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}

    </>
  )
}