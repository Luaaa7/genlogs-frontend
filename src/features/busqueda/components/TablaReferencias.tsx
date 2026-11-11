import { Check, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EstadoBadge, type EstadoBadgeTono } from "@/components/ui/EstadoBadge"
import { Tabla, Td, Th, filaClass } from "@/components/ui/tabla"
import { formatCurrency } from "@/lib/formatters/currency"
import type { EstadoReferencia, Referencia } from "@/api/sourcingApi"

const ESTADOS_REFERENCIA: Record<EstadoReferencia, { label: string; tono: EstadoBadgeTono }> = {
  CAPTURADO: { label: "Nueva", tono: "info" },
  UTIL: { label: "Útil", tono: "success" },
  DESCARTADO: { label: "Descartada", tono: "neutral" },
  CONVERTIDO: { label: "En vitrina", tono: "accent" },
}

const FUENTES: Record<string, string> = {
  EBAY: "eBay",
  MERCADO_LIBRE: "Mercado Libre",
  AMAZON: "Amazon",
  ALIBABA: "Alibaba",
  PROVEEDOR: "Proveedor",
}

interface Props {
  referencias: Referencia[]
  /** Solo el Asistente Logístico marca; los demás roles ven la tabla sin acciones. */
  puedeMarcar: boolean
  marcando?: number
  onMarcar: (idSourcing: number, estado: "UTIL" | "DESCARTADO") => void
}

export function TablaReferencias({ referencias, puedeMarcar, marcando, onMarcar }: Props) {
  return (
    <Tabla titulo="Referencias encontradas" minWidth={860}>
      <thead>
        <tr>
          <Th>Fuente</Th>
          <Th>Referencia</Th>
          <Th>N.º de parte</Th>
          <Th alinear="derecha">Precio</Th>
          <Th alinear="derecha">Puesto en Lima</Th>
          <Th>Estado</Th>
          {puedeMarcar && <Th alinear="derecha">Acciones</Th>}
        </tr>
      </thead>
      <tbody>
        {referencias.map((r) => {
          const estado = ESTADOS_REFERENCIA[r.estado]
          const bloqueada = r.estado === "CONVERTIDO"
          const ocupada = marcando === r.idSourcing
          return (
            <tr key={r.idSourcing} className={filaClass}>
              <Td className="whitespace-nowrap">
                {FUENTES[r.fuente] ?? r.fuente}
                {r.metodo === "URL" && <span className="ml-1 text-xs text-muted-foreground">(URL)</span>}
              </Td>
              <Td className="max-w-80">
                <div className="flex flex-col gap-0.5">
                  <span className="line-clamp-2">{r.titulo ?? "Sin título"}</span>
                  {r.urlReferencia && (
                    <a
                      href={r.urlReferencia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-fit items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Ver en la tienda
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span className="sr-only">(se abre en otra pestaña)</span>
                    </a>
                  )}
                  {r.editadoAMano && <span className="text-xs text-muted-foreground">Editada a mano</span>}
                </div>
              </Td>
              <Td className="whitespace-nowrap font-mono text-xs">{r.numeroParte ?? "—"}</Td>
              <Td alinear="derecha" className="whitespace-nowrap tabular-nums">
                {r.precioRef != null ? formatCurrency(r.precioRef, r.codigoMoneda ?? "PEN") : "—"}
              </Td>
              <Td alinear="derecha" className="whitespace-nowrap tabular-nums">
                {r.costoPuestoLima != null ? formatCurrency(r.costoPuestoLima, "PEN") : "—"}
              </Td>
              <Td>
                <EstadoBadge tono={estado.tono}>{estado.label}</EstadoBadge>
              </Td>
              {puedeMarcar && (
                <Td alinear="derecha" className="whitespace-nowrap">
                  {!bloqueada && (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={r.estado === "UTIL" ? "default" : "outline"}
                        disabled={ocupada || r.estado === "UTIL"}
                        onClick={() => onMarcar(r.idSourcing, "UTIL")}
                        aria-label={`Marcar como útil: ${r.titulo ?? r.idSourcing}`}
                      >
                        <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                        Útil
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ocupada || r.estado === "DESCARTADO"}
                        onClick={() => onMarcar(r.idSourcing, "DESCARTADO")}
                        aria-label={`Descartar: ${r.titulo ?? r.idSourcing}`}
                      >
                        <X className="mr-1 h-4 w-4" aria-hidden="true" />
                        Descartar
                      </Button>
                    </div>
                  )}
                </Td>
              )}
            </tr>
          )
        })}
      </tbody>
    </Tabla>
  )
}
