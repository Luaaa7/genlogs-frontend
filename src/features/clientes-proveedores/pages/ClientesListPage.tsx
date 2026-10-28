import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { avisar } from '@/lib/avisos';
import { listarSectoresEconomicos } from '@/api/sectoresEconomicosApi';
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
  const { data: clienteDetalle, isError: errorDetalle } = useCliente(clienteEditando?.idCliente ?? 0);
  const { data: sectores = [] } = useQuery({ queryKey: ['sectores-economicos'], queryFn: listarSectoresEconomicos, staleTime: 10 * 60_000 });

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

  // El sector real del cliente: el id si vino en la fila, si no por su nombre en el catálogo.
  // Antes se forzaba a 1 y al guardar se pisaba el sector verdadero (#2).
  const normalizar = (t?: string | null) => (t ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const idSectorReal =
    clienteEditando?.sectorEconomico?.idSectorEconomico ??
    sectores.find((s) => normalizar(s.nombreSector) === normalizar(clienteDetalle?.sectorEconomico))?.idSectorEconomico;
  const TIPO_DOC: Record<string, number> = { RUC: 1, DNI: 2, CE: 3, PASAPORTE: 4 };

  // El detalle del cliente que se está editando ya llegó (y es el de ESE cliente, no el anterior).
  const detalleListo = !!clienteDetalle && clienteDetalle.idCliente === clienteEditando?.idCliente;

  const valoresIniciales = detalleListo && clienteDetalle
    ? {
        tercero: {
          idTipoDocumento: TIPO_DOC[(clienteDetalle.tipoDocumento ?? '').toUpperCase()] ?? 1,
          numeroDocumento: clienteDetalle.numeroDocumento,
          razonSocial: clienteDetalle.razonSocial,
          direccion: clienteDetalle.direccion ?? '',
          telefono: clienteDetalle.telefono ?? '',
          correo: clienteDetalle.correo ?? '',
        },
        ...(idSectorReal != null ? { idSectorEconomico: idSectorReal } : {}),
        situacion: clienteDetalle.situacion,
      }
    : undefined;

  const handleSubmit = (data: ClienteRequest) => {
    if (isEditing && clienteEditando) {
      actualizar.mutate({ id: clienteEditando.idCliente, data }, {
        onSuccess: () => {
          setMostrarForm(false);
          avisar(`Cliente ${data.tercero.razonSocial} actualizado`);
        },
      });
    } else {
      crear.mutate(data, {
        onSuccess: () => {
          setMostrarForm(false);
          avisar(`Cliente ${data.tercero.razonSocial} registrado`);
        },
      });
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
        {isEditing && !detalleListo ? (
          errorDetalle ? (
            <ErrorBanner message="No se pudieron cargar los datos del cliente." />
          ) : (
            <CargandoSpinner texto="Cargando datos del cliente..." />
          )
        ) : (
        <ClienteForm
          // Se vuelve a montar al cambiar de cliente: useForm solo lee los valores iniciales al montarse.
          key={isEditing ? `editar-${clienteEditando?.idCliente}` : 'nuevo'}
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
        )}
      </PanelLateral>
    </div>
  );
}