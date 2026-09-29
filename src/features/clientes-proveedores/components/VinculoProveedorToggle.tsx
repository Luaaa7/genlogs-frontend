interface Props { disabled?: boolean }
/** En V8 clientes y proveedores son roles sobre tercero; no existe idProveedor. */
export function VinculoProveedorToggle({ disabled = true }: Props) { return <p className="rounded-md border border-slate-200 p-3 text-sm text-slate-500">Cliente/proveedor se gestiona como rol independiente sobre el mismo tercero.{disabled ? '' : ''}</p> }
