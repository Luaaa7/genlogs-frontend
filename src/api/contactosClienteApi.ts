import { axiosClient } from './axiosClient'
import type { ContactoCliente, ContactoClienteRequest } from '../types/proveedor.types'

/**
 * Los contactos no cuelgan de /clientes/{id} ni de /proveedores/{id}: viven
 * en ContactoTerceroController, bajo el Tercero compartido por ambos roles
 * (/api/terceros/{idTercero}/contactos y /api/contactos/{idContacto}).
 * El parámetro es idTercero, no idCliente/idProveedor.
 */
export const contactosClienteApi = {
  listar: (idTercero: number) =>
    axiosClient.get<ContactoCliente[]>(`/terceros/${idTercero}/contactos`).then((r) => r.data),
  agregar: (idTercero: number, data: ContactoClienteRequest) =>
    axiosClient
      .post<ContactoCliente>(`/terceros/${idTercero}/contactos`, data)
      .then((r) => r.data),
  actualizar: (idContacto: number, data: ContactoClienteRequest) =>
    axiosClient.put<ContactoCliente>(`/contactos/${idContacto}`, data).then((r) => r.data),
  eliminar: (idContacto: number) => axiosClient.delete<void>(`/contactos/${idContacto}`),
}
