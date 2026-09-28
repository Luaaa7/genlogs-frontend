import { useProveedores } from '../hooks/useProveedores';

interface Props {
  idProveedor: number | null | undefined;
  onChange: (id: number | null) => void;
}

export function VinculoProveedorToggle({ idProveedor, onChange }: Props) {
  const { data: proveedores = [] } = useProveedores();
  const activo = idProveedor != null;

  return (
    <fieldset className="space-y-2 rounded-md border border-slate-200 p-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          role="switch"
          checked={activo}
          onChange={(e) => onChange(e.target.checked ? proveedores[0]?.id ?? 0 : null)}
        />
        Este cliente también es proveedor
      </label>
      {activo && (
        <select
          className="w-full rounded border border-slate-300 p-2 text-sm"
          value={idProveedor ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Selecciona un proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>
              {p.razonSocial} ({p.ruc})
            </option>
          ))}
        </select>
      )}
    </fieldset>
  );
}
