import React from "react";
import { cn } from "@/lib/utils/utils";
import { iconInputClass } from "./inputStyles";

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function IconInput({ icon, className, ...props }: IconInputProps) {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <span className="absolute left-3.5 text-muted-foreground pointer-events-none flex items-center justify-center">
          {icon}
        </span>
      )}
      <input {...props} className={cn(iconInputClass, icon ? "pl-10 pr-4" : "px-4", className)} />
    </div>
  );
}
