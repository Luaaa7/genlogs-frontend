import { Link } from "react-router-dom"
import { cn } from "@/lib/utils/utils"

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
    <div className={cn("rounded-xl border border-border bg-card p-10 text-center transition-shadow hover:shadow-md", className)}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action.variant === "outline" ? (
            <Link
              to={action.href}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {action.label}
            </Link>
          ) : (
            <Link
              to={action.href}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}