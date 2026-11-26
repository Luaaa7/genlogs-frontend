import { useLocation } from "react-router-dom"
import { MENSAJE_SESION_VENCIDA, sesionVencidaEn } from "@/lib/sesiones"

/** Aviso del login (interno y del portal) cuando un 401 cerró la sesión: se activa con ?motivo=sesion-expirada. */
export function AvisoSesionVencida() {
  const { search } = useLocation()
  if (!sesionVencidaEn(search)) return null
  return (
    <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      {MENSAJE_SESION_VENCIDA}
    </p>
  )
}
