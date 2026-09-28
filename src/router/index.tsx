import { createBrowserRouter, Navigate } from "react-router-dom"
import { AuthLayout } from "@/layouts/AuthLayout"
import { AppLayout } from "@/layouts/AppLayout"
import { ProtectedRoute } from "@/router/ProtectedRoute"
import { RoleGuard } from "@/router/RoleGuard"
import { LoginPage } from "@/features/auth/components/LoginPage"
import { ForgotPasswordPage } from "@/features/auth/components/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/components/ResetPasswordPage"
import { UsuariosPage } from "@/features/usuarios/components/UsuariosPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"

import { Placeholder } from "@/router/Placeholder"
import { CatalogoProductosPage } from "@/features/catalogo-repuestos/pages/CatalogoProductosPage"
import { ProductoDetallePage } from "@/features/catalogo-repuestos/pages/ProductoDetallePage"
import { NuevoProductoPage } from "@/features/catalogo-repuestos/pages/NuevoProductoPage"
import { EditarProductoPage } from "@/features/catalogo-repuestos/pages/EditarProductoPage"
import { CatalogoServiciosPage } from "@/features/catalogo-servicios/pages/CatalogoServiciosPage"
import { ReportesPage } from "@/features/reportes/pages/ReportesPage"
import { CotizacionesListPage } from "@/features/cotizaciones/pages/CotizacionesListPage"
import { NuevaCotizacionPage } from "@/features/cotizaciones/pages/NuevaCotizacionPage"
import { CotizacionDetallePage } from "@/features/cotizaciones/pages/CotizacionDetallePage"
import { SolicitudWebPublicPage } from "@/features/solicitudes-web/pages/SolicitudWebPublicPage"
import ClientesListPage from "@/features/clientes-proveedores/pages/ClientesListPage"
import ClienteDetallePage from "@/features/clientes-proveedores/pages/ClienteDetallePage"
import ProveedoresListPage from "@/features/clientes-proveedores/pages/ProveedoresListPage"

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/recuperar-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/solicitud-web", element: <SolicitudWebPublicPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Redirección de inicio y definición explícita de /dashboard
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <DashboardPage /> },
          
          // 2. Rutas de Clientes y Proveedores (reemplazando el Placeholder anterior)
          { path: "/clientes", element: <ClientesListPage /> },
          { path: "/clientes/:id", element: <ClienteDetallePage /> },
          { path: "/proveedores", element: <ProveedoresListPage /> },

          { path: "/empresas-mineras", element: <Placeholder nombre="Empresas Mineras" /> },
          
          { path: "/catalogo-repuestos", element: <CatalogoProductosPage /> },
          { path: "/catalogo-repuestos/nuevo", element: <NuevoProductoPage /> },
          { path: "/catalogo-repuestos/:id", element: <ProductoDetallePage /> },
          { path: "/catalogo-repuestos/:id/editar", element: <EditarProductoPage /> },
          
          { path: "/catalogo-servicios", element: <CatalogoServiciosPage /> },
          { path: "/reportes", element: <ReportesPage /> },
          
          { path: "/cotizaciones", element: <CotizacionesListPage /> },
          { path: "/cotizaciones/nueva", element: <NuevaCotizacionPage /> },
          { path: "/cotizaciones/:id", element: <CotizacionDetallePage /> },
          
          { path: "/ordenes-compra", element: <Placeholder nombre="Órdenes de Compra" /> },
          { path: "/facturacion", element: <Placeholder nombre="Facturación" /> },
          {
            element: <RoleGuard allowedRoles={["ADMINISTRADOR"]} />,
            children: [
              { path: "/usuarios", element: <UsuariosPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
])