// src/lib/validators/proforma.schema.ts
import { z } from "zod"
import { hoyISO } from "@/lib/formatters/fechaLocal"
import type { ProformaRequest } from "@/types/proforma.types"

export const MAX_ADJUNTOS = 5

export const adjuntoProformaSchema = z.object({
  nombreArchivo: z.string().min(1),
  url: z.string().min(1),
  tipoArchivo: z.string().min(1),
  tamanioBytes: z.number().nonnegative(),
})

export const proformaSchema = z.object({
  cotizacionId: z
    .number({ error: "Selecciona una cotización aprobada" })
    .int()
    .positive("Selecciona una cotización aprobada"),
  fechaVencimiento: z
    .string()
    .refine(
      (valor) => valor === "" || (/^\d{4}-\d{2}-\d{2}$/.test(valor) && valor >= hoyISO()),
      "La fecha de vencimiento no puede ser anterior a hoy"
    )
    .optional(),
  observaciones: z.string().trim().max(500, "Máximo 500 caracteres").optional(),
  adjuntos: z.array(adjuntoProformaSchema).max(MAX_ADJUNTOS, `Máximo ${MAX_ADJUNTOS} adjuntos`),
})

export type ProformaFormValues = z.infer<typeof proformaSchema>

/** Convierte los valores del formulario en el payload del backend (vacíos → undefined). */
export function toProformaRequest(values: ProformaFormValues): ProformaRequest {
  const observaciones = values.observaciones?.trim()
  return {
    cotizacionId: values.cotizacionId,
    fechaVencimiento: values.fechaVencimiento ? values.fechaVencimiento : undefined,
    observaciones: observaciones ? observaciones : undefined,
    adjuntos: values.adjuntos,
  }
}