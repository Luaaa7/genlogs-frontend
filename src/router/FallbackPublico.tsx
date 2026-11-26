import logoGenlogs from "@/assets/GENLOGS.webp"

/**
 * Aviso de carga de las vistas públicas que se descargan al abrir su ruta (Ayuda, Contacto, ingreso y registro).
 * La cabecera y el pie ya están puestos; aquí solo se ve una barra fina dorada arriba y el emblema de GENLOGS,
 * sin textos que aparezcan y desaparezcan. Con «movimiento reducido» la barra queda quieta.
 */
export function FallbackPublico() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center px-4 py-16">
      <div data-testid="barra-carga" aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-accent/20">
        <span className="gl-barra-carga block h-full w-1/3 bg-amarillo motion-reduce:w-full motion-reduce:opacity-60" />
      </div>
      <img
        data-testid="emblema-carga"
        src={logoGenlogs}
        alt=""
        width={192}
        height={80}
        className="h-16 w-auto animate-pulse object-contain opacity-60 motion-reduce:animate-none dark:brightness-0 dark:invert"
      />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
