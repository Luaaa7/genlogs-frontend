import { useQuery } from "@tanstack/react-query"
import { listarCategoriasProducto } from "@/api/categoriasApi"

interface CategoriaSelectorProps {
  value: number | undefined
  onChange: (idCategoria: number) => void
  className?: string
}

export function CategoriaSelector({ value, onChange, className }: CategoriaSelectorProps) {
  const { data: categorias, isLoading } = useQuery({ queryKey: ["categorias-producto"], queryFn: listarCategoriasProducto })

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={isLoading}
      className={className ?? "rounded-md border border-border px-3 py-2 text-sm"}
    >
      <option value="" disabled>{isLoading ? "Cargando categorías..." : "Selecciona una categoría"}</option>
      {categorias?.map((cat) => (
        <option key={cat.idCategoriaProducto} value={cat.idCategoriaProducto}>
          {"—".repeat(cat.nivel - 1)} {cat.nombreCategoria}
        </option>
      ))}
    </select>
  )
}