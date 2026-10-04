import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proveedoresApi } from '../../../api/proveedoresApi';
import { contactosClienteApi } from '../../../api/contactosClienteApi';
import type { ContactoClienteRequest } from '../../../types/proveedor.types';
import { clientesKeys } from './useClientes';

export const proveedoresKeys = { all: ['proveedores'] as const };

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

export const useAgregarContacto = (clienteId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactoClienteRequest) => contactosClienteApi.agregar(clienteId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientesKeys.detalle(clienteId) }),
  });
};

export const useEliminarContacto = (clienteId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactoId: number) => contactosClienteApi.eliminar(clienteId, contactoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientesKeys.detalle(clienteId) }),
  });
};