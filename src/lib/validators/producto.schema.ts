import { z } from "zod"

export const productoSchema = z.object({
  idCategoriaProducto: z.number({ message: "Selecciona una categoría" }),
  idMarca: z.number().optional(),
  idUnidadMedida: z.number({ message: "Selecciona una unidad de medida" }),
  codigoProducto: z.string().min(1, "El código es obligatorio").max(30),
  nombreProducto: z.string().min(1, "El nombre es obligatorio").max(200),
  procedencia: z.string().max(100).optional(),
  visibleWeb: z.boolean(),
  descripcion: z.string().optional(),
  caracteristicas: z
    .array(
      z.object({
        nombreCaracteristica: z.string().min(1, "Nombre requerido"),
        unidadCaracteristica: z.string().optional(),
        valorCaracteristica: z.string().min(1, "Valor requerido"),
      })
    )
    .optional(),
})

export type ProductoFormValues = z.infer<typeof productoSchema>