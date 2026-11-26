/**
 * Línea de 2 px en el borde inferior de la barra superior del portal (dorada en claro y en oscuro).
 * Aparece tras un instante (las cargas rapidísimas no parpadean) y, con «movimiento reducido», queda fija.
 */
export function BarraProgresoPortal({ activa }: { activa: boolean }) {
  if (!activa) return null
  return (
    <div
      role="progressbar"
      aria-label="Cargando"
      aria-busy="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 animate-[barra-aparece_0.2s_ease-out_0.15s_both] overflow-hidden motion-reduce:animate-none"
    >
      <div className="h-full w-2/5 animate-[barra-desliza_1.1s_ease-in-out_infinite] bg-[#B47B2B] motion-reduce:w-full motion-reduce:animate-none motion-reduce:opacity-70 dark:bg-[#FACC15]" />
    </div>
  )
}
