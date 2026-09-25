import { useState } from "react"
import { useProductos } from "../hooks/useProductos"
import { ProductoCard } from "../components/ProductoCard"

export function CatalogoProductosPage() {
  const [busqueda, setBusqueda] = useState("")
  const { data, isLoading, error } = useProductos({ nombre: busqueda, page: 0, size: 20 })

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Catálogo de repuestos</h1>
      <input
        type="text"
        placeholder="Buscar por código, descripción, categoría o marca..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-6 w-full max-w-md rounded-md border border-border px-3 py-2 text-sm"
      />
      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {error && <p className="text-sm text-destructive">Error al cargar el catálogo</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {data?.content.map((producto) => <ProductoCard key={producto.idProducto} producto={producto} />)}
      </div>
    </div>
  )
}