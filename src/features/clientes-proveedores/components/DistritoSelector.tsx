import { ubicacionDistrito, type Distrito } from "@/api/distritosApi"

interface DistritoSelectorProps {
  /** id del select: lo une con el <label> del Campo (#15). */
  id?: string
  /** ids de la ayuda y el error del Campo (describedBy). */
  describedBy?: string
  invalid?: boolean
  distritos: Distrito[] | undefined
  isLoading: boolean
  value: number | undefined
  onChange: (idDistrito: number) => void
  onUbigeoChange?: (ubigeo: string) => void
  className?: string
  disabled?: boolean
}

export function DistritoSelector({
  id,
  describedBy,
  invalid,
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
      id={id}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
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
          {d.nombreDistrito}
          {ubicacionDistrito(d) ? ` - ${ubicacionDistrito(d)}` : ""}
        </option>
      ))}
    </select>
  )
}