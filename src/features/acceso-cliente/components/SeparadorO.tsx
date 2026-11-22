/** Línea divisoria con texto entre el botón de Google y el formulario con correo. */
export function SeparadorO({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator" aria-label={texto}>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span>{texto}</span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  )
}
