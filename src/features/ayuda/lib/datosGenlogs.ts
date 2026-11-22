import { Clock, Mail, MapPin, Phone, type LucideIcon } from "lucide-react"

export interface DatoContacto {
  id: string
  etiqueta: string
  /** null mientras Luana no lo confirme con GENLOGS: no se muestra. */
  valor: string | null
  href?: string
  Icono: LucideIcon
}

/**
 * Datos públicos de GENLOGS para Contáctame (v3.4, K2). Solo se muestran los que
 * tienen valor; el resto se completa cuando Luana los confirme con GENLOGS.
 */
export const DATOS_GENLOGS: DatoContacto[] = [
  { id: "correo", etiqueta: "Correo de ventas", valor: "ventas1@genlogsac.com", href: "mailto:ventas1@genlogsac.com", Icono: Mail },
  { id: "telefono", etiqueta: "Teléfono", valor: null, Icono: Phone },
  { id: "direccion", etiqueta: "Dirección", valor: null, Icono: MapPin },
  { id: "horario", etiqueta: "Horario de atención", valor: null, Icono: Clock },
]

export function datosConValor(datos: DatoContacto[] = DATOS_GENLOGS): DatoContacto[] {
  return datos.filter((d) => d.valor !== null && d.valor.trim() !== "")
}
