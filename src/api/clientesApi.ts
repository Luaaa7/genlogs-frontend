import { http } from './http';
import type { Cliente, ClienteRequest, FiltrosCliente } from '../types/cliente.types';

const limpiar = (f: FiltrosCliente) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== ''));

function extractArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.content)) return obj.content as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

export const clientesApi = {
  listar: (filtros: FiltrosCliente = {}) =>
    http.get<unknown>('/api/clientes', { params: limpiar(filtros) }).then((r) => extractArray<Cliente>(r.data)),
  obtener: (id: number) => http.get<Cliente>(`/api/clientes/${id}`).then((r) => r.data),
  crear: (data: ClienteRequest) => http.post<Cliente>('/api/clientes', data).then((r) => r.data),
};