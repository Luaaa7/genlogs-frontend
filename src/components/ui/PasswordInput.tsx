import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import { iconInputClass } from "./inputStyles";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function PasswordInput({ icon = <Lock size={18} />, className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <span className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
          {icon}
        </span>
      )}
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn(iconInputClass, "pl-10 pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={showPassword}
        className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
