import { ExternalLink } from 'lucide-react'
import type { ItemIdentificacion } from '@/api/contratos/solicitudes'
import { enlacesBusqueda, terminoDeBusqueda } from '../lib/busquedaExterna'

interface Props {
  items: ItemIdentificacion[]
  /** En «En búsqueda» cada ítem ofrece buscadores externos. */
  buscar: boolean
}

/** Repuestos de la solicitud. En búsqueda, cada uno trae accesos rápidos a Google, eBay, Amazon y Alibaba (pestaña nueva). */
export function ItemsSolicitud({ items, buscar }: Props) {
  return (
    <section aria-labelledby="items-solicitud" className="rounded-xl border border-border bg-card p-5">
      <h2 id="items-solicitud" className="mb-4 text-base font-semibold text-foreground">Ítems de la solicitud</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Esta solicitud no tiene ítems registrados.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const termino = terminoDeBusqueda(item)
            return (
              <li key={item.idItem} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-foreground">{item.descripcion}</p>
                  <p className="text-muted-foreground">
                    {[`${item.cantidad}${item.unidad ? ` ${item.unidad}` : ''}`, item.marca, item.numeroParte ? `N.º de parte ${item.numeroParte}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {buscar && (
                  <div role="group" aria-label={`Buscar ${termino} en otros sitios`} className="flex flex-wrap gap-1.5">
                    {enlacesBusqueda(termino).map((enlace) => (
                      <a
                        key={enlace.nombre}
                        href={enlace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buscar ${termino} en ${enlace.nombre}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {enlace.nombre}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
