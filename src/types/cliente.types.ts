import type { ContactoCliente } from './proveedor.types';

export type TipoDocumento = 'DNI' | 'RUC';

export interface Cliente {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial: string;
  sectorEconomico: string;
  region: string;
  idProveedor?: number | null;
  contactos: ContactoCliente[];
}

export type ClienteRequest = Omit<Cliente, 'id' | 'contactos'>;

export interface FiltrosCliente {
  documento?: string;
  region?: string;
  sector?: string;
}
