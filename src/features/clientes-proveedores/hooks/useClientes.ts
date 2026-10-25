import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { clientesApi } from '../../../api/clientesApi';
import type { FiltrosCliente, ClienteRequest } from '../../../types/cliente.types';

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

/** Lista paginada en el servidor (para la pantalla de Clientes). */
export const useClientesPagina = (filtros: FiltrosCliente & { page: number; size: number }) =>
  useQuery({
    queryKey: [...clientesKeys.all, 'pagina', filtros] as const,
    queryFn: () => clientesApi.listarPagina(filtros),
    placeholderData: keepPreviousData,
  });

export const useCliente = (id: number) =>
  useQuery({
    queryKey: clientesKeys.detalle(id),
    queryFn: () => clientesApi.obtener(id),
    // id 0 = ningún cliente elegido: antes igual pedía /clientes/0 en cada carga de la lista.
    enabled: Number.isFinite(id) && id > 0,
  });

export const useActualizarCliente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteRequest }) => clientesApi.actualizar(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientesKeys.all }),
  });
};