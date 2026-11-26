import { Truck } from "lucide-react"
import { nombreEtapa, type EtapaCodigo } from "@/features/despacho/api/despachoTipos"
import { etapasDelDespacho } from "../lib/etapasDespacho"
import { LineaEtapas } from "./LineaEtapas"

/** Línea de progreso del despacho. Si la etapa no es conocida, no se dibuja. */
export function EtapasDespacho({ etapa, className }: { etapa: string; className?: string }) {
  const etapas = etapasDelDespacho(etapa)
  const actual = etapas.indexOf(etapa as EtapaCodigo)
  if (actual === -1) return null
  return (
    <LineaEtapas
      etapas={etapas.map(nombreEtapa)}
      actual={actual}
      terminado={etapa === "ENTREGADO"}
      IconoEnCurso={Truck}
      resumen={`Etapa ${actual + 1} de ${etapas.length}: ${nombreEtapa(etapas[actual])}`}
      className={className}
    />
  )
}
