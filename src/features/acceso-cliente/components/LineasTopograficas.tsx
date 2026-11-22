/**
 * Curvas de nivel, como en un plano topográfico de mina: textura de fondo para las
 * franjas azul marino del portal. Siempre iguales (sin azar) y solo decorativas.
 */
const CENTROS = [
  { x: 820, y: 120, anillos: 9 },
  { x: 1150, y: 420, anillos: 7 },
]

function curva(cx: number, cy: number, radio: number, fase: number): string {
  const puntos: string[] = []
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * 2 * Math.PI
    const r = radio * (1 + 0.1 * Math.sin(3 * t + fase) + 0.06 * Math.sin(5 * t + fase * 2) + 0.04 * Math.sin(2 * t + fase * 3))
    puntos.push(`${(cx + r * Math.cos(t) * 1.35).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`)
  }
  return `M${puntos.join(" L")}Z`
}

const TRAZOS = CENTROS.flatMap(({ x, y, anillos }, c) =>
  Array.from({ length: anillos }, (_, k) => curva(x, y, (k + 1) * 38, (k + 1) * 0.7 + c * 1.9)),
)

export function LineasTopograficas() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1280 560"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeOpacity={0.08}
      strokeWidth={1.2}
    >
      {TRAZOS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}
