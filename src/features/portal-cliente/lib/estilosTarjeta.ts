import type { CSSProperties } from "react"

/** Elevación sutil al pasar el cursor; sin movimiento si la persona pidió «movimiento reducido». */
export const TARJETA_ELEVABLE =
  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"

/**
 * Entrada suave (fade-in + translate-y) de las tarjetas. Usa `backwards` y no `both`: al terminar la animación
 * no deja un transform fijo que anularía el hover.
 */
export const ENTRADA_TARJETA = "animate-[tarjeta-entra_0.35s_ease-out_backwards] motion-reduce:animate-none"

const PASO_MS = 60
const MAX_ESCALONADAS = 8

/** Retardo escalonado: cada tarjeta entra 60 ms después de la anterior (tope en la 9.ª, para que listas largas no tarden). */
export function retardoEntrada(indice: number): CSSProperties {
  return { animationDelay: `${Math.min(indice, MAX_ESCALONADAS) * PASO_MS}ms` }
}
