/** Etiqueta dorada «PORTAL DEL CLIENTE» que comparten el ingreso, el registro y los encabezados del portal. */
export function EtiquetaPortal() {
  return (
    <p
      data-testid="etiqueta-portal"
      className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-dorado dark:text-amarillo"
    >
      <span className="h-[3px] w-[22px] rounded-sm bg-dorado dark:bg-amarillo" aria-hidden="true" />
      Portal del cliente
    </p>
  )
}
