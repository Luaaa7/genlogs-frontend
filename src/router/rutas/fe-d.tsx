import type { RutasBloque } from './tipos'
import { vitrinaHabilitada } from '@/lib/interruptores'
import { RutaBusqueda } from '@/features/busqueda/RutaBusqueda'
import { BusquedaPage } from '@/features/busqueda/pages/BusquedaPage'
import { RutaVitrina } from '@/features/vitrina/RutaVitrina'
import { VitrinaProductosPage } from '@/features/vitrina/pages/VitrinaProductosPage'
import { ProductoVitrinaPage } from '@/features/vitrina/pages/ProductoVitrinaPage'
import { RepuestosPage } from '@/features/portal-cliente/repuestos/RepuestosPage'

/** Rutas de FE-D - Landing, busqueda y vitrina interna (Nicole). Solo este bloque edita este archivo. */
export const rutasFeD: RutasBloque = {
  // Fases 2 y 3: apagadas hasta la prueba de 10 pedidos (VITE_VITRINA_HABILITADA).
  internas: vitrinaHabilitada
    ? [
        { element: <RutaBusqueda />, children: [{ path: '/busqueda', element: <BusquedaPage /> }] },
        {
          element: <RutaVitrina />,
          children: [
            { path: '/vitrina/productos', element: <VitrinaProductosPage /> },
            { path: '/vitrina/productos/:id', element: <ProductoVitrinaPage /> },
          ],
        },
      ]
    : [],
  // "Repuestos" del portal (pieza de Nicole dentro de FE-B): dentro de ClienteLayout, con sesión de cliente.
  portal: vitrinaHabilitada ? [{ path: '/portal/repuestos', element: <RepuestosPage /> }] : [],
  publicas: [],
}
