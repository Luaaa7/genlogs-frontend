/**
 * Etiqueta dorada que comparten el ingreso, el registro y los encabezados del portal.
 * Por defecto dice «Portal del cliente»; Ayuda y Contacto usan su propio texto.
 */
export function EtiquetaPortal({ texto = "Portal del cliente" }: { texto?: string }) {
  return (
    <p
      data-testid="etiqueta-portal"
      className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.14em] text-dorado dark:text-amarillo"
    >
      <span className="h-[3px] w-[22px] rounded-sm bg-dorado dark:bg-amarillo" aria-hidden="true" />
      {texto}
    </p>
  )
}
