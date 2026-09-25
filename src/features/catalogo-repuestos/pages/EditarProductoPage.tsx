import { useParams } from "react-router-dom"
import { useProducto, useActualizarProducto } from "../hooks/useProductos"
import { ProductoForm } from "../components/ProductoForm"

export function EditarProductoPage() {
  const { id } = useParams<{ id: string }>()
  const idProducto = Number(id)
  const { data: producto, isLoading } = useProducto(idProducto)
  const { mutate, isPending } = useActualizarProducto(idProducto)

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
  if (!producto) return <p className="p-6 text-sm text-destructive">Producto no encontrado</p>

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Editar producto</h1>
      <ProductoForm defaultValues={producto} idProductoExistente={idProducto} onSubmit={(values) => mutate(values)} submitting={isPending} />
    </div>
  )
}