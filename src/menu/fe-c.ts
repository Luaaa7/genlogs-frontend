import { Truck } from 'lucide-react'
import type { ItemMenu } from './tipos'

/** Opciones del menu de FE-C - Panel interno operativo (Alelhy). Solo este bloque edita este archivo. */
export const menuFeC: ItemMenu[] = [
  {
    grupo: 'Operación',
    label: 'Despacho',
    path: '/despachos',
    icon: Truck,
    visible: (permisos) => permisos.puedeVer('despacho') && !permisos.esCliente,
  },
]
