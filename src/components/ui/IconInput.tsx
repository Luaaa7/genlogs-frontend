import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode
}

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, className = "", ...props }, ref) => {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          {icon}
        </span>
        <input
          {...props}
          ref={ref}
          className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${className}`}
        />
      </div>
    )
  }
)

IconInput.displayName = "IconInput"