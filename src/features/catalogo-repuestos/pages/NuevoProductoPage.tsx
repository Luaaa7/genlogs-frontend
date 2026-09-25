import { useNavigate } from "react-router-dom"
import { ProductoForm } from "../components/ProductoForm"
import { useCrearProducto } from "../hooks/useProductos"
import type { ProductoFormValues } from "@/lib/validators/producto.schema"

export function NuevoProductoPage() {
  const navigate = useNavigate()
  const { mutate, isPending } = useCrearProducto()

  function handleSubmit(values: ProductoFormValues) {
    mutate(values, { onSuccess: (producto) => navigate(`/catalogo-repuestos/${producto.idProducto}/editar`) })
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Nuevo producto</h1>
      <ProductoForm onSubmit={handleSubmit} submitting={isPending} />
    </div>
  )
}