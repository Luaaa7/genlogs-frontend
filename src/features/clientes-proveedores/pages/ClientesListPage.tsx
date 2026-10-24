import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Plus } from 'lucide-react';
import { ClienteTable } from '../components/ClienteTable';
import { ClienteForm } from '../components/ClienteForm';
import { useClientes, useActualizarCliente } from '../hooks/useClientes';
import { valoresTerceroParaEditar } from '@/lib/utils/valoresIniciales';
import { useCrearCliente } from '../hooks/useCrearCliente';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PanelLateral } from '@/components/ui/PanelLateral';
import { Button } from '@/components/ui/button';
import CargandoSpinner from '../../../components/ui/CargandoSpinner';
import type { FiltrosCliente } from '../../../types/cliente.types';
import type { Cliente } from '../../../types/cliente.types';
import type { ClienteRequest } from '../../../types/cliente.types';

export default function ClientesListPage() {
  const [filtros, setFiltros] = useState<FiltrosCliente>({});
  const [debounced] = useDebounce(filtros, 300);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  // Cambiamos a isFetching para cubrir tanto la carga inicial como las recargas por filtros
  const { data = [], isFetching, isError, refetch } = useClientes(debounced);
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();

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

  // Se rellena desde la fila de la lista (trae tipo de documento, distrito y sector
  // como objetos). Antes se usaba el detalle, que no trae ids de distrito ni de sector:
  // el sector se reseteaba a 1 y CE/Pasaporte se convertían en DNI al guardar.
  const valoresIniciales = clienteEditando
    ? {
        tercero: valoresTerceroParaEditar(clienteEditando.tercero),
        idSectorEconomico: clienteEditando.sectorEconomico?.idSectorEconomico ?? 1,
        situacion: clienteEditando.situacion,
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
        descripcion={<><span className="tabular-nums">{clientes.length}</span> clientes con sus contactos y unidades mineras</>}
        acciones={nuevo}
      />

      {isError && (
        <ErrorBanner
          message="No se pudo cargar la lista de clientes."
          onRetry={() => refetch()}
        />
      )}

{isFetching ? (
        <CargandoSpinner texto="Cargando clientes..." />
      ) : (
        <ClienteTable
          clientes={clientes}
          filtros={filtros}
          onFiltrosChange={setFiltros}
          isLoading={isFetching}
          accionVacio={nuevo}
          onEditar={handleEditar}
        />
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
          key={clienteEditando ? `editar-${clienteEditando.idCliente}` : 'nuevo'}
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
