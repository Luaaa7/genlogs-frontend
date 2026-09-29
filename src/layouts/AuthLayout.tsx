import { Outlet } from "react-router-dom"
import logoGenlogs from "../assets/GENLOGS.png"

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-sky-50 via-blue-50 to-cyan-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-blue-900/5">
        
        {/* Logo maximizado */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <img 
            src={logoGenlogs} 
            alt="GenLogs S.A.C." 
            className="h-36 w-auto object-contain" 
          />
        </div>

        <Outlet />
      </div>
    </div>
  )
}