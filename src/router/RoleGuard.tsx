import { Navigate, useLocation } from "react-router-dom"
import { Outlet } from "react-router-dom"

interface RoleGuardProps {
  allowedRoles: string[]
  children?: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const location = useLocation()
  const userRole = localStorage.getItem("user_role") ?? ""

  if (!allowedRoles.includes(userRole)) {
   return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}