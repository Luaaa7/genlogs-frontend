import { useRef, useState } from "react"
import { cn } from "cn"
import { useUploadArchivo } from "@/hooks/useUploadArchivo"
import type { TipoArchivo } from "@/lib/constants/uploads"
import type { CloudinaryUploadResponse } from "@/api/cloudinaryApi"

interface FileUploaderProps {
  tipo: TipoArchivo
  onUploaded: (resultado: CloudinaryUploadResponse) => void
  label?: string
  className?: string
}

export function FileUploader({ tipo, onUploaded, label = "Subir archivo", className }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { subir, progreso, subiendo, error } = useUploadArchivo(tipo)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (tipo === "imagen" && file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file))
    }
    const resultado = await subir(file)
    if (resultado) onUploaded(resultado)
  }

  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border border-dashed border-border p-4", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input ref={inputRef} type="file" onChange={handleFileChange} disabled={subiendo} className="text-sm text-muted-foreground" />
      {preview && <img src={preview} alt="Vista previa" className="h-24 w-24 rounded-md object-cover" />}
      {subiendo && (
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progreso}%` }} />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}