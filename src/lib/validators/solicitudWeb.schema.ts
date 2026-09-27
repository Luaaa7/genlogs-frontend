// src/lib/validators/solicitudWeb.schema.ts

import { z } from 'zod';

export const solicitudWebDetalleSchema = z.object({
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres').max(500),
  cantidad: z.number().min(1).optional(),
  especificaciones: z.string().max(500).optional(),
});

export type SolicitudWebDetalleFormData = z.infer<typeof solicitudWebDetalleSchema>;

export const crearSolicitudWebSchema = z.object({
  nombreContacto: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Debe ingresar un correo válido'),
  telefono: z.string().min(7, 'El teléfono debe tener al menos 7 caracteres').max(20),
  empresaNombre: z.string().max(200).optional(),
  ruc: z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos').optional().or(z.literal('')),
  ciudadUbicacion: z.string().min(2, 'La ciudad es obligatoria').max(100),
  direccion: z.string().max(300).optional(),
  descripcionNecesidad: z.string().min(10, 'Describa su necesidad (mínimo 10 caracteres)').max(2000),
  presupuestoAproximado: z.number().min(0).optional(),
  tiempoEntregaRequerido: z.string().optional(),
  detalles: z.array(solicitudWebDetalleSchema).min(1, 'Debe agregar al menos un detalle de necesidad'),
});

export type CrearSolicitudWebFormData = z.infer<typeof crearSolicitudWebSchema>;
