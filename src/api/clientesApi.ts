import { http } from './http';
import type { Cliente, ClienteRequest, FiltrosCliente } from '../types/cliente.types';
import { extractArray, limpiarFiltros } from '@/lib/utils/pagination';

export const clientesApi = {
  listar: (filtros: FiltrosCliente = {}) =>
    http.get<unknown>('/api/clientes', { params: limpiarFiltros(filtros as Record<string, unknown>) }).then((r) => extractArray<Cliente>(r.data)),
  obtener: (id: number) => http.get<Cliente>(`/api/clientes/${id}`).then((r) => r.data),
  crear: (data: ClienteRequest) => http.post<Cliente>('/api/clientes', data).then((r) => r.data),
};