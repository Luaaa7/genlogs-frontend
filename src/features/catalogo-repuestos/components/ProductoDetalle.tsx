import type { Producto } from "@/types/producto.types"

export function ProductoDetalle({ producto }: { producto: Producto }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        {producto.imagenes.map((img) => (
          <img key={img.idProductoImagen} src={img.urlImagen} alt={producto.nombreProducto} className="w-full rounded-lg object-cover" />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{producto.codigoProducto}</p>
          <h1 className="text-xl font-semibold">{producto.nombreProducto}</h1>
          {producto.marcaNombre && <p className="text-sm text-muted-foreground">{producto.marcaNombre}</p>}
        </div>
        {producto.descripcion && <p className="text-sm text-foreground">{producto.descripcion}</p>}
        <div>
          <h2 className="mb-2 text-sm font-semibold">Ficha técnica</h2>
          <table className="w-full text-sm">
            <tbody>
              {producto.caracteristicas.map((c) => (
                <tr key={c.idCaracteristica} className="border-b border-border">
                  <td className="py-1 text-muted-foreground">{c.nombreCaracteristica}</td>
                  <td className="py-1 font-medium">{c.valorCaracteristica} {c.unidadCaracteristica ?? ""}</td>
                </tr>
              ))}
              {producto.procedencia && (
                <tr className="border-b border-border">
                  <td className="py-1 text-muted-foreground">Procedencia</td>
                  <td className="py-1 font-medium">{producto.procedencia}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {producto.documentos.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Documentos</h2>
            <ul className="text-sm">
              {producto.documentos.map((d) => (
                <li key={d.idDocumento}>
                  <a href={d.urlDocumento} target="_blank" rel="noreferrer" className="text-primary hover:underline">{d.nombreDocumento}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}