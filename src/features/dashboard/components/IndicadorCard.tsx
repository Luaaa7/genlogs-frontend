import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface IndicadorCardProps {
  icon: LucideIcon
  label: string
  value: string
  subtitle?: string
  trend?: number
  trendLabel?: string
  variant?: "default" | "highlight"
}

function TrendIndicator({ trend, label }: { trend: number; label?: string }) {
  if (trend === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>{label ?? "Sin cambios"}</span>
      </div>
    )
  }

  const isPositive = trend > 0
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive ? "text-emerald-600" : "text-destructive"
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{label ?? `${isPositive ? "+" : ""}${trend.toFixed(1)}%`}</span>
    </div>
  )
}

export function IndicadorCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  trendLabel,
  variant = "default",
}: IndicadorCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg border border-border p-4 transition-shadow hover:shadow-md",
        variant === "highlight" && "bg-primary/5 border-primary/20"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {trend !== undefined && <TrendIndicator trend={trend} label={trendLabel} />}
        </div>
        <p className="text-lg font-semibold truncate">{value}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}