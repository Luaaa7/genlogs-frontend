import type { ReactNode } from "react"
import { Boxes, Layers, Tags } from "lucide-react"
import { EtiquetaPortal } from "../../components/EtiquetaPortal"
import { EscenaIndustrial } from "./Ilustraciones"

interface Props {
  /** Totales reales del catálogo cargado; sin datos no se muestran. */
  resumen?: { repuestos: number; marcas: number; categorias: number }
  /** Buscador: va dentro del encabezado, como en la referencia. */
  children: ReactNode
}

/**
 * Encabezado de Repuestos: etiqueta del portal, título, resumen del catálogo y buscador,
 * sobre una escena industrial (cordillera, camión minero y engranajes) con profundidad.
 */
export function HeroRepuestos({ resumen, children }: Props) {
  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#EEF3F8] via-[#F4F7FB] to-[#E3ECF6] shadow-sm dark:border-white/10 dark:from-[#10213B] dark:via-[#0D1C36] dark:to-[#0B1830]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full sm:w-[78%] lg:w-[62%]">
        <EscenaIndustrial className="opacity-60 sm:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#EEF3F8] via-[#EEF3F8]/60 to-transparent dark:from-[#10213B] dark:via-[#10213B]/60" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[#2E6BA8]/10 blur-3xl dark:bg-[#2E6BA8]/25" />

      <div className="flex flex-col gap-6 px-5 py-7 sm:px-8 sm:py-9">
        <div className="max-w-2xl">
          <EtiquetaPortal />
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#183153] dark:text-foreground sm:text-4xl">Repuestos</h1>
          <p className="mt-2 text-muted-foreground sm:text-lg">
            Encuentra el repuesto que necesitas de forma rápida y sencilla. Te enviamos la cotización con precio y plazo confirmados.
          </p>
          {resumen && (
            <ul aria-label="Resumen del catálogo" className="mt-4 flex flex-wrap gap-2 text-sm">
              <Dato icono={<Boxes className="h-4 w-4" />} valor={resumen.repuestos} texto={resumen.repuestos === 1 ? "repuesto" : "repuestos"} />
              <Dato icono={<Tags className="h-4 w-4" />} valor={resumen.marcas} texto={resumen.marcas === 1 ? "marca" : "marcas"} />
              <Dato icono={<Layers className="h-4 w-4" />} valor={resumen.categorias} texto={resumen.categorias === 1 ? "categoría" : "categorías"} />
            </ul>
          )}
        </div>
        <div className="max-w-3xl">{children}</div>
      </div>
    </header>
  )
}

function Dato({ icono, valor, texto }: { icono: ReactNode; valor: number; texto: string }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[#183153] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <span aria-hidden="true" className="text-[#2E6BA8] dark:text-[#60A5FA]">{icono}</span>
      <span className="font-semibold tabular-nums">{valor}</span> {texto}
    </li>
  )
}
