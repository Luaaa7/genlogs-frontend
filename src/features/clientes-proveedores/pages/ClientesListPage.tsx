import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Plus } from 'lucide-react';
import { ClienteTable } from '../components/ClienteTable';
import { ClienteForm } from '../components/ClienteForm';
import { useClientesPagina, useActualizarCliente, useCliente } from '../hooks/useClientes';
import { useCrearCliente } from '../hooks/useCrearCliente';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PanelLateral } from '@/components/ui/PanelLateral';
import { Button } from '@/components/ui/button';
import { Paginacion } from '@/components/ui/tabla';
import CargandoSpinner from '../../../components/ui/CargandoSpinner';
import type { FiltrosCliente } from '../../../types/cliente.types';
import type { Cliente } from '../../../types/cliente.types';
import type { ClienteRequest } from '../../../types/cliente.types';

export default function ClientesListPage() {
  const [filtros, setFiltros] = useState<FiltrosCliente>({});
  const [debounced] = useDebounce(filtros, 300);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(20);
  // Paginación en el servidor: antes se cargaban los ~200 clientes de una vez.
  const { data: resultado, isFetching, isLoading, isError, refetch } = useClientesPagina({ ...debounced, page: pagina, size: tamano });
  const data = resultado?.content ?? [];
  const total = resultado?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / tamano));
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();
  const { data: clienteDetalle } = useCliente(clienteEditando?.idCliente ?? 0);

  const clientes = data ?? [];

  const handleNuevo = () => {
    setClienteEditando(null);
    setMostrarForm(true);
  };

  const handleEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setMostrarForm(true);
  };

  const isEditing = !!clienteEditando;
  const panelTitle = isEditing ? 'Editar cliente' : 'Nuevo cliente';
  const panelDescription = isEditing
    ? 'Modifica los datos del cliente seleccionado.'
    : 'Ingresa el RUC o DNI y los datos se completan desde SUNAT/RENIEC.';

  const valoresIniciales = clienteDetalle
    ? {
        tercero: {
          idTipoDocumento: clienteDetalle.tipoDocumento === 'RUC' ? 1 : 2,
          numeroDocumento: clienteDetalle.numeroDocumento,
          razonSocial: clienteDetalle.razonSocial,
          direccion: clienteDetalle.direccion ?? '',
          telefono: clienteDetalle.telefono ?? '',
          correo: clienteDetalle.correo ?? '',
        },
        idSectorEconomico: 1,
        situacion: clienteDetalle.situacion,
      }
    : undefined;

  const handleSubmit = (data: ClienteRequest) => {
    if (isEditing && clienteEditando) {
      actualizar.mutate({ id: clienteEditando.idCliente, data }, { onSuccess: () => setMostrarForm(false) });
    } else {
      crear.mutate(data, { onSuccess: () => setMostrarForm(false) });
    }
  };

  const nuevo = (
    <Button onClick={handleNuevo}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      Nuevo cliente
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Clientes"
        descripcion={<><span className="tabular-nums">{total}</span> clientes con sus contactos y unidades mineras</>}
        acciones={nuevo}
      />

      {isError && (
        <ErrorBanner
          message="No se pudo cargar la lista de clientes."
          onRetry={() => refetch()}
        />
      )}

      {isLoading ? (
        <CargandoSpinner texto="Cargando clientes..." />
      ) : (
        <div className="flex flex-col gap-3">
          <ClienteTable
            clientes={clientes}
            filtros={filtros}
            onFiltrosChange={(f) => { setFiltros(f); setPagina(0); }}
            isLoading={isFetching}
            accionVacio={nuevo}
            onEditar={handleEditar}
          />
          {total > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card [&>div]:border-t-0">
              <Paginacion
                pagina={pagina}
                totalPaginas={totalPaginas}
                total={total}
                enPagina={clientes.length}
                tamano={tamano}
                onPagina={setPagina}
                onTamano={(t) => { setTamano(t); setPagina(0); }}
              />
            </div>
          )}
        </div>
      )}

      <PanelLateral
        abierto={mostrarForm}
        titulo={panelTitle}
        descripcion={panelDescription}
        onCerrar={() => {
          setMostrarForm(false);
          setClienteEditando(null);
        }}
      >
        <ClienteForm
          isSubmitting={isEditing ? actualizar.isPending : crear.isPending}
          serverError={isEditing
            ? actualizar.isError
              ? 'No se pudo actualizar el cliente. Revisa los datos e intenta de nuevo.'
              : undefined
            : crear.isError
            ? 'No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.'
            : undefined}
          valoresIniciales={valoresIniciales as import('../../../lib/validators/rucDni.schema').ClienteFormValues | undefined}
          onSubmit={handleSubmit}
        />
      </PanelLateral>
    </div>
  );
}