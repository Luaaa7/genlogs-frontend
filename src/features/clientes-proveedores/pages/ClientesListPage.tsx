import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Plus } from 'lucide-react';
import { ClienteTable } from '../components/ClienteTable';
import { ClienteForm } from '../components/ClienteForm';
import { useClientes } from '../hooks/useClientes';
import { useCrearCliente } from '../hooks/useCrearCliente';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { PanelLateral } from '@/components/ui/PanelLateral';
import { Button } from '@/components/ui/button';
import type { FiltrosCliente } from '../../../types/cliente.types';

export default function ClientesListPage() {
  const [filtros, setFiltros] = useState<FiltrosCliente>({});
  const [debounced] = useDebounce(filtros, 300);
  const [mostrarForm, setMostrarForm] = useState(false);
  const { data = [], isLoading, isError, refetch } = useClientes(debounced);
  const crear = useCrearCliente();

  const nuevo = (
    <Button onClick={() => setMostrarForm(true)}>
      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
      Nuevo cliente
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Clientes"
        descripcion={<><span className="tabular-nums">{data.length}</span> clientes con sus contactos y unidades mineras</>}
        acciones={nuevo}
      />

      {isError && <ErrorBanner message="No se pudo cargar la lista de clientes." onRetry={() => refetch()} />}
      <ClienteTable clientes={data} filtros={filtros} onFiltrosChange={setFiltros} isLoading={isLoading} accionVacio={nuevo} />

      <PanelLateral
        abierto={mostrarForm}
        titulo="Nuevo cliente"
        descripcion="Ingresa el RUC o DNI y los datos se completan desde SUNAT/RENIEC."
        onCerrar={() => setMostrarForm(false)}
      >
        <ClienteForm
          isSubmitting={crear.isPending}
          serverError={crear.isError ? 'No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.' : undefined}
          onSubmit={(d) => crear.mutate(d, { onSuccess: () => setMostrarForm(false) })}
        />
      </PanelLateral>
    </div>
  );
}
