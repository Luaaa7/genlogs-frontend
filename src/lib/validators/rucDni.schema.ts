import { z } from 'zod'
export const dniSchema = z.string().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos')
export const rucSchema = z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos')
export const terceroSchema = z.object({
  idTipoDocumento: z.number().int().positive('Selecciona el tipo de documento'),
  idDistrito: z.number().int().positive('Selecciona el distrito'),
  numeroDocumento: z.string().min(1, 'El número de documento es obligatorio'),
  /** RUC: razón social. DNI y pasaporte: se arma con nombres y apellidos al guardar. */
  razonSocial: z.string().optional(),
  nombres: z.string().optional(),
  apellidoPaterno: z.string().optional(),
  apellidoMaterno: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.union([z.string().email('Correo no válido'), z.literal('')]).optional(),
  ubigeo: z.string().optional(),
  /** Solo cuando el distrito es "Extranjero": ciudad y país (se guarda en la dirección). */
  lugarExtranjero: z.string().optional(),
}).superRefine((v, ctx) => {
  // Distrito "Extranjero" (UBIGEO 90xxxx): hay que decir dónde (si no está ya en la dirección)
  if ((v.ubigeo ?? '').startsWith('90') && !v.lugarExtranjero?.trim() && !v.direccion?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['lugarExtranjero'], message: 'Escribe la ciudad y el país' })
  }
  // RUC: 11 dígitos, empieza con 10 o 20, y razón social
  if (v.idTipoDocumento === 1) {
    if (!/^\d{11}$/.test(v.numeroDocumento)) {
      ctx.addIssue({ code: 'custom', path: ['numeroDocumento'], message: 'El RUC debe tener 11 dígitos' })
    } else if (!/^(10|20)/.test(v.numeroDocumento)) {
      ctx.addIssue({ code: 'custom', path: ['numeroDocumento'], message: 'El RUC debe empezar con 10 o 20' })
    }
    if ((v.razonSocial ?? '').trim().length < 2) {
      ctx.addIssue({ code: 'custom', path: ['razonSocial'], message: 'Ingresa la razón social' })
    }
    return
  }
  // DNI: 8 dígitos
  if (v.idTipoDocumento === 2 && !/^\d{8}$/.test(v.numeroDocumento)) {
    ctx.addIssue({ code: 'custom', path: ['numeroDocumento'], message: 'El DNI debe tener 8 dígitos' })
  }
  // Pasaporte: de 6 a 12 letras y números (igual que en la base de datos)
  if (v.idTipoDocumento === 4 && !/^[A-Za-z0-9]{6,12}$/.test(v.numeroDocumento.trim())) {
    ctx.addIssue({
      code: 'custom',
      path: ['numeroDocumento'],
      message: v.numeroDocumento.trim() ? 'El pasaporte debe tener de 6 a 12 letras y números' : 'Ingresa el número de pasaporte',
    })
  }
  // DNI y pasaporte: nombres y los dos apellidos
  if (!v.nombres?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['nombres'], message: 'Ingresa los nombres' })
  }
  if (!v.apellidoPaterno?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['apellidoPaterno'], message: 'Ingresa el apellido paterno' })
  }
  if (!v.apellidoMaterno?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['apellidoMaterno'], message: 'Ingresa el apellido materno' })
  }
})
export const clienteSchema = z.object({ tercero: terceroSchema, idSectorEconomico: z.number().int().positive('Selecciona el sector'), situacion: z.string().default('ACTIVO') })
export const proveedorSchema = z.object({ tercero: terceroSchema, situacion: z.string().default('ACTIVO') })
export const contactoSchema = z.object({ nombre: z.string().min(2), cargo: z.string().optional(), telefono: z.string().optional(), email: z.string().email().optional().or(z.literal('')), principal: z.boolean().default(false) })
export type ClienteFormValues = z.input<typeof clienteSchema>
export type ProveedorFormValues = z.input<typeof proveedorSchema>
export type ContactoFormValues = z.input<typeof contactoSchema>