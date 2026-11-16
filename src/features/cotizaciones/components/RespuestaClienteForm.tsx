import { useState } from "react"
import type { RespuestaClienteRequest } from "@/api/cotizacionesApi"
import type { AdjuntoCotizacion } from "@/types/cotizacion.types"
import { Button } from "@/components/ui/button"
import { inputFormClass, textareaFormClass } from "@/components/ui/campoEstilos"

interface Props {
  adjuntos: AdjuntoCotizacion[]
  ocupado: boolean
  error: string | null
  onRegistrar: (body: RespuestaClienteRequest) => void
}

/** El Jefe marca Aprobada o Rechazada. Sin comentario o sin adjunto no se envía. */
export function RespuestaClienteForm({ adjuntos, ocupado, error, onRegistrar }: Props) {
  const [destino, setDestino] = useState<"APROBADA" | "RECHAZADA" | "">("")
  const [comentario, setComentario] = useState("")
  const [idAdjunto, setIdAdjunto] = useState("")
  const [faltantes, setFaltantes] = useState<string[]>([])

  function registrar() {
    const texto = comentario.trim()
    const adjunto = Number(idAdjunto)
    const avisos: string[] = []
    if (destino !== "APROBADA" && destino !== "RECHAZADA") avisos.push("Marca si el cliente aprobó o rechazó.")
    if (!texto) avisos.push("Indica cómo y cuándo respondió el cliente.")
    if (!Number.isInteger(adjunto) || adjunto <= 0) avisos.push("Adjunta el correo o la orden de compra de la minera.")
    setFaltantes(avisos)
    if (avisos.length > 0 || (destino !== "APROBADA" && destino !== "RECHAZADA")) return
    onRegistrar({ codigoEstado: destino, comentario: texto, idAdjunto: adjunto })
  }

  return (
    <section aria-labelledby="respuesta-cliente-t" className="rounded-xl border border-border bg-card p-5">
      <h2 id="respuesta-cliente-t" className="text-base font-semibold">Registrar la respuesta del cliente</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Cómo y cuándo respondió, y el correo o la orden de compra que ya está en los adjuntos.
      </p>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          registrar()
        }}
      >
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-2 text-sm font-medium">Respuesta</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="respuesta-cliente" value="APROBADA" checked={destino === "APROBADA"} onChange={() => setDestino("APROBADA")} />
            Aprobada
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="respuesta-cliente" value="RECHAZADA" checked={destino === "RECHAZADA"} onChange={() => setDestino("RECHAZADA")} />
            Rechazada
          </label>
        </fieldset>
        <label className="text-sm" htmlFor="comentario-respuesta">
          Cómo y cuándo respondió
          <textarea
            id="comentario-respuesta"
            className={`${textareaFormClass} mt-1`}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </label>
        <label className="text-sm" htmlFor="adjunto-respuesta">
          Correo o orden de compra
          <select
            id="adjunto-respuesta"
            className={`${inputFormClass} mt-1`}
            value={idAdjunto}
            onChange={(e) => setIdAdjunto(e.target.value)}
          >
            <option value="">Elige el adjunto de la cotización</option>
            {adjuntos.map((a) => (
              <option key={a.idAdjunto} value={a.idAdjunto}>{a.nombreArchivo}</option>
            ))}
          </select>
        </label>
        {adjuntos.length === 0 && (
          <p className="text-sm text-muted-foreground">Carga el correo o la orden de compra en los adjuntos de la cotización.</p>
        )}
        {faltantes.map((aviso) => (
          <p key={aviso} role="alert" className="text-sm text-destructive">{aviso}</p>
        ))}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div>
          <Button type="submit" disabled={ocupado}>Registrar respuesta</Button>
        </div>
      </form>
    </section>
  )
}
