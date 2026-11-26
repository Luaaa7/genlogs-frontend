import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { X } from "lucide-react"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import type { Pedido } from "@/types/portal.types"
import { usePedido } from "../hooks/usePedido"
import { TONO_ESTADO_PEDIDO, etiquetaEstado, resumenCotizacion } from "../lib/estadoPedido"
import { ProgresoPedido } from "./ProgresoPedido"

/** Lo que dura la transición de salida antes de desmontar el panel (igual a duration-300). */
const SALIDA_MS = 300

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/**
 * Panel lateral con lo esencial de una solicitud (ítems y estado de su cotización) sin salir de Mis pedidos,
 * así el filtro activo no se pierde. El foco entra al panel y se queda dentro (Tab da la vuelta); al cerrar, la página lo devuelve al botón que lo abrió.
 */
export function VistaRapidaPedido({ pedido, onCerrar }: { pedido: Pedido; onCerrar: () => void }) {
  const detalle = usePedido(String(pedido.id))
  const panel = useRef<HTMLDivElement>(null)
  const cerrar = useRef<HTMLButtonElement>(null)
  const titulo = pedido.asunto ?? "Solicitud de abastecimiento"

  // Entra con transición: primero fuera de pantalla y un instante después en su lugar.
  const [abierto, setAbierto] = useState(false)
  useEffect(() => {
    const temporizador = setTimeout(() => setAbierto(true), 20)
    return () => clearTimeout(temporizador)
  }, [])

  // Sale con transición: se anima la salida y recién entonces se avisa a la página (sin movimiento, al instante).
  const salida = useRef<ReturnType<typeof setTimeout> | null>(null)
  const solicitarCierre = useCallback(() => {
    if (salida.current) return
    setAbierto(false)
    const sinMovimiento = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    salida.current = setTimeout(onCerrar, sinMovimiento ? 0 : SALIDA_MS)
  }, [onCerrar])
  useEffect(() => () => {
    if (salida.current) clearTimeout(salida.current)
  }, [])

  // Al abrir, el foco entra al panel; quien lo abrió devuelve el foco a su botón al cerrar.
  useEffect(() => {
    cerrar.current?.focus()
  }, [])

  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        solicitarCierre()
        return
      }
      if (evento.key !== "Tab" || !panel.current) return
      const enfocables = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      if (enfocables.length === 0) return
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener("keydown", alPulsar)
    return () => document.removeEventListener("keydown", alPulsar)
  }, [solicitarCierre])

  const items = detalle.data?.items ?? []

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300 motion-reduce:transition-none ${abierto ? "opacity-100" : "opacity-0"}`}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) solicitarCierre()
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vista-rapida-titulo"
        className={`flex h-full w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none dark:border-border dark:bg-card ${abierto ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{pedido.codigo ?? `Pedido #${pedido.id}`}</p>
            <h2 id="vista-rapida-titulo" className="mt-1 text-xl font-semibold">{titulo}</h2>
            <EstadoBadge tono={TONO_ESTADO_PEDIDO[pedido.estado] ?? "neutral"} className="mt-2">{etiquetaEstado(pedido.estado)}</EstadoBadge>
          </div>
          <button
            ref={cerrar}
            type="button"
            onClick={solicitarCierre}
            aria-label="Cerrar vista rápida"
            className={`shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground ${FOCO}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <ProgresoPedido estado={pedido.estado} etiqueta={`Avance de ${titulo}`} />

        <section aria-labelledby="vista-rapida-items">
          <h3 id="vista-rapida-items" className="font-semibold">Ítems de la solicitud</h3>
          {detalle.isPending ? (
            <p role="status" className="mt-2 text-sm text-muted-foreground">Cargando ítems...</p>
          ) : detalle.isError ? (
            <p role="alert" className="mt-2 text-sm text-muted-foreground">No pudimos cargar los ítems. Abre el detalle completo para verlos.</p>
          ) : items.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Esta solicitud no tiene ítems registrados.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-border dark:border-border">
              {items.map((item, i) => (
                <li key={item.id ?? i} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0">{item.descripcion}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{item.cantidad}{item.unidad ? ` ${item.unidad}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="vista-rapida-cotizacion">
          <h3 id="vista-rapida-cotizacion" className="font-semibold">Estado de la cotización</h3>
          <p className="mt-2 text-sm text-muted-foreground">{resumenCotizacion(pedido.estado)}</p>
        </section>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          {pedido.estado === "COTIZADA" && (
            <Link to="/portal/cotizaciones" className={`inline-flex items-center justify-center rounded-md bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#183153] hover:bg-[#EAB308] ${FOCO}`}>
              Ver cotizaciones
            </Link>
          )}
          <Link to={`/portal/pedidos/${pedido.id}`} className={`inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-muted dark:border-border ${FOCO}`}>
            Ver detalle completo
          </Link>
        </div>
      </div>
    </div>
  )
}
