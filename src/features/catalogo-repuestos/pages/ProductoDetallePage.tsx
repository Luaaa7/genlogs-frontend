import { useParams } from "react-router-dom"
import { useProducto } from "../hooks/useProductos"
import { ProductoDetalle } from "../components/ProductoDetalle"

export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const { data: producto, isLoading, error } = useProducto(Number(id))

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
  if (error || !producto) return <p className="p-6 text-sm text-destructive">Producto no encontrado</p>

  return <div className="p-6"><ProductoDetalle producto={producto} /></div>
}