import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proveedoresApi } from '../../../api/proveedoresApi';
import { contactosClienteApi } from '../../../api/contactosClienteApi';
import type { ContactoClienteRequest } from '../../../types/proveedor.types';

export const proveedoresKeys = { all: ['proveedores'] as const };

// Los contactos viven bajo el Tercero (ver contactosClienteApi.ts), no bajo
// Cliente ni Proveedor, así que su cache se indexa por idTercero.
export const contactosKeys = {
  porTercero: (idTercero: number) => ['contactos', 'por-tercero', idTercero] as const,
};

export const useContactosTercero = (idTercero: number) =>
  useQuery({
    queryKey: contactosKeys.porTercero(idTercero),
    queryFn: () => contactosClienteApi.listar(idTercero),
    enabled: Number.isFinite(idTercero) && idTercero > 0,
    initialData: [],
    initialDataUpdatedAt: 0,
  });

export const useProveedores = () =>
  // initialDataUpdatedAt: 0 → la lista vacía inicial cuenta como antigua y se
  // consulta al servidor al montar (con el staleTime global no lo hacía).
  useQuery({ queryKey: proveedoresKeys.all, queryFn: proveedoresApi.listar, initialData: [], initialDataUpdatedAt: 0 });

export const useCrearProveedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: proveedoresApi.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: proveedoresKeys.all }),
  });
};

export const useAgregarContacto = (idTercero: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactoClienteRequest) => contactosClienteApi.agregar(idTercero, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contactosKeys.porTercero(idTercero) }),
  });
};

export const useEliminarContacto = (idTercero: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idContacto: number) => contactosClienteApi.eliminar(idContacto),
    onSuccess: () => qc.invalidateQueries({ queryKey: contactosKeys.porTercero(idTercero) }),
  });
};