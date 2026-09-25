import { createBrowserRouter, Navigate } from "react-router-dom"
import { AuthLayout } from "@/layouts/AuthLayout"
import { AppLayout } from "@/layouts/AppLayout"
import { ProtectedRoute } from "@/router/ProtectedRoute"
import { RoleGuard } from "@/router/RoleGuard"
import { LoginPage } from "@/features/auth/components/LoginPage"
import { ForgotPasswordPage } from "@/features/auth/components/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/components/ResetPasswordPage"
import { UsuariosPage } from "@/features/usuarios/components/UsuariosPage"
import { Placeholder } from "@/router/Placeholder"
import { CatalogoProductosPage } from "@/features/catalogo-repuestos/pages/CatalogoProductosPage"
import { ProductoDetallePage } from "@/features/catalogo-repuestos/pages/ProductoDetallePage"
import { NuevoProductoPage } from "@/features/catalogo-repuestos/pages/NuevoProductoPage"
import { EditarProductoPage } from "@/features/catalogo-repuestos/pages/EditarProductoPage"

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/recuperar-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
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
          { path: "/catalogo-repuestos", element: <CatalogoProductosPage /> },
          { path: "/catalogo-repuestos/nuevo", element: <NuevoProductoPage /> },
          { path: "/catalogo-repuestos/:id", element: <ProductoDetallePage /> },
          { path: "/catalogo-repuestos/:id/editar", element: <EditarProductoPage /> },
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
  // Cualquier ruta no definida cae aquí en vez de mostrar el error genérico de react-router.
  { path: "*", element: <Navigate to="/" replace /> },
])