import { Link } from "react-router-dom"
import { cn } from "@/lib/utils/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateCardProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
    variant?: "primary" | "outline"
  }
  className?: string
}

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateCardProps) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm p-10 text-center shadow-sm transition-shadow hover:shadow-md", className)}>
      <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
        {/* Halo degradado detrás del ícono — da un aire "ilustrado"
            en vez de un círculo plano de un solo color. */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/15 via-accent/5 to-transparent" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-card text-accent shadow-sm ring-1 ring-border/60">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          <Button asChild variant={action.variant === "outline" ? "outline" : "default"}>
            <Link to={action.href}>{action.label}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}