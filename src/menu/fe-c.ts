import { Inbox, Truck } from 'lucide-react'
import type { ItemMenu } from './tipos'
import { entraALaPantalla } from '@/features/solicitudes/lib/reglasSolicitud'

/** Opciones del menu de FE-C - Panel interno operativo (Alelhy). Solo este bloque edita este archivo. */
export const menuFeC: ItemMenu[] = [
  {
    grupo: 'Operación',
    label: 'Solicitudes',
    path: '/solicitudes',
    icon: Inbox,
    visible: (permisos) => entraALaPantalla(permisos.rol),
  },
  {
    grupo: 'Operación',
    label: 'Despacho',
    path: '/despachos',
    icon: Truck,
    visible: (permisos) => permisos.puedeVer('despacho') && !permisos.esCliente,
  },
]
