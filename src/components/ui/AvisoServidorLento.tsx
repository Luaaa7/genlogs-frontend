import { Loader2 } from "lucide-react"

/** Aviso cuando una carga tarda: el servidor puede estar activándose (Render). */
export function AvisoServidorLento() {
  return (
    <div role="status" className="animate-in fade-in-0 slide-in-from-top-2 overflow-hidden rounded-xl border border-accent/30 bg-accent/10 duration-300 motion-reduce:animate-none">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Esto está tardando más de lo normal</p>
          <p className="text-muted-foreground">El servidor se está activando. La primera carga del día puede tardar hasta un minuto; no cierres la página.</p>
        </div>
      </div>
      <div className="h-[3px] overflow-hidden bg-accent/15" aria-hidden="true">
        <span className="portal-indeterminada block h-full w-2/5 bg-accent" />
      </div>
    </div>
  )
}
