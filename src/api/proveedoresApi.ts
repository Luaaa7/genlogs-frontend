import { http } from './http';
import type { Proveedor, ProveedorRequest } from '../types/proveedor.types';
import { extractArray } from '@/lib/utils/pagination';

export const proveedoresApi = {
  listar: () => http.get<unknown>('/api/proveedores').then((r) => extractArray<Proveedor>(r.data)),
  crear: (data: ProveedorRequest) => http.post<Proveedor>('/api/proveedores', data).then((r) => r.data),
};