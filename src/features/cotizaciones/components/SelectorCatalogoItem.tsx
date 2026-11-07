import React, { useEffect, useId, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useCatalogoCompletoProductos } from '@/hooks/useProductos'
import { useServicios } from '@/features/catalogo-servicios/hooks/useServicios'
import { cn } from '@/lib/utils/utils'

export interface ItemCatalogo {
  tipo: 'producto' | 'servicio'
  id: number
  nombre: string
  codigo: string
  idUnidadMedida?: number
  /** Solo servicios: categoría y su categoría padre (para sugerir el margen). */
  idCategoriaServicio?: number
  idCategoriaPadre?: number
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
  /** Si se indica, solo busca productos o solo servicios. */
  tipo?: 'producto' | 'servicio'
}

const MAX_RESULTADOS = 8

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Buscador de productos y servicios del catálogo para una línea de cotización. */
export const SelectorCatalogoItem: React.FC<SelectorCatalogoItemProps> = ({
  valor,
  seleccionado,
  onEscribir,
  onSeleccionar,
  ariaLabel,
  invalido,
  className,
  tipo,
}) => {
  const listaId = useId()
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  // Espera a que se deje de escribir para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(valor.trim()), 250)
    return () => clearTimeout(t)
  }, [valor])

  const { data: catalogo = [], isLoading: cargandoProductos, isError: errorProductos } = useCatalogoCompletoProductos()
  const { data: servicios = [], isLoading: cargandoServicios, isError: errorServicios } = useServicios()
  // Mientras se escribe (antes de que pase la espera) o llega la respuesta, se avisa que está buscando
  const buscando = cargandoProductos || cargandoServicios || busqueda !== valor.trim()

  // La búsqueda se hace en pantalla: sin importar tildes ni mayúsculas, con varias
  // palabras en cualquier orden, y por nombre, código o marca.
  const palabras = useMemo(() => normalizar(busqueda).split(/[^a-z0-9]+/).filter(Boolean), [busqueda])
  const coincide = (...textos: (string | undefined | null)[]) => {
    if (palabras.length === 0) return true
    const pajar = normalizar(textos.filter(Boolean).join(' '))
    return palabras.every((w) => pajar.includes(w))
  }
  const productos = useMemo(
    () => tipo === 'servicio' ? [] : catalogo.filter((p) => coincide(p.nombreProducto, p.codigoProducto, p.marcaNombre)).slice(0, MAX_RESULTADOS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogo, palabras, tipo],
  )
  const serviciosFiltrados = useMemo(
    () => tipo === 'producto' ? [] : servicios.filter((s) => coincide(s.nombreServicio, s.codigoServicio)).slice(0, MAX_RESULTADOS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [servicios, palabras, tipo],
  )
  const queBusca = tipo === 'producto' ? 'productos' : tipo === 'servicio' ? 'servicios' : 'productos ni servicios'

  const sinResultados = productos.length === 0 && serviciosFiltrados.length === 0
  // Si el servidor falla, decirlo: antes salía "No hay productos" y parecía que el catálogo estaba vacío.
  const fallaProductos = errorProductos && tipo !== 'servicio'
  const fallaServicios = errorServicios && tipo !== 'producto'
  const errorCatalogo = fallaProductos && fallaServicios ? 'productos y servicios' : fallaProductos ? 'productos' : fallaServicios ? 'servicios' : null

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
        placeholder={tipo === 'producto' ? 'Buscar repuesto por nombre, código o marca' : tipo === 'servicio' ? 'Buscar servicio por nombre o código' : 'Buscar producto o servicio'}
        value={valor}
        onFocus={() => setAbierto(true)}
        onChange={(e) => {
          onEscribir(e.target.value)
          setAbierto(true)
        }}
        title={seleccionado ? 'Ítem del catálogo' : 'Elige una opción de la lista'}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-background pl-8 pr-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive',
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
                    elegir({ tipo: 'servicio', id: s.idServicio, nombre: s.nombreServicio, codigo: s.codigoServicio, idUnidadMedida: s.unidadMedida?.idUnidadMedida, idCategoriaServicio: s.categoriaServicio?.idCategoriaServicio, idCategoriaPadre: s.categoriaServicio?.categoriaPadre?.idCategoriaServicio })
                  }
                >
                  <span className="font-medium text-foreground">{s.nombreServicio}</span>
                  <span className="text-xs text-muted-foreground">{s.codigoServicio}</span>
                </button>
              ))}
            </div>
          )}

          {errorCatalogo && (
            <p role="alert" className="px-2.5 py-3 text-sm text-destructive">
              No se pudo cargar el catálogo de {errorCatalogo}. Revisa tu conexión o vuelve a iniciar sesión.
            </p>
          )}

          {sinResultados && buscando && !errorCatalogo && (
            <p role="status" className="px-2.5 py-3 text-sm text-muted-foreground">Buscando…</p>
          )}

          {sinResultados && !buscando && !errorCatalogo && (
            <p className="px-2.5 py-3 text-sm text-muted-foreground">
              No hay {queBusca === 'productos ni servicios' ? 'productos ni servicios' : queBusca} con ese nombre o código. Si falta, créalo primero en el catálogo.
            </p>
          )}
        </div>
      )}
    </div>
  )
}