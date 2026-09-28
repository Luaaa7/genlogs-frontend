import { Link, useParams } from 'react-router-dom';
import { useCliente } from '../hooks/useClientes';
import { ContactoClienteList } from '../components/ContactoClienteList';

export default function ClienteDetallePage() {
  const id = Number(useParams().id);
  const { data: cliente, isLoading, isError } = useCliente(id);

  if (isLoading) return <p className="p-6 text-slate-500">Cargando cliente…</p>;
  if (isError || !cliente) return <p role="alert" className="p-6 text-red-600">No se encontró el cliente.</p>;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link to="/clientes" className="text-sm text-sky-700 hover:underline">Volver a clientes</Link>
      <header>
        <h1 className="text-2xl font-semibold">{cliente.razonSocial}</h1>
        <p className="text-sm text-slate-500">{cliente.tipoDocumento} {cliente.numeroDocumento}</p>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-slate-500">Nombre comercial</dt><dd>{cliente.nombreComercial || '—'}</dd></div>
        <div><dt className="text-slate-500">Sector</dt><dd>{cliente.sectorEconomico}</dd></div>
        <div><dt className="text-slate-500">Región</dt><dd>{cliente.region}</dd></div>
        <div><dt className="text-slate-500">Proveedor vinculado</dt><dd>{cliente.idProveedor ?? '—'}</dd></div>
      </dl>
      <h2 className="text-lg font-semibold">Contactos</h2>
      <ContactoClienteList clienteId={cliente.id} contactos={cliente.contactos ?? []} />
    </main>
  );
}
