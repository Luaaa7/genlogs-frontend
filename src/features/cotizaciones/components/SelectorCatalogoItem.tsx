import React, { useEffect, useId, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useProductos } from '@/hooks/useProductos'
import { useServicios } from '@/features/catalogo-servicios/hooks/useServicios'
import { cn } from '@/lib/utils/utils'

export interface ItemCatalogo {
  tipo: 'producto' | 'servicio'
  id: number
  nombre: string
  codigo: string
  idUnidadMedida?: number
}

interface SelectorCatalogoItemProps {
  /** Texto que se ve en el campo (nombre del ítem elegido o lo que se está buscando). */
  valor: string
  /** true cuando el ítem ya está vinculado a un producto o servicio del catálogo. */
  seleccionado: boolean
  onEscribir: (texto: string) => void
  onSeleccionar: (item: ItemCatalogo) => void
  ariaLabel: string
  invalido?: boolean
  className?: string
}

const MAX_RESULTADOS = 8

/** Buscador de productos y servicios del catálogo para una línea de cotización. */
export const SelectorCatalogoItem: React.FC<SelectorCatalogoItemProps> = ({
  valor,
  seleccionado,
  onEscribir,
  onSeleccionar,
  ariaLabel,
  invalido,
  className,
}) => {
  const listaId = useId()
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  // Espera a que se deje de escribir para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(valor.trim()), 250)
    return () => clearTimeout(t)
  }, [valor])

  const { data: pagina } = useProductos({ nombre: busqueda || undefined, size: MAX_RESULTADOS })
  const { data: servicios = [] } = useServicios()

  const productos = pagina?.content ?? []
  const serviciosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return servicios
      .filter((s) => !q || s.nombreServicio.toLowerCase().includes(q) || s.codigoServicio.toLowerCase().includes(q))
      .slice(0, MAX_RESULTADOS)
  }, [servicios, busqueda])

  const sinResultados = productos.length === 0 && serviciosFiltrados.length === 0

  const elegir = (item: ItemCatalogo) => {
    onSeleccionar(item)
    setAbierto(false)
  }

  const opcionClass =
    'flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div
      className={cn('relative', className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setAbierto(false)
      }}
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        aria-invalid={invalido}
        autoComplete="off"
        placeholder="Buscar producto o servicio"
        value={valor}
        onFocus={() => setAbierto(true)}
        onChange={(e) => {
          onEscribir(e.target.value)
          setAbierto(true)
        }}
        title={seleccionado ? 'Ítem del catálogo' : 'Elige una opción de la lista'}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive',
          seleccionado && 'font-medium',
        )}
      />

      {abierto && (
        <div
          id={listaId}
          role="listbox"
          aria-label="Resultados del catálogo"
          className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {productos.length > 0 && (
            <div role="group" aria-label="Productos">
              <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Productos</p>
              {productos.map((p) => (
                <button
                  key={`p-${p.idProducto}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={opcionClass}
                  onClick={() =>
                    elegir({ tipo: 'producto', id: p.idProducto, nombre: p.nombreProducto, codigo: p.codigoProducto, idUnidadMedida: p.idUnidadMedida })
                  }
                >
                  <span className="font-medium text-foreground">{p.nombreProducto}</span>
                  <span className="text-xs text-muted-foreground">{p.codigoProducto}</span>
                </button>
              ))}
            </div>
          )}

          {serviciosFiltrados.length > 0 && (
            <div role="group" aria-label="Servicios">
              <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Servicios</p>
              {serviciosFiltrados.map((s) => (
                <button
                  key={`s-${s.idServicio}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={opcionClass}
                  onClick={() =>
                    elegir({ tipo: 'servicio', id: s.idServicio, nombre: s.nombreServicio, codigo: s.codigoServicio, idUnidadMedida: s.unidadMedida?.idUnidadMedida })
                  }
                >
                  <span className="font-medium text-foreground">{s.nombreServicio}</span>
                  <span className="text-xs text-muted-foreground">{s.codigoServicio}</span>
                </button>
              ))}
            </div>
          )}

          {sinResultados && (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">
              No hay productos ni servicios con ese nombre. Si falta, créalo primero en el catálogo.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
