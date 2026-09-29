import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema, type ClienteFormValues } from '../../../lib/validators/rucDni.schema';
import type { ClienteRequest } from '../../../types/cliente.types';
import { VinculoProveedorToggle } from './VinculoProveedorToggle';
import { REGIONES, SECTORES } from '../constants/clientes.constants';

interface Props {
  onSubmit: (data: ClienteRequest) => void;
  isSubmitting?: boolean;
  serverError?: string;
}

const input = 'w-full rounded border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-600';

export function ClienteForm({ onSubmit, isSubmitting, serverError }: Props) {
  const {
    register, control, watch, handleSubmit, formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { tipoDocumento: 'RUC', idProveedor: null, nombreComercial: '' },
  });
  const tipo = watch('tipoDocumento');

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v as ClienteRequest))} className="space-y-4" noValidate>
      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm">
          Tipo
          <select {...register('tipoDocumento')} className={input}>
            <option value="RUC">RUC</option>
            <option value="DNI">DNI</option>
          </select>
        </label>
        <label className="col-span-2 text-sm">
          Número de {tipo}
          <input {...register('numeroDocumento')} inputMode="numeric" maxLength={tipo === 'RUC' ? 11 : 8} className={input} />
          {errors.numeroDocumento && <span className="text-xs text-red-600">{errors.numeroDocumento.message}</span>}
        </label>
      </div>

      <label className="block text-sm">
        Razón social
        <input {...register('razonSocial')} className={input} />
        {errors.razonSocial && <span className="text-xs text-red-600">{errors.razonSocial.message}</span>}
      </label>
      <label className="block text-sm">
        Nombre comercial
        <input {...register('nombreComercial')} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Sector económico
          <select {...register('sectorEconomico')} className={input} defaultValue="">
            <option value="" disabled>Selecciona</option>
            {SECTORES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {errors.sectorEconomico && <span className="text-xs text-red-600">{errors.sectorEconomico.message}</span>}
        </label>
        <label className="text-sm">
          Región
          <select {...register('region')} className={input} defaultValue="">
            <option value="" disabled>Selecciona</option>
            {REGIONES.map((r) => <option key={r}>{r}</option>)}
          </select>
          {errors.region && <span className="text-xs text-red-600">{errors.region.message}</span>}
        </label>
      </div>

      <Controller
        name="idProveedor"
        control={control}
        render={({ field }) => <VinculoProveedorToggle idProveedor={field.value} onChange={field.onChange} />}
      />

      {serverError && <p role="alert" className="text-sm text-red-600">{serverError}</p>}
      <button type="submit" disabled={isSubmitting} className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {isSubmitting ? 'Guardando…' : 'Guardar cliente'}
      </button>
    </form>
  );
}
