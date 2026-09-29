import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils/utils"

interface IndicadorCardProps {
  icon: LucideIcon
  label: string
  value: string
  subtitle?: string
  trend?: number
  trendLabel?: string
  iconBgColor?: string
  iconColor?: string
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
        isPositive ? "text-success" : "text-destructive"
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
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
}: IndicadorCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", iconBgColor, iconColor)}>
          <Icon className="h-5.5 w-5.5" />
        </div>
        {trend !== undefined && <TrendIndicator trend={trend} label={trendLabel} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground leading-tight line-clamp-2">{label}</p>
        <p className="mt-1.5 text-3xl font-bold text-foreground tracking-tight font-mono">{value}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
      </div>
    </div>
  )
}