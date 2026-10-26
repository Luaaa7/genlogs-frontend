/** Clase única de inputs, selects y textareas de formularios: mismos tokens que
 *  <Input> (borde `input`, fondo `background`, anillo `ring`). */
export const controlFormClass =
  "w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive"

export const inputFormClass = `${controlFormClass} h-10`
export const textareaFormClass = `${controlFormClass} min-h-24 py-2`

/** aria-describedby para el control de un <Campo>. */
export function describedBy(id: string, { error, ayuda }: { error?: unknown; ayuda?: unknown }) {
  return [error ? `${id}-error` : null, ayuda && !error ? `${id}-ayuda` : null].filter(Boolean).join(" ") || undefined
}
