import { z } from "zod"

/** Validación del formulario de reclamos e incidencias (mismas reglas que ReclamoService). */
export const reclamoSchema = z
  .object({
    tipo: z.enum(["RECLAMO", "INCIDENCIA"], { message: "Elige el tipo" }),
    prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"]),
    idCliente: z.number().optional(),
    idOrdenCompra: z.number().optional(),
    idUsuarioResponsable: z.number().optional(),
    asunto: z
      .string()
      .trim()
      .min(3, "El asunto debe tener al menos 3 caracteres")
      .max(200, "El asunto no puede exceder 200 caracteres"),
    descripcion: z.string().trim().min(5, "Describe qué pasó (al menos 5 caracteres)"),
    fechaLimite: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.tipo === "RECLAMO" && v.idCliente == null && v.idOrdenCompra == null) {
      ctx.addIssue({ code: "custom", path: ["idCliente"], message: "Un reclamo debe tener cliente (o una orden de compra)" })
    }
  })

export type ReclamoFormValues = z.infer<typeof reclamoSchema>
