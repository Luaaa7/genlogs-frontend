import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Ventana } from "@/components/ui/Ventana"
import { inputFormClass, textareaFormClass } from "@/components/ui/campoEstilos"
import type { AccionRespuestaCliente, CodigoRespuestaCliente, MedioRespuestaCliente, RespuestaFlujoCliente } from "@/api/cotizacionesApi"

const MAX_BYTES = 5 * 1024 * 1024
const EXTENSIONES = new Set(["pdf", "png", "jpg", "jpeg"])
const TIPOS = new Set(["application/pdf", "image/png", "image/jpeg"])

const MEDIOS: { value: MedioRespuestaCliente; label: string }[] = [
  { value: "correo", label: "Correo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "llamada", label: "Llamada" },
  { value: "otro", label: "Otro" },
]

const CODIGO_RESPUESTA: Record<AccionRespuestaCliente, CodigoRespuestaCliente> = {
  acepto: "ACEPTADA_CLIENTE",
  pidio_cambios: "EN_NEGOCIACION",
  rechazo: "RECHAZADA",
}

const TITULO_ACCION: Record<AccionRespuestaCliente, string> = {
  acepto: "El cliente aceptó la cotización.",
  pidio_cambios: "El cliente pidió cambios.",
  rechazo: "El cliente rechazó la cotización.",
}

function hoyLima(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function validar(
  accion: AccionRespuestaCliente,
  fecha: string,
  medio: string,
  nota: string,
  archivo: File | null,
): string | null {
  if (!fecha) return "La fecha de respuesta es obligatoria"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "La fecha de respuesta no es válida. Usa el formato aaaa-mm-dd"
  if (fecha > hoyLima()) return "La fecha de respuesta no puede ser futura"
  if (!medio) return "Indica el medio: correo, whatsapp, llamada u otro"
  if (archivo) {
    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? ""
    const tipoOk = !archivo.type || TIPOS.has(archivo.type)
    if (!EXTENSIONES.has(extension) || !tipoOk) return "El adjunto solo puede ser PDF, PNG o JPG"
    if (archivo.size > MAX_BYTES) return "El adjunto no puede superar 5 MB"
  }
  // La nota es obligatoria en las tres respuestas; el adjunto no la reemplaza.
  if (accion === "acepto" && !nota.trim()) return "La nota es obligatoria: escribe qué confirmó el cliente"
  if (accion === "pidio_cambios" && !nota.trim()) return "Indica el motivo del cambio que pidió el cliente"
  if (accion === "rechazo" && !nota.trim()) return "Indica el motivo del rechazo"
  return null
}

interface Props {
  accion: AccionRespuestaCliente
  ocupado: boolean
  error: string | null
  onCerrar: () => void
  onGuardar: (body: RespuestaFlujoCliente) => void
}

/** El vendedor o el jefe anotan lo que el cliente respondió fuera del portal. */
export function RegistrarRespuestaClienteModal({ accion, ocupado, error, onCerrar, onGuardar }: Props) {
  const [fecha, setFecha] = useState(hoyLima)
  const [medio, setMedio] = useState<MedioRespuestaCliente | "">("")
  const [medioOtro, setMedioOtro] = useState("")
  const [nota, setNota] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const falla = validar(accion, fecha, medio, nota, archivo)
    if (falla) {
      setAviso(falla)
      return
    }
    setAviso(null)
    onGuardar({
      codigoEstado: CODIGO_RESPUESTA[accion],
      fechaRespuesta: fecha,
      medio: medio as MedioRespuestaCliente,
      ...(medio === "otro" && medioOtro.trim() ? { medioDetalle: medioOtro.trim() } : {}),
      comentario: nota.trim(),
      adjunto: archivo,
    })
  }

  return (
    <Ventana
      titulo="Registrar respuesta del cliente"
      descripcion={TITULO_ACCION[accion]}
      onCerrar={onCerrar}
      cerrable={!ocupado}
      acciones={
        <>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={ocupado}>Cancelar</Button>
          <Button type="submit" form="respuesta-cliente" disabled={ocupado}>
            {ocupado ? "Guardando…" : "Guardar respuesta"}
          </Button>
        </>
      }
    >
      <form id="respuesta-cliente" className="space-y-4" onSubmit={enviar}>
        <label className="block text-sm text-foreground" htmlFor="fecha-respuesta">
          Fecha de la respuesta <span className="text-destructive">*</span>
          <input
            id="fecha-respuesta"
            type="date"
            max={hoyLima()}
            className={`${inputFormClass} mt-1`}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={ocupado}
          />
        </label>
        <label className="block text-sm text-foreground" htmlFor="medio-respuesta">
          Medio <span className="text-destructive">*</span>
          <select
            id="medio-respuesta"
            className={`${inputFormClass} mt-1`}
            value={medio}
            onChange={(e) => setMedio(e.target.value as MedioRespuestaCliente | "")}
            disabled={ocupado}
          >
            <option value="">Selecciona el medio</option>
            {MEDIOS.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
            ))}
          </select>
        </label>
        {medio === "otro" && (
          <label className="block text-sm text-foreground" htmlFor="medio-otro-respuesta">
            ¿Cuál? <span className="text-muted-foreground">(opcional)</span>
            <input
              id="medio-otro-respuesta"
              type="text"
              maxLength={60}
              className={`${inputFormClass} mt-1`}
              value={medioOtro}
              onChange={(e) => setMedioOtro(e.target.value)}
              disabled={ocupado}
              placeholder="Ej. Reunión presencial, Teams, SMS"
            />
          </label>
        )}
        <label className="block text-sm text-foreground" htmlFor="nota-respuesta">
          Nota <span className="text-destructive">*</span>
          <textarea
            id="nota-respuesta"
            className={`${textareaFormClass} mt-1`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            disabled={ocupado}
            placeholder={accion === "acepto" ? "Qué confirmó el cliente" : "Motivo que indicó el cliente"}
          />
        </label>
        <label className="block text-sm text-foreground" htmlFor="adjunto-respuesta">
          Adjunto <span className="text-muted-foreground">(opcional, PDF, PNG o JPG, máx. 5 MB)</span>
          <input
            id="adjunto-respuesta"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="mt-1 block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
            disabled={ocupado}
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
        {(aviso || error) && (
          <p role="alert" className="text-sm text-destructive">{aviso || error}</p>
        )}
      </form>
    </Ventana>
  )
}