import { Link } from "react-router-dom"
import type { Producto } from "@/types/producto.types"

export function ProductoCard({ producto }: { producto: Producto }) {
  const imagenPrincipal = producto.imagenes.find((img) => img.esPrincipal)?.urlImagen

  return (
    <Link to={`/catalogo-repuestos/${producto.idProducto}`} className="flex flex-col gap-2 rounded-lg border border-border p-3 transition-shadow hover:shadow-md">
      <div className="aspect-square overflow-hidden rounded-md bg-muted">
        {imagenPrincipal ? (
          <img src={imagenPrincipal} alt={producto.nombreProducto} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Sin imagen</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{producto.codigoProducto}</p>
      <p className="text-sm font-medium">{producto.nombreProducto}</p>
      {producto.marcaNombre && <p className="text-xs text-muted-foreground">{producto.marcaNombre}</p>}
    </Link>
  )
}