import { Navigate, useLocation } from "react-router-dom"
import { Outlet } from "react-router-dom"

export function ProtectedRoute() {
  const location = useLocation()
  const token = localStorage.getItem("access_token")

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}