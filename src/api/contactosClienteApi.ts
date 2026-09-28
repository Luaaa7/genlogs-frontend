import { http } from './http';
import type { ContactoCliente, ContactoClienteRequest } from '../types/proveedor.types';

export const contactosClienteApi = {
  agregar: (clienteId: number, data: ContactoClienteRequest) =>
    http
      .post<ContactoCliente>(`/api/clientes/${clienteId}/contactos`, data)
      .then((r) => r.data),
  eliminar: (clienteId: number, contactoId: number) =>
    http.delete<void>(`/api/clientes/${clienteId}/contactos/${contactoId}`),
};
