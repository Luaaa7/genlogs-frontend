// src/features/proformas/components/ProformaTable.tsx
import { Link } from "react-router-dom"
import { Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/formatters/currency"
import { formatearFechaCorta } from "@/lib/formatters/fechaLocal"
import { formatearNumeroOrdenCompra } from "@/lib/formatters/numeroOrdenCompra"
import { cn } from "@/lib/utils"
import { ESTADOS_PROFORMA, ETIQUETA_ESTADO_PROFORMA } from "@/types/proforma.types"
import type { EstadoProforma, Proforma } from "@/types/proforma.types"
import { EstadoProformaBadge } from "./EstadoProformaBadge"

interface ProformaTableProps {
  proformas: Proforma[]
  isLoading?: boolean
  /** true mientras se refresca (cambio de filtro o de página). */
  isFetching?: boolean
  estadoFiltro?: EstadoProforma
  onEstadoFiltroChange: (estado: EstadoProforma | undefined) => void
  /** Acción del estado vacío cuando aún no hay proformas. */
  onCrear?: () => void
}

const FILAS_SKELETON = 5

function FiltroEstado({
  estadoFiltro,
  onChange,
}: {
  estadoFiltro?: EstadoProforma
  onChange: (estado: EstadoProforma | undefined) => void
}) {
  const opciones: Array<{ valor: EstadoProforma | undefined; etiqueta: string }> = [
    { valor: undefined, etiqueta: "Todas" },
    ...ESTADOS_PROFORMA.map((estado) => ({ valor: estado, etiqueta: ETIQUETA_ESTADO_PROFORMA[estado] })),
  ]

  return (
    <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap items-center gap-2">
      {opciones.map(({ valor, etiqueta }) => {
        const activo = estadoFiltro === valor
        return (
          <button
            key={etiqueta}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(valor)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activo
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {etiqueta}
          </button>
        )
      })}
    </div>
  )
}

export function ProformaTable({
  proformas,
  isLoading = false,
  isFetching = false,
  estadoFiltro,
  onEstadoFiltroChange,
  onCrear,
}: ProformaTableProps) {
  const vacio = !isLoading && proformas.length === 0

  return (
    <div className="flex flex-col gap-4">
      <FiltroEstado estadoFiltro={estadoFiltro} onChange={onEstadoFiltroChange} />

      {vacio ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          {estadoFiltro ? (
            <>
              <p className="text-sm text-muted-foreground">
                No hay proformas en estado «{ETIQUETA_ESTADO_PROFORMA[estadoFiltro]}».
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => onEstadoFiltroChange(undefined)}>
                Ver todas las proformas
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Aún no hay proformas. Crea la primera a partir de una cotización aprobada.
              </p>
              {onCrear && (
                <Button type="button" size="sm" onClick={onCrear}>
                  Nueva proforma
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          aria-busy={isLoading || isFetching}
          className={cn(
            "overflow-x-auto rounded-lg border border-border bg-card text-card-foreground transition-opacity",
            isFetching && !isLoading && "opacity-60"
          )}
        >
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Listado de proformas</caption>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">N.° orden de compra</th>
                <th scope="col" className="px-4 py-3 font-medium">Cotización</th>
                <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                <th scope="col" className="px-4 py-3 font-medium">Vence</th>
                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: FILAS_SKELETON }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}

              {proformas.map((proforma) => (
                <tr
                  key={proforma.id}
                  className="border-b border-border last:border-0 hover:bg-accent/40"
                >
                  <td className="px-4 py-3 font-mono font-medium">
                    {formatearNumeroOrdenCompra(proforma.numeroOrdenCompra)}
                  </td>
                  <td className="px-4 py-3">{proforma.cotizacionCodigo ?? `#${proforma.cotizacionId}`}</td>
                  <td className="px-4 py-3">{proforma.clienteNombre ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(proforma.total, proforma.moneda)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatearFechaCorta(proforma.fechaVencimiento)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoProformaBadge estado={proforma.estadoProforma} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={`/proformas/${proforma.id}`}
                        aria-label={`Ver detalle de la proforma ${formatearNumeroOrdenCompra(
                          proforma.numeroOrdenCompra,
                          `#${proforma.id}`
                        )}`}
                      >
                        <Eye className="mr-1 h-4 w-4" aria-hidden="true" />
                        Ver
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}