import type { Distrito } from "@/api/distritosApi"

interface DistritoSelectorProps {
  distritos: Distrito[] | undefined
  isLoading: boolean
  value: number | undefined
  onChange: (idDistrito: number) => void
  onUbigeoChange?: (ubigeo: string) => void
  className?: string
  disabled?: boolean
}

export function DistritoSelector({
  distritos,
  isLoading,
  value,
  onChange,
  onUbigeoChange,
  className,
  disabled = false,
}: DistritoSelectorProps) {
  const selectedDistrito = distritos?.find((d) => d.idDistrito === value)

  if (onUbigeoChange && selectedDistrito) {
    onUbigeoChange(selectedDistrito.ubigeo)
  }

  const isDisabled = isLoading || disabled

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={isDisabled}
      className={className ?? "rounded-md border border-border px-3 py-2 text-sm"}
    >
      <option value="" disabled>
        {isLoading ? "Cargando distritos..." : disabled ? "Catálogo no disponible" : "Selecciona un distrito"}
      </option>
      {distritos?.map((d) => (
        <option key={d.idDistrito} value={d.idDistrito}>
          {d.nombreDistrito} - {d.provincia.nombreProvincia}, {d.provincia.departamento.nombreDepartamento}
        </option>
      ))}
    </select>
  )
}