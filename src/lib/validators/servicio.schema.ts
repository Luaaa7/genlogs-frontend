import { z } from "zod"

/**
 * Validación del formulario de servicios.
 * Los campos siguen `ServicioFormValues` (types/servicio.types.ts), que es el
 * contrato real con el backend: IDs numéricos y `idsSectores`.
 */
export const servicioSchema = z.object({
  idCategoriaServicio: z.number({ message: "Selecciona una categoría" }),
  idUnidadMedida: z.number({ message: "Selecciona una unidad de medida" }),
  codigoServicio: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .max(30, "El código no puede exceder 30 caracteres"),
  nombreServicio: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  duracionEstimadaHoras: z
    .number({ message: "Ingresa un número válido" })
    .positive("La duración debe ser mayor a 0")
    .optional(),
  visibleWeb: z.boolean(),
  descripcion: z.string().max(500, "La descripción no puede exceder 500 caracteres").optional(),
  idsSectores: z.array(z.number()),
  costo: z.number({ message: "Ingresa un costo válido" }).positive("El costo tiene que ser mayor que 0").optional(),
  margen: z
    .number({ message: "Ingresa un margen válido" })
    .min(0, "El margen tiene que estar entre 0 y 100")
    .max(100, "El margen tiene que estar entre 0 y 100")
    .optional(),
  precioManual: z.boolean(),
  precioReferencial: z.number({ message: "Ingresa un precio válido" }).positive("El precio tiene que ser mayor que 0").optional(),
}).superRefine((v, ctx) => {
  // Con precio manual el backend deduce el margen: (precio − costo) / costo × 100, entre 0 y 100.
  if (!v.precioManual) return
  if (v.costo == null) {
    ctx.addIssue({ code: "custom", path: ["costo"], message: "Para fijar el precio a mano, primero registra el costo" })
    return
  }
  if (v.precioReferencial == null) {
    ctx.addIssue({ code: "custom", path: ["precioReferencial"], message: "Ingresa el precio" })
    return
  }
  if (v.precioReferencial < v.costo) {
    ctx.addIssue({ code: "custom", path: ["precioReferencial"], message: "El precio no puede ser menor que el costo" })
  } else if (v.precioReferencial > v.costo * 2) {
    ctx.addIssue({ code: "custom", path: ["precioReferencial"], message: "Este precio deja un margen mayor a 100 %" })
  }
})

export type ServicioSchemaValues = z.infer<typeof servicioSchema>
