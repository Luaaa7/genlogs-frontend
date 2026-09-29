import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { ClienteTable } from '../components/ClienteTable';
import { ClienteForm } from '../components/ClienteForm';
import { useClientes } from '../hooks/useClientes';
import { useCrearCliente } from '../hooks/useCrearCliente';
import type { FiltrosCliente } from '../../../types/cliente.types';

export default function ClientesListPage() {
  const [filtros, setFiltros] = useState<FiltrosCliente>({});
  const [debounced] = useDebounce(filtros, 300);
  const [mostrarForm, setMostrarForm] = useState(false);
  const { data = [], isLoading, isError } = useClientes(debounced);
  const crear = useCrearCliente();

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <button onClick={() => setMostrarForm((v) => !v)} className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-primary/90 hover:to-accent/90 transition-all">
          {mostrarForm ? 'Cerrar' : 'Nuevo cliente'}
        </button>
      </header>

      {mostrarForm && (
        <div className="rounded border border-border p-4">
          <ClienteForm
            isSubmitting={crear.isPending}
            serverError={crear.isError ? 'No se pudo guardar el cliente. Revisa los datos e intenta de nuevo.' : undefined}
            onSubmit={(d) => crear.mutate(d, { onSuccess: () => setMostrarForm(false) })}
          />
        </div>
      )}

      {isError && <p role="alert" className="text-sm text-destructive">No se pudo cargar la lista. Recarga la página.</p>}
      <ClienteTable clientes={data} filtros={filtros} onFiltrosChange={setFiltros} isLoading={isLoading} />
    </main>
  );
}
