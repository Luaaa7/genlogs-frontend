import { Outlet } from "react-router-dom"
import logoGenlogs from "../assets/GENLOGS.png"

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2E6BA8] p-4 sm:p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/20">

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <img
            src={logoGenlogs}
            alt="GenLogs S.A.C."
            className="h-28 w-auto sm:h-36 object-contain"
          />
        </div>

        <Outlet />
      </div>
    </div>
  )
}
