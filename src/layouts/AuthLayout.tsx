import { Outlet } from "react-router-dom"

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-sky-50 via-blue-50 to-cyan-100 p-4">
      {/* Tarjeta blanca principal que envuelve todo */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-blue-900/5">
        
        {/* Logo y nombre de la empresa dentro del tablero blanco */}
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-600/30">
            <span className="text-xl font-bold text-white">GL</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-800">GenLogs</h2>
        </div>

        {/* Contenido de las pantallas de autenticación */}
        <Outlet />
        
      </div>
    </div>
  )
}