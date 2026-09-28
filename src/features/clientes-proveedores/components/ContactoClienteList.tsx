import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactoSchema, type ContactoFormValues } from '../../../lib/validators/rucDni.schema';
import type { ContactoCliente } from '../../../types/proveedor.types';
import { useAgregarContacto, useEliminarContacto } from '../hooks/useProveedores';

const input = 'rounded border border-slate-300 p-2 text-sm';

export function ContactoClienteList({ clienteId, contactos }: { clienteId: number; contactos: ContactoCliente[] }) {
  const agregar = useAgregarContacto(clienteId);
  const eliminar = useEliminarContacto(clienteId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: { principal: false },
  });

  const onSubmit = handleSubmit((v) =>
    agregar.mutate({ ...v, principal: !!v.principal }, { onSuccess: () => reset() }),
  );

  return (
    <section className="space-y-4">
      <ul className="divide-y divide-slate-100 rounded border border-slate-200">
        {contactos.length === 0 && <li className="p-3 text-sm text-slate-500">Aún no hay contactos. Agrega el primero abajo.</li>}
        {contactos.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <div className="font-medium">
                {c.nombre} {c.principal && <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-800">Principal</span>}
              </div>
              <div className="text-slate-500">{c.cargo} · {c.telefono} · {c.email}</div>
            </div>
            <button
              onClick={() => window.confirm(`¿Eliminar a ${c.nombre}?`) && eliminar.mutate(c.id)}
              disabled={eliminar.isPending}
              className="text-red-600 hover:underline"
            >
              Eliminar contacto
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-2" noValidate>
        {(['nombre', 'cargo', 'telefono', 'email'] as const).map((f) => (
          <label key={f} className="text-sm capitalize">
            {f}
            <input {...register(f)} className={`${input} w-full`} />
            {errors[f] && <span className="text-xs text-red-600">{errors[f]?.message}</span>}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('principal')} /> Contacto principal
        </label>
        <button type="submit" disabled={agregar.isPending} className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">
          {agregar.isPending ? 'Agregando…' : 'Agregar contacto'}
        </button>
      </form>
    </section>
  );
}
