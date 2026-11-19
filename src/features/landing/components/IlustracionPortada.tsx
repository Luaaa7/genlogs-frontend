import { useId } from "react"

/**
 * Ilustración vectorial de la portada: un camión minero lleva el repuesto hasta la operación.
 * Solo usa colores del tema (var(--…)), así se ve bien en claro y en oscuro.
 */
export function IlustracionPortada({ className }: { className?: string }) {
  const id = useId()
  const titulo = `${id}-titulo`
  const recorte = `${id}-recorte`
  return (
    <svg viewBox="0 0 480 360" role="img" aria-labelledby={titulo} className={className}>
      <title id={titulo}>Camión minero llevando un repuesto hasta la operación</title>
      <defs>
        <clipPath id={recorte}>
          <rect x="1" y="1" width="478" height="358" rx="24" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="478" height="358" rx="24" style={{ fill: "var(--card)" }} />
      <g clipPath={`url(#${recorte})`}>
        <circle cx="380" cy="86" r="34" style={{ fill: "var(--accent)" }} fillOpacity={0.14} />
        <circle cx="380" cy="86" r="18" style={{ fill: "var(--accent)" }} fillOpacity={0.28} />
        <path d="M0 250 L90 150 L150 205 L230 105 L330 230 L380 185 L480 260 L480 359 L0 359 Z" style={{ fill: "var(--primary)" }} fillOpacity={0.1} />
        <path d="M0 280 L120 195 L200 250 L290 170 L400 265 L480 235 L480 359 L0 359 Z" style={{ fill: "var(--primary)" }} fillOpacity={0.18} />
        <path d="M230 105 L252 132 L238 128 L226 140 L214 125 Z" style={{ fill: "var(--card)" }} fillOpacity={0.9} />
        <rect x="0" y="300" width="480" height="59" style={{ fill: "var(--muted)" }} />
        <path d="M150 292 C 230 250, 290 330, 350 268" fill="none" style={{ stroke: "var(--accent)" }} strokeWidth={3} strokeDasharray="8 8" strokeLinecap="round" />
        <g transform="translate(40 228)">
          <path d="M4 22 L70 22 L86 4 L4 4 Z" style={{ fill: "var(--accent)" }} />
          <rect x="4" y="22" width="96" height="30" rx="5" style={{ fill: "var(--primary)" }} />
          <rect x="74" y="0" width="30" height="26" rx="4" style={{ fill: "var(--primary)" }} />
          <rect x="80" y="5" width="18" height="11" rx="2" style={{ fill: "var(--card)" }} fillOpacity={0.85} />
          <circle cx="26" cy="58" r="15" style={{ fill: "var(--foreground)" }} />
          <circle cx="26" cy="58" r="6" style={{ fill: "var(--muted)" }} />
          <circle cx="84" cy="58" r="15" style={{ fill: "var(--foreground)" }} />
          <circle cx="84" cy="58" r="6" style={{ fill: "var(--muted)" }} />
        </g>
        <g transform="translate(330 196)">
          <path d="M30 0 L60 14 L30 28 L0 14 Z" style={{ fill: "var(--accent)" }} fillOpacity={0.35} />
          <path d="M0 14 L30 28 L30 64 L0 50 Z" style={{ fill: "var(--accent)" }} fillOpacity={0.55} />
          <path d="M60 14 L30 28 L30 64 L60 50 Z" style={{ fill: "var(--accent)" }} fillOpacity={0.8} />
          <path d="M15 7 L45 21" style={{ stroke: "var(--card)" }} strokeWidth={3} />
        </g>
        <g transform="translate(346 120)">
          <path d="M14 0 C 6.3 0 0 6.1 0 13.7 C 0 24 14 40 14 40 C 14 40 28 24 28 13.7 C 28 6.1 21.7 0 14 0 Z" style={{ fill: "var(--accent)" }} />
          <circle cx="14" cy="13.5" r="5.5" style={{ fill: "var(--card)" }} />
        </g>
      </g>
      <rect x="1" y="1" width="478" height="358" rx="24" fill="none" style={{ stroke: "var(--border)" }} strokeWidth={2} />
      <g transform="translate(36 40)">
        <rect width="168" height="56" rx="14" style={{ fill: "var(--card)", stroke: "var(--border)" }} strokeWidth={1.5} />
        <circle cx="28" cy="28" r="14" style={{ fill: "var(--success)" }} fillOpacity={0.15} />
        <path d="M21 28 L26 33 L35 23" fill="none" style={{ stroke: "var(--success)" }} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <rect x="52" y="18" width="92" height="8" rx="4" style={{ fill: "var(--foreground)" }} fillOpacity={0.75} />
        <rect x="52" y="32" width="64" height="7" rx="3.5" style={{ fill: "var(--muted-foreground)" }} fillOpacity={0.45} />
      </g>
    </svg>
  )
}