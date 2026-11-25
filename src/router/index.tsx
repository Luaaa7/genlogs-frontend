import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AyudaLayout } from '@/layouts/AyudaLayout'
import { ClienteLayout } from '@/layouts/ClienteLayout'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { ClienteRoute } from '@/router/ClienteRoute'
import { RoleGuard } from '@/router/RoleGuard'
import { perezosa } from '@/router/perezosa'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { creaCotizaciones } from '@/features/cotizaciones/lib/rolesCotizacion'
import { NoEncontradaPage } from '@/router/NoEncontradaPage'
import { LandingPage } from '@/features/landing/LandingPage'
// Paso 0: cada bloque agrega sus rutas en router/rutas/fe-x.tsx, no aqui.
import { RUTAS_BLOQUES } from '@/router/rutas'

// Páginas que se cargan solo al abrir su ruta (code splitting).
const ForgotPasswordPage = perezosa(() => import('@/features/auth/components/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = perezosa(() => import('@/features/auth/components/ResetPasswordPage'), 'ResetPasswordPage')
const DashboardPage = perezosa(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage')
const CatalogoProductosPage = perezosa(() => import('@/features/catalogo-repuestos/pages/CatalogoProductosPage'), 'CatalogoProductosPage')
const ProductoDetallePage = perezosa(() => import('@/features/catalogo-repuestos/pages/ProductoDetallePage'), 'ProductoDetallePage')
const NuevoProductoPage = perezosa(() => import('@/features/catalogo-repuestos/pages/NuevoProductoPage'), 'NuevoProductoPage')
const EditarProductoPage = perezosa(() => import('@/features/catalogo-repuestos/pages/EditarProductoPage'), 'EditarProductoPage')
const CatalogoServiciosPage = perezosa(() => import('@/features/catalogo-servicios/pages/CatalogoServiciosPage'), 'CatalogoServiciosPage')
const ServicioFormPage = perezosa(() => import('@/features/catalogo-servicios/pages/ServicioFormPage'), 'ServicioFormPage')
const ReportesPage = perezosa(() => import('@/features/reportes/pages/ReportesPage'), 'ReportesPage')
const CotizacionesListPage = perezosa(() => import('@/features/cotizaciones/pages/CotizacionesListPage'), 'CotizacionesListPage')
const NuevaCotizacionPage = perezosa(() => import('@/features/cotizaciones/pages/NuevaCotizacionPage'), 'NuevaCotizacionPage')
const EditarCotizacionPage = perezosa(() => import('@/features/cotizaciones/pages/EditarCotizacionPage'), 'EditarCotizacionPage')
const CotizacionDetallePage = perezosa(() => import('@/features/cotizaciones/pages/CotizacionDetallePage'), 'CotizacionDetallePage')
const ClientesListPage = perezosa(() => import('@/features/clientes-proveedores/pages/ClientesListPage'), 'default')
const ClienteDetallePage = perezosa(() => import('@/features/clientes-proveedores/pages/ClienteDetallePage'), 'default')
const ProveedoresListPage = perezosa(() => import('@/features/clientes-proveedores/pages/ProveedoresListPage'), 'default')
const EmpresasMinerasPage = perezosa(() => import('@/features/empresas-mineras/pages/EmpresasMinerasPage'), 'EmpresasMinerasPage')
const OrdenesCompraPage = perezosa(() => import('@/features/ordenes-compra/pages/OrdenesCompraPage'), 'OrdenesCompraPage')
const FacturacionPage = perezosa(() => import('@/features/facturacion/pages/FacturacionPage'), 'FacturacionPage')
const ReclamosPage = perezosa(() => import('@/features/reclamos/pages/ReclamosPage'), 'ReclamosPage')
const ReclamoDetallePage = perezosa(() => import('@/features/reclamos/pages/ReclamoDetallePage'), 'ReclamoDetallePage')
const RegistroClientePage = perezosa(() => import('@/features/portal-cliente/pages/RegistroClientePage'), 'RegistroClientePage')
const IngresoClientePage = perezosa(() => import('@/features/acceso-cliente/pages/IngresoClientePage'), 'IngresoClientePage')
const CompletarEmpresaPage = perezosa(() => import('@/features/acceso-cliente/pages/CompletarEmpresaPage'), 'CompletarEmpresaPage')
const MisPedidosPage = perezosa(() => import('@/features/portal-cliente/pages/MisPedidosPage'), 'MisPedidosPage')
const PedidoDetallePage = perezosa(() => import('@/features/portal-cliente/pages/PedidoDetallePage'), 'PedidoDetallePage')
const NuevaSolicitudPage = perezosa(() => import('@/features/portal-cliente/pages/NuevaSolicitudPage'), 'NuevaSolicitudPage')
<<<<<<< HEAD
// v3.4 (BPMN 4.1): comprobantes del cliente y pago en línea con Mercado Pago.
const MisComprobantesPage = perezosa(() => import('@/features/portal-cliente/pages/MisComprobantesPage'), 'MisComprobantesPage')
const PagoResultadoPage = perezosa(() => import('@/features/portal-cliente/pages/PagoResultadoPage'), 'PagoResultadoPage')
// v3.4 (K2): Ayuda y Contáctame, públicas.
=======
// v3.4 (K2): Ayuda y Contacto, públicas.
>>>>>>> origin/release/v3.3
const AyudaPage = perezosa(() => import('@/features/ayuda/pages/AyudaPage'), 'AyudaPage')
const ContactoPage = perezosa(() => import('@/features/ayuda/pages/ContactoPage'), 'ContactoPage')

export const router = createBrowserRouter([
  { element: <PublicLayout />, children: [
    { path: '/', element: <LandingPage /> },
    ...RUTAS_BLOQUES.publicas,
  ] },
  // Ayuda y Contacto: públicas, pero con sesión se ven dentro del sistema (AyudaLayout elige el marco).
  { element: <AyudaLayout />, children: [
    { path: '/ayuda', element: <AyudaPage /> },
    { path: '/contacto', element: <ContactoPage /> },
  ] },
  { element: <AuthLayout />, children: [
    { path: '/login', element: <LoginPage /> },
    { path: '/recuperar-password', element: <ForgotPasswordPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },
  ] },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [
    { path: '/dashboard', element: <DashboardPage /> },
    { path: '/clientes', element: <ClientesListPage /> },
    { path: '/clientes/:id', element: <ClienteDetallePage /> },
    { path: '/proveedores', element: <ProveedoresListPage /> },
    // R3 (v3.3): empresas mineras y repuestos según la matriz (Gerente, Jefe, Asist. Log. y Asist. Adm.).
    // Crear y editar repuestos, solo Jefe y Asist. Log. (igual que el @PreAuthorize de ProductoController).
    { element: <RoleGuard permitido={(p) => p.verCatalogosYEmpresas} />, children: [
      { path: '/empresas-mineras', element: <EmpresasMinerasPage /> },
      { path: '/catalogo-repuestos', element: <CatalogoProductosPage /> },
      { path: '/catalogo-repuestos/:id', element: <ProductoDetallePage /> },
    ] },
    { element: <RoleGuard permitido={(p) => p.verCatalogosYEmpresas && p.editarCatalogos} />, children: [
      { path: '/catalogo-repuestos/nuevo', element: <NuevoProductoPage /> },
      { path: '/catalogo-repuestos/:id/editar', element: <EditarProductoPage /> },
    ] },
    // S2: servicios y comprobantes según la matriz v3.2 (permisos.ts); el backend también bloquea.
    { element: <RoleGuard permitido={(p) => p.verServicios} />, children: [
      { path: '/catalogo-servicios', element: <CatalogoServiciosPage /> },
      { path: '/catalogo-servicios/nuevo', element: <ServicioFormPage /> },
      { path: '/catalogo-servicios/:id/editar', element: <ServicioFormPage /> },
    ] },
    { path: '/reportes', element: <ReportesPage /> },
    // C2: cotizaciones según la matriz (sin Contador ni SST); la nueva, solo quien crea.
    { element: <RoleGuard permitido={(p) => p.verCotizaciones} />, children: [
      { path: '/cotizaciones', element: <CotizacionesListPage /> },
      { path: '/cotizaciones/:id', element: <CotizacionDetallePage /> },
    ] },
    { element: <RoleGuard permitido={(p) => creaCotizaciones(p.rol)} />, children: [
      { path: '/cotizaciones/nueva', element: <NuevaCotizacionPage /> },
      { path: '/cotizaciones/:id/editar', element: <EditarCotizacionPage /> },
    ] },
    { element: <RoleGuard permitido={(p) => p.verOrdenes} />, children: [
      { path: '/ordenes-compra', element: <OrdenesCompraPage /> },
    ] },
    { element: <RoleGuard permitido={(p) => p.verComprobantes} />, children: [
      { path: '/facturacion', element: <FacturacionPage /> },
    ] },
    // Reclamos internos según la matriz v3.2 (permisos.ts). /usuarios y /configuracion/* están en rutas/fe-a.tsx.
    { element: <RoleGuard permitido={(p) => p.verReclamos} />, children: [
      { path: '/reclamos', element: <ReclamosPage /> },
      { path: '/reclamos/:id', element: <ReclamoDetallePage /> },
    ] },
    ...RUTAS_BLOQUES.internas,
    // Cualquier otra ruta: página 404 dentro del layout (sin sesión, ProtectedRoute manda al login).
    { path: '*', element: <NoEncontradaPage /> },
  ] }] },
  // Registro e ingreso del cliente (FE-A): sin sesión. Desde la v3.4 llevan la misma cabecera
  // pública que el resto del sitio, para que al pasar de Ingresar a Crear cuenta la barra no cambie.
  { element: <PublicLayout />, children: [
    { path: '/portal/ingreso', element: <IngresoClientePage /> },
    { path: '/portal/registro', element: <RegistroClientePage /> },
  ] },
  { element: <ClienteRoute />, children: [{ element: <ClienteLayout />, children: [
    { path: '/portal/pedidos', element: <MisPedidosPage /> },
    { path: '/portal/pedidos/:id', element: <PedidoDetallePage /> },
    { path: '/portal/solicitud', element: <NuevaSolicitudPage /> },
    { path: '/portal/empresa', element: <CompletarEmpresaPage /> },
    { path: '/portal/comprobantes', element: <MisComprobantesPage /> },
    { path: '/portal/comprobantes/pago', element: <PagoResultadoPage /> },
    ...RUTAS_BLOQUES.portal,
  ] }] },
])