import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/ui/PageHeader"
import { mensajeErrorApi } from "@/api/productosApi"
import { useCrearProducto } from "@/hooks/useCrearProducto"
import { productoFormToRequest } from "@/lib/validators/producto.schema"
import type { ProductoFormValues } from "@/lib/validators/producto.schema"
import type { MediosNuevosProducto } from "@/types/producto.types"
import { ProductoForm } from "../components/ProductoForm"

export function NuevoProductoPage() {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useCrearProducto()

  function handleSubmit(values: ProductoFormValues, medios: MediosNuevosProducto) {
    mutate(
      { values: productoFormToRequest(values), medios },
      {
        onSuccess: ({ producto, mediosFallidos }) => {
          if (mediosFallidos > 0) {
            // El producto ya existe: se lleva al usuario a editarlo para reintentar los archivos.
            navigate(`/catalogo-repuestos/${producto.idProducto}/editar`, {
              state: {
                aviso:
                  mediosFallidos === 1
                    ? "El producto se creó, pero 1 archivo no se pudo asociar. Vuelve a subirlo."
                    : `El producto se creó, pero ${mediosFallidos} archivos no se pudieron asociar. Vuelve a subirlos.`,
              },
            })
            return
          }
          navigate(`/catalogo-repuestos/${producto.idProducto}`)
        },
      }
    )
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader titulo="Nuevo producto" descripcion="Datos, ficha técnica, imágenes y documentos del repuesto." />

      <ProductoForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/catalogo-repuestos")}
        submitting={isPending}
        submitLabel="Crear producto"
        errorMessage={
          error ? mensajeErrorApi(error, "No se pudo crear el producto. Revisa los datos e intenta de nuevo.") : null
        }
      />
    </div>
  )
}
