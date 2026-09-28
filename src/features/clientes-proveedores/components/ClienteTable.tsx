import { Link } from 'react-router-dom';
import type { Cliente, FiltrosCliente } from '../../../types/cliente.types';
import { REGIONES, SECTORES } from './ClienteForm';

interface Props {
  clientes: Cliente[];
  filtros: FiltrosCliente;
  onFiltrosChange: (f: FiltrosCliente) => void;
  isLoading?: boolean;
}

const ctl = 'rounded border border-slate-300 p-2 text-sm';

export function ClienteTable({ clientes, filtros, onFiltrosChange, isLoading }: Props) {
  const set = (patch: FiltrosCliente) => onFiltrosChange({ ...filtros, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          className={ctl}
          placeholder="Buscar por DNI o RUC"
          value={filtros.documento ?? ''}
          onChange={(e) => set({ documento: e.target.value })}
        />
        <select className={ctl} value={filtros.region ?? ''} onChange={(e) => set({ region: e.target.value })}>
          <option value="">Todas las regiones</option>
          {REGIONES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className={ctl} value={filtros.sector ?? ''} onChange={(e) => set({ sector: e.target.value })}>
          <option value="">Todos los sectores</option>
          {SECTORES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-2">Documento</th><th className="p-2">Razón social</th>
              <th className="p-2">Sector</th><th className="p-2">Región</th><th className="p-2">Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4 text-slate-500">Cargando clientes…</td></tr>}
            {!isLoading && (!clientes || clientes.length === 0) && (
              <tr><td colSpan={5} className="p-4 text-slate-500">No hay clientes con estos filtros. Prueba quitando alguno.</td></tr>
            )}
            {clientes?.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-2">{c.tipoDocumento} {c.numeroDocumento}</td>
                <td className="p-2">
                  <Link to={`/clientes/${c.id}`} className="font-medium text-sky-700 hover:underline">{c.razonSocial}</Link>
                  {c.nombreComercial && <div className="text-xs text-slate-500">{c.nombreComercial}</div>}
                </td>
                <td className="p-2">{c.sectorEconomico}</td>
                <td className="p-2">{c.region}</td>
                <td className="p-2">{c.idProveedor ? 'Vinculado' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
