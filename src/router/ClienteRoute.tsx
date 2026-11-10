import { Navigate, Outlet, useLocation } from "react-router-dom"

export function ClienteRoute() {
  const location = useLocation()
  const token = localStorage.getItem("cliente_access_token")
  const session = sessionStorage.getItem("genlogs-cliente-auth")
  const internalToken = localStorage.getItem("access_token")
  const internalSession = sessionStorage.getItem("genlogs-auth")
  const role = (() => {
    try {
      return JSON.parse(session ?? "{}").rol ?? ""
    } catch {
      return ""
    }
  })()
  const isClientSession = Boolean(
    token &&
    session &&
    !internalToken &&
    !internalSession &&
    (!role || role.toUpperCase() === "CLIENTE")
  )

  if (!isClientSession) {
    return <Navigate to="/portal/registro" state={{ from: location }} replace />
  }

  return <Outlet />
}
