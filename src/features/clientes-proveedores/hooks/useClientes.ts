import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { clientesApi } from '../../../api/clientesApi';
import type { FiltrosCliente } from '../../../types/cliente.types';

export const clientesKeys = {
  all: ['clientes'] as const,
  lista: (f: FiltrosCliente) => ['clientes', 'lista', f] as const,
  detalle: (id: number) => ['clientes', 'detalle', id] as const,
};

export const useClientes = (filtros: FiltrosCliente) =>
  useQuery({
    queryKey: clientesKeys.lista(filtros),
    queryFn: () => clientesApi.listar(filtros),
    placeholderData: keepPreviousData,
    // initialDataUpdatedAt: 0 → la lista vacía inicial cuenta como antigua y se
    // consulta al servidor al montar (con el staleTime global no lo hacía).
    initialData: [],
    initialDataUpdatedAt: 0,
  });

export const useCliente = (id: number) =>
  useQuery({
    queryKey: clientesKeys.detalle(id),
    queryFn: () => clientesApi.obtener(id),
    enabled: Number.isFinite(id),
  });