import { cn } from "@/lib/utils/utils"

export type IlustracionEncabezado = "pedidos" | "cotizaciones" | "comprobantes" | "despachos" | "reclamos" | "ayuda" | "contacto"

/**
 * Fondo del encabezado del portal: retícula técnica y cordillera de GenLogs. El objeto de cada sección
 * va aparte (ObjetoEncabezado) para que nunca quede detrás de la acción del encabezado.
 */
export function EscenaEncabezado({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 220" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" className={cn("h-full w-full", className)}>
      <defs>
        <pattern id="gl-reticula-portal" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0v22" fill="none" className="stroke-[#1E3A5F]/[0.07] dark:stroke-white/[0.05]" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="520" height="220" fill="url(#gl-reticula-portal)" />
      {/* Cordillera */}
      <path d="M60 220L190 96l52 44 86-96 72 80 46-34 74 130z" className="fill-[#1E3A5F]/[0.09] dark:fill-white/[0.07]" />
      <path d="M190 96l20 18 12-5 20 31zM328 44l16 18 14-4 42 46" className="fill-white/70 dark:fill-white/[0.06]" />
      <path d="M150 220l130-92 64 46 98-68 78 114z" className="fill-[#1E3A5F]/[0.12] dark:fill-white/[0.09]" />
    </svg>
  )
}

const VISTA: Record<IlustracionEncabezado, string> = {
  pedidos: "0 0 126 166",
  cotizaciones: "0 0 132 146",
  comprobantes: "0 0 146 152",
  despachos: "-32 -4 234 118",
  reclamos: "0 0 190 150",
  ayuda: "0 0 190 150",
  contacto: "0 0 190 150",
}

/** Objeto de la sección (portapapeles, cotización, comprobante o camión), con su propio tamaño. */
export function ObjetoEncabezado({ ilustracion, className }: { ilustracion: IlustracionEncabezado; className?: string }) {
  return (
    <svg viewBox={VISTA[ilustracion]} aria-hidden="true" className={cn("h-full w-auto drop-shadow-[0_10px_18px_rgba(15,23,42,0.18)]", className)}>
      {ilustracion === "pedidos" && <Portapapeles />}
      {ilustracion === "cotizaciones" && <Cotizacion />}
      {ilustracion === "comprobantes" && <Comprobante />}
      {ilustracion === "despachos" && <Camion />}
      {ilustracion === "reclamos" && <Reclamo />}
      {ilustracion === "ayuda" && <Ayuda />}
      {ilustracion === "contacto" && <Contacto />}
    </svg>
  )
}

const NAVY = "fill-[#1E3A5F] dark:fill-[#0B1830]"
const PAPEL = "fill-white dark:fill-[#E2E8F0]"
const LINEA = "stroke-[#93A9C4] dark:stroke-[#94A3B8]"
const AZUL = "fill-[#2E6BA8] dark:fill-[#3B82F6]"
const AMARILLO = "fill-[#FACC15]"

function Portapapeles() {
  return (
    <g>
      <rect x="0" y="10" width="104" height="134" rx="10" className={AZUL} />
      <rect x="8" y="20" width="88" height="116" rx="6" className={PAPEL} />
      <rect x="30" y="2" width="44" height="18" rx="5" className={AMARILLO} />
      {[44, 70, 96].map((y, i) => (
        <g key={y}>
          <rect x="18" y={y} width="14" height="14" rx="3" className={i < 2 ? AZUL : "fill-none stroke-[#93A9C4] dark:stroke-[#94A3B8]"} strokeWidth="2" />
          {i < 2 && <path d={`M21 ${y + 7}l3 3 6-6`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          <path d={`M40 ${y + 7}h44`} className={LINEA} strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <g transform="translate(78 108)">
        <path d="M0 14l22-12 22 12v26L22 52 0 40z" className={AMARILLO} />
        <path d="M0 14l22 12 22-12M22 26v26" fill="none" className="stroke-[#B45309]/50" strokeWidth="2" />
      </g>
    </g>
  )
}

function Cotizacion() {
  return (
    <g>
      <rect x="22" y="12" width="96" height="124" rx="8" className="fill-[#C9D8EA] dark:fill-[#24497A]" />
      <rect x="6" y="2" width="96" height="124" rx="8" className={PAPEL} />
      <rect x="6" y="2" width="96" height="22" rx="8" className={NAVY} />
      <rect x="6" y="16" width="96" height="8" className={NAVY} />
      {[38, 50, 62].map((y) => <path key={y} d={`M18 ${y}h60`} className={LINEA} strokeWidth="4" strokeLinecap="round" />)}
      <path d="M18 84h72M18 96h72" className={LINEA} strokeWidth="3" strokeLinecap="round" />
      <path d="M58 112h32" className="stroke-[#1E3A5F] dark:stroke-[#0B1830]" strokeWidth="5" strokeLinecap="round" />
      <circle cx="104" cy="118" r="24" className={AMARILLO} />
      <path d="M94 118l7 7 13-14" fill="none" className="stroke-[#1E3A5F]" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

function Comprobante() {
  return (
    <g>
      <path d="M8 0h88v132l-11-7-11 7-11-7-11 7-11-7-11 7-11-7-11 7z" className={PAPEL} />
      <rect x="20" y="14" width="40" height="8" rx="3" className={AZUL} />
      {[36, 48, 60, 72].map((y) => (
        <g key={y}>
          <path d={`M20 ${y}h36`} className={LINEA} strokeWidth="4" strokeLinecap="round" />
          <path d={`M68 ${y}h16`} className={LINEA} strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <path d="M20 92h64" className="stroke-[#1E3A5F] dark:stroke-[#0B1830]" strokeWidth="2" />
      <path d="M52 106h32" className="stroke-[#1E3A5F] dark:stroke-[#0B1830]" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(64 96) rotate(-10)">
        <rect width="74" height="46" rx="7" className={NAVY} />
        <rect y="10" width="74" height="9" className={AMARILLO} />
        <rect x="10" y="28" width="22" height="8" rx="2" className="fill-white/70" />
      </g>
    </g>
  )
}

function Camion() {
  return (
    <g>
      <rect x="0" y="0" width="128" height="72" rx="5" className={AZUL} />
      {[22, 44, 66, 88, 110].map((x) => <path key={x} d={`M${x} 8v56`} className="stroke-white/25" strokeWidth="3" />)}
      <path d="M132 18h38l24 28v34h-62z" className={AMARILLO} />
      <path d="M140 26h26l15 18h-41z" className="fill-[#1E3A5F]/75 dark:fill-[#0B1830]/80" />
      <rect x="-4" y="72" width="202" height="14" rx="3" className={NAVY} />
      <rect x="186" y="64" width="12" height="6" rx="2" className="fill-[#F97316]" />
      {[30, 96, 164].map((x) => (
        <g key={x}>
          <circle cx={x} cy="90" r="17" className="fill-[#0F172A]" />
          <circle cx={x} cy="90" r="7" className="fill-[#94A3B8]" />
        </g>
      ))}
      <path d="M-30 110h250" className="stroke-[#1E3A5F]/25 dark:stroke-white/15" strokeWidth="2" />
    </g>
  )
}

/** Globo de aviso con «!» sobre un camión pequeño: algo pasó con un pedido. */
function Reclamo() {
  return (
    <g>
      <g transform="translate(70 92) scale(0.48)">
        <Camion />
      </g>
      <path d="M14 8h96a12 12 0 0 1 12 12v50a12 12 0 0 1-12 12H58l-24 20 4-20H14A12 12 0 0 1 2 70V20A12 12 0 0 1 14 8z" className={PAPEL} />
      <path d="M14 8h96a12 12 0 0 1 12 12v50a12 12 0 0 1-12 12H58l-24 20 4-20H14A12 12 0 0 1 2 70V20A12 12 0 0 1 14 8z" fill="none" className="stroke-[#1E3A5F] dark:stroke-[#93C5FD]" strokeWidth="4" />
      <rect x="56" y="22" width="12" height="34" rx="6" className="fill-[#1E3A5F] dark:fill-[#0B1830]" />
      <circle cx="62" cy="68" r="7" className="fill-[#1E3A5F] dark:fill-[#0B1830]" />
      <circle cx="122" cy="14" r="11" className={AMARILLO} />
    </g>
  )
}

/** Libro abierto con una moneda «?»: guías para resolver dudas. */
function Ayuda() {
  return (
    <g>
      <path d="M10 44c26-10 52-10 76 6v92c-24-16-50-16-76-6z" className={AZUL} />
      <path d="M162 44c-26-10-52-10-76 6v92c24-16 50-16 76-6z" className="fill-[#1E3A5F] dark:fill-[#24497A]" />
      <path d="M18 40c24-8 46-6 66 8v86c-20-12-42-14-66-6z" className={PAPEL} />
      <path d="M154 40c-24-8-46-6-66 8v86c20-12 42-14 66-6z" className={PAPEL} />
      {[62, 76, 90, 104].map((y) => (
        <g key={y}>
          <path d={`M30 ${y - 4}c14-4 28-3 44 3`} fill="none" className={LINEA} strokeWidth="3" strokeLinecap="round" />
          <path d={`M142 ${y - 4}c-14-4-28-3-44 3`} fill="none" className={LINEA} strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="150" cy="30" r="26" className={AMARILLO} />
      <path d="M141 23a9 9 0 1 1 13 8c-3 2-4 4-4 7" fill="none" className="stroke-[#1E3A5F]" strokeWidth="5" strokeLinecap="round" />
      <circle cx="150" cy="46" r="3.5" className="fill-[#1E3A5F]" />
    </g>
  )
}

/** Sobre de correo y globo de conversación: escríbenos. */
function Contacto() {
  return (
    <g>
      <rect x="8" y="46" width="128" height="88" rx="10" className={AZUL} />
      <rect x="16" y="54" width="112" height="72" rx="6" className={PAPEL} />
      <path d="M16 60l56 40 56-40" fill="none" className="stroke-[#2E6BA8] dark:stroke-[#3B82F6]" strokeWidth="6" strokeLinejoin="round" />
      <path d="M118 6h56a12 12 0 0 1 12 12v34a12 12 0 0 1-12 12h-22l-18 16 3-16h-19a12 12 0 0 1-12-12V18a12 12 0 0 1 12-12z" className={AMARILLO} />
      {[132, 146, 160].map((x) => <circle key={x} cx={x} cy="35" r="5" className="fill-[#1E3A5F]" />)}
    </g>
  )
}
