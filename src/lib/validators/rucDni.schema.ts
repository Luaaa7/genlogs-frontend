import { z } from 'zod';

export const dniSchema = z.string().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos');
export const rucSchema = z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos');

export const clienteSchema = z
  .object({
    tipoDocumento: z.enum(['DNI', 'RUC']),
    numeroDocumento: z.string().min(1, 'Ingresa el número de documento'),
    razonSocial: z.string().min(2, 'Ingresa la razón social'),
    nombreComercial: z.string().optional().default(''),
    sectorEconomico: z.string().min(1, 'Selecciona un sector'),
    region: z.string().min(1, 'Selecciona una región'),
    idProveedor: z.number().nullable().optional(),
  })
  .superRefine((v, ctx) => {
    const res = (v.tipoDocumento === 'DNI' ? dniSchema : rucSchema).safeParse(v.numeroDocumento);
    if (!res.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['numeroDocumento'],
        message: res.error.issues[0].message,
      });
    }
  });

export const proveedorSchema = z.object({
  ruc: rucSchema,
  razonSocial: z.string().min(2, 'Ingresa la razón social'),
  contactoNombre: z.string().min(2, 'Ingresa el nombre del contacto'),
  telefono: z.string().regex(/^\+?\d{7,15}$/, 'Teléfono no válido'),
  email: z.string().email('Correo no válido'),
  direccion: z.string().min(3, 'Ingresa la dirección'),
});

export const contactoSchema = z.object({
  nombre: z.string().min(2, 'Ingresa el nombre'),
  cargo: z.string().min(2, 'Ingresa el cargo'),
  telefono: z.string().regex(/^\+?\d{7,15}$/, 'Teléfono no válido'),
  email: z.string().email('Correo no válido'),
  principal: z.boolean().default(false),
});

export type ClienteFormValues = z.input<typeof clienteSchema>;
export type ProveedorFormValues = z.infer<typeof proveedorSchema>;
export type ContactoFormValues = z.input<typeof contactoSchema>;
