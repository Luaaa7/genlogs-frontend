import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AlertTriangle, Store } from "lucide-react"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { FiltroChips } from "@/components/ui/FiltroChips"
import { PageHeader } from "@/components/ui/PageHeader"
import { Tabla, TablaCard, Td, Th, filaClass } from "@/components/ui/tabla"
import { TableSkeletonRows } from "@/components/ui/TableSkeletonRows"
import type { EstadoPublicacion } from "@/api/contratos/enumeraciones"
import { formatCurrency } from "@/lib/formatters/currency"
import { usePermisos } from "@/lib/permisos"
import { useProductosVitrina } from "../hooks/useVitrina"
import { ESTADOS_VITRINA } from "../estados"

const OPCIONES: { valor?: EstadoPublicacion; label: string }[] = [
  { label: "Todos" },
  { valor: "BORRADOR", label: "Borradores" },
  { valor: "PUBLICADO", label: "Publicados" },
  { valor: "OCULTO", label: "Ocultos" },
]

/** Vitrina interna: lo convertido desde la búsqueda, para revisar y publicar (BPMN 10). */
export function VitrinaProductosPage() {
  const [params] = useSearchParams()
  // El aviso de la verificación diaria enlaza aquí con ?estado=OCULTO.
  const [estado, setEstado] = useState<EstadoPublicacion | undefined>(() => {
    const e = params.get("estado")
    return e === "BORRADOR" || e === "PUBLICADO" || e === "OCULTO" ? e : undefined
  })
  const { verMargenes } = usePermisos()
  const { data, isLoading, isError, error, refetch } = useProductosVitrina(estado)
  const productos = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Vitrina de repuestos"
        descripcion="Los repuestos se crean desde la búsqueda con «Convertir». Solo lo publicado lo ve el cliente."
      />
      <FiltroChips etiqueta="Filtrar por estado" opciones={OPCIONES} valor={estado} onChange={setEstado} />
      {isError && <ErrorBanner message="No se pudo cargar la vitrina." error={error} onRetry={() => refetch()} />}
      <TablaCard>
        {!isLoading && !isError && productos.length === 0 ? (
          <EstadoVacio
            icono={<Store className="h-5.5 w-5.5" />}
            titulo={estado ? "No hay productos en este estado" : "Aún no hay productos en la vitrina"}
            descripcion="Marca una referencia como Útil en la búsqueda y conviértela en producto."
          />
        ) : (
          <Tabla titulo="Productos de la vitrina" minWidth={760}>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Repuesto</Th>
                <Th>Categoría</Th>
                <Th alinear="derecha">Precio</Th>
                {verMargenes && <Th alinear="derecha">Margen</Th>}
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={verMargenes ? 6 : 5} />
              ) : (
                productos.map((p) => (
                  <tr key={p.idProducto} className={filaClass}>
                    <Td className="whitespace-nowrap font-mono text-xs">{p.codigo}</Td>
                    <Td>
                      <Link to={`/vitrina/productos/${p.idProducto}`} className="font-medium text-accent hover:underline">
                        {p.nombre}
                      </Link>
                      {!p.tieneImagenVerificada && p.estado === "BORRADOR" && (
                        <span className="block text-xs text-muted-foreground">Falta la foto propia</span>
                      )}
                    </Td>
                    <Td>{p.categoria ?? "—"}</Td>
                    <Td alinear="derecha" className="whitespace-nowrap tabular-nums">
                      {p.precioReferencial != null ? formatCurrency(p.precioReferencial, "PEN") : "—"}
                    </Td>
                    {verMargenes && (
                      <Td alinear="derecha" className="whitespace-nowrap tabular-nums">
                        {p.margen != null ? `${p.margen} %` : "—"}
                        {p.requiereJefe && (
                          <span className="ml-1 inline-flex align-middle text-warning-text" title="Margen fuera de rango">
                            <AlertTriangle className="h-4 w-4" aria-label="Margen fuera de rango" />
                          </span>
                        )}
                      </Td>
                    )}
                    <Td><EstadoBadge tono={ESTADOS_VITRINA[p.estado].tono}>{ESTADOS_VITRINA[p.estado].label}</EstadoBadge></Td>
                  </tr>
                ))
              )}
            </tbody>
          </Tabla>
        )}
      </TablaCard>
    </div>
  )
}
