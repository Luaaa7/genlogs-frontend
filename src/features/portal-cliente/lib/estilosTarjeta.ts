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

/**
 * Tarjeta del portal con el lenguaje de Repuestos: blanca en claro, azul marino en oscuro, borde sutil,
 * sombra moderada y elevación al pasar el cursor.
 */
export const TARJETA_PORTAL =
  "rounded-xl border border-slate-200 bg-white shadow-sm hover:border-[#2E6BA8]/40 hover:shadow-lg hover:shadow-[#1E3A5F]/10 sm:rounded-2xl dark:border-white/10 dark:bg-[#0F213D] dark:hover:border-[#60A5FA]/40 dark:hover:shadow-black/40"

/** Cuadro del icono que abre cada tarjeta (pedido, cotización, comprobante, despacho). */
export const ICONO_TARJETA =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2E6BA8]/10 text-[#2E6BA8] ring-1 ring-[#2E6BA8]/15 dark:bg-[#60A5FA]/10 dark:text-[#93C5FD] dark:ring-[#60A5FA]/20"

/** Enlace o botón secundario de las tarjetas («Ver detalle», «Vista rápida»). */
export const BOTON_SECUNDARIO =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#1E3A5F] transition-colors hover:border-[#2E6BA8]/50 hover:bg-[#EEF3F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04] dark:text-[#93C5FD] dark:hover:bg-white/[0.08]"
