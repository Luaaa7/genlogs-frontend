import { ClipboardCheck, ShieldCheck, Truck } from "lucide-react"
import logoGenlogs from "@/assets/GENLOGS.webp"
import { cn } from "@/lib/utils/utils"

const PUNTOS = [
  { icono: ClipboardCheck, texto: "Cotizaciones con aprobación interna" },
  { icono: Truck, texto: "Seguimiento de pedidos y despachos" },
  { icono: ShieldCheck, texto: "Acceso por rol" },
]

/**
 * Panel de marca de las pantallas de ingreso (v3.4, K3; decisión de Luana).
 * Solo colores del tema (primary), así se ve bien en claro y en oscuro.
 * Quien lo usa decide cuándo se oculta (en el celular va oculto).
 */
export function PanelMarca({ className }: { className?: string }) {
  return (
    <aside
      aria-label="GenLogs S.A.C."
      className={cn("relative flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground", className)}
    >
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-foreground/10" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary-foreground/5" />

      <img
        src={logoGenlogs}
        alt="GenLogs S.A.C."
        width={192}
        height={80}
        className="relative -my-3 h-20 w-auto self-start object-contain brightness-0 invert"
      />

      <div className="relative mt-10">
        <h2 className="max-w-sm text-3xl font-bold leading-tight tracking-tight">
          Repuestos y servicios para la minería
        </h2>
        <ul className="mt-8 space-y-4">
          {PUNTOS.map(({ icono: Icono, texto }) => (
            <li key={texto} className="flex items-center gap-3 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Icono className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-primary-foreground/90">{texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative mt-10 text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} GenLogs S.A.C. Soluciones para minería.
      </p>
    </aside>
  )
}
