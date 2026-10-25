import * as React from "react"
import { cn } from "@/lib/utils/utils"

// Sin tono "primary": en tema oscuro --primary (#2E6BA8) como texto no llega
// a 4.5:1 sobre el fondo; para marcas neutras de marca usa "accent".
export type EstadoBadgeTono = "success" | "warning" | "destructive" | "info" | "accent" | "neutral"

interface EstadoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tono: EstadoBadgeTono
}

/** Chip de estado de negocio (Activo, Pendiente, Inactivo, Principal…).
 *  Antes cada pantalla lo escribía a mano con variaciones de radio y
 *  padding; aquí queda una sola definición. El texto del estado siempre va
 *  dentro: el color nunca es el único indicador. */
const tonos: Record<EstadoBadgeTono, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning-text",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
  neutral: "border border-border text-muted-foreground",
}

export function EstadoBadge({ tono, className, ...props }: EstadoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tonos[tono],
        className
      )}
      {...props}
    />
  )
}
