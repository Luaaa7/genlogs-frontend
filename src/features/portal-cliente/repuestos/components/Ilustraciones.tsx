import { cn } from "@/lib/utils/utils"
import type { TipoIlustracion } from "../lib/ilustracion"

const TRAZO = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const

/**
 * Dibujo técnico de la categoría para la tarjeta del repuesto cuando no hay foto.
 * Es una ilustración genérica de la familia de piezas, no una foto del producto.
 */
export function IlustracionCategoria({ tipo, className }: { tipo: TipoIlustracion; className?: string }) {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true" className={cn("h-full w-full", className)}>
      {tipo === "automatizacion" && (
        <g {...TRAZO}>
          <rect x="18" y="14" width="84" height="62" rx="5" />
          <rect x="26" y="22" width="30" height="20" rx="2" />
          <path d="M26 50h30M26 57h22M26 64h26" />
          {[66, 76, 86].map((x) => <circle key={x} cx={x} cy="27" r="3" />)}
          {[64, 71, 78, 85, 92].map((x) => <path key={x} d={`M${x} 48v20`} />)}
          <path d="M60 48h36" />
          <path d="M8 30h10M8 46h10M102 30h10M102 46h10" />
        </g>
      )}
      {tipo === "componentes" && (
        <g {...TRAZO}>
          <circle cx="46" cy="45" r="18" strokeDasharray="7 5" strokeWidth="9" opacity="0.9" />
          <circle cx="46" cy="45" r="11" />
          <circle cx="46" cy="45" r="4" />
          <path d="M74 22l20 20-6 6-20-20zM70 18l8-4 12 12-4 8" />
          <path d="M80 54h16v16H80zM84 54v-6h8v6" />
        </g>
      )}
      {tipo === "fabricaciones" && (
        <g {...TRAZO}>
          <ellipse cx="60" cy="18" rx="24" ry="7" />
          <path d="M36 18v50c0 4 11 7 24 7s24-3 24-7V18" />
          <ellipse cx="60" cy="18" rx="9" ry="2.5" />
          {[44, 50, 56, 62, 68, 74].map((x) => <path key={x} d={`M${x} 29v38`} opacity="0.7" />)}
          <path d="M36 30c8 3 40 3 48 0M36 60c8 3 40 3 48 0" />
        </g>
      )}
      {tipo === "valvulas" && (
        <g {...TRAZO}>
          <path d="M10 52h22v-12h56v12h22M10 66h22v12h56V66h22" />
          <path d="M32 40c8 6 8 32 0 38M88 40c-8 6-8 32 0 38" />
          <path d="M60 40V22" />
          <ellipse cx="60" cy="18" rx="22" ry="5" />
          <path d="M40 18h40M60 13v10" />
          <circle cx="60" cy="59" r="9" />
        </g>
      )}
      {tipo === "general" && (
        <g {...TRAZO}>
          <path d="M60 12l34 18v34L60 82 26 64V30z" />
          <path d="M26 30l34 18 34-18M60 48v34" />
          <path d="M43 21l34 18" opacity="0.6" />
        </g>
      )}
    </svg>
  )
}

/** Carrito vacío, como en la referencia: carrito grande con un par de piezas flotando. */
export function IlustracionCarritoVacio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" aria-hidden="true" className={cn("h-auto w-full", className)}>
      <ellipse cx="102" cy="126" rx="70" ry="7" className="fill-[#1E3A5F]/10 dark:fill-black/30" />
      <circle cx="150" cy="34" r="22" className="fill-[#2E6BA8]/10 dark:fill-[#60A5FA]/10" />
      <circle cx="42" cy="44" r="14" className="fill-[#FACC15]/20" />
      <g className="stroke-[#1E3A5F] dark:stroke-[#93C5FD]" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 30h20l18 64h84l14-46H48" />
        <path d="M60 94l-6 16h96" />
      </g>
      <path d="M50 52h102l-12 38H61z" className="fill-[#2E6BA8]/15 dark:fill-[#60A5FA]/15" />
      <g className="stroke-[#2E6BA8] dark:stroke-[#60A5FA]" strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <path d="M76 56v30M98 56v30M120 56v30M140 56l-4 30" />
      </g>
      <g className="fill-[#1E3A5F] dark:fill-[#93C5FD]">
        <circle cx="70" cy="118" r="8" />
        <circle cx="138" cy="118" r="8" />
      </g>
      <circle cx="70" cy="118" r="3" className="fill-white dark:fill-[#0B1830]" />
      <circle cx="138" cy="118" r="3" className="fill-white dark:fill-[#0B1830]" />
      <g className="stroke-[#FACC15]" fill="none" strokeWidth="5" strokeDasharray="5 4">
        <circle cx="150" cy="34" r="10" />
      </g>
      <circle cx="150" cy="34" r="4" className="fill-[#FACC15]" />
      <rect x="34" y="36" width="16" height="16" rx="3" transform="rotate(-14 42 44)" className="fill-[#2E6BA8]" />
    </svg>
  )
}

/**
 * Escena del encabezado: cordillera, camión minero, engranajes y retícula técnica.
 * Ilustración original en la paleta de GENLOGS; los colores cambian con el tema.
 */
export function EscenaIndustrial({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 260" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" className={cn("h-full w-full", className)}>
      <defs>
        <pattern id="gl-reticula" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0v24" fill="none" className="stroke-[#1E3A5F]/[0.07] dark:stroke-white/[0.05]" strokeWidth="1" />
        </pattern>
        <linearGradient id="gl-monte-lejano" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="[stop-color:#C9D8EA] dark:[stop-color:#1E3A5F]" />
          <stop offset="1" className="[stop-color:#E6EEF7] dark:[stop-color:#10213B]" />
        </linearGradient>
        <linearGradient id="gl-monte-cercano" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="[stop-color:#9FB9D6] dark:[stop-color:#24497A]" />
          <stop offset="1" className="[stop-color:#C9D8EA] dark:[stop-color:#132A4A]" />
        </linearGradient>
      </defs>
      <rect width="640" height="260" fill="url(#gl-reticula)" />
      {/* Cordillera */}
      <path d="M120 260L250 120l60 52 90-98 80 86 50-40 110 140z" fill="url(#gl-monte-lejano)" />
      <path d="M250 120l22 19 14-6 24 39zM400 74l18 20 16-4 46 50" className="fill-white/60 dark:fill-white/10" />
      <path d="M200 260l140-104 70 50 110-74 120 128z" fill="url(#gl-monte-cercano)" />
      {/* Terrazas de la mina */}
      <g className="stroke-white/70 dark:stroke-white/10" strokeWidth="2" fill="none">
        <path d="M330 214h220M360 196h170M392 178h110" />
      </g>
      {/* Engranajes */}
      <g className="stroke-[#2E6BA8]/50 dark:stroke-[#60A5FA]/35" fill="none">
        <circle cx="560" cy="60" r="30" strokeWidth="12" strokeDasharray="9 7" />
        <circle cx="560" cy="60" r="16" strokeWidth="4" />
        <circle cx="604" cy="104" r="17" strokeWidth="8" strokeDasharray="6 5" />
        <circle cx="604" cy="104" r="7" strokeWidth="3" />
      </g>
      {/* Camión minero */}
      <g transform="translate(372 150)">
        <path d="M18 34h126l14-30H44z" className="fill-[#FACC15]" />
        <path d="M18 34h126l14-30H44z" className="fill-none stroke-[#B45309]/40" strokeWidth="2" />
        <path d="M14 34h150v20H14z" className="fill-[#1E3A5F] dark:fill-[#0B1830]" />
        <path d="M150 12h30l12 22v20h-42z" className="fill-[#FACC15]" />
        <path d="M158 18h18l7 14h-25z" className="fill-[#1E3A5F]/70 dark:fill-[#0B1830]/80" />
        {[46, 136, 174].map((x) => (
          <g key={x}>
            <circle cx={x} cy="64" r="20" className="fill-[#0F172A]" />
            <circle cx={x} cy="64" r="9" className="fill-[#64748B]" />
            <circle cx={x} cy="64" r="3" className="fill-[#0F172A]" />
          </g>
        ))}
      </g>
      <path d="M300 236h340" className="stroke-[#1E3A5F]/20 dark:stroke-white/10" strokeWidth="2" />
    </svg>
  )
}
