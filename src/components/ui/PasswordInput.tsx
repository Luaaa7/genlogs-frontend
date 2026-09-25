import { useState, forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ icon, className = "", ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            {icon}
          </span>
        )}
        <input
          {...props}
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm text-slate-800 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-blue-600"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"