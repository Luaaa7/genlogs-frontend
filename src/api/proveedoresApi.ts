import { http } from './http';
import type { Proveedor, ProveedorRequest } from '../types/proveedor.types';

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

export const proveedoresApi = {
  listar: () => http.get<unknown>('/api/proveedores').then((r) => extractArray<Proveedor>(r.data)),
  crear: (data: ProveedorRequest) => http.post<Proveedor>('/api/proveedores', data).then((r) => r.data),
};