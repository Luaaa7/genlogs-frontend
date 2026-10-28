import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactoSchema, type ContactoFormValues } from '../../../lib/validators/rucDni.schema';
import type { ContactoCliente } from '../../../types/proveedor.types';
import { useAgregarContacto, useContactosTercero, useEliminarContacto } from '../hooks/useProveedores';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Campo } from '@/components/ui/campo';
import { describedBy, inputFormClass } from '@/components/ui/campoEstilos';
import { avisar } from '@/lib/avisos';

/** Campos del formulario de contacto con su etiqueta visible (con tildes). */
const CAMPOS_CONTACTO = [['nombre', 'Nombre', 'name'], ['cargo', 'Cargo', 'organization-title'], ['telefono', 'Teléfono', 'tel'], ['email', 'Correo', 'email']] as const

/**
 * Los contactos cuelgan del Tercero (no del Cliente/Proveedor directamente),
 * así que este componente recibe idTercero y carga su propia lista — no
 * depende de que el padre se la pase embebida en otro objeto.
 */
export function ContactoClienteList({ idTercero }: { idTercero: number }) {
  const { data: contactos = [] } = useContactosTercero(idTercero);
  const agregar = useAgregarContacto(idTercero);
  const eliminar = useEliminarContacto(idTercero);
  const [contactoAEliminar, setContactoAEliminar] = useState<ContactoCliente | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactoFormValues>({
    resolver: zodResolver(contactoSchema),
    defaultValues: { principal: false },
  });

  const onSubmit = handleSubmit((v) =>
    agregar.mutate(
      { ...v, nombres: v.nombre, correo: v.email, esPrincipal: !!v.principal },
      {
        onSuccess: () => {
          reset();
          avisar(`Contacto ${v.nombre} agregado`);
        },
      },
    ),
  );

  return (
    <section className="space-y-4">
      <ul className="divide-y divide-border rounded border border-border">
        {contactos.length === 0 && <li className="p-3 text-sm text-muted-foreground">Aún no hay contactos. Agrega el primero abajo.</li>}
        {contactos.map((c) => (
          <li key={c.id ?? c.idContacto} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <div className="font-medium">
                {c.nombre ?? c.nombres} {(c.principal ?? c.esPrincipal) && <EstadoBadge tono="accent" className="ml-1">Principal</EstadoBadge>}
              </div>
              <div className="text-muted-foreground">{c.cargo} · {c.telefono} · {c.email ?? c.correo}</div>
            </div>
            <button
              type="button"
              onClick={() => setContactoAEliminar(c)}
              aria-label={`Eliminar a ${c.nombre ?? c.nombres}`}
              disabled={eliminar.isPending}
              className="text-destructive hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Eliminar contacto
            </button>
          </li>
        ))}
      </ul>

      {eliminar.isError && (
        <ErrorBanner message="No se pudo eliminar el contacto. Intenta de nuevo." />
      )}

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
        {CAMPOS_CONTACTO.map(([f, etiqueta, autoComplete]) => {
          const id = `contacto-${f}`;
          return (
            <Campo key={f} id={id} label={etiqueta} error={errors[f]?.message} obligatorio={f === 'nombre'}>
              <input
                id={id}
                type={f === 'email' ? 'email' : f === 'telefono' ? 'tel' : 'text'}
                autoComplete={autoComplete}
                {...register(f)}
                aria-invalid={!!errors[f]}
                aria-describedby={describedBy(id, { error: errors[f] })}
                className={inputFormClass}
              />
            </Campo>
          );
        })}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('principal')} /> Contacto principal
        </label>
        {agregar.isError && (
          <div className="sm:col-span-2">
            <ErrorBanner message="No se pudo agregar el contacto. Revisa los datos e intenta de nuevo." />
          </div>
        )}
        <button
          type="submit"
          disabled={agregar.isPending}
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2 transition-colors"
        >
          {agregar.isPending ? 'Agregando…' : 'Agregar contacto'}
        </button>
      </form>

      <ConfirmDialog
        open={contactoAEliminar !== null}
        title="Eliminar contacto"
        description={
          contactoAEliminar
            ? `¿Eliminar a ${contactoAEliminar.nombre ?? contactoAEliminar.nombres}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={eliminar.isPending}
        onConfirm={() => {
          if (!contactoAEliminar) return;
          eliminar.mutate(contactoAEliminar.id ?? contactoAEliminar.idContacto, {
            onSuccess: () => {
              avisar(`Contacto ${contactoAEliminar.nombre ?? contactoAEliminar.nombres} eliminado`);
              setContactoAEliminar(null);
            },
            // Si falla, se cierra el diálogo y se muestra el error arriba del formulario.
            onError: () => setContactoAEliminar(null),
          });
        }}
        onCancel={() => setContactoAEliminar(null)}
      />
    </section>
  );
}