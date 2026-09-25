import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"

interface RoleGuardProps {
  allowedRoles: string[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const hasRole = useAuthStore((state) => state.hasRole)
  const isAllowed = allowedRoles.some((rol) => hasRole(rol))

  if (!isAllowed) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}