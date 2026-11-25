import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ShoppingCart, Trash2, X } from "lucide-react"
import { rutaIngresoCliente } from "@/api/contratos/ingresoCliente"
import { useCotizacionCart } from "@/hooks/useCotizacionCart"
import { puedeEntrarAlPortal } from "@/lib/sesiones"

const RUTA_SOLICITUD = "/portal/solicitud"

/**
 * Barra flotante del carrito de cotización de la landing: aparece cuando hay al menos un repuesto elegido.
 * Cerrada es una barra con el conteo; abierta es un panel para ajustar cantidades, quitar repuestos y
 * pedir la cotización (con sesión de cliente va a la solicitud; sin ella, primero al ingreso).
 */
export function CarritoFlotante() {
  const navigate = useNavigate()
  const { items, total, abierto, abrir, cerrar, cambiarCantidad, quitar } = useCotizacionCart()

  // Sin repuestos no hay panel: la próxima vez que se agregue uno empieza cerrado.
  useEffect(() => {
    if (total === 0 && abierto) cerrar()
  }, [total, abierto, cerrar])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") cerrar()
    }
    document.addEventListener("keydown", alPulsar)
    return () => document.removeEventListener("keydown", alPulsar)
  }, [abierto, cerrar])

  if (total === 0) return null

  const palabra = total === 1 ? "repuesto" : "repuestos"

  function solicitar() {
    cerrar()
    navigate(puedeEntrarAlPortal() ? RUTA_SOLICITUD : rutaIngresoCliente(RUTA_SOLICITUD))
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 w-[calc(100vw-2rem)] max-w-sm">
      {abierto ? (
        <div role="region" aria-label="Carrito de cotización" className="flex max-h-[70vh] flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-lg">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="font-semibold">Tu cotización</h2>
            <span className="text-sm text-muted-foreground">{total} {palabra}</span>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar carrito"
              className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <ul className="-mx-1 flex flex-col divide-y divide-border overflow-y-auto px-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.nombre}</p>
                  {item.marca && <p className="text-xs text-muted-foreground">{item.marca}</p>}
                  {item.numeroParte && <p className="font-mono text-xs text-muted-foreground">{item.numeroParte}</p>}
                </div>
                <label className="sr-only" htmlFor={`carrito-cantidad-${item.id}`}>Cantidad de {item.nombre}</label>
                <input
                  id={`carrito-cantidad-${item.id}`}
                  type="number"
                  min={1}
                  step={1}
                  value={item.cantidad}
                  onChange={(e) => cambiarCantidad(item.id, Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => quitar(item.id)}
                  aria-label={`Quitar ${item.nombre}`}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">Te confirmamos precio y plazo en la cotización. No es una compra.</p>
          <button
            type="button"
            onClick={solicitar}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Solicitar cotización ({total})
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={abrir}
          aria-expanded={false}
          aria-label={`Tu cotización: ${total} ${palabra}. Abrir carrito`}
          className="ml-auto flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Tu cotización
          <span className="rounded-full bg-amarillo px-2 py-0.5 text-xs font-extrabold text-[#0f2440]">{total}</span>
        </button>
      )}
    </div>
  )
}
