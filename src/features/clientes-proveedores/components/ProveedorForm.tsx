import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proveedorSchema, type ProveedorFormValues } from '../../../lib/validators/rucDni.schema';

interface Props {
  defaultValues?: Partial<ProveedorFormValues>;
  onSubmit: (data: ProveedorFormValues) => void;
  isSubmitting?: boolean;
  serverError?: string;
}

const input = 'w-full rounded border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600';

const CAMPOS: { name: keyof ProveedorFormValues; label: string; type?: string; max?: number }[] = [
  { name: 'ruc', label: 'RUC', max: 11 },
  { name: 'razonSocial', label: 'Razón social' },
  { name: 'contactoNombre', label: 'Nombre del contacto' },
  { name: 'telefono', label: 'Teléfono', type: 'tel' },
  { name: 'email', label: 'Correo', type: 'email' },
  { name: 'direccion', label: 'Dirección' },
];

export function ProveedorForm({ defaultValues, onSubmit, isSubmitting, serverError }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {CAMPOS.map((c) => (
        <label key={c.name} className="block text-sm">
          {c.label}
          <input {...register(c.name)} type={c.type ?? 'text'} maxLength={c.max} className={input} />
          {errors[c.name] && <span className="text-xs text-red-600">{errors[c.name]?.message}</span>}
        </label>
      ))}
      {serverError && <p role="alert" className="text-sm text-red-600">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {isSubmitting ? 'Guardando…' : 'Guardar proveedor'}
      </button>
    </form>
  );
}
