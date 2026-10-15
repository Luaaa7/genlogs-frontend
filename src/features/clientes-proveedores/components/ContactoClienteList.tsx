import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactoSchema, type ContactoFormValues } from '../../../lib/validators/rucDni.schema';
import type { ContactoCliente } from '../../../types/proveedor.types';
import { useAgregarContacto, useEliminarContacto } from '../hooks/useProveedores';

const input = 'rounded border border-border p-2 text-sm';

export function ContactoClienteList({ clienteId, contactos }: { clienteId: number; contactos: ContactoCliente[] }) {
  const agregar = useAgregarContacto(clienteId);
  const eliminar = useEliminarContacto(clienteId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: { principal: false },
  });

  const onSubmit = handleSubmit((v) =>
    agregar.mutate({ ...v, nombres: v.nombre, correo: v.email, esPrincipal: !!v.principal }, { onSuccess: () => reset() }),
  );

  return (
    <section className="space-y-4">
      <ul className="divide-y divide-border rounded border border-border">
        {contactos.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aún no hay contactos. Agrega el primero abajo.</li>}
        {contactos.map((c) => (
          <li key={c.id ?? c.idContacto} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <div className="font-medium">
                {c.nombre ?? c.nombres} {(c.principal ?? c.esPrincipal) && <span className="ml-1 rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">Principal</span>}
              </div>
              <div className="text-muted-foreground">{c.cargo} · {c.telefono} · {c.email ?? c.correo}</div>
            </div>
            <button
              onClick={() => window.confirm(`¿Eliminar a ${(c.nombre ?? c.nombres)}?`) && eliminar.mutate(c.id ?? c.idContacto)}
              disabled={eliminar.isPending}
              className="text-destructive hover:underline"
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
            {errors[f] && <span className="text-xs text-destructive">{errors[f]?.message}</span>}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('principal')} /> Contacto principal
        </label>
        <button type="submit" disabled={agregar.isPending} className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2">
          {agregar.isPending ? 'Agregando…' : 'Agregar contacto'}
        </button>
      </form>
    </section>
  );
}
