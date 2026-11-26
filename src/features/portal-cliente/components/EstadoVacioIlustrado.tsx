import type { ReactNode } from "react"

export type IlustracionVacia = "pedidos" | "cotizaciones" | "comprobantes" | "despachos" | "repuestos" | "busqueda"

// Azul acero para los trazos y ámbar para el detalle; en oscuro los trazos aclaran para no perderse.
const TRAZO = "fill-none stroke-[#1E3A5F] dark:stroke-slate-300"
const SUAVE = "fill-[#2E6BA8]/15 dark:fill-[#2E6BA8]/25"
const AMBAR = "fill-[#FACC15] stroke-[#1E3A5F] dark:stroke-slate-300"

/** Cada ilustración se dibuja sobre una silueta de montañas, igual que el encabezado del portal. */
function Dibujo({ tipo }: { tipo: IlustracionVacia }) {
  switch (tipo) {
    case "pedidos":
      return (
        <>
          <rect x="52" y="26" width="56" height="70" rx="6" className={`${SUAVE} ${TRAZO}`} strokeWidth="2" />
          <rect x="64" y="19" width="32" height="14" rx="4" className={AMBAR} strokeWidth="2" />
          <path d="M62 52h36M62 64h36M62 76h22" className={TRAZO} strokeWidth="2" strokeLinecap="round" />
        </>
      )
    case "cotizaciones":
      return (
        <>
          <path d="M54 22h40l16 16v58H54z" className={`${SUAVE} ${TRAZO}`} strokeWidth="2" strokeLinejoin="round" />
          <path d="M94 22v16h16" className={TRAZO} strokeWidth="2" strokeLinejoin="round" />
          <path d="M64 52h34M64 63h34M64 74h18" className={TRAZO} strokeWidth="2" strokeLinecap="round" />
          <circle cx="97" cy="84" r="9" className={AMBAR} strokeWidth="2" />
        </>
      )
    case "comprobantes":
      return (
        <>
          <path d="M54 22h52v76l-8-6-9 6-9-6-9 6-9-6-8 6z" className={`${SUAVE} ${TRAZO}`} strokeWidth="2" strokeLinejoin="round" />
          <path d="M64 40h32M64 52h32" className={TRAZO} strokeWidth="2" strokeLinecap="round" />
          <rect x="64" y="64" width="32" height="10" rx="3" className={AMBAR} strokeWidth="2" />
        </>
      )
    case "despachos":
      return (
        <>
          <rect x="30" y="46" width="58" height="36" rx="3" className={`${SUAVE} ${TRAZO}`} strokeWidth="2" />
          <path d="M88 56h20l14 14v12H88z" className={`${SUAVE} ${TRAZO}`} strokeWidth="2" strokeLinejoin="round" />
          <circle cx="52" cy="86" r="8" className={AMBAR} strokeWidth="2" />
          <circle cx="108" cy="86" r="8" className={AMBAR} strokeWidth="2" />
        </>
      )
    case "repuestos":
      return (
        <>
          <circle cx="80" cy="60" r="26" className={TRAZO} strokeWidth="9" strokeDasharray="7 6" />
          <circle cx="80" cy="60" r="19" className={`${SUAVE} ${TRAZO}`} strokeWidth="2" />
          <circle cx="80" cy="60" r="7" className={AMBAR} strokeWidth="2" />
        </>
      )
    case "busqueda":
      return (
        <>
          <circle cx="72" cy="56" r="23" className={`${SUAVE} ${TRAZO}`} strokeWidth="3" />
          <path d="M89 73l18 18" className={TRAZO} strokeWidth="7" strokeLinecap="round" />
          <circle cx="72" cy="56" r="8" className={AMBAR} strokeWidth="2" />
        </>
      )
  }
}

interface EstadoVacioIlustradoProps {
  ilustracion: IlustracionVacia
  titulo: string
  descripcion?: string
  /** Acción rápida: restablecer el filtro o crear una solicitud. */
  accion?: ReactNode
}

/** Estado vacío del portal: ilustración vectorial minimalista, mensaje corto y una acción para salir del vacío. */
export function EstadoVacioIlustrado({ ilustracion, titulo, descripcion, accion }: EstadoVacioIlustradoProps) {
  return (
    <div className="mt-6 flex animate-[tarjeta-entra_0.35s_ease-out_backwards] flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-900 motion-reduce:animate-none">
      <svg data-testid="ilustracion-vacia" aria-hidden="true" viewBox="0 0 160 120" className="h-28 w-auto">
        <path d="M0 104 L38 60 L60 82 L96 34 L130 84 L146 66 L160 104Z" className={`${SUAVE} stroke-none`} />
        <path d="M10 104h140" className={TRAZO} strokeWidth="2" strokeLinecap="round" />
        <Dibujo tipo={ilustracion} />
      </svg>
      <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
      {descripcion && <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
