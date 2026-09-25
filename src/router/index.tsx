import { createBrowserRouter } from "react-router-dom"
import { AuthLayout } from "@/layouts/AuthLayout"
import { AppLayout } from "@/layouts/AppLayout"
import { ProtectedRoute } from "@/router/ProtectedRoute"
import { RoleGuard } from "@/router/RoleGuard"
import { LoginPage } from "@/features/auth/components/LoginPage"
import { ForgotPasswordPage } from "@/features/auth/components/ForgotPasswordPage"
import { UsuariosPage } from "@/features/usuarios/components/UsuariosPage"
import { Placeholder } from "@/router/Placeholder"

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/recuperar-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Placeholder nombre="Dashboard" /> },
          { path: "/clientes-proveedores", element: <Placeholder nombre="Clientes y Proveedores" /> },
          { path: "/empresas-mineras", element: <Placeholder nombre="Empresas Mineras" /> },
          { path: "/catalogo-repuestos", element: <Placeholder nombre="Catálogo de Repuestos" /> },
          { path: "/cotizaciones", element: <Placeholder nombre="Cotizaciones" /> },
          { path: "/ordenes-compra", element: <Placeholder nombre="Órdenes de Compra" /> },
          { path: "/facturacion", element: <Placeholder nombre="Facturación" /> },
          {
            // Solo administradores pueden entrar a /usuarios
            element: <RoleGuard allowedRoles={["ADMINISTRADOR"]} />,
            children: [
              { path: "/usuarios", element: <UsuariosPage /> },
            ],
          },
        ],
      },
    ],
  },
])