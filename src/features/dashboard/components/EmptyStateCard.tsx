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
    <div className={cn("rounded-xl border border-slate-200 bg-white p-10 text-center transition-shadow hover:shadow-md", className)}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action.variant === "outline" ? (
            <Link
              to={action.href}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <Link
              to={action.href}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}