import type { ContactoTercero, ContactoTerceroInput, Tercero, TerceroInput } from './tercero.types'
/**
 * GET /proveedores también devuelve la entidad JPA tal cual (igual que
 * Cliente): `tercero` viene anidado y sin `contactos` embebidos — esos se
 * piden aparte con useContactosTercero(idTercero).
 */
export interface Proveedor { idProveedor: number; id?: number; situacion: string; status: 'A' | 'I'; tercero: Tercero }
export interface ProveedorInput { tercero: TerceroInput; situacion?: string }
export type ProveedorRequest = ProveedorInput
export type ContactoProveedor = ContactoTercero
export type ContactoProveedorRequest = ContactoTerceroInput
export type ContactoCliente = ContactoTercero
export type ContactoClienteRequest = ContactoTerceroInput
