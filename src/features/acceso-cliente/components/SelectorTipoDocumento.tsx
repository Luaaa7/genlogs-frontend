import type { TipoDocumentoPortal } from "@/api/contratos/ingresoGoogle"

interface Props {
  valor: TipoDocumentoPortal
  alCambiar: (tipo: TipoDocumentoPortal) => void
  /** Prefijo para los ids, porque el selector aparece en dos pantallas distintas. */
  prefijo: string
}

const OPCIONES: { tipo: TipoDocumentoPortal; texto: string }[] = [
  { tipo: "RUC", texto: "Empresa (RUC)" },
  { tipo: "DNI", texto: "Persona natural (DNI)" },
]

/**
 * Elige con qué documento se registra la cuenta: Empresa o persona con negocio (RUC) o persona
 * natural (DNI). Son dos opciones excluyentes, así que van como botones de opción nativos.
 */
export function SelectorTipoDocumento({ valor, alCambiar, prefijo }: Props) {
  return (
    <fieldset>
      <legend className="text-sm font-medium leading-none">Tipo de documento</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {OPCIONES.map(({ tipo, texto }) => {
          const id = `${prefijo}-tipo-${tipo.toLowerCase()}`
          const activo = valor === tipo
          return (
            <label
              key={tipo}
              htmlFor={id}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors motion-reduce:transition-none focus-within:ring-2 focus-within:ring-ring ${
                activo
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-white text-foreground hover:bg-muted dark:bg-background"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={`${prefijo}-tipo-documento`}
                value={tipo}
                checked={activo}
                onChange={() => alCambiar(tipo)}
                className="sr-only"
              />
              {texto}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
