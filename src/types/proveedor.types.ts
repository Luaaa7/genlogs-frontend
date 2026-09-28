export interface Proveedor {
  id: number;
  ruc: string;
  razonSocial: string;
  contactoNombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

export type ProveedorRequest = Omit<Proveedor, 'id'>;

export interface ContactoCliente {
  id: number;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  principal: boolean;
}

export type ContactoClienteRequest = Omit<ContactoCliente, 'id'>;
