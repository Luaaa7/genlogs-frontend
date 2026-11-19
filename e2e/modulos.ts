/**
 * Páginas que revisan Playwright (e2e/paginas.spec.ts) y Lighthouse (scripts/lighthouse-modulos.mjs).
 * Las internas se abren con la sesión del usuario de GENLOGS_USUARIO (por defecto demo.jefe).
 * Si el rol no tiene permiso, la app redirige a /dashboard y se anota como «sin acceso».
 */
export type Modulo = { nombre: string; ruta: string }

export const PUBLICAS: Modulo[] = [
  { nombre: 'Landing', ruta: '/' },
  { nombre: 'Login', ruta: '/login' },
  { nombre: 'Portal - ingreso', ruta: '/portal/ingreso' },
  { nombre: 'Portal - registro', ruta: '/portal/registro' },
  { nombre: 'Recuperar contraseña', ruta: '/recuperar-password' },
]

export const INTERNAS: Modulo[] = [
  { nombre: 'Dashboard', ruta: '/dashboard' },
  { nombre: 'Solicitudes', ruta: '/solicitudes' },
  { nombre: 'Cotizaciones', ruta: '/cotizaciones' },
  { nombre: 'Órdenes de compra', ruta: '/ordenes-compra' },
  { nombre: 'Comprobantes', ruta: '/facturacion' },
  { nombre: 'Reclamos', ruta: '/reclamos' },
  { nombre: 'Despacho', ruta: '/despachos' },
  { nombre: 'Acciones correctivas', ruta: '/acciones' },
  { nombre: 'PASE y SCTR', ruta: '/alertas-documentos' },
  { nombre: 'Búsqueda', ruta: '/busqueda' },
  { nombre: 'Vitrina', ruta: '/vitrina/productos' },
  { nombre: 'Clientes', ruta: '/clientes' },
  { nombre: 'Proveedores', ruta: '/proveedores' },
  { nombre: 'Empresas mineras', ruta: '/empresas-mineras' },
  { nombre: 'Repuestos', ruta: '/catalogo-repuestos' },
  { nombre: 'Servicios', ruta: '/catalogo-servicios' },
  { nombre: 'Reportes', ruta: '/reportes' },
  { nombre: 'Usuarios', ruta: '/usuarios' },
  { nombre: 'IGV', ruta: '/configuracion/igv' },
  { nombre: 'Márgenes', ruta: '/configuracion/margenes' },
  { nombre: 'Parámetros', ruta: '/configuracion/parametros' },
  { nombre: 'Tipo de cambio', ruta: '/configuracion/tipo-cambio' },
  { nombre: 'Fuentes de búsqueda', ruta: '/configuracion/fuentes' },
  { nombre: 'Prueba de 10 pedidos', ruta: '/configuracion/prueba-fuentes' },
]
