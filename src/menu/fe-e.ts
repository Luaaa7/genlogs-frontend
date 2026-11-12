import { ListChecks, ShieldAlert } from 'lucide-react'
import type { ItemMenu } from './tipos'
import { ROLES_ALERTAS_DOCUMENTOS } from '@/features/alertas-documentos/lib/alertas'

/** Opciones del menu de FE-E - Finanzas, servicios y dashboard (Mell). Solo este bloque edita este archivo. */
export const menuFeE: ItemMenu[] = [
  {
    grupo: 'Operación',
    label: 'Acciones correctivas',
    path: '/acciones',
    icon: ListChecks,
    visible: (p) => p.puedeVer('dashboard'),
  },
  {
    grupo: 'Operación',
    label: 'PASE y SCTR por vencer',
    path: '/alertas-documentos',
    icon: ShieldAlert,
    visible: (p) => p.rol !== null && ROLES_ALERTAS_DOCUMENTOS.includes(p.rol),
  },
]
